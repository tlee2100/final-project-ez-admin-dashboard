import { useState, useCallback, useEffect } from 'react';
import { message, Modal } from 'antd';
import { bookingApi } from '../services/booking.api';
import type { BlockoutRecord, CreateBlockoutFormData } from '../types/booking.types';

export function useBlockouts(siteId: string | null, onBlockoutChanged?: () => void) {
  const [blockouts, setBlockouts] = useState<BlockoutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBlockouts = useCallback(async () => {
    if (!siteId) {
      setBlockouts([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await bookingApi.getBlockouts(siteId);
      setBlockouts(data);
    } catch (err) {
      console.error('Failed to fetch blockouts', err);
    } finally {
      setIsLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBlockouts();
  }, [fetchBlockouts]);

  const handleCreateBlockout = async (data: CreateBlockoutFormData): Promise<boolean> => {
    if (!siteId) return false;
    try {
      await bookingApi.createBlockout(siteId, data);
      message.success('Block-out time created successfully');
      fetchBlockouts();
      onBlockoutChanged?.();
      return true;
    } catch (err: unknown) {
      message.error((err as Error).message || 'Failed to create blockout');
      return false;
    }
  };

  const confirmDeleteBlockout = (blockout: BlockoutRecord) => {
    Modal.confirm({
      title: 'Remove Block-out Time',
      content: `Are you sure you want to remove this blockout (${blockout.reason || 'Blocked time'})? Time slots will become available for booking again.`,
      okText: 'Remove Blockout',
      okButtonProps: { danger: true },
      cancelText: 'Keep Blocked',
      onOk: async () => {
        if (!siteId) return;
        try {
          await bookingApi.deleteBlockout(siteId, blockout.id);
          message.success('Block-out removed successfully');
          fetchBlockouts();
          onBlockoutChanged?.();
        } catch (err: unknown) {
          message.error((err as Error).message || 'Failed to remove blockout');
        }
      },
    });
  };

  return {
    blockouts,
    isLoading,
    fetchBlockouts,
    handleCreateBlockout,
    confirmDeleteBlockout,
  };
}
