'use client';

import React from 'react';
import Link from 'next/link';
import {
  MessageOutlined,
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
  GlobalOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import type { ActivityItem } from '@/src/features/dashboard/types/dashboard.types';
import './ActivityFeed.css';

interface ActivityFeedProps {
  items: ActivityItem[];
}

const ICON_MAP: Record<ActivityItem['type'], React.ReactElement> = {
  chat: <MessageOutlined />,
  agent: <UserOutlined />,
  knowledge: <FileTextOutlined />,
  warning: <WarningOutlined />,
  site: <GlobalOutlined />,
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="activity-feed" role="region" aria-label="Recent Activity">
      <div className="activity-feed-header">
        <h2 className="activity-feed-title">Recent Activity</h2>
        <Link href="/live-chats" className="activity-feed-view-all">
          View All <ArrowRightOutlined />
        </Link>
      </div>

      <ul className="activity-list">
        {items.map((item) => (
          <li key={item.id} className="activity-item">
            <div className={`activity-icon-wrap ${item.type}`} aria-hidden="true">
              {ICON_MAP[item.type]}
            </div>

            <div className="activity-body">
              <p className="activity-title">{item.title}</p>
              <p className="activity-desc">{item.description}</p>
            </div>

            <time className="activity-time" dateTime={item.time} aria-label={`${item.timeAgo}`}>
              {item.timeAgo}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}
