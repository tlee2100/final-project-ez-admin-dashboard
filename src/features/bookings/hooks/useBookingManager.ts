import { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { apiRequest } from '@/src/lib/api.client';
import type { AvailableSlot } from '../types/booking.types';
import { bookingApi } from '../services/booking.api';
import { useBookingSocket } from './useBookingSocket';

interface UseBookingManagerOptions {
  activeSiteId: string | null;
  onBookingConfirmed: () => void;
}

const isMatchingSlot = (
  a: { resourceId?: string; startAt: string; endAt: string },
  b: { resourceId?: string; startAt: string; endAt: string },
) => {
  const sameResource = (a.resourceId || '') === (b.resourceId || '');
  const sameStart = new Date(a.startAt).getTime() === new Date(b.startAt).getTime();
  const sameEnd = new Date(a.endAt).getTime() === new Date(b.endAt).getTime();
  return sameResource && sameStart && sameEnd;
};

export function useBookingManager({ activeSiteId, onBookingConfirmed }: UseBookingManagerOptions) {
  const [sessionId] = useState<string>(() => crypto.randomUUID());

  const [holdingSlots, setHoldingSlots] = useState<AvailableSlot[]>([]);
  const [holdExpiry, setHoldExpiry] = useState<Date | null>(null);

  // Keep a ref to the currently held slot(s) for cleanup on unmount
  const currentHoldsRef = useRef<Array<{ resourceId: string; startAt: string; endAt: string }>>([]);

  // Fetch existing active holds from server on initial load or site change
  useEffect(() => {
    let isMounted = true;
    if (!activeSiteId) {
      void Promise.resolve().then(() => {
        if (isMounted) {
          setHoldingSlots([]);
        }
      });
      return;
    }

    bookingApi
      .getActiveHolds(activeSiteId)
      .then((holds) => {
        if (isMounted) {
          setHoldingSlots(holds || []);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch active holds:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [activeSiteId]);

  // Subscribe to real-time slot held / released events via WebSocket
  useBookingSocket({
    siteId: activeSiteId,
    enabled: !!activeSiteId,
    onSlotHeld: (slot) => {
      setHoldingSlots((prev) => {
        const isSelfHold = currentHoldsRef.current.some((h) => isMatchingSlot(h, slot));
        if (isSelfHold) return prev;
        const exists = prev.some((s) => isMatchingSlot(s, slot));
        if (exists) return prev;
        return [
          ...prev,
          {
            resourceId: slot.resourceId,
            startAt: slot.startAt,
            endAt: slot.endAt,
            status: 'HOLDING',
          },
        ];
      });
    },
    onSlotsHeld: (slots) => {
      setHoldingSlots((prev) => {
        const next = [...prev];
        for (const slot of slots) {
          const isSelfHold = currentHoldsRef.current.some((h) => isMatchingSlot(h, slot));
          if (isSelfHold) continue;
          if (!next.some((s) => isMatchingSlot(s, slot))) {
            next.push({
              resourceId: slot.resourceId,
              startAt: slot.startAt,
              endAt: slot.endAt,
              status: 'HOLDING',
            });
          }
        }
        return next;
      });
    },
    onSlotConfirmed: (slot) => {
      setHoldingSlots((prev) => prev.filter((s) => !isMatchingSlot(s, slot)));
      onBookingConfirmed();
    },
    onSlotReleased: (slot) => {
      setHoldingSlots((prev) => prev.filter((s) => !isMatchingSlot(s, slot)));
    },
  });

  const handleHoldSlot = async (slotOrSlots: AvailableSlot | AvailableSlot[]) => {
    if (!activeSiteId) return false;
    const slots = Array.isArray(slotOrSlots) ? slotOrSlots : [slotOrSlots];
    if (slots.length === 0) return true;

    // If already holding slots that are not in the new list, release them in a single request
    if (currentHoldsRef.current.length > 0) {
      const oldHolds = currentHoldsRef.current;
      const holdsToRelease = oldHolds.filter((oldH) => !slots.some((s) => isMatchingSlot(oldH, s)));
      if (holdsToRelease.length > 0) {
        await bookingApi
          .releaseHolds(activeSiteId, {
            sessionId,
            slots: holdsToRelease.map((h) => ({
              resourceId: h.resourceId,
              startAt: h.startAt,
              endAt: h.endAt,
            })),
          })
          .catch(() => {});
        setHoldingSlots((prev) =>
          prev.filter((s) => !holdsToRelease.some((h) => isMatchingSlot(s, h))),
        );
      }
    }

    // Optimistically add to local holdingSlots immediately so all slots hold simultaneously
    setHoldingSlots((prev) => {
      const updated = [...prev];
      for (const slot of slots) {
        const newHoldSlot: AvailableSlot = {
          resourceId: slot.resourceId || '',
          startAt: slot.startAt,
          endAt: slot.endAt,
          status: 'HOLDING',
        };
        if (!updated.some((s) => isMatchingSlot(s, newHoldSlot))) {
          updated.push(newHoldSlot);
        }
      }
      return updated;
    });

    try {
      // Send a single consolidated request to hold all slots
      await bookingApi.holdSlots(activeSiteId, {
        sessionId,
        slots: slots.map((s) => ({
          resourceId: s.resourceId || '',
          startAt: s.startAt,
          endAt: s.endAt,
        })),
      });

      currentHoldsRef.current = slots.map((s) => ({
        resourceId: s.resourceId || '',
        startAt: s.startAt,
        endAt: s.endAt,
      }));

      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 10);
      setHoldExpiry(expiry);
      return true;
    } catch (error: unknown) {
      // Roll back optimistic hold on failure
      setHoldingSlots((prev) => prev.filter((s) => !slots.some((slot) => isMatchingSlot(s, slot))));
      message.error(
        (error as Error).message || 'Sorry, someone else just held one of these slots.',
      );
      return false;
    }
  };

  // Called when admin closes the modal — releases all holds immediately in a single request
  const handleReleaseHold = async () => {
    const holds = currentHoldsRef.current;
    if (!activeSiteId || holds.length === 0) return;

    currentHoldsRef.current = [];
    setHoldExpiry(null);

    // Optimistically remove from holdingSlots immediately
    setHoldingSlots((prev) => prev.filter((s) => !holds.some((h) => isMatchingSlot(s, h))));

    try {
      await bookingApi.releaseHolds(activeSiteId, {
        sessionId,
        slots: holds.map((h) => ({
          resourceId: h.resourceId,
          startAt: h.startAt,
          endAt: h.endAt,
        })),
      });
    } catch (error) {
      console.error('Failed to release hold', error);
    }
  };

  // Release hold if user reloads the page or closes the tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      const holds = currentHoldsRef.current;
      if (activeSiteId && holds.length > 0) {
        apiRequest(`/admin/bookings/${activeSiteId}/hold`, {
          method: 'DELETE',
          body: JSON.stringify({
            sessionId,
            slots: holds.map((h) => ({
              resourceId: h.resourceId,
              startAt: h.startAt,
              endAt: h.endAt,
            })),
          }),
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeSiteId, sessionId]);

  // Called after a successful booking submission
  const clearHoldExpiry = () => {
    currentHoldsRef.current = [];
    setHoldExpiry(null);
  };

  return {
    sessionId,
    holdingSlots,
    holdExpiry,
    handleHoldSlot,
    handleReleaseHold,
    clearHoldExpiry,
  };
}
