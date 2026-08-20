export type StatTrend = 'up' | 'down' | 'neutral';

export interface StatCardData {
  id: string;
  title: string;
  value: string;
  trend: number; // percentage change
  trendDirection: StatTrend;
  icon: string;
  iconColor: string;
  iconBg: string;
  isMock?: boolean;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChatActivityData {
  daily: ChartDataPoint[];
  weekly: ChartDataPoint[];
  monthly: ChartDataPoint[];
}

export interface ContainmentData {
  aiResolved: number;
  agentHandoff: number;
}

export interface UserFeedbackItem {
  label: string;
  value: number;
  color?: string;
}

export type UserFeedbackData = UserFeedbackItem[];

export interface ActivityItem {
  id: string;
  type: 'chat' | 'agent' | 'knowledge' | 'warning' | 'site';
  title: string;
  description: string;
  time: string;
  timeAgo: string;
}

export interface DashboardData {
  stats: StatCardData[];
  chatActivity: ChatActivityData;
  containmentRate: ContainmentData;
  tokenUsage: { daily: ChartDataPoint[] };
  userFeedback: UserFeedbackData;
  recentActivity: ActivityItem[];
}

export type ChartPeriod = 'Daily' | 'Weekly' | 'Monthly';
