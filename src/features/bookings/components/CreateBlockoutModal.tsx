import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Button,
  Typography,
  Radio,
  Space,
  Tag,
} from 'antd';
import dayjs from 'dayjs';

import type { CreateBlockoutFormData } from '../types/booking.types';

const { Text } = Typography;

interface CreateBlockoutModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (data: CreateBlockoutFormData) => Promise<boolean>;
  siteStaff: { id: string; name: string }[];
  defaultDate?: dayjs.Dayjs;
}

const COMMON_REASONS = [
  'Public Holiday',
  'Staff Leave',
  'Salon Maintenance',
  'Team Training',
  'Emergency Closure',
];

export function CreateBlockoutModal({
  open,
  onCancel,
  onSubmit,
  siteStaff,
  defaultDate,
}: CreateBlockoutModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const scopeType = Form.useWatch('scopeType', form) || 'all';
  const blockType = Form.useWatch('blockType', form) || 'full_day';

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        scopeType: 'all',
        blockType: 'full_day',
        date: defaultDate || dayjs(),
        dateRange: [defaultDate || dayjs(), defaultDate || dayjs()],
        startTime: dayjs('09:00', 'HH:mm'),
        endTime: dayjs('18:00', 'HH:mm'),
        reason: '',
      });
    }
  }, [open, defaultDate, form]);

  const handleFinish = async (values: {
    scopeType: 'all' | 'specific';
    staffId?: string;
    blockType: 'full_day' | 'time_range';
    date?: dayjs.Dayjs;
    dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
    startTime?: dayjs.Dayjs;
    endTime?: dayjs.Dayjs;
    reason?: string;
  }) => {
    let startAt: string;
    let endAt: string;

    if (values.blockType === 'full_day') {
      if (values.dateRange && values.dateRange.length === 2) {
        startAt = values.dateRange[0].startOf('day').toISOString();
        endAt = values.dateRange[1].endOf('day').toISOString();
      } else {
        const d = values.date || dayjs();
        startAt = d.startOf('day').toISOString();
        endAt = d.endOf('day').toISOString();
      }
    } else {
      const d = values.date || dayjs();
      const dStr = d.format('YYYY-MM-DD');
      const sTimeStr = values.startTime ? values.startTime.format('HH:mm') : '09:00';
      const eTimeStr = values.endTime ? values.endTime.format('HH:mm') : '18:00';

      startAt = dayjs(`${dStr} ${sTimeStr}`).toISOString();
      endAt = dayjs(`${dStr} ${eTimeStr}`).toISOString();
    }

    const payload = {
      resourceId: values.scopeType === 'specific' ? values.staffId : null,
      startAt,
      endAt,
      reason: values.reason?.trim() || null,
    };

    setLoading(true);
    try {
      const success = await onSubmit(payload);
      if (success) {
        form.resetFields();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>🔒 Block-Out Time</div>
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 'normal' }}>
            Mark dates or hours as unavailable (holidays, closures, or staff leave).
          </Text>
        </div>
      }
      onCancel={onCancel}
      footer={null}
      width={520}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 20 }}>
        {/* Scope Selection */}
        <Form.Item label="Applies to" name="scopeType">
          <Radio.Group style={{ width: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="all">
                <span style={{ fontWeight: 500 }}>
                  Entire Salon (All Staff / Closure / Holiday)
                </span>
              </Radio>
              <Radio value="specific">
                <span style={{ fontWeight: 500 }}>
                  Specific Staff Member (Leave / Personal Time)
                </span>
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        {scopeType === 'specific' && (
          <Form.Item
            name="staffId"
            label="Staff Member"
            rules={[{ required: true, message: 'Please select a staff member' }]}
          >
            <Select placeholder="Select staff member">
              {siteStaff.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* Block Type */}
        <Form.Item label="Duration Type" name="blockType">
          <Radio.Group buttonStyle="solid">
            <Radio.Button value="full_day">Full Day(s)</Radio.Button>
            <Radio.Button value="time_range">Specific Time Range</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {blockType === 'full_day' ? (
          <Form.Item
            name="dateRange"
            label="Date Range"
            rules={[{ required: true, message: 'Please select date range' }]}
          >
            <DatePicker.RangePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
        ) : (
          <>
            <Form.Item
              name="date"
              label="Date"
              rules={[{ required: true, message: 'Please select a date' }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item
                name="startTime"
                label="Start Time"
                rules={[{ required: true, message: 'Select start time' }]}
              >
                <TimePicker format="HH:mm" minuteStep={15} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="endTime"
                label="End Time"
                rules={[{ required: true, message: 'Select end time' }]}
              >
                <TimePicker format="HH:mm" minuteStep={15} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </>
        )}

        {/* Reason Input */}
        <Form.Item name="reason" label="Reason (Optional)">
          <Input placeholder="e.g., 30/04 Holiday, Annual Leave, Renovation..." maxLength={255} />
        </Form.Item>

        <div style={{ marginBottom: 24 }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
            Quick suggestions:
          </Text>
          <Space wrap size={[6, 6]}>
            {COMMON_REASONS.map((r) => (
              <Tag
                key={r}
                style={{ cursor: 'pointer', borderRadius: 12 }}
                onClick={() => form.setFieldValue('reason', r)}
              >
                + {r}
              </Tag>
            ))}
          </Space>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" danger htmlType="submit" loading={loading}>
            Save Blockout
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
