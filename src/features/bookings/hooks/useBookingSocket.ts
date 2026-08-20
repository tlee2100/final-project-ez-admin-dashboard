'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { notifyAuthExpired } from '@/src/lib/api.client';
import { useSession } from 'next-auth/react';
import type { AvailableSlot } from '../types/booking.types';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface UseBookingSocketOptions {
  siteId: string | null;
  enabled: boolean;
  onSlotHeld: (slot: Omit<AvailableSlot, 'status'>) => void;
  onSlotConfirmed: (slot: Omit<AvailableSlot, 'status'>) => void;
  onSlotReleased: (slot: Omit<AvailableSlot, 'status'>) => void;
}

export function useBookingSocket({
  siteId,
  enabled,
  onSlotHeld,
  onSlotConfirmed,
  onSlotReleased,
}: UseBookingSocketOptions) {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);

  // Store timeouts for slots so we can clear them if confirmed/released early
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const getSlotKey = (startAt: string, endAt: string, resourceId: string) => {
    return `${resourceId}_${startAt}_${endAt}`;
  };

  const onSlotHeldRef = useRef(onSlotHeld);
  const onSlotConfirmedRef = useRef(onSlotConfirmed);
  const onSlotReleasedRef = useRef(onSlotReleased);

  useEffect(() => {
    onSlotHeldRef.current = onSlotHeld;
    onSlotConfirmedRef.current = onSlotConfirmed;
    onSlotReleasedRef.current = onSlotReleased;
  }, [onSlotHeld, onSlotConfirmed, onSlotReleased]);

  const connect = useCallback(() => {
    if (!enabled || !siteId) return;
    const token = session?.accessToken;
    if (!token) return;

    const socket = io(`${WS_URL}/bookings`, {
      auth: { token },
      query: { siteId },
      transports: ['websocket'],
    });

    socket.on(
      'booking_slot_held',
      (data: { resourceId: string; startAt: string; endAt: string }) => {
        onSlotHeldRef.current(data);

        // Implement the Frontend Local Timeout workaround
        const key = getSlotKey(data.startAt, data.endAt, data.resourceId);
        if (timeoutRefs.current.has(key)) {
          clearTimeout(timeoutRefs.current.get(key));
        }

        const timeout = setTimeout(() => {
          onSlotReleasedRef.current(data);
          timeoutRefs.current.delete(key);
        }, 600 * 1000); // 10 minutes

        timeoutRefs.current.set(key, timeout);
      },
    );

    socket.on(
      'booking_slot_confirmed',
      (data: { resourceId: string; startAt: string; endAt: string }) => {
        onSlotConfirmedRef.current(data);
        const key = getSlotKey(data.startAt, data.endAt, data.resourceId);
        if (timeoutRefs.current.has(key)) {
          clearTimeout(timeoutRefs.current.get(key));
          timeoutRefs.current.delete(key);
        }
      },
    );

    socket.on(
      'booking_slot_released',
      (data: { resourceId: string; startAt: string; endAt: string }) => {
        onSlotReleasedRef.current(data);
        const key = getSlotKey(data.startAt, data.endAt, data.resourceId);
        if (timeoutRefs.current.has(key)) {
          clearTimeout(timeoutRefs.current.get(key));
          timeoutRefs.current.delete(key);
        }
      },
    );

    socket.on('connect', () => {
      console.log('✅ WebSocket Connected to Bookings namespace');
      // Re-join site explicitly just in case
      socket.emit('join_site', { siteId });
    });

    socket.on('connect_error', async (err) => {
      console.error('❌ WebSocket Connection Error:', err.message);
      if (err.message.includes('Unauthorized') || err.message.includes('Authentication')) {
        notifyAuthExpired();
      }
    });

    socketRef.current = socket;
  }, [enabled, siteId, session?.accessToken]);

  const disconnect = useCallback(() => {
    socketRef.current?.off('booking_slot_held');
    socketRef.current?.off('booking_slot_confirmed');
    socketRef.current?.off('booking_slot_released');
    socketRef.current?.disconnect();
    socketRef.current = null;

    // Clear all pending timeouts when unmounting
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current.clear();
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { disconnect, getSocket: () => socketRef.current };
}
