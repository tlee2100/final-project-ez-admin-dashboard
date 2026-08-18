import type { CrawlerConfig } from '../types/knowledge-base.types';

export const initialCrawlerConfig: CrawlerConfig = {
  sitemapUrl: 'https://techsolutions.example.com/sitemap.xml',
  autoCrawlEnabled: true,
  crawlIntervalDays: 7,
  maxDepth: 3,
  respectRobotsTxt: true,
  crawledItems: [
    {
      id: 'crawl-1',
      url: 'https://techsolutions.example.com/sitemap.xml',
      status: 'completed',
      pagesFound: 42,
      lastCrawled: '2 days ago',
    },
    {
      id: 'crawl-2',
      url: 'https://techsolutions.example.com/docs/getting-started',
      status: 'completed',
      pagesFound: 1,
      lastCrawled: '2 days ago',
    },
    {
      id: 'crawl-3',
      url: 'https://techsolutions.example.com/blog/new-features',
      status: 'completed',
      pagesFound: 1,
      lastCrawled: '2 days ago',
    },
  ],
};
