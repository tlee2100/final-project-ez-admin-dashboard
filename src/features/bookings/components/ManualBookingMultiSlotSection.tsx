import React from 'react';
import { Form, Select, Input, Button, Tabs, Tag, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { AvailableSlot, SelectedCalendarSlot } from '../types/booking.types';

const { Title, Text } = Typography;

export interface ManualBookingMultiSlotSectionProps {
  totalSlots: number;
  activeTabKey: string;
  setActiveTabKey: (key: string) => void;
  isMultiSlot: boolean;
  isSalon: boolean;
  selectedSlots: SelectedCalendarSlot[];
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
  availableSlots: AvailableSlot[];
  siteStaff: { id: string; name: string }[];
  selectedStaffIds: string[];
  selectedFormDates: dayjs.Dayjs[];
  effectiveServices: Array<{ id: string; name: string }>;
  onApplyToAllSlots: () => void;
}

export const ManualBookingMultiSlotSection: React.FC<ManualBookingMultiSlotSectionProps> = ({
  totalSlots,
  activeTabKey,
  setActiveTabKey,
  isMultiSlot,
  isSalon,
  selectedSlots,
  selectedTimeSlotsArr,
  timeSlotOptions,
  availableSlots,
  siteStaff,
  selectedStaffIds,
  selectedFormDates,
  effectiveServices,
  onApplyToAllSlots,
}) => {
  return (
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
          onClick={onApplyToAllSlots}
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
            const parsedSlotDate = dayjs(selectedSlots[idx].date);
            slotDate = parsedSlotDate.isValid() ? parsedSlotDate.format('DD/MM/YYYY') : '';
          } else if (selectedTimeSlotsArr[idx]) {
            const timeVal = selectedTimeSlotsArr[idx];
            const opt = timeSlotOptions.find((o) => o.value === timeVal);
            const matchedSlot = availableSlots.find(
              (s) => s.startAt === timeVal || (opt && s.startAt === opt.startAt),
            );
            const slotStartAt = opt ? opt.startAt : matchedSlot ? matchedSlot.startAt : timeVal;
            slotTime = dayjs(slotStartAt).isValid() ? dayjs(slotStartAt).format('HH:mm') : timeVal;
            staffName =
              opt?.resourceName ||
              siteStaff.find((s) => s.id === selectedStaffIds[0])?.name ||
              'Staff';
            slotDate = dayjs(slotStartAt).isValid()
              ? dayjs(slotStartAt).format('DD/MM/YYYY')
              : selectedFormDates[0]
                ? selectedFormDates[0].format('DD/MM/YYYY')
                : dayjs().format('DD/MM/YYYY');
          }

          const tabLabel =
            selectedFormDates.length > 1 && slotDate
              ? `${slotDate.slice(0, 5)} ${slotTime}`
              : staffName && selectedStaffIds.length > 1
                ? `${slotTime} (${staffName})`
                : slotTime || `Slot ${idx + 1}`;

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

                {effectiveServices && effectiveServices.length > 0 && (
                  <Form.Item
                    name={['slotServices', idx]}
                    label={
                      <span>
                        Service
                        {isSalon && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>}
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
                      options={effectiveServices.map((s) => ({ value: s.id, label: s.name }))}
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
  );
};
