import { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { apiRequest } from '@/src/lib/api.client';
import { AvailableSlot } from '@/src/features/bookings/types/booking.types';
import { useBookingSocket } from './useBookingSocket';

interface UseBookingManagerOptions {
  activeSiteId: string | null;
  onBookingConfirmed: () => void;
}

export function useBookingManager({ activeSiteId, onBookingConfirmed }: UseBookingManagerOptions) {
  const [sessionId] = useState<string>(() => crypto.randomUUID());

  const [holdingSlots, setHoldingSlots] = useState<AvailableSlot[]>([]);
  const [holdExpiry, setHoldExpiry] = useState<Date | null>(null);
  // Track the slot currently held by THIS browser session
  const currentHoldRef = useRef<{ resourceId: string; startAt: string; endAt: string } | null>(
    null,
  );

  // Fetch initial holds on mount so other admins' holds are visible from the start
  useEffect(() => {
    if (!activeSiteId) return;
    const fetchHolds = async () => {
      try {
        const holds = await apiRequest<AvailableSlot[]>(
          `/admin/sites/${activeSiteId}/bookings/holds`,
          {
            method: 'GET',
          },
        );
        setHoldingSlots(holds);
      } catch (error) {
        console.error('Failed to fetch initial holds', error);
      }
    };
    fetchHolds();
  }, [activeSiteId]);

  useBookingSocket({
    siteId: activeSiteId,
    enabled: !!activeSiteId,
    onSlotHeld: (slot) => {
      setHoldingSlots((prev) => {
        const exists = prev.some(
          (s) =>
            s.startAt === slot.startAt &&
            s.endAt === slot.endAt &&
            s.resourceId === slot.resourceId,
        );
        if (exists) return prev;
        return [...prev, { ...slot, status: 'HOLDING' as const }];
      });
    },
    onSlotConfirmed: (slot) => {
      setHoldingSlots((prev) =>
        prev.filter(
          (s) =>
            !(
              s.startAt === slot.startAt &&
              s.endAt === slot.endAt &&
              s.resourceId === slot.resourceId
            ),
        ),
      );
      onBookingConfirmed();
    },
    onSlotReleased: (slot) => {
      setHoldingSlots((prev) =>
        prev.filter(
          (s) =>
            !(
              s.startAt === slot.startAt &&
              s.endAt === slot.endAt &&
              s.resourceId === slot.resourceId
            ),
        ),
      );
    },
  });

  const handleHoldSlot = async (slot: AvailableSlot) => {
    if (!activeSiteId) return false;

    // If already holding a different slot, release the old one first
    if (currentHoldRef.current) {
      const oldHold = currentHoldRef.current;
      const isSameSlot =
        oldHold.resourceId === (slot.resourceId || '') &&
        oldHold.startAt === slot.startAt &&
        oldHold.endAt === slot.endAt;

      if (!isSameSlot) {
        await handleReleaseHold();
      }
    }

    try {
      await apiRequest(`/admin/sites/${activeSiteId}/bookings/hold`, {
        method: 'POST',
        body: JSON.stringify({
          resourceId: slot.resourceId || '',
          startAt: slot.startAt,
          endAt: slot.endAt,
          sessionId,
        }),
      });

      currentHoldRef.current = {
        resourceId: slot.resourceId || '',
        startAt: slot.startAt,
        endAt: slot.endAt,
      };

      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 10);
      setHoldExpiry(expiry);
      return true;
    } catch (error: unknown) {
      message.error((error as Error).message || 'Sorry, someone else just held this slot.');
      return false;
    }
  };

  // Called when admin closes the modal — releases the hold immediately
  const handleReleaseHold = async () => {
    const hold = currentHoldRef.current;
    if (!activeSiteId || !hold) return;

    currentHoldRef.current = null;
    setHoldExpiry(null);

    try {
      await apiRequest(`/admin/sites/${activeSiteId}/bookings/hold`, {
        method: 'DELETE',
        body: JSON.stringify({
          resourceId: hold.resourceId,
          startAt: hold.startAt,
          endAt: hold.endAt,
          sessionId,
        }),
      });
    } catch (error) {
      console.error('Failed to release hold', error);
    }
  };

  // Release hold if user reloads the page or closes the tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      const hold = currentHoldRef.current;
      if (activeSiteId && hold) {
        // Fire-and-forget with keepalive
        apiRequest(`/admin/sites/${activeSiteId}/bookings/hold`, {
          method: 'DELETE',
          body: JSON.stringify({
            resourceId: hold.resourceId,
            startAt: hold.startAt,
            endAt: hold.endAt,
            sessionId,
          }),
          keepalive: true,
        }).catch(() => {}); // Ignore errors on unload
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeSiteId, sessionId]);

  // Called after a successful booking submission
  const clearHoldExpiry = () => {
    currentHoldRef.current = null;
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
