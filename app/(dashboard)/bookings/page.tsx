'use client';

import React, { useState, useEffect } from 'react';
import { message, Spin, Empty, Alert, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTable } from '@refinedev/antd';
import { type CrudFilter } from '@refinedev/core';
import { useAuth } from '@/src/contexts/AuthContext';
import dayjs from 'dayjs';

import { useSitesData } from '@/src/features/sites/hooks/useSitesData';
import { useSiteBookingConfig } from '@/src/features/sites/hooks/useSiteBookingConfig';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useBookingManager } from '@/src/features/bookings/hooks/useBookingManager';
import { useBlockouts } from '@/src/features/bookings/hooks/useBlockouts';
import { bookingApi } from '@/src/features/bookings/services/booking.api';
import { computeSlotInterval, isSameSlot } from '@/src/features/bookings/utils/booking.utils';

import { BookingHeader } from '@/src/features/bookings/components/BookingHeader';
import { BookingFilterBar } from '@/src/features/bookings/components/BookingFilterBar';
import { BookingListTable } from '@/src/features/bookings/components/BookingListTable';
import { BookingCalendarView } from '@/src/features/bookings/components/BookingCalendarView';
import { ManualBookingModal } from '@/src/features/bookings/components/ManualBookingModal';
import { BookingDetailsDrawer } from '@/src/features/bookings/components/BookingDetailsDrawer';
import '@/src/features/bookings/components/bookings.css';

import type {
  BookingRecord,
  AvailableSlot,
  ManualBookingFormData,
  SelectedCalendarSlot,
} from '@/src/features/bookings/types/booking.types';

