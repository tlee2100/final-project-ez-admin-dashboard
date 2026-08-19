'use client';

import React, { useState, useEffect } from 'react';
import { message, Spin, Empty, Alert } from 'antd';
import { useTable } from '@refinedev/antd';
import { type CrudFilter, useCustom, useDataProvider } from '@refinedev/core';
import { useAuth } from '@/src/contexts/AuthContext';
import dayjs from 'dayjs';

import { useSitesData } from '@/src/features/sites/hooks/useSitesData';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useBookingManager } from '@/src/hooks/useBookingManager';
import { useBlockouts } from '@/src/features/bookings/hooks/useBlockouts';
import { bookingApi } from '@/src/features/bookings/services/booking.api';

import { BookingHeader } from '@/src/features/bookings/components/BookingHeader';
import { BookingFilterBar } from '@/src/features/bookings/components/BookingFilterBar';
import { BookingListTable } from '@/src/features/bookings/components/BookingListTable';
import { BookingCalendarView } from '@/src/features/bookings/components/BookingCalendarView';
import { ManualBookingModal } from '@/src/features/bookings/components/ManualBookingModal';
import { BookingDetailsDrawer } from '@/src/features/bookings/components/BookingDetailsDrawer';
import '@/src/features/bookings/components/bookings.css';

import type {
  BookingRecord,
  BookingConfig,
  AvailableSlot,
  ManualBookingFormData,
} from '@/src/features/bookings/types/booking.types';

export default function BookingsPage() {
  const { currentRole } = useAuth();
  const isAdmin = currentRole === 'super_admin' || currentRole === 'admin';

  // ── Sites State ────────────────────────────────────────────────────────────
  const { filteredSites, isLoading: isSitesLoading } = useSitesData();
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const activeSiteId = selectedSiteId || filteredSites[0]?.id || null;

  // ── UI View & Modal States ────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [initialModalData, setInitialModalData] = useState<{
    staffId?: string;
    timeSlot?: string;
    date?: dayjs.Dayjs;
  } | null>(null);

  // ── Filters & Search State ────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [showCancelled, setShowCancelled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 350);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterStaffId, setFilterStaffId] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // ── Site Booking Config ───────────────────────────────────────────────────
  const { query } = useCustom<BookingConfig>({
    url: `/admin/sites/${activeSiteId}/bookings/booking-config`,
    method: 'get',
    queryOptions: {
      enabled: !!activeSiteId,
    },
  });
  const config = query.data?.data || null;
  const isConfigLoading = query.isLoading;

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
    const filters: CrudFilter[] = [
      { field: 'startAt', operator: 'gte' as const, value: dayStart },
      { field: 'startAt', operator: 'lte' as const, value: dayEnd },
      ...(filterStaffId
        ? [{ field: 'resource.id', operator: 'eq' as const, value: filterStaffId }]
        : []),
      ...(filterStatus
        ? [{ field: 'status', operator: 'eq' as const, value: filterStatus.toLowerCase() }]
        : []),
      ...(debouncedSearchQuery
        ? [{ field: 'q', operator: 'contains' as const, value: debouncedSearchQuery }]
        : []),
    ];
    setFilters(filters, 'replace');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayStart, dayEnd, filterStaffId, filterStatus, showCancelled, debouncedSearchQuery]);

  // ── Available Slots Data Provider Fetcher ─────────────────────────────────
  const dataProvider = useDataProvider();
  const fetchAvailableSlots = async (
    siteId: string,
    startDate: string,
    endDate: string,
    resourceId: string,
  ): Promise<AvailableSlot[]> => {
    const provider = dataProvider();
    if (!provider.custom) return [];
    try {
      const response = await provider.custom<{ slots: AvailableSlot[] }>({
        url: `/admin/sites/${siteId}/bookings/available-slots`,
        method: 'get',
        query: { startDate, endDate, resourceId },
      });
      return response.data?.slots || [];
    } catch (error) {
      console.error('Failed to fetch available slots via refine:', error);
      return [];
    }
  };

  // ── Booking Action Handlers ───────────────────────────────────────────────
  const handleCreateBooking = async (data: ManualBookingFormData): Promise<boolean> => {
    if (!activeSiteId || !config) return false;
    if (!config.bookingEnabled) {
      message.error('Booking is currently disabled for this site.');
      return false;
    }
    try {
      const formattedDate = data.date.format('YYYY-MM-DD');
      const startAt = dayjs(`${formattedDate} ${data.timeSlot}`).toISOString();
      const endAt = dayjs(`${formattedDate} ${data.timeSlot}`)
        .add(config.slotDuration, 'minute')
        .toISOString();

      await bookingApi.createBooking(activeSiteId, {
        startAt,
        endAt,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        serviceId: data.serviceId,
        staffId: data.staffId,
        notes: data.notes,
        timezone: config.timezone,
        sessionId,
      });

      message.success('Booking created successfully');
      tableQuery.refetch();
      setIsModalOpen(false);
      setInitialModalData(null);
      clearHoldExpiry();
      return true;
    } catch (error: unknown) {
      message.error((error as Error).message || 'Failed to create booking');
      return false;
    }
  };

  const handleEmptySlotClick = async (staffId: string, time: string) => {
    if (!config?.bookingEnabled) {
      message.warning('Booking is currently disabled for this site.');
      return;
    }

    setInitialModalData({ staffId, timeSlot: time, date: currentDate });

    const formattedDate = currentDate.format('YYYY-MM-DD');
    const startAt = dayjs(`${formattedDate} ${time}`).toISOString();
    const endAt = dayjs(`${formattedDate} ${time}`)
      .add(config?.slotDuration || 30, 'minute')
      .toISOString();

    const success = await handleHoldSlot({
      startAt,
      endAt,
      status: 'AVAILABLE',
      resourceId: staffId,
    });

    if (success) {
      setIsModalOpen(true);
    } else {
      setInitialModalData(null);
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
    try {
      await bookingApi.bulkCancel(activeSiteId, selectedRowKeys);
      message.success(`Cancelled ${selectedRowKeys.length} bookings`);
      setSelectedRowKeys([]);
      tableQuery.refetch();
    } catch {
      message.error('Failed to cancel selected bookings');
    }
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
    <div className="bookings-page">
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

      {isConfigLoading || !config ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin />
        </div>
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
              setInitialModalData(null);
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
              setInitialModalData(null);
              await handleReleaseHold();
            }}
            onSuccess={handleCreateBooking}
            siteId={activeSiteId || ''}
            siteServices={config.serviceDetails || []}
            siteStaff={config.resourceDetails || []}
            initialData={initialModalData}
            selectedDate={currentDate}
            startTime={config.startTime || '09:00'}
            endTime={config.endTime || '18:00'}
            slotDuration={config.slotDuration || 30}
            fetchAvailableSlots={fetchAvailableSlots}
            onHoldSlot={handleHoldSlot}
            holdExpiry={holdExpiry}
            onHoldExpired={async () => {
              clearHoldExpiry();
              setIsModalOpen(false);
              setInitialModalData(null);
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
