'use client';

import React, { forwardRef, useEffect } from 'react';
import {
  Form,
  Input,
  Switch,
  Button,
  Divider,
  Typography,
  ConfigProvider,
  Row,
  Col,
  notification,
} from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useUpdate } from '@refinedev/core';
import type { Site } from '../../types/site.types';

import type { InputRef } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';

const { Title, Text } = Typography;

export type CustomFieldProps = {
  label: string;
  icon?: React.ReactNode;
  isTextArea?: boolean;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  id?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  disabled?: boolean;
};

const CustomField = forwardRef<InputRef | TextAreaRef, CustomFieldProps>(
  ({ label, icon, isTextArea, value, onChange, id, onBlur, onFocus, onKeyDown, disabled }, ref) => {
    const commonProps = { value, onChange, id, onBlur, onFocus, onKeyDown, disabled };
    return (
      <div
        style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          padding: '8px 16px',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          border: '1px solid transparent',
          transition: 'all 0.2s',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#1677ff')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
      >
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: isTextArea ? 'flex-start' : 'center' }}>
          {icon && (
            <span
              style={{
                marginRight: '8px',
                color: '#6b7280',
                display: 'flex',
                marginTop: isTextArea ? '2px' : '0',
                fontSize: '16px',
              }}
            >
              {icon}
            </span>
          )}
          {isTextArea ? (
            <Input.TextArea
              ref={ref as React.Ref<TextAreaRef>}
              variant="borderless"
              {...commonProps}
              style={{
                padding: 0,
                fontSize: '14px',
                backgroundColor: 'transparent',
                boxShadow: 'none',
                color: '#111827',
              }}
            />
          ) : (
            <Input
              ref={ref as React.Ref<InputRef>}
              variant="borderless"
              {...commonProps}
              style={{
                padding: 0,
                fontSize: '14px',
                backgroundColor: 'transparent',
                boxShadow: 'none',
                color: '#111827',
              }}
            />
          )}
        </div>
      </div>
    );
  },
);
CustomField.displayName = 'CustomField';

interface SubTabGeneralProps {
  site: Site;
}

export function SubTabGeneral({ site }: SubTabGeneralProps) {
  const [form] = Form.useForm();
  const { mutate: updateSite, mutation: updateMutation } = useUpdate<Site>();
  const isUpdating = updateMutation.isPending;

  useEffect(() => {
    if (site) {
      form.setFieldsValue({
        siteName: site.name,
        siteUrl: site.url,
        enableChatbot: site.isAiActive ?? true,
        humanHandoff: site.humanHandoff ?? false,
        emailTranscript: site.emailTranscript ?? false,
      });
    }
  }, [site, form]);

  // Theo dõi giá trị của trường enableChatbot để xử lý UI cho Human Handoff
  const enableChatbot = Form.useWatch('enableChatbot', form);

  const onFinish = (values: {
    siteName: string;
    siteUrl: string;
    enableChatbot: boolean;
    humanHandoff: boolean;
    emailTranscript: boolean;
  }) => {
    updateSite(
      {
        resource: 'sites',
        id: site.id,
        values: {
          name: values.siteName,
          url: values.siteUrl,
          isAiActive: values.enableChatbot,
          humanHandoff: values.humanHandoff,
          emailTranscript: values.emailTranscript,
        },
      },
      {
        onSuccess: () => {
          notification.success({
            message: 'General Settings Updated',
            description: 'The general settings have been successfully saved.',
          });
        },
        onError: (error) => {
          notification.error({
            message: 'Update Failed',
            description: error?.message || 'Failed to save general settings.',
          });
        },
      },
    );
  };

  return (
    <div style={{ width: '100%', margin: '0 auto', padding: '8px 0' }}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* General Info */}
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={24} md={12}>
            <Form.Item
              name="siteName"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: 'Vui lòng nhập Tên trang web' }]}
            >
              <CustomField label="Site Name" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="siteUrl"
              style={{ marginBottom: 0 }}
              rules={[
                { required: true, message: 'Vui lòng nhập URL trang web' },
                { type: 'url', message: 'URL không hợp lệ (Ví dụ: https://example.com)' },
              ]}
            >
              <CustomField label="Site URL" icon={<GlobalOutlined />} />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '0 0 24px 0', borderColor: '#f3f4f6' }} />

        {/* Features */}
        <Title
          level={5}
          style={{ marginBottom: 16, fontSize: '15px', fontWeight: 600, color: '#374151' }}
        >
          Features
        </Title>

        <ConfigProvider
          theme={{
            components: {
              Switch: {
                colorPrimary: '#10b981',
                colorPrimaryHover: '#059669',
              },
            },
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Enable Chatbot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '2px',
                    color: '#111827',
                  }}
                >
                  Enable Chatbot
                </div>
                <Text style={{ fontSize: '13px', color: '#6b7280' }}>Accept chatbot answer</Text>
              </div>
              <Form.Item name="enableChatbot" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Switch />
              </Form.Item>
            </div>

            {/* Human Handoff */}
            {/* Thêm padding-left và mờ đi (opacity) khi bị disable để thể hiện quan hệ cha-con trực quan */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingLeft: '24px',
                borderLeft: '2px solid #e5e7eb',
                marginLeft: '8px',
                opacity: enableChatbot ? 1 : 0.5,
                transition: 'opacity 0.2s',
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '2px',
                    color: '#111827',
                  }}
                >
                  Human Handoff
                </div>
                <Text style={{ fontSize: '13px', color: '#6b7280' }}>
                  Allow visitors to request human assistance
                </Text>
              </div>
              <Form.Item name="humanHandoff" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Switch disabled={!enableChatbot} />
              </Form.Item>
            </div>

            {/* Email Transcript */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '2px',
                    color: '#111827',
                  }}
                >
                  Email Transcript
                </div>
                <Text style={{ fontSize: '13px', color: '#6b7280' }}>
                  Allow visitors to receive chat transcripts via email
                </Text>
              </div>
              <Form.Item name="emailTranscript" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Switch />
              </Form.Item>
            </div>
          </div>
        </ConfigProvider>

        <Divider style={{ margin: '24px 0', borderColor: '#f3f4f6' }} />

        {/* Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isUpdating}
              style={{ borderRadius: '6px', fontWeight: 500 }}
            >
              Save Changes
            </Button>
          </Form.Item>
        </div>
      </Form>
    </div>
  );
}
