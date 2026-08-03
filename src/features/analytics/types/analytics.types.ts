import type {
  StatCardData,
  ChatActivityData,
  ContainmentData,
  UserFeedbackData,
  ChartDataPoint,
} from '../../dashboard/types/dashboard.types';

export interface TopicData {
  name: string;
  count: number;
  percentage: number;
}

export interface ConversationMetrics {
  avgLength: string;
  avgLengthTrend: string;
  avgMessages: string;
  avgMessagesTrend: string;
  humanHandoffRate: string;
  humanHandoffTrend: string;
  firstResponseTime: string;
  firstResponseTrend: string;
}

export interface KBDocumentPerformance {
  name: string;
  hits: number;
}

export interface KnowledgeBasePerformance {
  querySuccessRate: string;
  querySuccessTrend: string;
  avgRetrievalTime: string;
  avgRetrievalTrend: string;
  topDocuments: KBDocumentPerformance[];
}

export interface UnhandledIntent {
  name: string;
  occurrences: number;
}

export interface ModelPerformance {
  avgGenerationTime: string;
  avgGenerationTrend: string;
  intentAccuracy: string;
  intentAccuracyTrend: string;
  topUnhandledIntents: UnhandledIntent[];
}

export interface SiteUsageData {
  siteName: string;
  tokens: number;
  percentage: number;
  estimatedCost: string;
}

export interface AnalyticsData {
  overview: {
    stats: StatCardData[];
    chatActivity: ChatActivityData;
    containmentRate: ContainmentData;
    tokenUsage: { daily: ChartDataPoint[]; weekly: ChartDataPoint[]; monthly: ChartDataPoint[] };
    userFeedback: UserFeedbackData;
  };
  conversations: {
    topTopics: TopicData[];
    metrics: ConversationMetrics;
  };
  performance: {
    kb: KnowledgeBasePerformance;
    model: ModelPerformance;
  };
  usageCosts: {
    stats: StatCardData[];
    tokenUsage: { daily: ChartDataPoint[]; weekly: ChartDataPoint[]; monthly: ChartDataPoint[] };
    usageBySite: SiteUsageData[];
  };
}
