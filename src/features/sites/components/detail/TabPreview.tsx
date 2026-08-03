'use client';

import React, { useState } from 'react';
import {
  MobileOutlined,
  DesktopOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  MessageOutlined,
} from '@ant-design/icons';

export function TabPreview() {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [position, setPosition] = useState<'left' | 'right'>('right');

  return (
    <div className="preview-tab-container">
      {/* ── Sub Header with Toggles ── */}
      <div className="preview-sub-header">
        <h2 className="preview-sub-title">Live Chatbot Preview</h2>
        <div className="preview-device-toggle">
          <button
            className={`preview-toggle-btn ${device === 'desktop' ? 'active' : ''}`}
            onClick={() => setDevice('desktop')}
            aria-label="Desktop preview"
          >
            <DesktopOutlined /> Desktop
          </button>
          <button
            className={`preview-toggle-btn ${device === 'mobile' ? 'active' : ''}`}
            onClick={() => setDevice('mobile')}
            aria-label="Mobile preview"
          >
            <MobileOutlined /> Mobile
          </button>
        </div>
      </div>
      <p className="preview-sub-desc">
        This is how your chatbot will appear to visitors on your website. You can interact with it
        to test the appearance.
      </p>

      {/* ── Viewport Wrapper ── */}
      <div className="preview-viewport-outer">
        <div className={`preview-viewport-container ${device}`}>
          <div className="preview-viewport-header">
            <span className="preview-viewport-dot red" />
            <span className="preview-viewport-dot yellow" />
            <span className="preview-viewport-dot green" />
            <span className="preview-viewport-address-bar">
              {device === 'desktop' ? 'https://yourwebsite.com' : 'yourwebsite.com'}
            </span>
          </div>

          <div className="preview-viewport-body">
            {/* Background mockup content to make it feel premium */}
            <div className="preview-mock-content">
              <div className="preview-mock-hero" />
              <div className="preview-mock-paragraph" />
              <div className="preview-mock-paragraph short" />
            </div>

            {/* Chatbot Bubble Widget */}
            <div className={`preview-chat-widget ${position}`}>
              <div className="preview-chat-bubble">
                <MessageOutlined className="preview-bubble-icon" />
                <span className="preview-bubble-text">Need Help?</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Position Switcher Toggles ── */}
      <div className="preview-bottom-actions">
        <div className="preview-position-toggles">
          <button
            className={`preview-action-btn ${position === 'left' ? 'active' : ''}`}
            onClick={() => setPosition('left')}
            aria-label="Align chatbot to the left"
          >
            <AlignLeftOutlined /> Left Position
          </button>
          <button
            className={`preview-action-btn ${position === 'right' ? 'active' : ''}`}
            onClick={() => setPosition('right')}
            aria-label="Align chatbot to the right"
          >
            <AlignRightOutlined /> Right Position
          </button>
        </div>
        <p className="preview-action-note">
          Note: This is a visual preview. For full functionality testing including AI responses, use
          the &quot;Test Chatbot&quot; tab.
        </p>
      </div>
    </div>
  );
}
