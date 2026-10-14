import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Popover, Button, List, Typography, Spin, Empty, Tag, Segmented } from 'antd';
import {
  BellOutlined,
  CheckCircleFilled,
  CustomerServiceOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
  FrownFilled,
  MessageOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNotification } from '@/src/contexts/NotificationContext';
import { NotificationType, type NotificationItem } from '@/src/types/notification.types';
import './NotificationBell.css';

const { Text } = Typography;

type FilterType = 'all' | 'urgent' | 'messages' | 'system';

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.CONVERSATION_WAITING:
      return <MessageOutlined className="notif-icon" />;
    case NotificationType.AGENT_HANDOFF_REQUEST:
      return <CustomerServiceOutlined className="notif-icon" />;
    case NotificationType.NEGATIVE_SENTIMENT:
      return <FrownFilled className="notif-icon" />;
    case NotificationType.CONVERSATION_CLOSED:
      return <CheckCircleFilled className="notif-icon" />;
    case NotificationType.DOCUMENT_PROCESSED:
      return <FileTextOutlined className="notif-icon" />;
    case NotificationType.BOOKING_CONFIRMED:
      return <CalendarOutlined className="notif-icon" />;
    case NotificationType.BOOKING_CANCELLED:
      return <CloseCircleOutlined className="notif-icon" />;
    case NotificationType.SYSTEM:
    default:
      return <BellOutlined className="notif-icon" />;
  }
}

function getNotificationColorClass(type: NotificationType, title?: string) {
  if (title === 'Agent Requested') return 'notif-info';
  switch (type) {
    case NotificationType.CONVERSATION_WAITING:
      return 'notif-warning';
    case NotificationType.AGENT_HANDOFF_REQUEST:
      return 'notif-info';
    case NotificationType.NEGATIVE_SENTIMENT:
    case NotificationType.BOOKING_CANCELLED:
      return 'notif-error';
    case NotificationType.CONVERSATION_CLOSED:
    case NotificationType.BOOKING_CONFIRMED:
      return 'notif-success';
    case NotificationType.DOCUMENT_PROCESSED:
      return 'notif-primary';
    case NotificationType.SYSTEM:
    default:
      return 'notif-default';
  }
}

function getNotificationTag(type: NotificationType, title?: string) {
  if (title === 'Agent Requested' || type === NotificationType.AGENT_HANDOFF_REQUEST) {
    return (
      <Tag color="purple" style={{ margin: 0, fontSize: '10px', fontWeight: 600 }}>
        AGENT REQUEST
      </Tag>
    );
  }
  switch (type) {
    case NotificationType.NEGATIVE_SENTIMENT:
      return (
        <Tag color="error" style={{ margin: 0, fontSize: '10px', fontWeight: 600 }}>
          NEGATIVE
        </Tag>
      );
    case NotificationType.CONVERSATION_WAITING:
      return (
        <Tag color="warning" style={{ margin: 0, fontSize: '10px', fontWeight: 600 }}>
          WAITING
        </Tag>
      );
    case NotificationType.NEW_MESSAGE:
      return (
        <Tag color="processing" style={{ margin: 0, fontSize: '10px', fontWeight: 600 }}>
          NEW MESSAGE
        </Tag>
      );
    case NotificationType.CONVERSATION_CLOSED:
      return (
        <Tag color="success" style={{ margin: 0, fontSize: '10px', fontWeight: 600 }}>
          CLOSED
        </Tag>
      );
    case NotificationType.DOCUMENT_PROCESSED:
      return (
        <Tag color="blue" style={{ margin: 0, fontSize: '10px', fontWeight: 600 }}>
          DOCUMENT
        </Tag>
      );
    default:
      return (
        <Tag color="default" style={{ margin: 0, fontSize: '10px', fontWeight: 600 }}>
          SYSTEM
        </Tag>
      );
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
    NotificationType.NEGATIVE_SENTIMENT,
  ];

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
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

  const filteredNotifications = notifications.filter((item) => {
    const isAgentHandoff =
      item.type === NotificationType.AGENT_HANDOFF_REQUEST ||
      (item.type === NotificationType.CONVERSATION_WAITING && item.title === 'Agent Requested');

    if (filter === 'urgent') {
      return item.type === NotificationType.NEGATIVE_SENTIMENT || isAgentHandoff;
    }
    if (filter === 'messages') {
      return (
        (item.type === NotificationType.CONVERSATION_WAITING && !isAgentHandoff) ||
        item.type === NotificationType.NEW_MESSAGE
      );
    }
    if (filter === 'system') {
      return (
        item.type === NotificationType.DOCUMENT_PROCESSED ||
        item.type === NotificationType.SYSTEM ||
        item.type === NotificationType.BOOKING_CONFIRMED ||
        item.type === NotificationType.BOOKING_CANCELLED
      );
    }
    return true;
  });

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

      <div className="notif-filter-bar">
        <Segmented
          value={filter}
          onChange={(val) => setFilter(val as FilterType)}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Urgent', value: 'urgent' },
            { label: 'Messages', value: 'messages' },
            { label: 'System', value: 'system' },
          ]}
          block
          size="small"
        />
      </div>

      <div className="notif-body" onScroll={handleScroll}>
        {isLoading && notifications.length === 0 ? (
          <div className="notif-loading">
            <Spin />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications" />
        ) : (
          <List
            className="notif-list"
            dataSource={filteredNotifications}
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
                <div
                  className={`notif-item-icon ${getNotificationColorClass(item.type, item.title)}`}
                >
                  {getNotificationIcon(item.type)}
                </div>
                <div className="notif-item-content">
                  <div className="notif-item-title-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getNotificationTag(item.type, item.title)}
                      <Text strong className="notif-item-title">
                        {item.title}
                      </Text>
                    </div>
                    {!item.readAt && <span className="notif-unread-dot" />}
                  </div>
                  <Text className="notif-item-desc" ellipsis={{ tooltip: item.message }}>
                    {item.message}
                  </Text>
                  <div className="notif-item-footer-row">
                    <span className="notif-item-time">{formatTimeAgo(item.createdAt)}</span>
                    {NAVIGABLE_TYPES.includes(item.type) && (
                      <span className="notif-quick-action">
                        View chat <RightOutlined style={{ fontSize: '10px' }} />
                      </span>
                    )}
                  </div>
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
