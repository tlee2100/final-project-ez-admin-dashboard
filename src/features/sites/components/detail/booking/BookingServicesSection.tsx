import React from 'react';
import { Form, Select, Tag, Space, Input, Button, Typography } from 'antd';

const { Title } = Typography;

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

export interface BookingServicesSectionProps {
  industryTemplate: string;
  services: string[];
  setServices: (services: string[]) => void;
  newServiceInput: string;
  setNewServiceInput: (val: string) => void;
  handleAddService: () => void;
  handleRemoveService: (service: string) => void;
}

export const BookingServicesSection: React.FC<BookingServicesSectionProps> = ({
  industryTemplate,
  services,
  setServices,
  newServiceInput,
  setNewServiceInput,
  handleAddService,
  handleRemoveService,
}) => {
  return (
    <div>
      <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>
        Services{' '}
        {industryTemplate === 'salon' ? '(Salon Catalog & Custom Services)' : '(Custom Services)'}
      </Title>
      {industryTemplate === 'salon' ? (
        <div>
          <div style={{ marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
            Select services from the preset salon catalog or type your own custom service names
            (press Enter to add).
          </div>
          <Form.Item name="services" noStyle>
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Select preset services or type custom service names (press Enter)"
              value={services}
              onChange={(selected) => {
                setServices(selected);
              }}
              options={Array.from(new Set([...SALON_PRESET_SERVICES, ...services])).map((s) => ({
                value: s,
                label: s,
              }))}
            />
          </Form.Item>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
            Add custom services or booking purposes for your site. Each service will be assigned a
            unique ID in your catalog.
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
  );
};
