export interface MockKBFile {
  name: string;
  size: string;
  type: string;
}

export interface MockChatMessage {
  sender: 'bot' | 'visitor' | 'agent';
  text: string;
  timestamp: string;
}

export interface MockConversation {
  id: string;
  visitorName: string;
  visitorAvatar?: string;
  status: 'waiting' | 'agent' | 'closed'; // 'agent' means active with agent, 'waiting' is waiting for agent, 'closed' is closed
  messagePreview: string;
  timeAgo: string;
  startTime: string;
  msgCount: number;
  location: string;
  metadataLabel: string;
  messages: MockChatMessage[];
}

export interface SiteDetailInfo {
  totalChats: number;
  activeChats: number;
  avgResponse: string;
  containmentRate: string;
  kbDocumentsCount: number;
  kbDocuments: MockKBFile[];
  sampleQuestions: string[];
  conversations: MockConversation[];
  statsSummary: {
    onSite: number;
    openNow: number;
    waiting: number;
    withAgent: number;
    closed: number;
    avgMsgs: number;
    resolvedShare: number;
  };
}

const DEFAULT_QUESTIONS = [
  'What are your pricing plans?',
  'How do I reset my password?',
  'Can you explain how to use your API?',
  'What are your latest features?',
  'I need help with your product',
];

const DEFAULT_KB_FILES: MockKBFile[] = [
  { name: 'Product Specifications.pdf', size: '1.2 MB', type: 'PDF' },
  { name: 'User Manual.docx', size: '420 KB', type: 'Word' },
  { name: 'API Documentation.md', size: '15 KB', type: 'Markdown' },
  { name: 'Pricing Information.pdf', size: '310 KB', type: 'PDF' },
  { name: 'FAQ.html', size: '45 KB', type: 'HTML' },
];

const DEFAULT_CONVERSATIONS: MockConversation[] = [
  {
    id: 'conv-1',
    visitorName: 'John Smith',
    status: 'waiting',
    messagePreview: "I'm having trouble resetting my password. Can someone help me?",
    timeAgo: '2 min ago',
    startTime: '2:45 PM',
    msgCount: 7,
    location: 'New York, USA',
    metadataLabel: 'Login Problems',
    messages: [
      { sender: 'bot', text: 'Hi! How can I help you today?', timestamp: '2:40 PM' },
      {
        sender: 'visitor',
        text: 'I want to reset my password but I do not receive the email.',
        timestamp: '2:41 PM',
      },
      {
        sender: 'bot',
        text: 'Please check your spam folder. If it is not there, I can connect you with an agent.',
        timestamp: '2:42 PM',
      },
      {
        sender: 'visitor',
        text: 'I already checked the spam folder, still nothing.',
        timestamp: '2:43 PM',
      },
      {
        sender: 'bot',
        text: 'Understood. Connecting you to a live representative now...',
        timestamp: '2:44 PM',
      },
      {
        sender: 'visitor',
        text: "I'm having trouble resetting my password. Can someone help me?",
        timestamp: '2:45 PM',
      },
    ],
  },
  {
    id: 'conv-2',
    visitorName: 'Michael Brown',
    status: 'agent',
    messagePreview: 'Thanks for your help! That solved my issue.',
    timeAgo: '1 min ago',
    startTime: '2:30 PM',
    msgCount: 4,
    location: 'London, UK',
    metadataLabel: 'Support Request',
    messages: [
      { sender: 'bot', text: 'Hello! I can help you locate your orders.', timestamp: '2:30 PM' },
      { sender: 'visitor', text: 'Hi, I cannot find my order invoice.', timestamp: '2:31 PM' },
      {
        sender: 'agent',
        text: 'Hi Michael! Let me pull up your invoice for order #4928.',
        timestamp: '2:33 PM',
      },
      {
        sender: 'visitor',
        text: 'Thanks for your help! That solved my issue.',
        timestamp: '2:34 PM',
      },
    ],
  },
];

