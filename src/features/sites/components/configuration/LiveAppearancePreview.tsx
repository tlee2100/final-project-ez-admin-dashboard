import React, { useState } from 'react';
import {
  CustomerServiceOutlined,
  CloseOutlined,
  RobotOutlined,
  MoreOutlined,
  PictureOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { Avatar } from 'antd';

export interface AppearancePreviewProps {
  primaryColor?: string | { toHexString?: () => string };
  backgroundColor?: string | { toHexString?: () => string };
  botAvatar?: string;
  launcherIcon?: string;
  defaultGreetingMessage?: string;
  chatButtonPosition?: string;
  chatWindowTitle?: string;
  chatButtonText?: string;
  showAvatar?: boolean;
}

export function LiveAppearancePreview({ settings }: { settings: AppearancePreviewProps }) {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to parse Ant Design ColorPicker values
  const getHexColor = (color: unknown, fallback: string) => {
    if (typeof color === 'string') return color;
    if (
      color &&
      typeof color === 'object' &&
      'toHexString' in color &&
      typeof (color as { toHexString: () => string }).toHexString === 'function'
    ) {
      return (color as { toHexString: () => string }).toHexString();
    }
    return fallback;
  };

  const primaryColor = getHexColor(settings.primaryColor, '#10b981');
  const backgroundColor = getHexColor(settings.backgroundColor, '#ffffff');
  const position = settings.chatButtonPosition || 'Bottom Right';
  const isLeft = position === 'Bottom Left';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '420px',
        height: '650px',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        backgroundColor: '#f9fafb',
        overflow: 'hidden',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        margin: '0 auto',
        position: 'sticky',
        top: '24px',
      }}
      className="live-preview-container"
    >
      {/* Mock Browser Header */}
      <div
        style={{
          height: '40px',
          backgroundColor: '#e5e7eb',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '6px',
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#fca5a5' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#fde047' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#86efac' }} />
      </div>

      {/* Mock Page Content */}
      <div style={{ padding: '24px', flex: 1 }}>
        <div
          style={{
            width: '60%',
            height: '24px',
            backgroundColor: '#d1d5db',
            borderRadius: '4px',
            marginBottom: '16px',
          }}
        />
        <div
          style={{
            width: '100%',
            height: '12px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            marginBottom: '8px',
          }}
        />
        <div
          style={{
            width: '80%',
            height: '12px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            marginBottom: '8px',
          }}
        />
        <div
          style={{ width: '90%', height: '12px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}
        />
      </div>

      {/* Mock Widget Container */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: isLeft ? '20px' : 'auto',
          right: !isLeft ? '20px' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isLeft ? 'flex-start' : 'flex-end',
          zIndex: 50,
        }}
      >
        {/* Open Chat Window */}
        {isOpen && (
          <div
            style={{
              width: '320px',
              height: '480px',
              backgroundColor,
              borderRadius: '16px',
              boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #f3f4f6',
            }}
          >
            {/* Chat Header */}
            <div
              style={{
                backgroundColor: primaryColor,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {settings.showAvatar !== false && (
                  <Avatar
                    size={32}
                    src={settings.botAvatar}
                    icon={!settings.botAvatar && <CustomerServiceOutlined />}
                    style={{
                      border: '2px solid rgba(255,255,255,0.8)',
                      backgroundColor: settings.botAvatar ? 'transparent' : '#6366f1',
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {settings.chatWindowTitle || 'Support Chat'}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      opacity: 0.85,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    We typically reply in a few minutes
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <MoreOutlined style={{ fontSize: '20px', cursor: 'pointer', flexShrink: 0 }} />
                <CloseOutlined
                  style={{ fontSize: '20px', cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => setIsOpen(false)}
                />
              </div>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, padding: '16px', backgroundColor, overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {settings.showAvatar !== false && (
                  <Avatar
                    size={28}
                    src={settings.botAvatar}
                    icon={!settings.botAvatar && <RobotOutlined />}
                    style={{
                      backgroundColor: settings.botAvatar ? 'transparent' : primaryColor,
                      flexShrink: 0,
                    }}
                  />
                )}
                <div
                  style={{
                    backgroundColor: '#fff',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    borderTopLeftRadius: settings.showAvatar !== false ? '4px' : '12px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    fontSize: '14px',
                    color: '#1f2937',
                    maxWidth: '85%',
                    lineHeight: '1.5',
                  }}
                >
                  {settings.defaultGreetingMessage || 'Hello! How can I help you today?'}
                </div>
              </div>
            </div>

            {/* Chat Footer */}
            <div style={{ padding: '8px', backgroundColor: backgroundColor || '#fff' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  width: '100%',
                  background: '#ffffff',
                  borderRadius: '24px',
                  padding: '4px 6px',
                  border: primaryColor ? 'none' : '1px solid #e5e7eb',
                  boxShadow: primaryColor
                    ? '0 2px 8px rgba(0,0,0,0.15)'
                    : '0 2px 6px rgba(0,0,0,0.05)',
                }}
              >
                <div
                  style={{
                    padding: '4px 8px',
                    color: primaryColor || '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'not-allowed',
                  }}
                >
                  <PictureOutlined style={{ fontSize: '20px' }} />
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: 0,
                    color: '#9ca3af',
                    fontSize: '14px',
                    background: 'transparent',
                  }}
                >
                  Type your message...
                </div>
                <div
                  style={{
                    backgroundColor: primaryColor || '#1677ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    borderRadius: '50%',
                    cursor: 'not-allowed',
                  }}
                >
                  <SendOutlined style={{ color: '#ffffff', fontSize: '16px' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Launcher Button */}
        {!isOpen && settings.chatButtonText ? (
          <button
            onClick={() => setIsOpen(true)}
            style={{
              backgroundColor: primaryColor,
              color: '#fff',
              border: 'none',
              borderRadius: '28px',
              padding: '0 24px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 14px 36px rgba(22, 119, 255, 0.34)',
              fontWeight: 500,
              fontSize: '16px',
              fontFamily: 'inherit',
            }}
          >
            {settings.launcherIcon ? (
              <img
                src={settings.launcherIcon}
                alt="Icon"
                style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <CustomerServiceOutlined style={{ fontSize: 24 }} />
            )}
            {settings.chatButtonText}
          </button>
        ) : (
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              backgroundColor: primaryColor,
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 14px 36px rgba(22, 119, 255, 0.34)',
              fontSize: '24px',
            }}
          >
            {isOpen ? (
              <CloseOutlined />
            ) : settings.launcherIcon ? (
              <img
                src={settings.launcherIcon}
                alt="Icon"
                style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <CustomerServiceOutlined />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
