import type {
  StatCardData,
  ChatActivityData,
  ContainmentData,
  UserFeedbackData,
  TokenUsageData,
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
  id?: string;
  name: string;
  siteName?: string;
  hits: number;
}

export interface KnowledgeBasePerformance {
  topDocuments: KBDocumentPerformance[];
}

export interface ModelPerformance {
  avgGenerationTime: string;
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
    tokenUsage: TokenUsageData;
    userFeedback: UserFeedbackData;
  };
  conversations?: {
    topTopics: TopicData[];
    metrics: ConversationMetrics;
  };
  performance: {
    stats: StatCardData[];
    kb: KnowledgeBasePerformance;
    model: ModelPerformance;
  };
  usageCosts: {
    stats: StatCardData[];
    tokenUsage: TokenUsageData;
    usageBySite: SiteUsageData[];
  };
}
