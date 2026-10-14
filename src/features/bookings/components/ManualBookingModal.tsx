import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Input, Select, Button, Typography, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { bookingApi } from '../services/booking.api';
import type {
  AvailableSlot,
  BookingConfig,
  ManualBookingFormData,
  ManualBookingFormValues,
  SelectedCalendarSlot,
} from '../types/booking.types';
import { useHoldCountdown } from '../hooks/useHoldCountdown';
import {
  phoneValidator,
  getEffectiveServices,
  getEffectiveStaff,
  buildTimeSlotOptions,
  convertFormToBookingPayload,
} from '../utils/manual-booking.utils';
import { ManualBookingSingleSlotSection } from './ManualBookingSingleSlotSection';
import { ManualBookingMultiSlotSection } from './ManualBookingMultiSlotSection';

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

const defaultFetchAvailableSlots = (
  sId: string,
  startDate: string,
  endDate: string,
  resourceId: string,
) => bookingApi.getAvailableSlots(sId, { startDate, endDate, resourceId });

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
  fetchAvailableSlots,
  onHoldSlot,
  holdExpiry,
  onHoldExpired,
  onReleaseHold,
}: ManualBookingModalProps) {
  const [form] = Form.useForm();
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string>('0');

  const { timeLeft, formattedTimeLeft } = useHoldCountdown(holdExpiry, onHoldExpired);

  const isMultiSlot = selectedSlots && selectedSlots.length > 0;
  const isSalon = industryTemplateId === 'salon';

  const selectedFormDate = Form.useWatch('date', form);
  const selectedFormDates = useMemo<dayjs.Dayjs[]>(() => {
    if (Array.isArray(selectedFormDate)) {
      return selectedFormDate
        .map((d) => (d ? dayjs(d) : null))
        .filter((d): d is dayjs.Dayjs => !!d && d.isValid());
    }
    return selectedFormDate && dayjs(selectedFormDate).isValid() ? [dayjs(selectedFormDate)] : [];
  }, [selectedFormDate]);

  const selectedStaffField = Form.useWatch('staffId', form);
  const selectedStaffIds = useMemo<string[]>(() => {
    if (Array.isArray(selectedStaffField)) return selectedStaffField.filter(Boolean);
    return selectedStaffField ? [selectedStaffField] : [];
  }, [selectedStaffField]);

  const selectedTimeSlots = Form.useWatch('timeSlot', form);
  const selectedTimeSlotsArr: string[] = Array.isArray(selectedTimeSlots)
    ? selectedTimeSlots
    : selectedTimeSlots
      ? [selectedTimeSlots]
      : [];

  const totalSlots = isMultiSlot ? selectedSlots.length : Math.max(1, selectedTimeSlotsArr.length);

  const effectiveServices = useMemo(
    () => getEffectiveServices(siteServices, config),
    [siteServices, config],
  );

  const effectiveStaff = useMemo(() => getEffectiveStaff(siteStaff, config), [siteStaff, config]);

  const timeSlotOptions = useMemo(
    () => buildTimeSlotOptions(availableSlots, selectedStaffIds, selectedFormDates, effectiveStaff),
    [availableSlots, selectedStaffIds, selectedFormDates, effectiveStaff],
  );

  useEffect(() => {
    if (open) {
      void Promise.resolve().then(() => {
        setActiveTabKey('0');
      });
      if (isMultiSlot) {
        const initialDates = selectedSlots
          .map((s) => (s.date ? dayjs(s.date) : null))
          .filter((d): d is dayjs.Dayjs => !!d && d.isValid());
        form.resetFields();
        form.setFieldsValue({
          date: initialDates.length > 0 ? initialDates : [dayjs()],
          staffId: selectedSlots[0]?.staffId ? [selectedSlots[0].staffId] : [],
          timeSlot: selectedSlots.map((s) => s.time),
          serviceId: undefined,
          slotServices: {},
          slotNotes: {},
        });
      } else {
        const parsedDate = selectedDate ? dayjs(selectedDate) : dayjs();
        form.resetFields();
        form.setFieldsValue({
          date: [parsedDate.isValid() ? parsedDate : dayjs()],
          staffId: [],
          timeSlot: undefined,
          serviceId: undefined,
          slotServices: {},
          slotNotes: {},
        });
      }
    } else {
      form.resetFields();
    }
  }, [open, siteId, isMultiSlot, selectedSlots, selectedDate, form]);

  useEffect(() => {
    let isCancelled = false;

    const fetchSlots = async () => {
      if (
        isMultiSlot ||
        selectedFormDates.length === 0 ||
        selectedStaffIds.length === 0 ||
        !siteId
      ) {
        setAvailableSlots([]);
        return;
      }

      setIsFetchingSlots(true);
      try {
        const fetchFn = fetchAvailableSlots || defaultFetchAvailableSlots;
        const resourceParam = selectedStaffIds.join(',');
        const formattedSlotsArrays = await Promise.all(
          selectedFormDates.map((d) => {
            const dateStr = d.format('YYYY-MM-DD');
            return fetchFn(siteId, dateStr, dateStr, resourceParam);
          }),
        );
        const combinedSlots = formattedSlotsArrays.flat();
        if (!isCancelled) {
          setAvailableSlots(Array.isArray(combinedSlots) ? combinedSlots : []);
        }
      } catch (error) {
        console.error('Failed to fetch available slots:', error);
        if (!isCancelled) {
          setAvailableSlots([]);
        }
      } finally {
        if (!isCancelled) {
          setIsFetchingSlots(false);
        }
      }
    };

    if (open && !isMultiSlot) {
      void fetchSlots();
    }

    return () => {
      isCancelled = true;
    };
  }, [
    selectedFormDate,
    selectedStaffField,
    selectedFormDates,
    selectedStaffIds,
    siteId,
    open,
    isMultiSlot,
    fetchAvailableSlots,
  ]);

  const handleTimeSlotChange = async (value: string | string[]) => {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    if (values.length === 0) {
      await onReleaseHold();
      return;
    }

    const slotsToHold: AvailableSlot[] = values.reduce<AvailableSlot[]>((acc, val) => {
      const opt = timeSlotOptions.find((o) => o.value === val);
      if (opt) {
        acc.push({
          startAt: opt.startAt,
          endAt: opt.endAt,
          resourceId: opt.resourceId,
          status: 'HOLDING',
        });
        return acc;
      }
      const s = availableSlots.find((slot) => slot.startAt === val);
      if (s) {
        acc.push({
          startAt: s.startAt,
          endAt: s.endAt,
          resourceId: s.resourceId || selectedStaffIds[0] || '',
          status: 'HOLDING',
        });
      }
      return acc;
    }, []);

    if (slotsToHold.length > 0) {
      const success = await onHoldSlot(slotsToHold);
      if (!success) {
        form.setFieldValue('timeSlot', undefined);
      }
    }
  };

  const handleApplyToAllSlots = () => {
    const currentValues = form.getFieldsValue();
    const activeIdx = Number(activeTabKey) || 0;
    const targetService = currentValues.slotServices?.[activeIdx];
    const targetNote = currentValues.slotNotes?.[activeIdx];

    const nextServices: Record<number, string> = { ...currentValues.slotServices };
    const nextNotes: Record<number, string> = { ...currentValues.slotNotes };

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

  const handleFinish = async (values: ManualBookingFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const bookingPayload = convertFormToBookingPayload({
        values,
        isMultiSlot,
        totalSlots,
        selectedSlots,
        selectedTimeSlotsArr,
        timeSlotOptions,
        availableSlots,
        selectedStaffIds,
        selectedFormDates,
      });

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
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          date: [dayjs()],
          staffId: [],
        }}
      >
        {/* If multi-slot, show selected slots summary */}
        {isMultiSlot && selectedSlots.length > 0 && (
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
          <ManualBookingSingleSlotSection
            form={form}
            siteStaff={siteStaff}
            selectedFormDates={selectedFormDates}
            selectedStaffIds={selectedStaffIds}
            selectedTimeSlotsArr={selectedTimeSlotsArr}
            timeSlotOptions={timeSlotOptions}
            isFetchingSlots={isFetchingSlots}
            holdExpiry={holdExpiry}
            onReleaseHold={onReleaseHold}
            onTimeSlotChange={handleTimeSlotChange}
          />
        )}

        {totalSlots > 1 ? (
          <ManualBookingMultiSlotSection
            totalSlots={totalSlots}
            activeTabKey={activeTabKey}
            setActiveTabKey={setActiveTabKey}
            isMultiSlot={isMultiSlot}
            isSalon={isSalon}
            selectedSlots={selectedSlots}
            selectedTimeSlotsArr={selectedTimeSlotsArr}
            timeSlotOptions={timeSlotOptions}
            availableSlots={availableSlots}
            siteStaff={siteStaff}
            selectedStaffIds={selectedStaffIds}
            selectedFormDates={selectedFormDates}
            effectiveServices={effectiveServices}
            onApplyToAllSlots={handleApplyToAllSlots}
          />
        ) : (
          effectiveServices &&
          effectiveServices.length > 0 && (
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
                  options={effectiveServices.map((s) => ({ value: s.id, label: s.name }))}
                  allowClear
                />
              </Form.Item>
            </div>
          )
        )}

        {timeLeft !== null && timeLeft > 0 && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: 6,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 13, color: '#d48806' }}>
              🔒 Selected slot is held for: <strong>{formattedTimeLeft}</strong>
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <Button onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            Create Booking
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
