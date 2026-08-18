import React, { useState, useEffect } from 'react';
import type { Site } from '@/src/features/sites/types/site.types';
import {
  Card,
  Typography,
  Switch,
  Radio,
  Input,
  Button,
  Select,
  Checkbox,
  Space,
  Tag,
  Row,
  Col,
  Divider,
  message,
  Spin,
  InputNumber,
  Modal,
} from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { apiRequest } from '@/src/lib/api.client';

const { Title, Text } = Typography;

interface TabBookingProps {
  site: Site;
}

const DAYS_MAP = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const generateTimeOptions = () => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      options.push({ value: time, label: time });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export function TabBooking({ site }: TabBookingProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [industryTemplate, setIndustryTemplate] = useState('salon');

  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');

  const [staff, setStaff] = useState<string[]>([]);
  const [newStaff, setNewStaff] = useState('');

  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [slotDuration, setSlotDuration] = useState('30');
  const [originalSlotDuration, setOriginalSlotDuration] = useState('30');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('20:00');

  const [availableDays, setAvailableDays] = useState<string[]>([
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ]);
  const daysOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await apiRequest<any>(`/admin/sites/${site.id}/bookings/booking-config`);

        setBookingEnabled(data.bookingEnabled);
        setIndustryTemplate(data.industryTemplate || 'salon');
        setTimezone(data.timezone || 'Asia/Ho_Chi_Minh');
        const savedDuration = String(data.slotDuration || 30);
        setSlotDuration(savedDuration);
        setOriginalSlotDuration(savedDuration);
        setStartTime(data.startTime || '09:00');
        setEndTime(data.endTime || '20:00');

        const dayStrings = (data.availableDays || [1, 2, 3, 4, 5, 6]).map(
          (d: number) => DAYS_MAP[d - 1],
        );
        setAvailableDays(dayStrings);

        setServices(data.services || []);
        setStaff(data.resources || []);
      } catch (error: unknown) {
        message.error('Failed to load booking configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [site.id]);

  const handleAddService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService('');
    }
  };

  const handleRemoveService = (service: string) => {
    setServices(services.filter((s) => s !== service));
  };

  const handleAddStaff = () => {
    if (newStaff.trim() && !staff.includes(newStaff.trim())) {
      setStaff([...staff, newStaff.trim()]);
      setNewStaff('');
    }
  };

  const handleRemoveStaff = (staffMember: string) => {
    setStaff(staff.filter((s) => s !== staffMember));
  };

  const doSave = async () => {
    try {
      setSaving(true);
      const daysNumbers = availableDays.map((d) => DAYS_MAP.indexOf(d) + 1).sort((a, b) => a - b);

      const payload = {
        bookingEnabled,
        industryTemplate,
        timezone,
        slotDuration: Number(slotDuration),
        startTime,
        endTime,
        availableDays: daysNumbers,
        services,
        resources: staff,
      };

      await apiRequest(`/admin/sites/${site.id}/bookings/booking-config`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setOriginalSlotDuration(slotDuration);
      message.success('Booking configuration saved successfully!');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save booking configuration';
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    const isDurationChanged = slotDuration !== originalSlotDuration;

    if (isDurationChanged) {
      Modal.confirm({
        title: (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <WarningOutlined style={{ color: '#f59e0b', fontSize: 20 }} />
            Slot Duration Change Warning
          </span>
        ),
        content: (
          <div style={{ marginTop: 8 }}>
            <p>
              You are changing the slot duration from{' '}
              <strong>{originalSlotDuration} minutes</strong> to{' '}
              <strong>{slotDuration} minutes</strong>.
            </p>
            <p style={{ marginTop: 8 }}>
              ⚠️ <strong>This may affect existing bookings:</strong>
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 4, color: '#374151' }}>
              <li>Existing bookings will no longer align with the new slot grid.</li>
              <li>The calendar view may display bookings at incorrect proportions.</li>
              <li>
                New bookings will use the new slot duration, which may conflict with old ones.
              </li>
            </ul>
            <p style={{ marginTop: 12, color: '#6b7280', fontSize: 13 }}>
              It is strongly recommended to complete or cancel all pending bookings before changing
              the slot duration.
            </p>
            <p style={{ marginTop: 8, fontWeight: 600 }}>Do you want to proceed anyway?</p>
          </div>
        ),
        okText: 'Yes, change it',
        okButtonProps: { danger: true },
        cancelText: 'Cancel',
        width: 520,
        icon: null,
        onOk: doSave,
      });
    } else {
      doSave();
    }
  };

  if (loading) {
    return (
      <Card
        bordered={false}
        className="site-detail-tab-card"
        style={{ padding: 40, textAlign: 'center' }}
      >
        <Spin size="large" />
      </Card>
    );
  }

  return (
    <Card bordered={false} className="site-detail-tab-card" style={{ padding: 8 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: '0 0 4px 0' }}>
          Booking Configuration
        </Title>
        <Text type="secondary">
          Enable appointments for this site and configure the Salon booking catalog
        </Text>
      </div>

      <div
        style={{
          backgroundColor: '#f9fafb',
          padding: '20px 24px',
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Enable Booking</div>
          <Text type="secondary">Allow visitors to book appointments through the chat widget</Text>
        </div>
        <Switch
          checked={bookingEnabled}
          onChange={setBookingEnabled}
          style={{ background: bookingEnabled ? '#10b981' : undefined }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          opacity: bookingEnabled ? 1 : 0.5,
          pointerEvents: bookingEnabled ? 'auto' : 'none',
        }}
      >
        {/* Industry Template */}
        <div>
          <Title level={5} style={{ fontSize: 14, marginBottom: 16 }}>
            Industry Template
          </Title>
          <Radio.Group
            onChange={(e) => setIndustryTemplate(e.target.value)}
            value={industryTemplate}
          >
            <Space direction="vertical">
              <Radio value="salon">
                <span style={{ fontWeight: 500 }}>Salon</span>
                <div style={{ color: '#9ca3af', fontSize: 13 }}>
                  Services catalog + staff assignment (Required)
                </div>
              </Radio>
              <Radio value="general" disabled>
                <span style={{ fontWeight: 500, color: '#9ca3af' }}>General</span>
                <div style={{ color: '#d1d5db', fontSize: 13 }}>
                  Generic free-text service — Coming later (Stretch)
                </div>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        {/* Services */}
        <div>
          <Title level={5} style={{ fontSize: 14, marginBottom: 12 }}>
            Services
          </Title>
          <div style={{ marginBottom: 12 }}>
            {services.map((service) => (
              <Tag
                key={service}
                closable
                onClose={() => handleRemoveService(service)}
                style={{
                  padding: '4px 10px',
                  fontSize: 14,
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: 16,
                }}
              >
                {service}
              </Tag>
            ))}
          </div>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="Add a service (e.g., Haircut Women)"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onPressEnter={handleAddService}
              style={{ background: '#f9fafb', border: '1px solid #e5e7eb', height: 40 }}
            />
            <Button
              type="primary"
              onClick={handleAddService}
              style={{ height: 40, background: '#bfdbfe', color: '#1e40af', border: 'none' }}
            >
              Add service
            </Button>
          </Space.Compact>
        </div>

        {/* Staff / Resources */}
        <div>
          <Title level={5} style={{ fontSize: 14, marginBottom: 12 }}>
            Staff / Resources
          </Title>
          <div style={{ marginBottom: 12 }}>
            {staff.map((s) => (
              <Tag
                key={s}
                closable
                onClose={() => handleRemoveStaff(s)}
                style={{
                  padding: '4px 10px',
                  fontSize: 14,
                  background: '#f3e8ff',
                  color: '#6b21a8',
                  border: 'none',
                  borderRadius: 16,
                }}
              >
                {s}
              </Tag>
            ))}
          </div>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="Add staff (e.g., Stylist Lan)"
              value={newStaff}
              onChange={(e) => setNewStaff(e.target.value)}
              onPressEnter={handleAddStaff}
              style={{ background: '#f9fafb', border: '1px solid #e5e7eb', height: 40 }}
            />
            <Button
              type="primary"
              onClick={handleAddStaff}
              style={{ height: 40, background: '#bfdbfe', color: '#1e40af', border: 'none' }}
            >
              Add staff
            </Button>
          </Space.Compact>
        </div>

        {/* Slot Configuration */}
        <div>
          <Title level={5} style={{ fontSize: 14, marginBottom: 16 }}>
            Slot Configuration
          </Title>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div style={{ marginBottom: 4, fontSize: 13, color: '#6b7280' }}>Timezone</div>
              <Select
                value={timezone}
                onChange={setTimezone}
                style={{ width: '100%', height: 40 }}
                className="custom-select-bg"
                options={[
                  { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh' },
                  { value: 'Asia/Bangkok', label: 'Asia/Bangkok' },
                  { value: 'Asia/Singapore', label: 'Asia/Singapore' },
                  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
                  { value: 'UTC', label: 'UTC' },
                ]}
              />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 4, fontSize: 13, color: '#6b7280' }}>Slot Duration</div>
              <InputNumber
                value={Number(slotDuration)}
                onChange={(val) => setSlotDuration(String(val || 30))}
                min={1}
                style={{ width: '100%', height: 40, paddingTop: 4 }}
                addonAfter="mins"
              />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 4, fontSize: 13, color: '#6b7280' }}>Start Time</div>
              <Select
                value={startTime}
                onChange={setStartTime}
                style={{ width: '100%', height: 40 }}
                className="custom-select-bg"
                options={TIME_OPTIONS}
              />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 4, fontSize: 13, color: '#6b7280' }}>End Time</div>
              <Select
                value={endTime}
                onChange={setEndTime}
                style={{ width: '100%', height: 40 }}
                className="custom-select-bg"
                options={TIME_OPTIONS}
              />
            </Col>
          </Row>

          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 8, fontSize: 14, color: '#6b7280' }}>Available Days</div>
            <Checkbox.Group
              options={daysOptions}
              value={availableDays}
              onChange={(list) => setAvailableDays(list as string[])}
            />
          </div>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button
            style={{
              height: 40,
              padding: '0 24px',
              background: '#f3f4f6',
              border: 'none',
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            loading={saving}
            onClick={handleSave}
            style={{ height: 40, padding: '0 24px', background: '#2563eb', fontWeight: 500 }}
          >
            Save Configuration
          </Button>
        </div>
      </div>
      <style>{`
        .custom-select-bg .ant-select-selector {
          background-color: #f9fafb !important;
          border-color: #e5e7eb !important;
        }
      `}</style>
    </Card>
  );
}
