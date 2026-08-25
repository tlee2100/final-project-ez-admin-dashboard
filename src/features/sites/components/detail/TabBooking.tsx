import React, { useState } from 'react';
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
  Spin,
  InputNumber,
  Modal,
  Form,
} from 'antd';
import { WarningOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { CreateBlockoutModal } from '@/src/features/bookings/components/CreateBlockoutModal';
import { useBlockouts } from '@/src/features/bookings/hooks/useBlockouts';
import {
  useSiteBookingConfig,
  type BookingFormValues,
} from '@/src/features/sites/hooks/useSiteBookingConfig';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface TabBookingProps {
  site: Site;
}

const DAYS_MAP = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const SALON_PRESET_SERVICES = [
  'Haircut (Women)',
  'Haircut (Men)',
  'Hair Wash & Blow Dry',
  'Hair Styling',
  'Hair Coloring',
  'Hair Perm & Straightening',
  'Hair & Scalp Treatment',
  'Facial Skincare',
  'Manicure & Pedicure',
  'Nail Art',
  'Full Body Massage',
  'Head Spa & Relax',
];

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
const DAYS_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TabBooking({ site }: TabBookingProps) {
  const [form] = Form.useForm();
  const {
    loading,
    saving,
    config,
    originalSlotDuration,
    resourceDetails,
    fetchConfig,
    saveConfig,
  } = useSiteBookingConfig(site.id);

  const { blockouts, handleCreateBlockout, confirmDeleteBlockout } = useBlockouts(site.id);
  const [isBlockoutModalOpen, setIsBlockoutModalOpen] = useState(false);

  const [services, setServices] = useState<string[]>([]);
  const [staff, setStaff] = useState<string[]>([]);
  const [newServiceInput, setNewServiceInput] = useState('');
  const [newStaffInput, setNewStaffInput] = useState('');

  // Watch form fields needed for dynamic UI rendering
  const bookingEnabled = Form.useWatch('bookingEnabled', form) ?? true;
  const industryTemplate = Form.useWatch('industryTemplate', form) || 'salon';

  const [prevConfig, setPrevConfig] = useState(config);
  if (config !== prevConfig) {
    setPrevConfig(config);
    if (config) {
      setServices(config.services || []);
      setStaff(config.resources || []);
      const dayStrings = (config.availableDays || [1, 2, 3, 4, 5, 6]).map(
        (d: number) => DAYS_MAP[d - 1],
      );
      form.setFieldsValue({
        bookingEnabled: config.bookingEnabled ?? true,
        industryTemplate: config.industryTemplate || 'salon',
        services: config.services || [],
        staff: config.resources || [],
        timezone: config.timezone || 'Asia/Ho_Chi_Minh',
        slotDuration: Number(config.slotDuration || 30),
        startTime: config.startTime || '09:00',
        endTime: config.endTime || '20:00',
        availableDays: dayStrings,
      });
    }
  }

  const handleAddService = () => {
    const trimmed = newServiceInput.trim();
    if (trimmed && !services.includes(trimmed)) {
      const next = [...services, trimmed];
      setServices(next);
      form.setFieldValue('services', next);
      setNewServiceInput('');
    }
  };

  const handleRemoveService = (service: string) => {
    const next = services.filter((s: string) => s !== service);
    setServices(next);
    form.setFieldValue('services', next);
  };

  const handleAddStaff = () => {
    const trimmed = newStaffInput.trim();
    if (trimmed && !staff.includes(trimmed)) {
      const next = [...staff, trimmed];
      setStaff(next);
      form.setFieldValue('staff', next);
      setNewStaffInput('');
    }
  };

  const handleRemoveStaff = (staffMember: string) => {
    const next = staff.filter((s: string) => s !== staffMember);
    setStaff(next);
    form.setFieldValue('staff', next);
  };

  const handleSubmit = async (values: BookingFormValues) => {
    const daysNumbers = (values.availableDays || [])
      .map((d: string) => DAYS_MAP.indexOf(d) + 1)
      .sort((a: number, b: number) => a - b);

    const payload = {
      bookingEnabled: values.bookingEnabled,
      industryTemplate: values.industryTemplate,
      timezone: values.timezone,
      slotDuration: Number(values.slotDuration),
      startTime: values.startTime,
      endTime: values.endTime,
      availableDays: daysNumbers,
      services: services,
      resources: staff,
    };

    const isDurationChanged = Number(values.slotDuration) !== originalSlotDuration;

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
              <strong>{values.slotDuration} minutes</strong>.
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
        onOk: () => saveConfig(payload),
      });
    } else {
      await saveConfig(payload);
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
          Enable appointments for this site and configure the booking template and resources
        </Text>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Enable Booking Toggle */}
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
            <Text type="secondary">
              Allow visitors to book appointments through the chat widget
            </Text>
          </div>
          <Form.Item name="bookingEnabled" valuePropName="checked" noStyle>
            <Switch style={{ background: bookingEnabled ? '#10b981' : undefined }} />
          </Form.Item>
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
            <Form.Item name="industryTemplate" noStyle>
              <Radio.Group>
                <Space direction="vertical">
                  <Radio value="salon">
                    <span style={{ fontWeight: 500 }}>Salon</span>
                    <div style={{ color: '#9ca3af', fontSize: 13 }}>
                      Services catalog + staff assignment (Stylists, Therapists)
                    </div>
                  </Radio>
                  <Radio value="general">
                    <span style={{ fontWeight: 500 }}>General</span>
                    <div style={{ color: '#9ca3af', fontSize: 13 }}>
                      Resource-based assignment (Rooms, Courts, Machines) + custom notes
                    </div>
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
          </div>

          {/* Services */}
          <div>
            <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>
              Services{' '}
              {industryTemplate === 'salon'
                ? '(Salon Catalog & Custom Services)'
                : '(Custom Services)'}
            </Title>
            {industryTemplate === 'salon' ? (
              <div>
                <div style={{ marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
                  Select services from the preset salon catalog or type your own custom service
                  names (press Enter to add).
                </div>
                <Form.Item name="services" noStyle>
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Select preset services or type custom service names (press Enter)"
                    value={services}
                    onChange={(selected) => {
                      setServices(selected);
                      form.setFieldValue('services', selected);
                    }}
                    options={Array.from(new Set([...SALON_PRESET_SERVICES, ...services])).map(
                      (s) => ({
                        value: s,
                        label: s,
                      }),
                    )}
                  />
                </Form.Item>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
                  Add custom services or booking purposes for your site. Each service will be
                  assigned a unique ID in your catalog.
                </div>
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
                    placeholder="Add a custom service (e.g., Badminton Court, Meeting Room A, Equipment Rental)"
                    value={newServiceInput}
                    onChange={(e) => setNewServiceInput(e.target.value)}
                    onPressEnter={handleAddService}
                    style={{ background: '#f9fafb', border: '1px solid #e5e7eb', height: 40 }}
                  />
                  <Button
                    type="primary"
                    onClick={handleAddService}
                    style={{
                      height: 40,
                      background: '#bfdbfe',
                      color: '#1e40af',
                      border: 'none',
                    }}
                  >
                    Add service
                  </Button>
                </Space.Compact>
              </div>
            )}
          </div>

          {/* Staff / Resources */}
          <div>
            <Title level={5} style={{ fontSize: 14, marginBottom: 12 }}>
              {industryTemplate === 'general'
                ? 'Resources (Rooms / Courts / Machines)'
                : 'Staff / Stylists'}
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
                placeholder={
                  industryTemplate === 'general'
                    ? 'Add resource (e.g., Room 101, Court A, 3D Printer #2)'
                    : 'Add staff (e.g., Stylist Lan)'
                }
                value={newStaffInput}
                onChange={(e) => setNewStaffInput(e.target.value)}
                onPressEnter={handleAddStaff}
                style={{ background: '#f9fafb', border: '1px solid #e5e7eb', height: 40 }}
              />
              <Button
                type="primary"
                onClick={handleAddStaff}
                style={{ height: 40, background: '#bfdbfe', color: '#1e40af', border: 'none' }}
              >
                {industryTemplate === 'general' ? 'Add resource' : 'Add staff'}
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
                <Form.Item name="timezone" noStyle>
                  <Select
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
                </Form.Item>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 4, fontSize: 13, color: '#6b7280' }}>Slot Duration</div>
                <Form.Item name="slotDuration" noStyle>
                  <InputNumber
                    min={1}
                    style={{ width: '100%', height: 40, paddingTop: 4 }}
                    addonAfter="mins"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 4, fontSize: 13, color: '#6b7280' }}>Start Time</div>
                <Form.Item name="startTime" noStyle>
                  <Select
                    style={{ width: '100%', height: 40 }}
                    className="custom-select-bg"
                    options={TIME_OPTIONS}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 4, fontSize: 13, color: '#6b7280' }}>End Time</div>
                <Form.Item name="endTime" noStyle>
                  <Select
                    style={{ width: '100%', height: 40 }}
                    className="custom-select-bg"
                    options={TIME_OPTIONS}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ marginTop: 24 }}>
              <div style={{ marginBottom: 8, fontSize: 14, color: '#6b7280' }}>Available Days</div>
              <Form.Item name="availableDays" noStyle>
                <Checkbox.Group options={DAYS_OPTIONS} />
              </Form.Item>
            </div>
          </div>

          {/* Block-Out Times & Staff Leave */}
          <Divider style={{ margin: '24px 0 16px 0' }} />
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 16,
              }}
            >
              <div>
                <Title level={5} style={{ fontSize: 14, margin: '0 0 4px 0' }}>
                  🔒 Block-Out Times & Staff Leave
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Mark specific dates or hours as unavailable (holidays, closures, or staff leave).
                </Text>
              </div>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => setIsBlockoutModalOpen(true)}
                style={{
                  borderRadius: 8,
                  borderColor: '#fca5a5',
                  color: '#dc2626',
                  background: '#fff5f5',
                  fontWeight: 500,
                }}
              >
                Add Block-Out
              </Button>
            </div>

            {blockouts.length === 0 ? (
              <div
                style={{
                  padding: '20px',
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: '1px dashed #e5e7eb',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: 13,
                }}
              >
                No active block-outs configured for this site. Click <strong>Add Block-Out</strong>{' '}
                to block dates or hours.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {blockouts.map((b) => {
                  const isWholeSalon = !b.resourceId;
                  const startDay = dayjs(b.startAt);
                  const endDay = dayjs(b.endAt);
                  const isAllDay =
                    startDay.format('HH:mm') === '00:00' &&
                    (endDay.format('HH:mm') === '23:59' || endDay.format('HH:mm') === '00:00');
                  const dateDisplay = isAllDay
                    ? `${startDay.format('DD/MM/YYYY')} (Full Day)`
                    : `${startDay.format('DD/MM/YYYY HH:mm')} - ${endDay.format('DD/MM/YYYY HH:mm')}`;

                  return (
                    <div
                      key={b.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#fef2f2',
                        border: '1px solid #fee2e2',
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 18 }}>🔒</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#991b1b' }}>
                            {b.reason || (isWholeSalon ? 'Entire Salon Closure' : 'Staff Leave')}
                            <Tag
                              color={isWholeSalon ? 'red' : 'purple'}
                              style={{ marginLeft: 8, fontSize: 11, borderRadius: 10 }}
                            >
                              {isWholeSalon ? 'Entire Salon' : b.resource?.name || 'Staff'}
                            </Tag>
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: '#7f1d1d',
                              opacity: 0.85,
                              marginTop: 2,
                            }}
                          >
                            {dateDisplay}
                          </div>
                        </div>
                      </div>

                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => confirmDeleteBlockout(b)}
                        style={{ color: '#ef4444' }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <CreateBlockoutModal
          open={isBlockoutModalOpen}
          onCancel={() => setIsBlockoutModalOpen(false)}
          onSubmit={async (data) => {
            const success = await handleCreateBlockout(data);
            if (success) setIsBlockoutModalOpen(false);
            return success;
          }}
          siteStaff={resourceDetails}
        />

        <Divider style={{ margin: '24px 0 16px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button
            onClick={async () => {
              const fresh = await fetchConfig();
              if (fresh) {
                setServices(fresh.services || []);
                setStaff(fresh.resources || []);
              }
            }}
            disabled={saving}
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
            htmlType="submit"
            loading={saving}
            style={{ height: 40, padding: '0 24px', background: '#2563eb', fontWeight: 500 }}
          >
            Save Configuration
          </Button>
        </div>
      </Form>
      <style>{`
        .custom-select-bg .ant-select-selector {
          background-color: #f9fafb !important;
          border-color: #e5e7eb !important;
        }
      `}</style>
    </Card>
  );
}
