export enum NotificationType {
  CONVERSATION_WAITING = 'CONVERSATION_WAITING',
  CONVERSATION_CLOSED = 'CONVERSATION_CLOSED',
  AGENT_HANDOFF_REQUEST = 'AGENT_HANDOFF_REQUEST',
  DOCUMENT_PROCESSED = 'DOCUMENT_PROCESSED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  SYSTEM = 'SYSTEM',
  NEW_MESSAGE = 'NEW_MESSAGE',
  NEGATIVE_SENTIMENT = 'NEGATIVE_SENTIMENT',
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  siteId: string | null;
  conversationId: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface ChatToastPayload {
  conversationId: string;
  title: string;
  visitorName: string;
}
