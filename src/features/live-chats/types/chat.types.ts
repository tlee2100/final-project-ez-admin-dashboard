// ─── Enums ────────────────────────────────────────────────────────────────────

export type ConversationStatus = 'OPEN' | 'PAUSED' | 'CLOSED';

export type HandlingStatus = 'AI_HANDLING' | 'WAITING_FOR_AGENT' | 'AGENT_HANDLING';

export type SenderType = 'VISITOR' | 'AGENT' | 'SYSTEM';

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface ConversationSite {
  id: string;
  name: string;
  url: string;
}

export interface ConversationAgent {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface LatestMessage {
  content: string;
  senderType: SenderType;
  createdAt: string;
}

export interface Conversation {
  id: string;
  siteId: string;
  agentId: string | null;
  visitorName: string;
  visitorEmail: string;
  status: ConversationStatus;
  handlingStatus: HandlingStatus;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  site?: ConversationSite;
  agent?: ConversationAgent | null;
  latestMessage?: LatestMessage | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: SenderType;
  agentId: string | null;
  content: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  createdAt: string;
  localId?: string; // temporary id before server confirms
}

// ─── Paginated Response ────────────────────────────────────────────────────────

export interface PaginatedMeta {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

export interface PaginatedConversations {
  data: Conversation[];
  meta: PaginatedMeta;
}
