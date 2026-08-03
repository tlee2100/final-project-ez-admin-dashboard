'use client';

import React, { useEffect, useState } from 'react';
import { Button, Modal, Input, Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const { Text } = Typography;

export function ClientChatWidgetLoader() {
  const [siteId, setSiteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    // Read from localStorage on mount to avoid hydration mismatch
    const saved = localStorage.getItem('demo_site_id') || '';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSiteId(saved);

    setInputVal(saved);

    if (saved && typeof window !== 'undefined') {
      if (!document.getElementById('ez-chat-widget-script')) {
        const script = document.createElement('script');
        script.id = 'ez-chat-widget-script';
        script.src = '/ez-chat-widget.js';
        script.dataset.backendUrl = 'http://localhost:3000';
        script.dataset.siteId = saved;
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  const handleSave = () => {
    const trimmedId = inputVal.trim();
    localStorage.setItem('demo_site_id', trimmedId);
    setSiteId(trimmedId);
    setIsModalOpen(false);
    // Reload page to re-initialize the widget cleanly with new Site ID
    window.location.reload();
  };

  // Don't render scripts until we know the siteId (prevents hydration mismatch)
  if (siteId === null) return null;

  return (
    <>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
        <Button
          type="primary"
          icon={<SettingOutlined />}
          onClick={() => setIsModalOpen(true)}
          style={{
            background: '#4f46e5',
            borderColor: '#4f46e5',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          {siteId ? 'Change Site ID' : 'Setup Site ID'}
        </Button>
      </div>

      <Modal
        title="Test Chat Widget Configuration"
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Save & Reload"
      >
        <p style={{ marginBottom: 12 }}>
          Enter the <strong>Site ID</strong> of the agent you want to connect to. You can copy this
          ID from the backend Database or from your Agent Dashboard.
        </p>
        <Input
          size="large"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="e.g. dc41e97a-30cf-4afc-a3c3-192d6c5ca030"
        />
        {!inputVal && (
          <Text type="danger" style={{ display: 'block', marginTop: 8, fontSize: 13 }}>
            Chat Widget will not load without a valid Site ID.
          </Text>
        )}
      </Modal>
    </>
  );
}
