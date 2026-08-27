import React, { useState } from 'react';
import type { Site } from '@/src/features/sites/types/site.types';
import { Card, Typography, Switch, Button, Divider, Spin, Modal, Form } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { CreateBlockoutModal } from '@/src/features/bookings/components/CreateBlockoutModal';
import { useBlockouts } from '@/src/features/bookings/hooks/useBlockouts';
import {
  useSiteBookingConfig,
  type BookingFormValues,
} from '@/src/features/sites/hooks/useSiteBookingConfig';
import type { UpdateBookingConfigPayload } from '@/src/features/bookings/types/booking.types';
import { BookingGeneralSection } from './booking/BookingGeneralSection';
import { BookingServicesSection } from './booking/BookingServicesSection';
import { BookingStaffSection } from './booking/BookingStaffSection';
import { BookingBlockoutsSection } from './booking/BookingBlockoutsSection';

const { Title, Text } = Typography;

interface TabBookingProps {
  site: Site;
}

const DAYS_MAP = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

    const payload: UpdateBookingConfigPayload = {
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
          <BookingGeneralSection />

          <BookingServicesSection
            industryTemplate={industryTemplate}
            services={services}
            setServices={(newServices) => {
              setServices(newServices);
              form.setFieldValue('services', newServices);
            }}
            newServiceInput={newServiceInput}
            setNewServiceInput={setNewServiceInput}
            handleAddService={handleAddService}
            handleRemoveService={handleRemoveService}
          />

          <BookingStaffSection
            industryTemplate={industryTemplate}
            staff={staff}
            newStaffInput={newStaffInput}
            setNewStaffInput={setNewStaffInput}
            handleAddStaff={handleAddStaff}
            handleRemoveStaff={handleRemoveStaff}
          />

          <BookingBlockoutsSection
            blockouts={blockouts}
            onOpenAddModal={() => setIsBlockoutModalOpen(true)}
            confirmDeleteBlockout={confirmDeleteBlockout}
          />
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
