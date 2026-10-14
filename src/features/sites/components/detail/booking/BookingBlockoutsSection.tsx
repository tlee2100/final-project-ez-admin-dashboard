import React from 'react';
import { Divider, Button, Tag, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { BlockoutRecord } from '@/src/features/bookings/types/booking.types';

const { Title, Text } = Typography;

export interface BookingBlockoutsSectionProps {
  blockouts: BlockoutRecord[];
  onOpenAddModal: () => void;
  confirmDeleteBlockout: (blockout: BlockoutRecord) => void;
}

export const BookingBlockoutsSection: React.FC<BookingBlockoutsSectionProps> = ({
  blockouts,
  onOpenAddModal,
  confirmDeleteBlockout,
}) => {
  return (
    <>
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
            onClick={onOpenAddModal}
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
            No active block-outs configured for this site. Click <strong>Add Block-Out</strong> to
            block dates or hours.
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
    </>
  );
};
