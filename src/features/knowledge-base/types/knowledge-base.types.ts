export enum DocFileType {
  PDF = 'pdf',
  DOCX = 'docx',
  MARKDOWN = 'md',
  HTML = 'html',
  URL = 'url',
  TXT = 'txt',
}

export enum DocFileExtension {
  PDF = 'pdf',
  DOCX = 'docx',
  MARKDOWN = 'md',
  MARKDOWN_LONG = 'markdown',
  HTML = 'html',
  HTM = 'htm',
  TXT = 'txt',
}

export interface KBDocument {
  id: string;
  siteId: string;
  name: string;
  type: DocFileType;
  sizeFormatted: string; // e.g. "2.4 MB"
  sizeBytes: number;
  chunksCount?: number;
  uploadedAt: string; // ISO string
  uploadedAtFormatted: string;
  processedAt?: string | null; // ISO string
  processedAtFormatted?: string;
  updatedAt: string; // ISO string used for sorting
  updatedAtFormatted: string;
  url?: string;
  contentSnippet?: string;
  status: 'indexed' | 'processing' | 'failed';
}

export interface VectorStorageStats {
  totalDocuments: number;
  totalChunks: number;
  totalSizeBytes: number;
  totalSizeFormatted: string; // e.g. "24.5 MB"
  lastUpdatedRelative: string; // e.g. "2 hours ago"
  vectorsUsed: number;
  vectorsLimit: number; // e.g. 100000
  usagePercentage: number; // e.g. 68
}

export interface CrawledUrlItem {
  id: string;
  url: string;
  status: 'completed' | 'crawling' | 'failed' | 'pending';
  pagesFound: number;
  lastCrawled: string;
  errorMessage?: string;
}

export interface CrawlerConfig {
  sitemapUrl: string;
  autoCrawlEnabled: boolean;
  crawlIntervalDays: number;
  maxDepth: number;
  respectRobotsTxt: boolean;
  crawledItems: CrawledUrlItem[];
}

export interface KBSettings {
  chunkSize: number;
  chunkOverlap: number;
  embeddingModel: string;
  vectorStoreBackend: 'pinecone' | 'qdrant' | 'pgvector';
  similarityThreshold: number;
  topKResults: number;
}

export type ModalTabType = 'upload' | 'url' | 'sitemap';

export interface AddContentPayload {
  tab: ModalTabType;
  files?: File[];
  url?: string;
  sitemapUrl?: string;
}

export interface DocumentChunkItem {
  id: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  sectionTitle: string | null;
  metadata: Record<string, unknown>;
  embeddingModel: string;
  vectorDimensions: number;
  createdAt: string;
}

export interface DocumentChunksResponse {
  document: {
    id: string;
    filename: string;
    fileType: string;
    fileSizeBytes: number | null;
    status: string;
    filePath: string;
    uploadedAt: string;
    processedAt: string | null;
    chunksCount: number;
  };
  chunks: DocumentChunkItem[];
}

export interface KBStatsResponse {
  totalDocuments: number;
  totalChunks: number;
  totalSizeBytes: number;
  totalTokens: number;
  vectorsUsed: number;
  vectorsLimit: number;
  usagePercentage: number;
  lastProcessedAt: string | null;
}
