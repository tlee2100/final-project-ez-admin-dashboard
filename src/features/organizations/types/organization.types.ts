export type OrganizationStatus = 'Active' | 'Trial' | 'Suspended' | 'Inactive';

export interface OrganizationOwner {
  name: string;
  email: string;
  avatar?: string;
  initials: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  adminOwner: OrganizationOwner;
  sitesCount: number;
  agentsCount: number;
  ownersCount: number;
  createdAt: string;
  notes?: string;
  ownerId?: string | null;
}

export type OrganizationSortField = 'name' | 'slug' | 'createdAt' | 'updatedAt';

export interface OrganizationsFilter {
  search: string;
  status: 'all' | OrganizationStatus;
  sortKey: OrganizationSortField;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}
