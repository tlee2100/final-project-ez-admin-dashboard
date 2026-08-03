// ── Site Entity ─────────────────────────────────────────────────────────────

// Mirrors the backend KnowledgeBaseStatus enum (sites.knowledgeBaseStatus).
export type KnowledgeBaseStatus = 'pending' | 'processing' | 'ready';

// Display metadata for each KB status — shared by the site card and detail
// header so the label + color stay consistent everywhere.
export const KB_STATUS_META: Record<
  KnowledgeBaseStatus,
  { label: string; variant: KnowledgeBaseStatus }
> = {
  pending: { label: 'Pending', variant: 'pending' },
  processing: { label: 'Processing', variant: 'processing' },
  ready: { label: 'Ready', variant: 'ready' },
};

// Safely resolve KB status meta, defaulting to 'pending' when missing.
export function getKbStatusMeta(status: KnowledgeBaseStatus | undefined | null): {
  label: string;
  variant: KnowledgeBaseStatus;
} {
  return KB_STATUS_META[status ?? 'pending'] ?? KB_STATUS_META.pending;
}

export interface Site {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  knowledgeBaseStatus: KnowledgeBaseStatus;
  kbDocuments: number;
  activeChats: number;
  updatedAt: string; // ISO date string
  assignedAgentIds: string[]; // user IDs of agents assigned to this site
}

// ── Filter / Sort State ──────────────────────────────────────────────────────

export type SiteStatusFilter = 'all' | 'active' | 'disabled';

export type SiteSortKey = 'name' | 'updatedAt' | 'kbDocuments' | 'activeChats';

export type SiteSortOrder = 'asc' | 'desc';

export interface SitesFilter {
  search: string;
  status: SiteStatusFilter;
  sortKey: SiteSortKey;
  sortOrder: SiteSortOrder;
}

// ── Sort Option (for dropdown) ───────────────────────────────────────────────

export interface SortOption {
  label: string;
  key: SiteSortKey;
  order: SiteSortOrder;
}

export const SORT_OPTIONS: SortOption[] = [
  { label: 'Name A → Z', key: 'name', order: 'asc' },
  { label: 'Name Z → A', key: 'name', order: 'desc' },
  { label: 'Recently Updated', key: 'updatedAt', order: 'desc' },
  { label: 'Oldest Updated', key: 'updatedAt', order: 'asc' },
  { label: 'Most KB Docs', key: 'kbDocuments', order: 'desc' },
  { label: 'Most Active Chats', key: 'activeChats', order: 'desc' },
];

export const STATUS_FILTER_OPTIONS: { label: string; value: SiteStatusFilter }[] = [
  { label: 'All Sites', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Disabled', value: 'disabled' },
];
