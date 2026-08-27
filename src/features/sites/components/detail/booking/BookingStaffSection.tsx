import React from 'react';
import { Tag, Space, Input, Button, Typography } from 'antd';

const { Title } = Typography;

export interface BookingStaffSectionProps {
  industryTemplate: string;
  staff: string[];
  newStaffInput: string;
  setNewStaffInput: (val: string) => void;
  handleAddStaff: () => void;
  handleRemoveStaff: (staffMember: string) => void;
}

export const BookingStaffSection: React.FC<BookingStaffSectionProps> = ({
  industryTemplate,
  staff,
  newStaffInput,
  setNewStaffInput,
  handleAddStaff,
  handleRemoveStaff,
}) => {
  return (
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
  );
};
