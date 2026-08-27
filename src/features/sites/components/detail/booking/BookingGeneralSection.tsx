import React from 'react';
import { Form, Radio, Space, Select, InputNumber, Checkbox, Row, Col, Typography } from 'antd';

const { Title } = Typography;

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

export const TIME_OPTIONS = generateTimeOptions();
export const DAYS_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const BookingGeneralSection: React.FC = () => {
  return (
    <>
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
    </>
  );
};
