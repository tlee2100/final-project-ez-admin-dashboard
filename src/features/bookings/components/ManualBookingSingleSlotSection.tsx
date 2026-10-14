import React from 'react';
import { Form, Select, DatePicker, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import type { FormInstance } from 'antd';

const { Title } = Typography;

export interface ManualBookingSingleSlotSectionProps {
  form: FormInstance;
  siteStaff: { id: string; name: string }[];
  selectedFormDates: dayjs.Dayjs[];
  selectedStaffIds: string[];
  selectedTimeSlotsArr: string[];
  timeSlotOptions: Array<{
    value: string;
    label: string;
    startAt: string;
    endAt: string;
    resourceId: string;
    resourceName: string;
    isHolding: boolean;
  }>;
  isFetchingSlots: boolean;
  holdExpiry: Date | null;
  onReleaseHold: () => Promise<void>;
  onTimeSlotChange: (value: string | string[]) => Promise<void>;
}

export const ManualBookingSingleSlotSection: React.FC<ManualBookingSingleSlotSectionProps> = ({
  form,
  siteStaff,
  selectedFormDates,
  selectedStaffIds,
  selectedTimeSlotsArr,
  timeSlotOptions,
  isFetchingSlots,
  holdExpiry,
  onReleaseHold,
  onTimeSlotChange,
}) => {
  return (
    <>
      <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
        Time & Staff Selection
      </Title>

      <Form.Item
        name="staffId"
        label="Staff / Resource(s)"
        rules={[{ required: true, message: 'Please select at least one staff/resource' }]}
      >
        <Select
          mode="multiple"
          maxTagCount="responsive"
          placeholder="Select staff or resource(s)"
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

      <Form.Item
        name="date"
        label="Date(s)"
        rules={[{ required: true, message: 'Please select at least one date' }]}
      >
        <DatePicker
          multiple
          maxTagCount="responsive"
          placeholder="Select date(s)"
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          disabledDate={(current) =>
            Boolean(current && dayjs(current).isBefore(dayjs().startOf('day')))
          }
          onChange={async () => {
            if (holdExpiry && onReleaseHold) {
              try {
                await onReleaseHold();
              } catch {
                // ignore
              }
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
          selectedFormDates.length === 0 || selectedStaffIds.length === 0
            ? 'Please select date(s) and staff/resource(s) first'
            : `${timeSlotOptions.length} slot option(s) available across ${selectedFormDates.length} date(s)`
        }
      >
        <Select
          mode="multiple"
          placeholder="Select time slot(s)"
          loading={isFetchingSlots}
          notFoundContent={isFetchingSlots ? <Spin size="small" /> : 'No available slots'}
          disabled={selectedFormDates.length === 0 || selectedStaffIds.length === 0}
          onChange={onTimeSlotChange}
          allowClear
        >
          {timeSlotOptions.map((opt) => (
            <Select.Option
              key={opt.value}
              value={opt.value}
              disabled={opt.isHolding}
              style={opt.isHolding ? { color: '#d97706', backgroundColor: '#fef08a' } : undefined}
            >
              {opt.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </>
  );
};
