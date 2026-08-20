import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, Typography, Spin, Tag } from 'antd';
import dayjs from 'dayjs';
import { bookingApi } from '../services/booking.api';
import type {
  AvailableSlot,
  BookingConfig,
  ManualBookingFormData,
  SelectedCalendarSlot,
} from '../types/booking.types';

const { Title, Text } = Typography;

interface ManualBookingModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (bookingData: ManualBookingFormData) => boolean | void | Promise<boolean | void>;
  siteId: string;
  config?: BookingConfig | null;
  industryTemplateId?: string;
  siteServices?: { id: string; name: string }[];
  siteStaff?: { id: string; name: string }[];
  initialData?: { staffId?: string; timeSlot?: string } | null;
  selectedSlots?: SelectedCalendarSlot[];
  selectedDate: dayjs.Dayjs;
  fetchAvailableSlots?: (
    siteId: string,
    startDate: string,
    endDate: string,
    resourceId: string,
  ) => Promise<AvailableSlot[]>;
  onHoldSlot: (slot: AvailableSlot | AvailableSlot[]) => Promise<boolean>;
  holdExpiry: Date | null;
  onHoldExpired: () => void;
  onReleaseHold: () => Promise<void>;
}

export function ManualBookingModal({
  open,
  onCancel,
  onSuccess,
  siteId,
  config,
  industryTemplateId = config?.industryTemplate || 'general',
  siteServices = config?.serviceDetails || [],
  siteStaff = config?.resourceDetails || [],
  initialData,
  selectedSlots = [],
  selectedDate,
  fetchAvailableSlots = (sId, startDate, endDate, resourceId) =>
    bookingApi.getAvailableSlots(sId, { startDate, endDate, resourceId }),
  onHoldSlot,
  holdExpiry,
  onHoldExpired,
  onReleaseHold,
}: ManualBookingModalProps) {
  const [form] = Form.useForm();
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const isMultiSlot = selectedSlots && selectedSlots.length > 0;
  const isSalon = industryTemplateId === 'salon';

  const selectedFormDate = Form.useWatch('date', form);
  const selectedStaffId = Form.useWatch('staffId', form);
  const selectedTimeSlots = Form.useWatch('timeSlot', form);
  const selectedTimeSlotsArr: string[] = Array.isArray(selectedTimeSlots)
    ? selectedTimeSlots
    : selectedTimeSlots
      ? [selectedTimeSlots]
      : [];

  const totalSlots = isMultiSlot ? selectedSlots.length : Math.max(1, selectedTimeSlotsArr.length);

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
      if (isMultiSlot) {
        form.setFieldsValue({
          date: selectedSlots[0]?.date || selectedDate || dayjs(),
          staffId: selectedSlots[0]?.staffId || undefined,
          timeSlot: selectedSlots.map((s) => s.time),
        });
      } else {
        form.setFieldsValue({
          date: selectedDate || dayjs(),
          staffId: initialData?.staffId || undefined,
          timeSlot: initialData?.timeSlot ? [initialData.timeSlot] : undefined,
        });
      }
    } else {
      form.resetFields();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailableSlots([]);
    }
  }, [open, initialData, selectedDate, selectedSlots, isMultiSlot, form]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (isMultiSlot || !selectedFormDate || !selectedStaffId || !siteId) {
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

    if (open && !isMultiSlot) {
      fetchSlots();
    }
  }, [selectedFormDate, selectedStaffId, siteId, open, isMultiSlot, fetchAvailableSlots]);

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

  const handleTimeSlotChange = async (value: string | string[]) => {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    if (values.length === 0) {
      if (holdExpiry) {
        await onReleaseHold();
      }
      return;
    }

    const slotsToHold = availableSlots.filter((s) =>
      values.includes(dayjs(s.startAt).format('HH:mm')),
    );
    if (slotsToHold.length > 0) {
      const success = await onHoldSlot(slotsToHold);
      if (!success) {
        form.setFieldValue('timeSlot', undefined);
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFinish = async (values: any) => {
    let serviceIds: string[] | undefined = undefined;
    let singleServiceId: string | undefined = undefined;

    if (Array.isArray(values.serviceId)) {
      serviceIds = values.serviceId;
      singleServiceId = values.serviceId[0];
    } else if (values.serviceId) {
      serviceIds = [values.serviceId];
      singleServiceId = values.serviceId;
    }

    let slotsPayload:
      | Array<{
          resourceId: string;
          date: string;
          timeSlot: string;
          serviceId?: string;
        }>
      | undefined = undefined;

    if (isMultiSlot) {
      slotsPayload = selectedSlots.map((s, idx) => ({
        resourceId: s.staffId,
        date: dayjs(s.date).format('YYYY-MM-DD'),
        timeSlot: s.time,
        serviceId: serviceIds ? serviceIds[idx] : undefined,
      }));
    } else if (selectedTimeSlotsArr.length > 1) {
      const formattedDate = values.date
        ? values.date.format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD');
      slotsPayload = selectedTimeSlotsArr.map((time, idx) => ({
        resourceId: values.staffId,
        date: formattedDate,
        timeSlot: time,
        serviceId: serviceIds ? serviceIds[idx] : undefined,
      }));
    }

    const singleTimeSlot = isMultiSlot
      ? selectedSlots[0]?.time
      : selectedTimeSlotsArr[0] || values.timeSlot;

    const bookingPayload: ManualBookingFormData = {
      ...values,
      timeSlot: singleTimeSlot,
      serviceId: singleServiceId,
      serviceIds,
      slots: slotsPayload,
    };

    const success = await onSuccess(bookingPayload);
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
            {isMultiSlot
              ? `Creating booking for ${totalSlots} selected slot${totalSlots > 1 ? 's' : ''}`
              : 'Manual walk-in or phone booking — auto-confirmed'}
          </Text>
        </div>
      }
      onCancel={onCancel}
      footer={null}
      width={540}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 20 }}>
        {/* If multi-slot, show selected slots summary */}
        {isMultiSlot && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <Text strong style={{ display: 'block', marginBottom: 8, color: '#334155' }}>
              Selected Time Slots ({totalSlots} slots):
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selectedSlots.map((s, idx) => (
                <Tag
                  color="blue"
                  key={`${s.staffId}-${s.time}-${idx}`}
                  style={{ padding: '4px 8px', fontSize: 13 }}
                >
                  <strong>{s.staffName}</strong>: {s.time} ({dayjs(s.date).format('DD/MM/YYYY')})
                </Tag>
              ))}
            </div>
          </div>
        )}

        <Title level={5} style={{ marginBottom: 16 }}>
          Customer Info
        </Title>

        <Form.Item name="customerName" label="Name" rules={[{ required: true }]}>
          <Input placeholder="Nguyen Van A" />
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

        <Title level={5} style={{ marginTop: 28, marginBottom: 16 }}>
          Booking Details
        </Title>

        {siteServices && siteServices.length > 0 && (
          <Form.Item
            name="serviceId"
            label={totalSlots > 1 ? `Services (${totalSlots} slots)` : 'Service'}
            rules={[
              {
                required: isSalon,
                message: 'Service is required for salon',
              },
              ...(isSalon && totalSlots > 1
                ? [
                    {
                      validator: (_: unknown, value: string[]) => {
                        if (!value || value.length !== totalSlots) {
                          return Promise.reject(
                            new Error(
                              `Please select exactly ${totalSlots} services for ${totalSlots} slots.`,
                            ),
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]
                : []),
            ]}
          >
            <Select
              mode={totalSlots > 1 ? 'multiple' : undefined}
              placeholder={totalSlots > 1 ? 'Select services' : 'Select service'}
              allowClear
            >
              {siteServices.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {!isMultiSlot && (
          <>
            <Form.Item name="staffId" label="Staff / Resource" rules={[{ required: true }]}>
              <Select
                placeholder="Select staff or resource"
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
              label={
                selectedTimeSlotsArr.length > 1
                  ? `Time Slots (${selectedTimeSlotsArr.length} selected)`
                  : 'Time Slot'
              }
              rules={[{ required: true, message: 'Please select at least one time slot' }]}
              extra={
                !selectedFormDate || !selectedStaffId
                  ? 'Please select a date and staff/resource first'
                  : `${availableSlots.length} slots available for this date & staff/resource`
              }
            >
              <Select
                mode="multiple"
                placeholder="Select time slot(s)"
                loading={isFetchingSlots}
                notFoundContent={isFetchingSlots ? <Spin size="small" /> : 'No available slots'}
                disabled={!selectedFormDate || !selectedStaffId}
                onChange={handleTimeSlotChange}
                allowClear
              >
                {availableSlots.map((slot) => {
                  const time = dayjs(slot.startAt).format('HH:mm');
                  const isHolding = slot.status === 'HOLDING';
                  return (
                    <Select.Option
                      key={time}
                      value={time}
                      disabled={isHolding}
                      style={
                        isHolding ? { color: '#d97706', backgroundColor: '#fef08a' } : undefined
                      }
                    >
                      {isHolding ? `${time} - Being booked... 🕒` : time}
                    </Select.Option>
                  );
                })}
              </Select>
            </Form.Item>
          </>
        )}

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
          <Button type="primary" htmlType="submit" disabled={!isMultiSlot && !holdExpiry}>
            Create Booking
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
