import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Popover, Button, List, Typography, Spin, Empty } from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  FileDoneOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNotification } from '@/src/contexts/NotificationContext';
import { NotificationType, type NotificationItem } from '@/src/types/notification.types';
import './NotificationBell.css';

const { Text } = Typography;

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.CONVERSATION_WAITING:
      return <WarningOutlined className="notif-icon notif-warning" />;
    case NotificationType.AGENT_HANDOFF_REQUEST:
      return <InfoCircleOutlined className="notif-icon notif-info" />;
    case NotificationType.CONVERSATION_CLOSED:
      return <CheckCircleOutlined className="notif-icon notif-success" />;
    case NotificationType.DOCUMENT_PROCESSED:
      return <FileDoneOutlined className="notif-icon notif-primary" />;
    case NotificationType.BOOKING_CONFIRMED:
      return <CalendarOutlined className="notif-icon notif-success" />;
    case NotificationType.BOOKING_CANCELLED:
      return <CloseCircleOutlined className="notif-icon notif-error" />;
    case NotificationType.SYSTEM:
    default:
      return <BellOutlined className="notif-icon notif-default" />;
  }
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const router = useRouter();

  const NAVIGABLE_TYPES: NotificationType[] = [
    NotificationType.CONVERSATION_WAITING,
    NotificationType.AGENT_HANDOFF_REQUEST,
  ];

  const [open, setOpen] = useState(false);

  // Auto pop-up for new notifications has been disabled per request
  // useEffect(() => {
  //   const handleNewNotif = () => setOpen(true);
  //   window.addEventListener('new_notification', handleNewNotif);
  //   return () => window.removeEventListener('new_notification', handleNewNotif);
  // }, []);

  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotification();

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasMore && !isLoading) {
        loadMore();
      }
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.readAt) {
      void markAsRead(item.id);
    }

    if (NAVIGABLE_TYPES.includes(item.type) && item.conversationId) {
      setOpen(false);
      router.push(`/live-chats/${item.conversationId}`);
    } else if (item.type === NotificationType.DOCUMENT_PROCESSED && item.siteId) {
      setOpen(false);
      router.push(`/sites/${item.siteId}/kb`);
    }
  };

  const content = (
    <div className="notif-popover-content">
      <div className="notif-header">
        <span className="notif-title">Notifications</span>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={() => markAllAsRead()}>
            Mark all read
          </Button>
        )}
      </div>

      <div className="notif-body" onScroll={handleScroll}>
        {isLoading && notifications.length === 0 ? (
          <div className="notif-loading">
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications" />
        ) : (
          <List
            className="notif-list"
            dataSource={notifications}
            footer={
              isLoading && hasMore ? (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <Spin size="small" />
                </div>
              ) : null
            }
            renderItem={(item) => (
              <List.Item
                className={`notif-item ${!item.readAt ? 'unread' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                <div className="notif-item-icon">{getNotificationIcon(item.type)}</div>
                <div className="notif-item-content">
                  <div className="notif-item-title-row">
                    <Text strong className="notif-item-title">
                      {item.title}
                    </Text>
                    {!item.readAt && <span className="notif-unread-dot" />}
                  </div>
                  <Text className="notif-item-desc" ellipsis={{ tooltip: item.message }}>
                    {item.message}
                  </Text>
                  <div className="notif-item-time">{formatTimeAgo(item.createdAt)}</div>
                </div>
                <Button
                  type="text"
                  size="small"
                  className="notif-delete-btn"
                  icon={<CloseCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(item.id);
                  }}
                  style={{ marginLeft: 'auto', color: '#94a3b8' }}
                />
              </List.Item>
            )}
          />
        )}
      </div>

      <div className="notif-footer">
        <Button
          type="text"
          danger
          size="small"
          onClick={() => deleteAllNotifications()}
          disabled={notifications.length === 0}
        >
          Clear all
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      overlayClassName="notif-popover"
      arrow={false}
    >
      <Badge count={unreadCount} overflowCount={99} size="small" offset={[-4, 4]}>
        <button className="header-notif-btn" aria-label="Notifications">
          <BellOutlined />
        </button>
      </Badge>
    </Popover>
  );
}
