'use client';

import React from 'react';
import { Form, Input, Button, Space, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';

export function AllowedDomainsInput() {
  return (
    <div className="allowed-domains-container" style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
          fontWeight: 500,
          color: '#374151',
        }}
      >
        <span>Allowed Domains (Security)</span>
        <Tooltip title="Specify which domains are allowed to embed the chat widget. E.g., example.com, *.example.com. Leave empty to allow any domain.">
          <InfoCircleOutlined style={{ color: '#9ca3af', cursor: 'pointer' }} />
        </Tooltip>
      </div>

      <Form.List name="allowedDomains">
        {(fields, { add, remove }) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} align="center" style={{ display: 'flex', width: '100%' }}>
                <Form.Item
                  {...restField}
                  name={[name]}
                  style={{ marginBottom: 0, flex: 1 }}
                  rules={[
                    {
                      validator: async (_, value) => {
                        if (value && typeof value === 'string' && value.trim() === '') {
                          return Promise.reject(new Error('Domain cannot be empty or spaces'));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    placeholder="e.g. example.com or *.example.com"
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => remove(name)}
                  style={{ borderRadius: 8 }}
                  title="Remove domain"
                />
              </Space>
            ))}

            <Button
              type="dashed"
              onClick={() => add()}
              block
              icon={<PlusOutlined />}
              size="large"
              style={{
                borderRadius: 8,
                marginTop: fields.length > 0 ? 4 : 0,
                color: '#4f46e5',
                borderColor: '#c7d2fe',
              }}
            >
              Add Domain
            </Button>
          </div>
        )}
      </Form.List>
    </div>
  );
}
