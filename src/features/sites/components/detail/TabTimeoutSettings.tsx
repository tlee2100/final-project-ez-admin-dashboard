'use client';

import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Switch,
  Button,
  notification,
  Typography,
  Slider,
  InputNumber,
  Row,
  Col,
} from 'antd';
import { useUpdate } from '@refinedev/core';
import type { Site } from '../../types/site.types';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface TabTimeoutSettingsProps {
  site: Site;
}

export function TabTimeoutSettings({ site }: TabTimeoutSettingsProps) {
  const [form] = Form.useForm();
  const { mutation: updateMutation } = useUpdate<Site>();
  const updateSite = updateMutation.mutate;
  const isLoading = updateMutation.isPending;

  const enableConversationTimeout = Form.useWatch('enableConversationTimeout', form);

  useEffect(() => {
    form.setFieldsValue({
      enableConversationTimeout: site.enableConversationTimeout ?? false,
      inactivityTimeoutMinutes: site.inactivityTimeoutMinutes ?? 15,
      warningTimeMinutes: site.warningTimeMinutes ?? 5,
      inactivityWarningMessage:
        site.inactivityWarningMessage ??
        'It looks like you have been inactive for a while. Are you still there? This chat will close in {minutes} minutes if there is no response.',
      timeoutMessage:
        site.timeoutMessage ??
        'This conversation has been closed due to inactivity. If you need further assistance, please start a new chat.',
      resetTimerOnBotResponse: site.resetTimerOnBotResponse ?? true,
      pauseTimerForAgentChats: site.pauseTimerForAgentChats ?? true,
      sendEmailNotificationOnTimeout: site.sendEmailNotificationOnTimeout ?? false,
    });
  }, [site, form]);

  const onFinish = (values: Partial<Site>) => {
    updateSite(
      {
        resource: 'sites',
        id: site.id,
        values,
      },
      {
        onSuccess: () => {
          notification.success({
            message: 'Timeout Settings Updated',
            description: 'The timeout settings have been successfully saved.',
          });
        },
        onError: (error) => {
          notification.error({
            message: 'Update Failed',
            description: error?.message || 'Failed to save timeout settings.',
          });
        },
      },
    );
  };

  return (
    <div style={{ padding: '24px 0', width: '100%' }}>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <Title level={4}>Conversation Timeout Settings</Title>
        <Text type="secondary">Configure how the system handles inactive conversations</Text>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ paddingTop: 4 }}>
              <Form.Item name="enableConversationTimeout" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>
            <div>
              <Text strong>Enable Conversation Timeout</Text>
              <br />
              <Text type="secondary">
                Automatically close inactive conversations after a specified period
              </Text>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <Title level={5} style={{ marginBottom: 16 }}>
            Timeout Duration
          </Title>

          <Form.Item label="Inactivity Timeout (minutes)" style={{ marginBottom: 16 }}>
            <Row align="middle" gutter={16}>
              <Col flex="auto">
                <Form.Item name="inactivityTimeoutMinutes" noStyle>
                  <Slider
                    min={1}
                    max={60}
                    disabled={!enableConversationTimeout}
                    trackStyle={{ backgroundColor: '#10b981' }}
                    handleStyle={{ borderColor: '#10b981' }}
                  />
                </Form.Item>
              </Col>
              <Col>
                <Form.Item name="inactivityTimeoutMinutes" noStyle>
                  <InputNumber
                    min={1}
                    max={60}
                    style={{ width: 80 }}
                    addonAfter="min"
                    disabled={!enableConversationTimeout}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item label="Warning Time (minutes before timeout)" style={{ marginBottom: 8 }}>
            <Row align="middle" gutter={16}>
              <Col flex="auto">
                <Form.Item name="warningTimeMinutes" noStyle>
                  <Slider
                    min={1}
                    max={30}
                    disabled={!enableConversationTimeout}
                    trackStyle={{ backgroundColor: '#f59e0b' }}
                    handleStyle={{ borderColor: '#f59e0b' }}
                  />
                </Form.Item>
              </Col>
              <Col>
                <Form.Item name="warningTimeMinutes" noStyle>
                  <InputNumber
                    min={1}
                    max={30}
                    style={{ width: 80 }}
                    addonAfter="min"
                    disabled={!enableConversationTimeout}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
          <Text type="secondary" style={{ display: 'block' }}>
            How long before the timeout to show a warning message to the visitor.
          </Text>
        </div>

        <div style={{ marginBottom: 32 }}>
          <Title level={5} style={{ marginBottom: 16 }}>
            Custom Messages
          </Title>

          <div
            style={{
              background: '#f8fafc',
              padding: '16px',
              borderRadius: 8,
              marginBottom: 16,
              opacity: !enableConversationTimeout ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <Form.Item
              label={
                <span style={{ color: '#64748b', fontSize: 13 }}>Inactivity Warning Message</span>
              }
              name="inactivityWarningMessage"
              style={{ marginBottom: 0 }}
            >
              <TextArea
                rows={2}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  boxShadow: 'none',
                  resize: 'none',
                }}
                disabled={!enableConversationTimeout}
              />
            </Form.Item>
          </div>

          <div
            style={{
              background: '#f8fafc',
              padding: '16px',
              borderRadius: 8,
              opacity: !enableConversationTimeout ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <Form.Item
              label={<span style={{ color: '#64748b', fontSize: 13 }}>Timeout Message</span>}
              name="timeoutMessage"
              style={{ marginBottom: 0 }}
            >
              <TextArea
                rows={2}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  boxShadow: 'none',
                  resize: 'none',
                }}
                disabled={!enableConversationTimeout}
              />
            </Form.Item>
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <Title level={5} style={{ marginBottom: 16 }}>
            Advanced Settings
          </Title>

          <div
            style={{ opacity: !enableConversationTimeout ? 0.6 : 1, transition: 'opacity 0.2s' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div>
                <Text strong>Reset Timer on Bot Response</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Reset the inactivity timer when the bot sends a message
                </Text>
              </div>
              <Form.Item name="resetTimerOnBotResponse" valuePropName="checked" noStyle>
                <Switch disabled={!enableConversationTimeout} />
              </Form.Item>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div>
                <Text strong>Pause Timer for Agent Assigned Chats</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Don&apos;t apply timeout to conversations with human agents
                </Text>
              </div>
              <Form.Item name="pauseTimerForAgentChats" valuePropName="checked" noStyle>
                <Switch disabled={!enableConversationTimeout} />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Send Email Notification on Timeout</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Send an email summary to the site administrator when a conversation is closed due
                  to timeout.
                </Text>
              </div>
              <Form.Item name="sendEmailNotificationOnTimeout" valuePropName="checked" noStyle>
                <Switch disabled={!enableConversationTimeout} />
              </Form.Item>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', marginTop: 40 }}>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Save Changes
          </Button>
        </div>
      </Form>
    </div>
  );
}