export default function BookingsPage() {
  const { currentRole } = useAuth();
  const isAdmin = currentRole === 'super_admin' || currentRole === 'admin';

  // ── Sites State ────────────────────────────────────────────────────────────
  const { filteredSites, isLoading: isSitesLoading } = useSitesData();
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const activeSiteId = selectedSiteId || filteredSites[0]?.id || null;
  const activeSite = filteredSites.find((s) => s.id === activeSiteId);

  // ── UI View & Modal States ────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<SelectedCalendarSlot[]>([]);

  // ── Filters & Search State ────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [showCancelled, setShowCancelled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 350);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterStaffId, setFilterStaffId] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // ── Site Booking Config ───────────────────────────────────────────────────
  const { config, loading: isConfigLoading } = useSiteBookingConfig(activeSiteId);

  // ── Refine useTable for Bookings ──────────────────────────────────────────
  const dayStart = currentDate.startOf('day').toISOString();
  const dayEnd = currentDate.endOf('day').toISOString();

  const { tableProps, tableQuery, setFilters } = useTable<BookingRecord>({
    resource: 'bookings',
    meta: { siteId: activeSiteId ?? '', showCancelled },
    syncWithLocation: false,
    pagination: { pageSize: 15 },
    filters: {
      initial: [
        { field: 'startAt', operator: 'gte' as const, value: dayStart },
        { field: 'startAt', operator: 'lte' as const, value: dayEnd },
        { field: 'status', operator: 'in' as const, value: ['confirmed', 'completed'] },
      ],
    },
    queryOptions: {
      enabled: !!activeSiteId,
    },
  });

  const bookings: BookingRecord[] = (tableProps.dataSource as BookingRecord[]) ?? [];

  // ── Real-time Socket & Hold Manager ───────────────────────────────────────
  const {
    sessionId,
    holdingSlots,
    holdExpiry,
    handleHoldSlot,
    handleReleaseHold,
    clearHoldExpiry,
  } = useBookingManager({
    activeSiteId,
    onBookingConfirmed: () => tableQuery.refetch(),
  });

  // ── Blockouts for Calendar Display ────────────────────────────────────────
  const { blockouts } = useBlockouts(activeSiteId);

  // ── Reactively Apply Table Filters with Debounce ──────────────────────────
  useEffect(() => {
    const statusFilter: CrudFilter[] = filterStatus
      ? [{ field: 'status', operator: 'eq' as const, value: filterStatus.toLowerCase() }]
      : !showCancelled
        ? [{ field: 'status', operator: 'in' as const, value: ['confirmed', 'completed'] }]
        : [];

    const filters: CrudFilter[] = [
      { field: 'startAt', operator: 'gte' as const, value: dayStart },
      { field: 'startAt', operator: 'lte' as const, value: dayEnd },
      ...(filterStaffId
        ? [{ field: 'resource.id', operator: 'eq' as const, value: filterStaffId }]
        : []),
      ...statusFilter,
      ...(debouncedSearchQuery
        ? [{ field: 'q', operator: 'contains' as const, value: debouncedSearchQuery }]
        : []),
    ];
    setFilters(filters, 'replace');
  }, [
    dayStart,
    dayEnd,
    filterStaffId,
    filterStatus,
    showCancelled,
    debouncedSearchQuery,
    setFilters,
  ]);

  // ── Booking Action Handlers ───────────────────────────────────────────────
  const handleCreateBooking = async (data: ManualBookingFormData): Promise<boolean> => {
    if (!activeSiteId || !config) return false;
    if (!config.bookingEnabled) {
      message.error('Booking is currently disabled for this site.');
      return false;
    }
    try {
      const cleanCustomerEmail = data.customerEmail?.trim() || undefined;

      if (data.slots && data.slots.length > 0) {
        await bookingApi.createBooking(activeSiteId, {
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: cleanCustomerEmail,
          serviceId: data.serviceId,
          serviceIds: data.serviceIds,
          slots: data.slots,
          notes: data.notes,
          timezone: config.timezone,
          sessionId,
        });
      } else {
        const { startAt, endAt } = computeSlotInterval(
          data.date || currentDate,
          data.timeSlot,
          config.slotDuration,
        );

        await bookingApi.createBooking(activeSiteId, {
          startAt,
          endAt,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: cleanCustomerEmail,
          serviceId: data.serviceId,
          serviceIds: data.serviceIds,
          staffId: data.staffId,
          notes: data.notes,
          timezone: config.timezone,
          sessionId,
        });
      }

      message.success('Booking created successfully');
      tableQuery.refetch();
      setIsModalOpen(false);
      setSelectedSlots([]);
      clearHoldExpiry();
      return true;
    } catch (error: unknown) {
      message.error((error as Error).message || 'Failed to create booking');
      return false;
    }
  };

  const handleSlotSelect = (staffId: string, staffName: string, time: string) => {
    if (!config?.bookingEnabled) {
      message.warning('Booking is currently disabled for this site.');
      return;
    }

    setSelectedSlots((prev) => {
      const target = { staffId, time, date: currentDate };
      const exists = prev.some((s) => isSameSlot(s, target));
      if (exists) {
        return prev.filter((s) => !isSameSlot(s, target));
      }
      return [...prev, { staffId, staffName, time, date: currentDate }];
    });
  };

  const handleClearSelectedSlots = () => {
    setSelectedSlots([]);
  };

  const handleConfirmSelectedSlots = async () => {
    if (selectedSlots.length === 0) return;

    const slotsToHold: AvailableSlot[] = selectedSlots.map((s) => {
      const { startAt, endAt } = computeSlotInterval(s.date, s.time, config?.slotDuration);
      return {
        resourceId: s.staffId,
        startAt,
        endAt,
        status: 'AVAILABLE' as const,
      };
    });

    const success = await handleHoldSlot(slotsToHold);
    if (success) {
      setIsModalOpen(true);
    }
  };

  const handleEmptySlotClick = async (staffId: string, time: string) => {
    if (!config?.bookingEnabled) {
      message.warning('Booking is currently disabled for this site.');
      return;
    }

    const { startAt, endAt } = computeSlotInterval(currentDate, time, config.slotDuration);
    const staffObj = config.resourceDetails?.find((r) => r.id === staffId);
    const newSlot = { staffId, staffName: staffObj?.name || 'Staff', time, date: currentDate };

    const success = await handleHoldSlot({
      resourceId: staffId,
      startAt,
      endAt,
      status: 'AVAILABLE' as const,
    });

    if (success) {
      setSelectedSlots([newSlot]);
      setIsModalOpen(true);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!activeSiteId) return;
    try {
      await bookingApi.updateStatus(activeSiteId, id, status);
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({ ...selectedBooking, status: status.toLowerCase() });
      }
      message.success(`Booking status updated to ${status}`);
      tableQuery.refetch();
    } catch {
      message.error('Failed to update status');
    }
  };

  const handleBulkCancel = async () => {
    if (!activeSiteId || selectedRowKeys.length === 0) return;
    Modal.confirm({
      title: 'Cancel Selected Bookings',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `Are you sure you want to cancel ${selectedRowKeys.length} selected booking(s)?`,
      okText: 'Yes, Cancel',
      okType: 'danger',
      cancelText: 'No, Keep',
      onOk: async () => {
        try {
          await bookingApi.bulkCancel(activeSiteId, selectedRowKeys);
          message.success('Selected bookings cancelled');
          setSelectedRowKeys([]);
          tableQuery.refetch();
        } catch {
          message.error('Failed to cancel bookings');
        }
      },
    });
  };

  // ── Render States ─────────────────────────────────────────────────────────
  if (isSitesLoading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (filteredSites.length === 0) {
    return (
      <div style={{ padding: 48 }}>
        <Empty description="No sites available" />
      </div>
    );
  }

  return (
    <div className="bookings-page-container">
      {/* Header & Meta Chips */}
      <BookingHeader
        sites={filteredSites}
        activeSiteId={activeSiteId}
        onSelectSite={(id) => {
          setSelectedSiteId(id);
          setSelectedRowKeys([]);
        }}
        isAdmin={isAdmin}
        config={config}
      />

      {isConfigLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : !config ? (
        <Empty description="No booking configuration found for this site" />
      ) : (
        <>
          {/* Warning Banner if Booking is Disabled */}
          {!config.bookingEnabled && (
            <Alert
              type="warning"
              showIcon
              message="Booking is currently disabled for this site"
              description="New appointments cannot be booked or held while booking is turned off. You can enable it in Site Settings."
              style={{ marginBottom: 16, borderRadius: 8 }}
            />
          )}

          {/* Controls & Filter Bar */}
          <BookingFilterBar
            config={config}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalBookingsCount={tableQuery.data?.total ?? 0}
            currentDate={currentDate}
            onCurrentDateChange={setCurrentDate}
            showCancelled={showCancelled}
            onShowCancelledChange={setShowCancelled}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            filterStaffId={filterStaffId}
            onFilterStaffIdChange={setFilterStaffId}
            selectedCount={selectedRowKeys.length}
            onBulkCancel={handleBulkCancel}
            onOpenNewBookingModal={() => {
              setSelectedSlots([]);
              setIsModalOpen(true);
            }}
          />

          {/* View Content (List Table / Day Calendar) */}
          {viewMode === 'list' ? (
            <BookingListTable
              tableProps={tableProps}
              onRowClick={(record) => setSelectedBooking(record)}
              onUpdateStatus={handleUpdateStatus}
              selectedRowKeys={selectedRowKeys}
              onSelectChange={setSelectedRowKeys}
            />
          ) : (
            <BookingCalendarView
              data={bookings}
              staff={config.resourceDetails || []}
              startTime={config.startTime}
              endTime={config.endTime}
              slotDuration={config.slotDuration}
              availableDays={config.availableDays || [1, 2, 3, 4, 5, 6, 7]}
              selectedDate={currentDate}
              holdingSlots={holdingSlots}
              selectedSlots={selectedSlots}
              onSlotSelect={handleSlotSelect}
              onClearSelectedSlots={handleClearSelectedSlots}
              onConfirmSelectedSlots={handleConfirmSelectedSlots}
              bookingEnabled={config.bookingEnabled}
              blockouts={blockouts}
              onBookingClick={(record) => setSelectedBooking(record)}
              onEmptySlotClick={handleEmptySlotClick}
            />
          )}

          {/* Modals & Slide-out Drawers */}
          <ManualBookingModal
            open={isModalOpen}
            onCancel={async () => {
              setIsModalOpen(false);
              setSelectedSlots([]);
              await handleReleaseHold();
            }}
            onSuccess={handleCreateBooking}
            siteId={activeSiteId || ''}
            config={config}
            industryTemplateId={
              config?.industryTemplate || activeSite?.industryTemplateId || 'general'
            }
            selectedSlots={selectedSlots}
            selectedDate={currentDate}
            onHoldSlot={handleHoldSlot}
            holdExpiry={holdExpiry}
            onHoldExpired={async () => {
              clearHoldExpiry();
              setIsModalOpen(false);
              setSelectedSlots([]);
            }}
            onReleaseHold={handleReleaseHold}
          />

          <BookingDetailsDrawer
            open={!!selectedBooking}
            onClose={() => setSelectedBooking(null)}
            booking={selectedBooking}
            onUpdateStatus={handleUpdateStatus}
          />
        </>
      )}
    </div>
  );
}
