import type { Site } from '../types/site.types';

// ── Agent mock user IDs ──────────────────────────────────────────────────────
// 'u-002' is the agent mock user defined in AuthContext.
// Sites assigned to the agent are those whose assignedAgentIds includes 'u-002'.

export const MOCK_SITES: Site[] = [
  {
    id: 'site-001',
    name: 'TechSolutions Inc.',
    url: 'techsolutions.example.com',
    enabled: true,
    knowledgeBaseStatus: 'ready',
    kbDocuments: 12,
    activeChats: 3,
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    assignedAgentIds: ['u-002'],
  },
  {
    id: 'site-002',
    name: 'EcommercePro',
    url: 'ecommercepro.example.com',
    enabled: true,
    knowledgeBaseStatus: 'processing',
    kbDocuments: 8,
    activeChats: 5,
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    assignedAgentIds: [],
  },
  {
    id: 'site-003',
    name: 'HealthcarePlus',
    url: 'healthcareplus.example.com',
    enabled: true,
    knowledgeBaseStatus: 'ready',
    kbDocuments: 15,
    activeChats: 2,
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    assignedAgentIds: ['u-002'],
  },
  {
    id: 'site-004',
    name: 'FinanceAdvisors',
    url: 'financeadvisors.example.com',
    enabled: false,
    knowledgeBaseStatus: 'pending',
    kbDocuments: 6,
    activeChats: 0,
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    assignedAgentIds: [],
  },
  {
    id: 'site-005',
    name: 'TravelExperts',
    url: 'travelexperts.example.com',
    enabled: true,
    knowledgeBaseStatus: 'ready',
    kbDocuments: 10,
    activeChats: 1,
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    assignedAgentIds: ['u-002'],
  },
  {
    id: 'site-006',
    name: 'EducationPortal',
    url: 'educationportal.example.com',
    enabled: true,
    knowledgeBaseStatus: 'processing',
    kbDocuments: 20,
    activeChats: 4,
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    assignedAgentIds: [],
  },
  {
    id: 'site-007',
    name: 'Glow Hair Salon',
    url: 'glowsalon.example.com',
    enabled: true,
    knowledgeBaseStatus: 'pending',
    kbDocuments: 5,
    activeChats: 0,
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    assignedAgentIds: [],
  },
  {
    id: 'site-008',
    name: 'Bella Nails Studio',
    url: 'bellanails.example.com',
    enabled: true,
    knowledgeBaseStatus: 'ready',
    kbDocuments: 7,
    activeChats: 2,
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    assignedAgentIds: [],
  },
];
