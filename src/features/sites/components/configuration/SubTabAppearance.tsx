import {
  Form,
  Button,
  Input,
  Switch,
  Radio,
  Upload,
  message,
  ColorPicker,
  Typography,
  notification,
} from 'antd';
import { UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import { useUpdate } from '@refinedev/core';
import { Site } from '@/src/features/sites/types/site.types';
import { siteApi } from '../../services/site.api';
import { useState } from 'react';
import { LiveAppearancePreview, AppearancePreviewProps } from './LiveAppearancePreview';

const { Title, Text } = Typography;

interface SubTabAppearanceProps {
  site: Site;
}

export function SubTabAppearance({ site }: SubTabAppearanceProps) {
  const [form] = Form.useForm();
  const { mutate: updateSite, mutation: updateMutation } = useUpdate<Site>();
  const isUpdating = updateMutation.isPending;

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLauncher, setUploadingLauncher] = useState(false);

  const [liveSettings, setLiveSettings] = useState<AppearancePreviewProps>({
    primaryColor: site.primaryColor || '#10b981',
    backgroundColor: site.backgroundColor || '#ffffff',
    botAvatar: site.botAvatar,
    launcherIcon: site.launcherIcon,
    defaultGreetingMessage: site.defaultGreetingMessage || '',
    chatButtonPosition: site.chatButtonPosition || 'Bottom Right',
    chatWindowTitle: site.chatWindowTitle || '',
    chatButtonText: site.chatButtonText || '',
    showAvatar: site.showAvatar ?? true,
  });

  const onFinish = (values: Record<string, unknown>) => {
    // Extract color hex values from ColorPicker
    const payload = {
      ...values,
      primaryColor:
        typeof values.primaryColor === 'string'
          ? values.primaryColor
          : (values.primaryColor as { toHexString?: () => string })?.toHexString?.() ||
            site.primaryColor,
      backgroundColor:
        typeof values.backgroundColor === 'string'
          ? values.backgroundColor
          : (values.backgroundColor as { toHexString?: () => string })?.toHexString?.() ||
            site.backgroundColor,
    };

    updateSite(
      {
        resource: 'sites',
        id: site.id,
        values: payload,
      },
      {
        onSuccess: () => {
          notification.success({
            message: 'Appearance Settings Updated',
            description: 'The appearance settings have been successfully saved.',
          });
        },
        onError: (error) => {
          notification.error({
            message: 'Update Failed',
            description: error?.message || 'Failed to save appearance settings.',
          });
        },
      },
    );
  };

  const customUpload = async (
    options: {
      file?: unknown;
      onSuccess?: (body: unknown) => void;
      onError?: (err: Error) => void;
    },
    fieldName: 'botAvatar' | 'launcherIcon',
    setUploading: (val: boolean) => void,
  ) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    try {
      const response = await siteApi.uploadImage(site.id, file as Blob);

      form.setFieldsValue({ [fieldName]: response.url });
      setLiveSettings((prev: AppearancePreviewProps) => ({ ...prev, [fieldName]: response.url }));
      if (typeof onSuccess === 'function') {
        onSuccess(response.url);
      }
      message.success('Image uploaded successfully');
    } catch (err: unknown) {
      if (typeof onError === 'function') {
        onError(err as Error);
      }
      message.error((err as Error).message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          gap: '32px',
          height: 'calc(100vh - 180px)',
          minHeight: '700px',
          overflow: 'hidden',
        }}
      >
        <div
          className="hide-scrollbar"
          style={{
            padding: '24px 16px 24px 0',
            width: '100%',
            maxWidth: 600,
            flex: 1,
            overflowY: 'auto',
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <Title level={4}>Appearance Settings</Title>
            <Text type="secondary">Customize the look and feel of your chatbot widget</Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onValuesChange={(_, allValues) => setLiveSettings(allValues)}
            initialValues={{
              primaryColor: site.primaryColor || '#10b981',
              backgroundColor: site.backgroundColor || '#ffffff',
              botAvatar: site.botAvatar,
              launcherIcon: site.launcherIcon,
              defaultGreetingMessage: site.defaultGreetingMessage || '',
              chatButtonPosition: site.chatButtonPosition || 'Bottom Right',
              chatWindowTitle: site.chatWindowTitle || '',
              chatButtonText: site.chatButtonText || '',
              showAvatar: site.showAvatar ?? true,
            }}
          >
            <div style={{ display: 'flex', gap: '24px', marginBottom: 16 }}>
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

            <Form.Item label="Bot Avatar">
              <Form.Item name="botAvatar" noStyle>
                <Input type="hidden" />
              </Form.Item>
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={(options) => customUpload(options, 'botAvatar', setUploadingAvatar)}
              >
                <Button
                  icon={uploadingAvatar ? <LoadingOutlined /> : <UploadOutlined />}
                  disabled={uploadingAvatar}
                >
                  {form.getFieldValue('botAvatar') ? 'Change Bot Avatar' : 'Upload Bot Avatar'}
                </Button>
              </Upload>
              <Form.Item
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.botAvatar !== currentValues.botAvatar
                }
                noStyle
              >
                {({ getFieldValue }) => {
                  const botAvatar = getFieldValue('botAvatar');
                  return botAvatar ? (
                    <div style={{ marginTop: 8 }}>
                      <img
                        src={botAvatar}
                        alt="Bot Avatar"
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : null;
                }}
              </Form.Item>
            </Form.Item>

            <Form.Item label="Launcher Icon">
              <Form.Item name="launcherIcon" noStyle>
                <Input type="hidden" />
              </Form.Item>
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={(options) =>
                  customUpload(options, 'launcherIcon', setUploadingLauncher)
                }
              >
                <Button
                  icon={uploadingLauncher ? <LoadingOutlined /> : <UploadOutlined />}
                  disabled={uploadingLauncher}
                >
                  {form.getFieldValue('launcherIcon')
                    ? 'Change Launcher Icon'
                    : 'Upload Launcher Icon'}
                </Button>
              </Upload>
              <Form.Item
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.launcherIcon !== currentValues.launcherIcon
                }
                noStyle
              >
                {({ getFieldValue }) => {
                  const launcherIcon = getFieldValue('launcherIcon');
                  return launcherIcon ? (
                    <div style={{ marginTop: 8 }}>
                      <img
                        src={launcherIcon}
                        alt="Launcher Icon"
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : null;
                }}
              </Form.Item>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isUpdating}>
                Save Appearance
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* Live Preview Column */}
        <div
          style={{
            flex: 1,
            minWidth: '400px',
            padding: '24px 0',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <LiveAppearancePreview settings={liveSettings} />
        </div>
      </div>
    </>
  );
}
