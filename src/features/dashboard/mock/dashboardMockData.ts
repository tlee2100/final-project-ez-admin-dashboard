import type { DashboardData } from '../types/dashboard.types';

export const mockDashboardData: DashboardData = {
  stats: [
    {
      id: 'total-chats',
      title: 'Total Chats',
      value: '1,248',
      trend: 12,
      trendDirection: 'up',
      icon: 'message',
      iconColor: '#6366f1',
      iconBg: '#ede9fe',
    },
    {
      id: 'active-sites',
      title: 'Active Sites',
      value: '8',
      trend: 2,
      trendDirection: 'up',
      icon: 'global',
      iconColor: '#10b981',
      iconBg: '#d1fae5',
    },
    {
      id: 'avg-response-time',
      title: 'Avg. Response Time',
      value: '1.2s',
      trend: 0.3,
      trendDirection: 'up',
      icon: 'clock',
      iconColor: '#f59e0b',
      iconBg: '#fef3c7',
    },
    {
      id: 'token-usage',
      title: 'Token Usage',
      value: '1.2M',
      trend: 5,
      trendDirection: 'up',
      icon: 'api',
      iconColor: '#f97316',
      iconBg: '#ffedd5',
    },
  ],

  chatActivity: {
    daily: [
      { label: 'Mon', value: 120 },
      { label: 'Tue', value: 145 },
      { label: 'Wed', value: 132 },
      { label: 'Thu', value: 168 },
      { label: 'Fri', value: 155 },
      { label: 'Sat', value: 90 },
      { label: 'Sun', value: 78 },
    ],
    weekly: [
      { label: 'Week 1', value: 820 },
      { label: 'Week 2', value: 932 },
      { label: 'Week 3', value: 901 },
      { label: 'Week 4', value: 1124 },
    ],
    monthly: [
      { label: 'Jan', value: 3200 },
      { label: 'Feb', value: 2800 },
      { label: 'Mar', value: 3600 },
      { label: 'Apr', value: 4100 },
      { label: 'May', value: 3900 },
      { label: 'Jun', value: 4500 },
      { label: 'Jul', value: 4248 },
    ],
  },

  containmentRate: {
    aiResolved: 78,
    agentHandoff: 22,
  },

  tokenUsage: {
    daily: [
      { label: 'Mon', value: 12400 },
      { label: 'Tue', value: 13800 },
      { label: 'Wed', value: 12900 },
      { label: 'Thu', value: 16200 },
      { label: 'Fri', value: 14500 },
      { label: 'Sat', value: 9800 },
      { label: 'Sun', value: 8600 },
    ],
  },

  userFeedback: [
    { label: 'Helpful', value: 85, color: '#10b981' },
    { label: 'Not Helpful', value: 15, color: '#ef4444' },
  ],

  recentActivity: [
    {
      id: '1',
      type: 'chat',
      title: 'New chat session on TechSolutions Inc.',
      description: 'Visitor asked about product pricing',
      time: '13:55',
      timeAgo: '5 min ago',
    },
    {
      id: '2',
      type: 'agent',
      title: 'Agent Sarah took over a chat',
      description: 'Visitor requested human assistance',
      time: '13:45',
      timeAgo: '15 min ago',
    },
    {
      id: '3',
      type: 'knowledge',
      title: 'Knowledge base updated',
      description: "New document 'Product FAQ.pdf' added to TechSolutions Inc.",
      time: '13:00',
      timeAgo: '1 hour ago',
    },
    {
      id: '4',
      type: 'warning',
      title: 'High token usage detected',
      description: 'EcommercePro site exceeded daily token budget',
      time: '12:00',
      timeAgo: '2 hours ago',
    },
    {
      id: '5',
      type: 'site',
      title: 'New site created',
      description: 'HealthcarePlus site has been set up',
      time: '11:00',
      timeAgo: '3 hours ago',
    },
  ],
};
