'use client';

import React, { useState, useEffect } from 'react';
import { Button, DatePicker, Select, message, Spin, Empty, Input } from 'antd';
import {
  PlusOutlined,
  AppstoreOutlined,
  BarsOutlined,
  LeftOutlined,
  RightOutlined,
  SettingOutlined,
  SearchOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTable } from '@refinedev/antd';
import { type CrudFilter, useCustom, useDataProvider } from '@refinedev/core';
import { useAuth } from '@/src/contexts/AuthContext';
import dayjs from 'dayjs';

import { useSitesData } from '@/src/features/sites/hooks/useSitesData';
import { apiRequest } from '@/src/lib/api.client';

import { BookingListTable } from '@/src/features/bookings/components/BookingListTable';
import { BookingCalendarView } from '@/src/features/bookings/components/BookingCalendarView';
import { ManualBookingModal } from '@/src/features/bookings/components/ManualBookingModal';
import { BookingDetailsDrawer } from '@/src/features/bookings/components/BookingDetailsDrawer';
import '@/src/features/bookings/components/bookings.css';
import type { BookingRecord, BookingConfig } from '@/src/features/bookings/types/booking.types';

export default function BookingsPage() {
  const { currentRole } = useAuth();
  const isAdmin = currentRole === 'super_admin' || currentRole === 'admin';
  const router = useRouter();

  const { filteredSites, isLoading: isSitesLoading } = useSitesData();
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialModalData, setInitialModalData] = useState<{
    staffId?: string;
    timeSlot?: string;
  } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [showCancelled, setShowCancelled] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterStaffId, setFilterStaffId] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // ── Set default active site ────────────────────────────────────────────────
  useEffect(() => {
    if (filteredSites.length > 0 && !activeSiteId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveSiteId(filteredSites[0].id);
    }
  }, [filteredSites, activeSiteId]);

  // ── Fetch booking config when site changes ─────────────────────────────────
  const { query } = useCustom<BookingConfig>({
    url: `/admin/sites/${activeSiteId}/bookings/booking-config`,
    method: 'get',
    queryOptions: {
      enabled: !!activeSiteId,
    },
  });
  const config = query.data?.data || null;
  const isConfigLoading = query.isLoading;

  const dataProvider = useDataProvider();

  const fetchAvailableSlots = async (
    siteId: string,
    startDate: string,
    endDate: string,
    resourceId: string,
  ) => {
    const provider = dataProvider();
    if (!provider.custom) return [];

    try {
      const response = await provider.custom({
        url: `/admin/sites/${siteId}/bookings/available-slots`,
        method: 'get',
        query: { startDate, endDate, resourceId },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const slots = (response.data as any).slots || [];
      return slots.map((slot: { startAt: string }) => dayjs(slot.startAt).format('HH:mm'));
    } catch (error) {
      console.error('Failed to fetch available slots via refine:', error);
      return [];
    }
  };

  // ── Build date range filter for the selected day ───────────────────────────
  const dayStart = currentDate.startOf('day').toISOString();
  const dayEnd = currentDate.endOf('day').toISOString();

  // ── Refine useTable ────────────────────────────────────────────────────────
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
      // Don't run query until we have an active site
      enabled: !!activeSiteId,
    },
  });

  const bookings: BookingRecord[] = (tableProps.dataSource as BookingRecord[]) ?? [];

  // ── Calendar view still needs all-day data — re-use the same list ─────────
  const calendarData = bookings;

  // ── Reactively apply all filters when any filter dependency changes ────────
  useEffect(() => {
    const filters: CrudFilter[] = [
      // Date range for the selected day
      { field: 'startAt', operator: 'gte' as const, value: dayStart },
      { field: 'startAt', operator: 'lte' as const, value: dayEnd },
      // Staff filter
      ...(filterStaffId
        ? [{ field: 'resource.id', operator: 'eq' as const, value: filterStaffId }]
        : []),
      // Status filter — if a specific status is chosen, use eq
      ...(filterStatus
        ? [{ field: 'status', operator: 'eq' as const, value: filterStatus.toLowerCase() }]
        : []),
      // Text search
      ...(searchQuery ? [{ field: 'q', operator: 'contains' as const, value: searchQuery }] : []),
    ];
    setFilters(filters, 'replace');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayStart, dayEnd, filterStaffId, filterStatus, showCancelled, searchQuery]);

  const activeSite = filteredSites.find((s) => s.id === activeSiteId);

  // ── Create new booking ─────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateBooking = async (data: any) => {
    if (!activeSiteId || !config) return false;
    try {
      const formattedDate = data.date.format('YYYY-MM-DD');
      const startAt = dayjs(`${formattedDate} ${data.timeSlot}`).toISOString();
      const endAt = dayjs(`${formattedDate} ${data.timeSlot}`)
        .add(config.slotDuration, 'minute')
        .toISOString();

      await apiRequest(`/admin/sites/${activeSiteId}/bookings`, {
        method: 'POST',
        body: JSON.stringify({
          startAt,
          endAt,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          serviceId: data.serviceId,
          staffId: data.staffId,
          notes: data.notes,
          timezone: config.timezone,
        }),
      });

      message.success('Booking created successfully');
      tableQuery.refetch();
      setIsModalOpen(false);
      setInitialModalData(null);
      return true;
    } catch (error: unknown) {
      message.error((error as Error).message || 'Failed to create booking');
      return false;
    }
  };

  const handleEmptySlotClick = (staffId: string, time: string) => {
    setInitialModalData({ staffId, timeSlot: time });
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!activeSiteId) return;
    try {
      await apiRequest(`/admin/sites/${activeSiteId}/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: status.toLowerCase() }),
      });
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
      await Promise.all(
        selectedRowKeys.map((id) =>
          apiRequest(`/admin/sites/${activeSiteId}/bookings/${String(id)}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'cancelled' }),
          }),
        ),
      );
      message.success(`Cancelled ${selectedRowKeys.length} bookings`);
      setSelectedRowKeys([]);
      tableQuery.refetch();
    } catch {
      message.error('Failed to cancel selected bookings');
    }
  };

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
      {/* Header */}
      <div className="bookings-header">
        <div>
          <h1 className="bookings-title">Bookings</h1>
          <p className="bookings-subtitle">
            Day calendar, list search, and walk-in booking for your sites
          </p>
        </div>
        <div className="bookings-header-actions">
          <Select
            value={activeSiteId}
            onChange={(val) => {
              setActiveSiteId(val);
              setSelectedRowKeys([]);
            }}
            style={{ width: 220 }}
            options={filteredSites.map((s) => ({ label: `🌐 ${s.name}`, value: s.id }))}
          />
          {isAdmin && activeSiteId && (
            <button
              className="site-settings-btn"
              onClick={() => router.push(`/sites/${activeSiteId}`)}
            >
              <SettingOutlined /> Site settings
            </button>
          )}
        </div>
      </div>

      {isConfigLoading || !config ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : (
        <>
          {/* Meta Chips */}
          <div className="bookings-meta">
            <span className={`meta-chip ${config.bookingEnabled ? 'enabled' : 'gray'}`}>
              🗓 Booking {config.bookingEnabled ? 'enabled' : 'disabled'}
            </span>
            <span className="meta-chip gray">{activeSite?.name}</span>
            <span className="meta-chip purple">{config.timezone}</span>
            <span className="meta-chip gray">
              {config.resourceDetails?.length || 0} staff · {config.serviceDetails?.length || 0}{' '}
              services
            </span>
          </div>

          {/* Controls */}
          <div className="bookings-controls">
            <div className="view-toggle">
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
              >
                <BarsOutlined /> List {tableQuery.data?.total ?? 0}
              </button>
              <button
                className={viewMode === 'calendar' ? 'active' : ''}
                onClick={() => setViewMode('calendar')}
              >
                <AppstoreOutlined /> Calendar
              </button>
            </div>

            <div className="booking-actions">
              <Button
                icon={<LeftOutlined />}
                onClick={() => setCurrentDate((d) => d.subtract(1, 'day'))}
              />
              <span style={{ fontWeight: 600 }}>{currentDate.format('DD/MM/YYYY')}</span>
              <Button
                icon={<RightOutlined />}
                onClick={() => setCurrentDate((d) => d.add(1, 'day'))}
              />
              <Button onClick={() => setCurrentDate(dayjs())}>Today</Button>
              <DatePicker
                value={currentDate}
                onChange={(d) => d && setCurrentDate(d)}
                format="DD/MM/YYYY"
                style={{ width: 130 }}
              />

              <Button
                style={{ marginLeft: 24 }}
                danger={showCancelled}
                type={showCancelled ? 'primary' : 'default'}
                onClick={() => setShowCancelled(!showCancelled)}
              >
                {showCancelled ? 'Hide cancelled' : 'Show cancelled'}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bookings-filters">
            <Input
              placeholder="Search phone, name, or code..."
              prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 300, borderRadius: 8, padding: '6px 11px' }}
            />
            <Select
              placeholder="All statuses"
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 150 }}
              allowClear
              options={[
                { label: 'Confirmed', value: 'Confirmed' },
                { label: 'Completed', value: 'Completed' },
                { label: 'Cancelled', value: 'Cancelled' },
              ]}
            />
            <Select
              placeholder="All staff"
              value={filterStaffId}
              onChange={setFilterStaffId}
              style={{ width: 150 }}
              allowClear
              options={config.resourceDetails?.map((s) => ({ label: s.name, value: s.id })) || []}
            />

            <div style={{ flex: 1 }} />

            {selectedRowKeys.length > 0 && (
              <Button
                danger
                type="text"
                icon={<CloseOutlined />}
                onClick={handleBulkCancel}
                style={{ backgroundColor: '#fce7f3', color: '#be185d', borderColor: '#fbcfe8' }}
              >
                Cancel selected ({selectedRowKeys.length})
              </Button>
            )}

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setInitialModalData(null);
                setIsModalOpen(true);
              }}
              style={{ borderRadius: 8 }}
            >
              New Booking
            </Button>
          </div>

          {/* View Content */}
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
              data={calendarData}
              staff={config.resourceDetails || []}
              startTime={config.startTime}
              endTime={config.endTime}
              slotDuration={config.slotDuration}
              availableDays={config.availableDays || [1, 2, 3, 4, 5, 6, 7]}
              selectedDate={currentDate}
              onBookingClick={(record) => setSelectedBooking(record)}
              onEmptySlotClick={handleEmptySlotClick}
            />
          )}

          {/* Modals & Drawers */}
          <ManualBookingModal
            open={isModalOpen}
            onCancel={() => {
              setIsModalOpen(false);
              setInitialModalData(null);
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