export const SITES_DETAIL_MAP: Record<string, SiteDetailInfo> = {
  'site-001': {
    totalChats: 1248,
    activeChats: 3,
    avgResponse: '1.2s',
    containmentRate: '78%',
    kbDocumentsCount: 12,
    kbDocuments: DEFAULT_KB_FILES,
    sampleQuestions: DEFAULT_QUESTIONS,
    conversations: DEFAULT_CONVERSATIONS,
    statsSummary: {
      onSite: 2,
      openNow: 2,
      waiting: 1,
      withAgent: 1,
      closed: 0,
      avgMsgs: 6,
      resolvedShare: 50,
    },
  },
  'site-002': {
    totalChats: 852,
    activeChats: 5,
    avgResponse: '1.5s',
    containmentRate: '64%',
    kbDocumentsCount: 8,
    kbDocuments: DEFAULT_KB_FILES.slice(0, 3),
    sampleQuestions: DEFAULT_QUESTIONS.slice(0, 3),
    conversations: [
      {
        id: 'conv-3',
        visitorName: 'Alice Green',
        status: 'waiting',
        messagePreview: 'How long does shipping take to Canada?',
        timeAgo: '5 min ago',
        startTime: '4:10 PM',
        msgCount: 3,
        location: 'Toronto, Canada',
        metadataLabel: 'Shipping Query',
        messages: [
          { sender: 'bot', text: 'Hello! Welcome to our store.', timestamp: '4:10 PM' },
          {
            sender: 'visitor',
            text: 'How long does shipping take to Canada?',
            timestamp: '4:11 PM',
          },
        ],
      },
    ],
    statsSummary: {
      onSite: 1,
      openNow: 1,
      waiting: 1,
      withAgent: 0,
      closed: 0,
      avgMsgs: 2,
      resolvedShare: 0,
    },
  },
};

// Fallback helper for dynamically generated values if not explicitly in SITES_DETAIL_MAP
export function getSiteDetailInfo(
  siteId: string,
  siteName: string,
  kbDocsCount: number,
  activeChatsCount: number,
): SiteDetailInfo {
  if (SITES_DETAIL_MAP[siteId]) {
    return SITES_DETAIL_MAP[siteId];
  }

  // Generate deterministic details based on the basic site info
  return {
    totalChats: Math.floor(kbDocsCount * 80 + activeChatsCount * 12 + 100),
    activeChats: activeChatsCount,
    avgResponse: '1.4s',
    containmentRate: `${Math.floor(70 + (kbDocsCount % 10))}%`,
    kbDocumentsCount: kbDocsCount,
    kbDocuments: DEFAULT_KB_FILES.slice(0, Math.min(kbDocsCount, DEFAULT_KB_FILES.length)),
    sampleQuestions: DEFAULT_QUESTIONS,
    conversations: [
      {
        id: `conv-${siteId}-1`,
        visitorName: 'Guest User',
        status: activeChatsCount > 0 ? 'waiting' : 'closed',
        messagePreview: `Hello, looking for information regarding ${siteName}.`,
        timeAgo: '10 min ago',
        startTime: '10:00 AM',
        msgCount: 2,
        location: 'Vietnam',
        metadataLabel: 'General Inquiry',
        messages: [
          {
            sender: 'bot',
            text: `Welcome to ${siteName}! How can I assist you?`,
            timestamp: '10:00 AM',
          },
          {
            sender: 'visitor',
            text: `Hello, looking for information regarding ${siteName}.`,
            timestamp: '10:01 AM',
          },
        ],
      },
    ],
    statsSummary: {
      onSite: activeChatsCount,
      openNow: activeChatsCount,
      waiting: activeChatsCount > 0 ? 1 : 0,
      withAgent: 0,
      closed: activeChatsCount > 0 ? 0 : 1,
      avgMsgs: 2,
      resolvedShare: activeChatsCount > 0 ? 0 : 100,
    },
  };
}
