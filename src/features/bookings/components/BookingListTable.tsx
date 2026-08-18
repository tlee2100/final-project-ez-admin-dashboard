import React from 'react';
import { Table, Tag, Dropdown, MenuProps, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MoreOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import type { BookingRecord } from '../types/booking.types';

interface BookingListTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tableProps: any;
  onRowClick: (record: BookingRecord) => void;
  onUpdateStatus: (id: string, status: string) => void;
  selectedRowKeys?: React.Key[];
  onSelectChange?: (newSelectedRowKeys: React.Key[]) => void;
}

export function BookingListTable({
  tableProps,
  onRowClick,
  onUpdateStatus,
  selectedRowKeys,
  onSelectChange,
}: BookingListTableProps) {
  const columns: ColumnsType<BookingRecord> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'startAt',
      key: 'date',
      render: (value: string) => dayjs(value).format('DD/MM/YYYY'),
    },
    {
      title: 'Time',
      key: 'time',
      render: (_: unknown, record: BookingRecord) =>
        `${dayjs(record.startAt).format('HH:mm')} - ${dayjs(record.endAt).format('HH:mm')}`,
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, record: BookingRecord) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.customerName}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{record.phone}</div>
        </div>
      ),
    },
    {
      title: 'Service',
      key: 'service',
      render: (_: unknown, record: BookingRecord) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.service?.name ?? '—'}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{record.resource?.name ?? '—'}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const normalized = status
          ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
          : status;
        let color = 'default';
        if (normalized === 'Confirmed') color = 'green';
        if (normalized === 'Completed') color = 'blue';
        if (normalized === 'Cancelled') color = 'red';
        return <Tag color={color}>{normalized}</Tag>;
      },
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_: unknown, record: BookingRecord) => {
        const normalized = record.status
          ? record.status.charAt(0).toUpperCase() + record.status.slice(1).toLowerCase()
          : record.status;

        const handleMenuClick: MenuProps['onClick'] = (e) => {
          if (e.key === 'complete') {
            onUpdateStatus(record.id, 'Completed');
          } else if (e.key === 'cancel') {
            onUpdateStatus(record.id, 'Cancelled');
          }
        };

        const items: MenuProps['items'] = [];

        if (normalized !== 'Completed' && normalized !== 'Cancelled') {
          items.push(
            { key: 'complete', label: 'Mark as Completed' },
            { key: 'cancel', label: 'Cancel Booking', danger: true },
          );
        }

        if (items.length === 0) return null;

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <div className="booking-table-container">
      <Table
        {...tableProps}
        columns={columns}
        rowKey="id"
        rowSelection={
          onSelectChange
            ? {
                selectedRowKeys,
                onChange: onSelectChange,
                getCheckboxProps: (record: BookingRecord) => ({
                  disabled:
                    record.status?.toLowerCase() === 'completed' ||
                    record.status?.toLowerCase() === 'cancelled',
                }),
              }
            : undefined
        }
        rowClassName={(record) =>
          record.status?.toLowerCase() === 'cancelled' ? 'booking-row-cancelled' : ''
        }
        onRow={(record) => ({
          onClick: () => onRowClick(record as BookingRecord),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  );
}
