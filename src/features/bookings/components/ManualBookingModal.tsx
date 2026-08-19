import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, Typography, Spin } from 'antd';
import dayjs from 'dayjs';
import { AvailableSlot, ManualBookingFormData } from '../types/booking.types';

const { Title, Text } = Typography;

interface ManualBookingModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (bookingData: ManualBookingFormData) => boolean | void | Promise<boolean | void>;
  siteId: string;
  siteServices: { id: string; name: string }[];
  siteStaff: { id: string; name: string }[];
  initialData?: { staffId?: string; timeSlot?: string } | null;
  selectedDate: dayjs.Dayjs;
  startTime: string;
  endTime: string;
  slotDuration: number;
  fetchAvailableSlots: (
    siteId: string,
    startDate: string,
    endDate: string,
    resourceId: string,
  ) => Promise<AvailableSlot[]>;
  onHoldSlot: (slot: AvailableSlot) => Promise<boolean>;
  holdExpiry: Date | null;
  onHoldExpired: () => void;
  onReleaseHold: () => Promise<void>;
}

export function ManualBookingModal({
  open,
  onCancel,
  onSuccess,
  siteId,
  siteServices,
  siteStaff,
  initialData,
  selectedDate,

  fetchAvailableSlots,
  onHoldSlot,
  holdExpiry,
  onHoldExpired,
  onReleaseHold,
}: ManualBookingModalProps) {
  const [form] = Form.useForm();
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const selectedFormDate = Form.useWatch('date', form);
  const selectedStaffId = Form.useWatch('staffId', form);

  // Validate Vietnamese phone number: 0 + 9-10 digits
  const phoneValidator = (_: unknown, value: string) => {
    if (!value) return Promise.resolve();
    const phoneRegex = /^0[0-9]{9,10}$/;
    if (!phoneRegex.test(value)) {
      return Promise.reject(new Error('Phone must match Vietnamese format (0xxxxxxxxx).'));
    }
    return Promise.resolve();
  };

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue({
        date: selectedDate || dayjs(),
        staffId: initialData?.staffId || undefined,
        timeSlot: initialData?.timeSlot || undefined,
      });
    } else {
      form.resetFields();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailableSlots([]);
    }
  }, [open, initialData, selectedDate, form]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedFormDate || !selectedStaffId || !siteId) {
        setAvailableSlots([]);
        return;
      }

      setIsFetchingSlots(true);
      try {
        const startDate = selectedFormDate.startOf('day').toISOString();
        const endDate = selectedFormDate.endOf('day').toISOString();

        const formattedSlots = await fetchAvailableSlots(
          siteId,
          startDate,
          endDate,
          selectedStaffId,
        );
        setAvailableSlots(formattedSlots);
      } catch (error) {
        console.error('Failed to fetch available slots:', error);
        setAvailableSlots([]);
      } finally {
        setIsFetchingSlots(false);
      }
    };

    if (open) {
      fetchSlots();
    }
  }, [selectedFormDate, selectedStaffId, siteId, open, fetchAvailableSlots]);

  useEffect(() => {
    if (!holdExpiry) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, holdExpiry.getTime() - now.getTime());
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onHoldExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiry, onHoldExpired]);

  const handleTimeSlotChange = async (value: string) => {
    const selectedSlot = availableSlots.find((s) => dayjs(s.startAt).format('HH:mm') === value);
    if (selectedSlot) {
      const success = await onHoldSlot(selectedSlot);
      if (!success) {
        form.setFieldValue('timeSlot', undefined);
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFinish = async (values: any) => {
    const success = await onSuccess(values);
    if (success !== false) {
      form.resetFields();
    }
  };

  return (
    <Modal
      open={open}
      title={
        <div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Create New Booking</div>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal' }}>
            Manual walk-in or phone booking — auto-confirmed
          </Text>
        </div>
      }
      onCancel={onCancel}
      footer={null}
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          Customer Info
        </Title>

        <Form.Item name="customerName" label="Name" rules={[{ required: true }]}>
          <Input placeholder="Tân Lê" />
        </Form.Item>

        <Form.Item
          name="customerPhone"
          label="Phone"
          rules={[{ required: true }, { validator: phoneValidator }]}
          extra="Vietnamese format: 0 + 9-10 digits"
        >
          <Input placeholder="0912345678" />
        </Form.Item>

        <Form.Item name="customerEmail" label="Email">
          <Input placeholder="email@example.com" />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea placeholder="Any special requests..." rows={3} />
        </Form.Item>

        <Title level={5} style={{ marginTop: 32, marginBottom: 16 }}>
          Booking Details
        </Title>

        <Form.Item name="serviceId" label="Service" rules={[{ required: true }]}>
          <Select placeholder="Select service">
            {siteServices.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {s.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="staffId" label="Staff" rules={[{ required: true }]}>
          <Select
            placeholder="Select staff"
            onChange={async () => {
              if (holdExpiry) {
                await onReleaseHold();
              }
              form.setFieldValue('timeSlot', undefined);
            }}
          >
            {siteStaff.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {s.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="date" label="Date" rules={[{ required: true }]}>
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
            onChange={async () => {
              if (holdExpiry) {
                await onReleaseHold();
              }
              form.setFieldValue('timeSlot', undefined);
            }}
          />
        </Form.Item>

        <Form.Item
          name="timeSlot"
          label="Time Slot"
          rules={[{ required: true }]}
          extra={
            !selectedFormDate || !selectedStaffId
              ? 'Please select a date and staff first'
              : `${availableSlots.length} slots available for this date & staff`
          }
        >
          <Select
            placeholder="Select time"
            loading={isFetchingSlots}
            notFoundContent={isFetchingSlots ? <Spin size="small" /> : 'No available slots'}
            disabled={!selectedFormDate || !selectedStaffId}
            onChange={handleTimeSlotChange}
          >
            {availableSlots.map((slot) => {
              const time = dayjs(slot.startAt).format('HH:mm');
              const isHolding = slot.status === 'HOLDING';
              return (
                <Select.Option
                  key={time}
                  value={time}
                  disabled={isHolding}
                  style={isHolding ? { color: '#d97706', backgroundColor: '#fef08a' } : undefined}
                >
                  {isHolding ? `${time} - Being booked... 🕒` : time}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        {timeLeft !== null && timeLeft > 0 && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 8,
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            <Text strong style={{ color: '#166534' }}>
              Slot held for{' '}
              {Math.floor(timeLeft / 60000)
                .toString()
                .padStart(2, '0')}
              :
              {Math.floor((timeLeft % 60000) / 1000)
                .toString()
                .padStart(2, '0')}
            </Text>
            <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>
              Complete your booking before time expires.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" disabled={!holdExpiry}>
            Create Booking
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
