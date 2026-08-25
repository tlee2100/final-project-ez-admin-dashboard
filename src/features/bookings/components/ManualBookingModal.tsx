import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Typography,
  Spin,
  Tag,
  Tabs,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [activeTabKey, setActiveTabKey] = useState<string>('0');

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

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setActiveTabKey('0');
      if (isMultiSlot) {
        form.setFieldsValue({
          date: selectedSlots[0]?.date || selectedDate || dayjs(),
          staffId: selectedSlots[0]?.staffId || undefined,
          timeSlot: selectedSlots.map((s) => s.time),
          serviceId: undefined,
          slotServices: {},
          slotNotes: {},
        });
      } else {
        form.setFieldsValue({
          date: selectedDate || dayjs(),
          staffId: undefined,
          timeSlot: undefined,
          slotServices: {},
          slotNotes: {},
        });
      }
    }
  }

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
      void fetchSlots();
    }
  }, [selectedFormDate, selectedStaffId, siteId, open, isMultiSlot, fetchAvailableSlots]);

  useEffect(() => {
    if (!holdExpiry) return;

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
      await onReleaseHold();
      return;
    }

    const slotsToHold: AvailableSlot[] = values
      .map((slotStr) => availableSlots.find((s) => s.startAt === slotStr))
      .filter((s): s is AvailableSlot => !!s);

    if (slotsToHold.length > 0) {
      const success = await onHoldSlot(slotsToHold);
      if (!success) {
        form.setFieldValue('timeSlot', undefined);
      }
    }
  };

  const handleApplyToAllSlots = () => {
    const slotServices = (form.getFieldValue('slotServices') as Record<string, string>) || {};
    const slotNotes = (form.getFieldValue('slotNotes') as Record<string, string>) || {};
    const currentIdx = parseInt(activeTabKey, 10) || 0;
    const targetService = slotServices[currentIdx] || slotServices[0];
    const targetNote = slotNotes[currentIdx] || slotNotes[0];

    const nextServices: Record<string, string> = {};
    const nextNotes: Record<string, string> = {};

    for (let i = 0; i < totalSlots; i++) {
      if (targetService) nextServices[i] = targetService;
      if (targetNote !== undefined) nextNotes[i] = targetNote;
    }

    form.setFieldsValue({
      slotServices: nextServices,
      slotNotes: nextNotes,
    });
    message.success('Configuration applied to all slots');
  };

  const handleFinish = async (
    values: ManualBookingFormData & {
      slotServices?: Record<number, string> | string[];
      slotNotes?: Record<number, string> | string[];
    },
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const slotServicesList: string[] = [];
      const slotNotesRaw: string[] = [];
      if (totalSlots > 1) {
        for (let i = 0; i < totalSlots; i++) {
          const sId =
            (Array.isArray(values.slotServices)
              ? values.slotServices[i]
              : values.slotServices?.[i]) || values.serviceId;
          if (sId) slotServicesList.push(sId);

          const sNote =
            (Array.isArray(values.slotNotes) ? values.slotNotes[i] : values.slotNotes?.[i]) || '';
          slotNotesRaw.push(sNote.trim());
        }
      } else {
        if (values.serviceId) {
          slotServicesList.push(values.serviceId);
        }
        const singleSlotNote =
          (Array.isArray(values.slotNotes) ? values.slotNotes[0] : values.slotNotes?.[0]) || '';
        slotNotesRaw.push(singleSlotNote.trim());
      }

      const singleServiceId = slotServicesList[0] || values.serviceId;
      const serviceIds = slotServicesList.length > 0 ? slotServicesList : undefined;

      let slotsPayload:
        | Array<{
            resourceId: string;
            date: string;
            timeSlot: string;
            serviceId?: string;
            notes?: string;
          }>
        | undefined = undefined;

      if (isMultiSlot) {
        slotsPayload = selectedSlots.map((s, idx) => ({
          resourceId: s.staffId,
          date: dayjs(s.date).format('YYYY-MM-DD'),
          timeSlot: s.time,
          serviceId: slotServicesList[idx] || slotServicesList[0],
          notes: slotNotesRaw[idx] || undefined,
        }));
      } else if (selectedTimeSlotsArr.length > 1) {
        const formattedDate = values.date
          ? values.date.format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD');
        slotsPayload = selectedTimeSlotsArr.map((time, idx) => ({
          resourceId: values.staffId || '',
          date: formattedDate,
          timeSlot: time,
          serviceId: slotServicesList[idx] || slotServicesList[0],
          notes: slotNotesRaw[idx] || undefined,
        }));
      }

      const singleTimeSlot = isMultiSlot
        ? selectedSlots[0]?.time
        : selectedTimeSlotsArr[0] || values.timeSlot;

      const generalNote = values.notes?.trim() || '';
      const topLevelNote =
        totalSlots === 1 && slotNotesRaw[0]
          ? [generalNote, slotNotesRaw[0]].filter(Boolean).join('\n')
          : generalNote;

      const bookingPayload: ManualBookingFormData = {
        ...values,
        customerEmail: values.customerEmail?.trim() || undefined,
        notes: topLevelNote || undefined,
        timeSlot: singleTimeSlot,
        serviceId: singleServiceId,
        serviceIds,
        slots: slotsPayload,
      };

      const success = await onSuccess(bookingPayload);
      if (success !== false) {
        form.resetFields();
      }
    } finally {
      setIsSubmitting(false);
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
      width={600}
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

        <Form.Item
          name="customerEmail"
          label="Email (Optional)"
          rules={[
            {
              type: 'email',
              message: 'Please enter a valid email address',
            },
          ]}
        >
          <Input placeholder="email@example.com" />
        </Form.Item>

        <Form.Item name="notes" label="General Notes">
          <Input.TextArea
            placeholder="General notes or special requests for the entire booking..."
            rows={2}
          />
        </Form.Item>

        {!isMultiSlot && (
          <>
            <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
              Time & Staff Selection
            </Title>

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

        {/* Slot Configurations: Tabs when multiple slots, simple select when single slot */}
        {totalSlots > 1 ? (
          <div style={{ marginTop: 24, marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <div>
                <Title level={5} style={{ margin: 0 }}>
                  Slot Configuration ({totalSlots} slots)
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Configure service and notes for each slot
                </Text>
              </div>
              <Button
                size="small"
                type="primary"
                ghost
                icon={<CopyOutlined />}
                onClick={handleApplyToAllSlots}
                style={{ borderRadius: 6 }}
              >
                Apply to all slots
              </Button>
            </div>

            <Tabs
              activeKey={activeTabKey}
              onChange={setActiveTabKey}
              type="card"
              items={Array.from({ length: totalSlots }).map((_, idx) => {
                let slotTime = '';
                let staffName = '';
                let slotDate = '';

                if (isMultiSlot && selectedSlots[idx]) {
                  slotTime = selectedSlots[idx].time;
                  staffName = selectedSlots[idx].staffName;
                  slotDate = dayjs(selectedSlots[idx].date).format('DD/MM/YYYY');
                } else if (selectedTimeSlotsArr[idx]) {
                  slotTime = selectedTimeSlotsArr[idx];
                  const staffObj = siteStaff.find((s) => s.id === selectedStaffId);
                  staffName = staffObj?.name || 'Staff';
                  slotDate = selectedFormDate
                    ? selectedFormDate.format('DD/MM/YYYY')
                    : dayjs().format('DD/MM/YYYY');
                }

                const tabLabel = slotTime ? `${slotTime}` : `Slot ${idx + 1}`;

                return {
                  key: String(idx),
                  label: tabLabel,
                  children: (
                    <div
                      style={{
                        padding: '16px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderTop: 'none',
                        borderRadius: '0 0 8px 8px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 16,
                          padding: '8px 12px',
                          background: '#ffffff',
                          borderRadius: 6,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {slotTime && <Tag color="blue">🕒 {slotTime}</Tag>}
                        {staffName && <Tag color="purple">👤 {staffName}</Tag>}
                        {slotDate && <Tag color="default">📅 {slotDate}</Tag>}
                      </div>

                      {siteServices && siteServices.length > 0 && (
                        <Form.Item
                          name={['slotServices', idx]}
                          label={
                            <span>
                              Service
                              {isSalon && (
                                <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                              )}
                            </span>
                          }
                          rules={[
                            {
                              required: isSalon,
                              message: 'Please select a service for this slot',
                            },
                          ]}
                          style={{ marginBottom: 14 }}
                        >
                          <Select
                            placeholder="Select service for this slot"
                            options={siteServices.map((s) => ({ value: s.id, label: s.name }))}
                            allowClear
                          />
                        </Form.Item>
                      )}

                      <Form.Item
                        name={['slotNotes', idx]}
                        label="Note for this slot (Optional)"
                        style={{ marginBottom: 0 }}
                      >
                        <Input.TextArea
                          placeholder="Specific notes/instructions for this slot..."
                          rows={2}
                        />
                      </Form.Item>
                    </div>
                  ),
                };
              })}
            />
          </div>
        ) : (
          /* Single Slot View */
          siteServices &&
          siteServices.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Title level={5} style={{ marginBottom: 16 }}>
                Booking Details
              </Title>
              <Form.Item
                name="serviceId"
                label="Service"
                rules={[
                  {
                    required: isSalon,
                    message: 'Service is required for salon',
                  },
                ]}
              >
                <Select
                  placeholder="Select service"
                  options={siteServices.map((s) => ({ value: s.id, label: s.name }))}
                  allowClear
                />
              </Form.Item>
            </div>
          )
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
          <Button onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            disabled={isSubmitting || (!isMultiSlot && !holdExpiry)}
          >
            Create Booking
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
