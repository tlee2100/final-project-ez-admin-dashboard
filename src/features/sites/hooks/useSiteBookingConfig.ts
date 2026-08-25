import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { bookingApi } from '@/src/features/bookings/services/booking.api';
import type { BookingConfig } from '@/src/features/bookings/types/booking.types';

export interface BookingFormValues {
  bookingEnabled: boolean;
  industryTemplate: string;
  services: string[];
  staff: string[];
  timezone: string;
  slotDuration: number;
  startTime: string;
  endTime: string;
  availableDays: string[];
}

export function useSiteBookingConfig(siteId: string | null) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [originalSlotDuration, setOriginalSlotDuration] = useState<number>(30);
  const [resourceDetails, setResourceDetails] = useState<{ id: string; name: string }[]>([]);

  const fetchConfig = useCallback(async () => {
    if (!siteId) {
      setLoading(false);
      setConfig(null);
      return null;
    }
    try {
      setLoading(true);
      const data = await bookingApi.getBookingConfig(siteId);
      setConfig(data);
      setOriginalSlotDuration(Number(data.slotDuration || 30));
      setResourceDetails(data.resourceDetails || []);
      return data;
    } catch {
      message.error('Failed to load booking configuration');
      return null;
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    let isMounted = true;
    if (!siteId) return;

    const load = async () => {
      try {
        const data = await bookingApi.getBookingConfig(siteId);
        if (isMounted) {
          setConfig(data);
          setOriginalSlotDuration(Number(data.slotDuration || 30));
          setResourceDetails(data.resourceDetails || []);
        }
      } catch {
        message.error('Failed to load booking configuration');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    void load();

    return () => {
      isMounted = false;
    };
  }, [siteId]);

  const saveConfig = useCallback(
    async (payload: Partial<BookingConfig> | Record<string, unknown>) => {
      if (!siteId) return false;
      try {
        setSaving(true);
        const updated = await bookingApi.updateBookingConfig(siteId, payload);
        setConfig(updated);
        if (payload.slotDuration) {
          setOriginalSlotDuration(Number(payload.slotDuration));
        }
        message.success('Booking configuration saved successfully!');
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to save booking configuration';
        message.error(errorMessage);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [siteId],
  );

  return {
    loading,
    saving,
    config,
    originalSlotDuration,
    resourceDetails,
    fetchConfig,
    saveConfig,
  };
}
