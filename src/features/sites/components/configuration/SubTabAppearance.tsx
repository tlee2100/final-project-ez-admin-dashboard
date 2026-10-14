import React from 'react';
import { Form, Button, Input, Switch, Radio, ColorPicker, Typography } from 'antd';
import type { Site } from '@/src/features/sites/types/site.types';
import { useSiteAppearance } from '../../hooks/useSiteAppearance';
import { LiveAppearancePreview } from './LiveAppearancePreview';
import { AppearanceImageUploader } from './AppearanceImageUploader';

const { Title, Text } = Typography;

export interface SubTabAppearanceProps {
  site: Site;
  onSave?: (updatedData: Partial<Site>) => void;
}

export function SubTabAppearance({ site, onSave }: SubTabAppearanceProps) {
  const {
    form,
    initialValues,
    liveSettings,
    isUpdating,
    uploadingState,
    handleValuesChange,
    handleSubmit,
    handleCustomUpload,
  } = useSiteAppearance({ site, onSave });

  return (
    <div className="appearance-tab-container">
      {/* Settings Form Column */}
      <div className="appearance-form-column hide-scrollbar">
        <div className="appearance-header">
          <Title level={4}>Appearance Settings</Title>
          <Text type="secondary">Customize the look and feel of your chatbot widget</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
          initialValues={initialValues}
        >
          <div className="appearance-colors-row">
            <Form.Item name="primaryColor" label="Primary Color">
              <ColorPicker showText />
            </Form.Item>

            <Form.Item name="backgroundColor" label="Background Color">
              <ColorPicker showText />
            </Form.Item>
          </div>

          <Form.Item name="chatButtonPosition" label="Widget Position">
            <Radio.Group>
              <Radio.Button value="Bottom Left">Bottom Left</Radio.Button>
              <Radio.Button value="Bottom Right">Bottom Right</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="chatWindowTitle" label="Chat Window Title">
            <Input placeholder="E.g. Support Chat" />
          </Form.Item>

          <Form.Item name="chatButtonText" label="Chat Button Text">
            <Input placeholder="E.g. Chat with us" />
          </Form.Item>

          <Form.Item name="defaultGreetingMessage" label="Default Greeting Message">
            <Input.TextArea rows={3} placeholder="E.g. Hello! How can I help you today?" />
          </Form.Item>

          <Form.Item name="showAvatar" valuePropName="checked">
            <Switch checkedChildren="Show Avatar" unCheckedChildren="Hide Avatar" />
          </Form.Item>

          <AppearanceImageUploader
            name="botAvatar"
            label="Bot Avatar"
            uploadText="Upload Bot Avatar"
            changeText="Change Bot Avatar"
            uploading={uploadingState.botAvatar}
            form={form}
            customRequest={handleCustomUpload('botAvatar')}
            alt="Bot Avatar"
          />

          <AppearanceImageUploader
            name="launcherIcon"
            label="Launcher Icon"
            uploadText="Upload Launcher Icon"
            changeText="Change Launcher Icon"
            uploading={uploadingState.launcherIcon}
            form={form}
            customRequest={handleCustomUpload('launcherIcon')}
            alt="Launcher Icon"
          />

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isUpdating}>
              Save Appearance
            </Button>
          </Form.Item>
        </Form>
      </div>

      {/* Live Preview Column */}
      <div className="appearance-preview-column">
        <LiveAppearancePreview settings={liveSettings} />
      </div>
    </div>
  );
}
