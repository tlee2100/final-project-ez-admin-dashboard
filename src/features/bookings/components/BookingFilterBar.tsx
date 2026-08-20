import React from 'react';
import { Button, DatePicker, Select, Input } from 'antd';
import {
  PlusOutlined,
  AppstoreOutlined,
  BarsOutlined,
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { BookingConfig } from '../types/booking.types';

interface BookingFilterBarProps {
  config: BookingConfig;
  viewMode: 'list' | 'calendar';
  onViewModeChange: (mode: 'list' | 'calendar') => void;
  totalBookingsCount: number;
  currentDate: dayjs.Dayjs;
  onCurrentDateChange: (date: dayjs.Dayjs) => void;
  showCancelled: boolean;
  onShowCancelledChange: (show: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  filterStatus: string | null;
  onFilterStatusChange: (status: string | null) => void;
  filterStaffId: string | null;
  onFilterStaffIdChange: (staffId: string | null) => void;
  selectedCount: number;
  onBulkCancel: () => void;
  onOpenNewBookingModal: () => void;
}

export function BookingFilterBar({
  config,
  viewMode,
  onViewModeChange,
  totalBookingsCount,
  currentDate,
  onCurrentDateChange,
  showCancelled,
  onShowCancelledChange,
  searchQuery,
  onSearchQueryChange,
  filterStatus,
  onFilterStatusChange,
  filterStaffId,
  onFilterStaffIdChange,
  selectedCount,
  onBulkCancel,
  onOpenNewBookingModal,
}: BookingFilterBarProps) {
  return (
    <>
      {/* View Toggle & Date Navigation */}
      <div className="bookings-controls">
        <div className="view-toggle">
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => onViewModeChange('list')}
          >
            <BarsOutlined /> List {totalBookingsCount}
          </button>
          <button
            className={viewMode === 'calendar' ? 'active' : ''}
            onClick={() => onViewModeChange('calendar')}
          >
            <AppstoreOutlined /> Calendar
          </button>
        </div>

        <div className="booking-actions">
          <Button
            icon={<LeftOutlined />}
            onClick={() => onCurrentDateChange(currentDate.subtract(1, 'day'))}
          />
          <span style={{ fontWeight: 600 }}>{currentDate.format('DD/MM/YYYY')}</span>
          <Button
            icon={<RightOutlined />}
            onClick={() => onCurrentDateChange(currentDate.add(1, 'day'))}
          />
          <Button onClick={() => onCurrentDateChange(dayjs())}>Today</Button>
          <DatePicker
            value={currentDate}
            onChange={(d) => d && onCurrentDateChange(d)}
            format="DD/MM/YYYY"
            style={{ width: 130 }}
          />

          <Button
            style={{ marginLeft: 24 }}
            danger={showCancelled}
            type={showCancelled ? 'primary' : 'default'}
            onClick={() => onShowCancelledChange(!showCancelled)}
          >
            {showCancelled ? 'Hide cancelled' : 'Show cancelled'}
          </Button>
        </div>
      </div>

      {/* Filter Inputs & Actions Bar */}
      <div className="bookings-filters">
        <Input
          placeholder="Search phone, name, or code..."
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          style={{ width: 300, borderRadius: 8, padding: '6px 11px' }}
        />
        <Select
          placeholder="All statuses"
          value={filterStatus}
          onChange={onFilterStatusChange}
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
          onChange={onFilterStaffIdChange}
          style={{ width: 150 }}
          allowClear
          options={config.resourceDetails?.map((s) => ({ label: s.name, value: s.id })) || []}
        />

        <div style={{ flex: 1 }} />

        {selectedCount > 0 && (
          <Button
            danger
            type="text"
            icon={<CloseOutlined />}
            onClick={onBulkCancel}
            style={{
              backgroundColor: '#fce7f3',
              color: '#be185d',
              borderColor: '#fbcfe8',
            }}
          >
            Cancel selected ({selectedCount})
          </Button>
        )}

        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={!config.bookingEnabled}
          onClick={onOpenNewBookingModal}
          style={{ borderRadius: 8 }}
        >
          New Booking
        </Button>
      </div>
    </>
  );
}
