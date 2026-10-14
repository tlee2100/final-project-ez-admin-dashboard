import { Drawer, Typography, Button, Tag, Space, Divider, Modal } from 'antd';
import {
  PhoneOutlined,
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
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

  // Collect all unique service names
  const allServices: string[] = [];
  if (booking.services && booking.services.length > 0) {
    booking.services.forEach((s) => {
      if (s?.name && !allServices.includes(s.name)) allServices.push(s.name);
    });
  }
  if (booking.templateFields?.serviceNames && Array.isArray(booking.templateFields.serviceNames)) {
    booking.templateFields.serviceNames.forEach((name) => {
      if (typeof name === 'string' && !allServices.includes(name)) allServices.push(name);
    });
  }
  if (allServices.length === 0 && booking.service?.name) {
    allServices.push(booking.service.name);
  }

  // Calculate merged slot-by-slot service schedule
  const serviceSchedule: Array<{
    serviceName: string;
    startTime: string;
    endTime: string;
    slotCount: number;
    staffName?: string;
    notes?: string;
  }> = [];

  const rawSlots = booking.templateFields?.slots;
  if (Array.isArray(rawSlots) && rawSlots.length > 0) {
    let current: (typeof serviceSchedule)[0] | null = null;
    const totalMinutes = dayjs(booking.endAt).diff(dayjs(booking.startAt), 'minute');
    const slotMins = Math.max(15, Math.round(totalMinutes / rawSlots.length));
    const baseStart = dayjs(booking.startAt);

    rawSlots.forEach((slot, idx) => {
      const sName = slot.serviceName || booking.service?.name || 'Service';
      const staffName = slot.staffName || booking.resource?.name;
      const slotStart = slot.timeSlot || baseStart.add(idx * slotMins, 'minute').format('HH:mm');
      const slotEnd = baseStart.add((idx + 1) * slotMins, 'minute').format('HH:mm');
      const slotNote = slot.notes;

      if (
        current &&
        current.serviceName === sName &&
        current.staffName === staffName &&
        current.notes === slotNote
      ) {
        current.slotCount += 1;
        current.endTime = slotEnd;
      } else {
        if (current) serviceSchedule.push(current);
        current = {
          serviceName: sName,
          startTime: slotStart,
          endTime: slotEnd,
          slotCount: 1,
          staffName,
          notes: slotNote,
        };
      }
    });
    if (current) serviceSchedule.push(current);
  } else if (
    booking.templateFields?.serviceNames &&
    Array.isArray(booking.templateFields.serviceNames) &&
    booking.templateFields.serviceNames.length > 0
  ) {
    const sNames = booking.templateFields.serviceNames;
    const baseStart = dayjs(booking.startAt);
    const totalMinutes = dayjs(booking.endAt).diff(baseStart, 'minute');
    const slotMins = Math.max(15, Math.round(totalMinutes / sNames.length));
    let current: (typeof serviceSchedule)[0] | null = null;

    sNames.forEach((sName, idx) => {
      const slotStart = baseStart.add(idx * slotMins, 'minute').format('HH:mm');
      const slotEnd = baseStart.add((idx + 1) * slotMins, 'minute').format('HH:mm');

      if (current && current.serviceName === sName) {
        current.slotCount += 1;
        current.endTime = slotEnd;
      } else {
        if (current) serviceSchedule.push(current);
        current = {
          serviceName: String(sName),
          startTime: slotStart,
          endTime: slotEnd,
          slotCount: 1,
          staffName: booking.resource?.name,
        };
      }
    });
    if (current) serviceSchedule.push(current);
  } else {
    serviceSchedule.push({
      serviceName: booking.service?.name || '—',
      startTime: dayjs(booking.startAt).format('HH:mm'),
      endTime: dayjs(booking.endAt).format('HH:mm'),
      slotCount: 1,
      staffName: booking.resource?.name,
    });
  }

  return (
    <Drawer
      title={<span style={{ fontSize: 18 }}>Booking {booking.code}</span>}
      placement="right"
      onClose={onClose}
      open={open}
      width={440}
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
              <div
                style={{ marginTop: 12, fontSize: 13, color: '#4b5563', whiteSpace: 'pre-wrap' }}
              >
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
            Appointment Overview
          </Title>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px 8px',
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Staff / Resource</div>
              <div style={{ fontWeight: 500 }}>{booking.resource?.name ?? '—'}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Date</div>
              <div style={{ fontWeight: 500 }}>{dateStr}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Total Time</div>
              <div style={{ fontWeight: 500 }}>{timeStr}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Timezone</div>
              <div style={{ fontWeight: 500 }}>{booking.timezone}</div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 6 }}>
              Services ({allServices.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {allServices.map((s, i) => (
                <Tag
                  key={i}
                  color="blue"
                  style={{ borderRadius: 6, padding: '2px 8px', fontSize: 13 }}
                >
                  {s}
                </Tag>
              ))}
            </div>
          </div>

          {serviceSchedule.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>
                Service & Slot Schedule:
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  backgroundColor: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}
              >
                {serviceSchedule.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 13,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>
                          {item.startTime} - {item.endTime}
                        </span>
                        {item.slotCount > 1 && (
                          <span style={{ color: '#64748b', fontSize: 12, marginLeft: 6 }}>
                            ({item.slotCount} slots)
                          </span>
                        )}
                      </div>
                      <Tag color="cyan" style={{ margin: 0, fontWeight: 500 }}>
                        {item.serviceName}
                      </Tag>
                    </div>
                    {item.notes && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#475569',
                          backgroundColor: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: 4,
                          border: '1px solid #e2e8f0',
                          width: 'fit-content',
                        }}
                      >
                        <span style={{ color: '#64748b' }}>Slot note: </span>
                        {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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
              onClick={() => {
                Modal.confirm({
                  title: 'Cancel Booking',
                  icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
                  content: `Are you sure you want to cancel the booking for ${booking.customerName || 'this customer'}?`,
                  okText: 'Yes, Cancel',
                  okType: 'danger',
                  cancelText: 'No, Keep',
                  onOk: () => onUpdateStatus(booking.id, 'Cancelled'),
                });
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
