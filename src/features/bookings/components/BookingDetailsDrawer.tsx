import React from 'react';
import { Drawer, Typography, Button, Tag, Space, Divider } from 'antd';
import {
  PhoneOutlined,
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

import type { BookingRecord } from '../types/booking.types';

interface BookingDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  booking: BookingRecord | null;
  onUpdateStatus: (id: string, status: string) => void;
}

export function BookingDetailsDrawer({
  open,
  onClose,
  booking,
  onUpdateStatus,
}: BookingDetailsDrawerProps) {
  if (!booking) return null;

  const normalizedStatus = booking.status
    ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()
    : booking.status;
  const isCompleted = normalizedStatus === 'Completed';
  const isCancelled = normalizedStatus === 'Cancelled';

  const dateStr = dayjs(booking.startAt).format('DD/MM/YYYY');
  const timeStr = `${dayjs(booking.startAt).format('HH:mm')} - ${dayjs(booking.endAt).format('HH:mm')}`;

  return (
    <Drawer
      title={<span style={{ fontSize: 18 }}>Booking {booking.code}</span>}
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      extra={
        <Tag
          color={
            normalizedStatus === 'Confirmed'
              ? 'green'
              : normalizedStatus === 'Completed'
                ? 'blue'
                : 'default'
          }
          style={{ borderRadius: 12, padding: '2px 10px' }}
        >
          {normalizedStatus}
        </Tag>
      }
      rootClassName="booking-drawer"
    >
      <div className="booking-drawer-content">
        <div className="booking-drawer-body">
          <Title
            level={5}
            style={{ color: '#6b7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            Customer
          </Title>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              {booking.customerName}
            </div>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4b5563' }}>
                <PhoneOutlined /> {booking.phone}
                <Button size="small" icon={<PhoneOutlined />} style={{ borderRadius: 4 }} />
              </div>
              {booking.customerEmail && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4b5563' }}>
                  <MailOutlined /> {booking.customerEmail}
                </div>
              )}
            </Space>
            {booking.notes && (
              <div style={{ marginTop: 12, fontSize: 13, color: '#4b5563' }}>
                <Text type="secondary">Notes: </Text>
                {booking.notes}
              </div>
            )}
          </div>

          <Divider />

          <Title
            level={5}
            style={{ color: '#6b7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            Appointment
          </Title>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px 8px',
              marginBottom: 24,
            }}
          >
            <div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Service</div>
              <div style={{ fontWeight: 500 }}>{booking.service?.name ?? '—'}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Staff</div>
              <div style={{ fontWeight: 500 }}>{booking.resource?.name ?? '—'}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Date</div>
              <div style={{ fontWeight: 500 }}>{dateStr}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Time</div>
              <div style={{ fontWeight: 500 }}>{timeStr}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Source</div>
              <div style={{ fontWeight: 500 }}>Manual</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Timezone</div>
              <div style={{ fontWeight: 500 }}>{booking.timezone}</div>
            </div>
          </div>
        </div>

        {!isCompleted && !isCancelled && (
          <div className="booking-drawer-footer">
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              style={{ flex: 1, backgroundColor: '#10b981', borderColor: '#10b981' }}
              onClick={() => onUpdateStatus(booking.id, 'Completed')}
            >
              Complete
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              style={{ flex: 1 }}
              onClick={() => onUpdateStatus(booking.id, 'Cancelled')}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
