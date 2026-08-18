import {
  CloseCircleOutlined,
  GlobalOutlined,
  ReloadOutlined,
  SaveOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Progress,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  type TableProps,
} from 'antd';
import { useState } from 'react';
import type {
  CrawlerConfigDto,
  CrawlRunDto,
  CrawlRunItemStatus,
  CrawlRunPageDto,
} from '../types/knowledge-base.types';

interface KBCrawlerTabProps {
  config: CrawlerConfigDto | null;
  activeRun: CrawlRunDto | null;
  selectedRun: CrawlRunDto | null;
  selectedRunId: string | null;
  runs: CrawlRunDto[];
  pages: CrawlRunPageDto[];
  pagesTotal: number;
  pagesPage: number;
  pagesLimit: number;
  pageSearch: string;
  pageStatusFilter?: CrawlRunItemStatus;
  progressPercent: number;
  isLoading: boolean;
  isActionLoading: boolean;
  canManage: boolean;
  onSelectRun: (runId: string) => void;
  onStatusFilter: (status?: CrawlRunItemStatus) => void;
  onSearchPages: (search: string) => void;
  onPagesChange: (page: number, limit: number) => void;
  onSaveConfig: (sitemapUrl: string, autoSyncEnabled: boolean) => Promise<unknown>;
  onStartCrawl: () => Promise<unknown>;
  onRetryFailed: (runId: string) => Promise<unknown>;
  onRecrawlSource: (documentId: string) => Promise<unknown>;
  onAddSitemapClick: () => void;
}

const ACTIVE_STATUSES = new Set(['queued', 'discovering', 'processing']);
const ITEM_STATUS_OPTIONS: CrawlRunItemStatus[] = [
  'discovered',
  'queued',
  'rendering',
  'indexed',
  'unchanged',
  'skipped_robots',
  'skipped_noindex',
  'failed',
  'quota_exceeded',
  'retired',
];

const statusColors: Record<string, string> = {
  queued: 'default',
  discovered: 'default',
  rendering: 'processing',
  processing: 'processing',
  discovering: 'processing',
  indexed: 'success',
  unchanged: 'cyan',
  completed: 'success',
  skipped_robots: 'warning',
  skipped_noindex: 'warning',
  failed: 'error',
  partial_failed: 'warning',
  quota_exceeded: 'error',
  retired: 'default',
};

const itemStatusLabels: Record<CrawlRunItemStatus, string> = {
  discovered: 'Discovered',
  queued: 'Queued',
  rendering: 'Processing',
  indexed: 'Indexed',
  unchanged: 'Unchanged',
  skipped_robots: 'Skipped',
  skipped_noindex: 'Skipped',
  failed: 'Failed',
  quota_exceeded: 'Failed',
  retired: 'Retired',
};

function formatDate(value?: string | null) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

function getJobStatus(run: CrawlRunDto | null) {
  if (!run) return { label: 'Idle', color: 'default' };
  if (run.status === 'queued') return { label: 'Queued', color: statusColors.queued };
  if (run.status === 'discovering' || run.status === 'processing') {
    return { label: 'Running', color: statusColors.processing };
  }
  if (run.status === 'completed') return { label: 'Completed', color: statusColors.completed };
  if (run.status === 'partial_failed') {
    return { label: 'Completed with errors', color: statusColors.partial_failed };
  }
  return { label: 'Failed', color: statusColors.failed };
}

function getDebugError(errorMessage?: string | null) {
  return errorMessage?.split(/\r?\n/, 1)[0]?.trim() || null;
}

function getFriendlyError(errorMessage?: string | null) {
  if (errorMessage?.toLowerCase().includes('not a supported sitemap document')) {
    return {
      title: 'Unable to read sitemap',
      description:
        'The URL does not contain a valid sitemap or sitemap index. Check the URL and try again.',
    };
  }

  return {
    title: 'Unable to complete crawl',
    description: 'The crawl stopped before it could finish. Check the URL and try again.',
  };
}

function formatRunLabel(run: CrawlRunDto) {
  return `${formatDate(run.createdAt)} · ${getJobStatus(run).label}`;
}

function CrawlerProgress({
  run,
  isActive,
  progressPercent,
}: {
  run: CrawlRunDto | null;
  isActive: boolean;
  progressPercent: number;
}) {
  if (!run) {
    return (
      <Typography.Text type="secondary">
        No crawl has been started. Save a website or sitemap URL to begin.
      </Typography.Text>
    );
  }

  const hasKnownProgress = run.totalPages > 0;

  if (run.status === 'failed') {
    if (hasKnownProgress) {
      return (
        <Progress
          percent={progressPercent}
          status="exception"
          format={() => 'Stopped'}
          aria-label={`Crawl stopped at ${progressPercent}%`}
        />
      );
    }

    return (
      <div className="kb-crawler-stopped" role="status">
        <CloseCircleOutlined aria-hidden="true" />
        <span>Crawl stopped before any URL progress was available.</span>
      </div>
    );
  }

  if (run.status === 'completed' || run.status === 'partial_failed') {
    return (
      <Progress
        percent={100}
        status={run.status === 'completed' ? 'success' : 'exception'}
        format={() => (run.status === 'completed' ? 'Completed' : 'Completed with errors')}
        aria-label={run.status === 'completed' ? 'Crawl completed' : 'Crawl completed with errors'}
      />
    );
  }

  if (isActive && hasKnownProgress) {
    return (
      <Progress
        percent={progressPercent}
        status="active"
        aria-label={`Crawl ${progressPercent}% complete`}
      />
    );
  }

  return (
    <div>
      <div
        className="kb-crawler-indeterminate"
        role="progressbar"
        aria-label={run.status === 'queued' ? 'Crawl queued' : 'Discovering pages'}
      >
        <span />
      </div>
      <Typography.Text type="secondary">
        {run.status === 'queued' ? 'Waiting to start…' : 'Discovering pages…'}
      </Typography.Text>
    </div>
  );
}

export function KBCrawlerTab(props: KBCrawlerTabProps) {
  const [sitemapUrl, setSitemapUrl] = useState(props.config?.sitemapUrl ?? '');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(props.config?.autoSyncEnabled ?? false);
  const [detailsRunId, setDetailsRunId] = useState<string | null>(null);

  const run = props.activeRun ?? props.selectedRun;
  const isActive = !!props.activeRun && ACTIVE_STATUSES.has(props.activeRun.status);
  const jobStatus = getJobStatus(run);
  const debugError = getDebugError(run?.errorMessage);
  const showDetails = !!run && detailsRunId === run.id;
  const columns: TableProps<CrawlRunPageDto>['columns'] = [
    {
      title: 'URL',
      dataIndex: 'url',
      ellipsis: true,
      render: (url: string) => (
        <Typography.Link href={url} target="_blank" rel="noreferrer" title={url}>
          {url}
        </Typography.Link>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 130,
      render: (status: CrawlRunItemStatus) => (
        <Tag color={statusColors[status]}>{itemStatusLabels[status]}</Tag>
      ),
    },
    {
      title: 'HTTP',
      dataIndex: 'httpStatus',
      width: 80,
      render: (status: number | null) => status ?? '—',
    },
    {
      title: 'Result',
      width: 220,
      ellipsis: true,
      render: (_, item) => getDebugError(item.errorMessage) || item.errorCode || '—',
    },
    {
      title: 'Last Crawled',
      dataIndex: 'finishedAt',
      width: 160,
      render: (finishedAt: string | null) => (finishedAt ? formatDate(finishedAt) : '—'),
    },
    {
      title: 'Action',
      width: 110,
      render: (_, item) =>
        item.documentId && props.canManage ? (
          <Tooltip title="Recrawl this URL">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              disabled={isActive}
              onClick={() => void props.onRecrawlSource(item.documentId!)}
            >
              Recrawl
            </Button>
          </Tooltip>
        ) : null,
    },
  ];

  const failedRunError = run?.status === 'failed' ? getFriendlyError(run.errorMessage) : null;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <GlobalOutlined /> Website Crawler &amp; Sitemap Sync
          </Space>
        }
        extra={
          props.canManage && !props.config ? (
            <Button type="primary" onClick={props.onAddSitemapClick}>
              Add Website or Sitemap URL
            </Button>
          ) : null
        }
        loading={props.isLoading}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            Crawl public pages from a website or sitemap. robots.txt rules are always respected.
          </Typography.Text>

          <div className="kb-crawler-url-field">
            <label htmlFor="crawler-url">
              <Typography.Text strong>Website or Sitemap URL</Typography.Text>
            </label>
            <Input
              id="crawler-url"
              prefix={<GlobalOutlined />}
              value={sitemapUrl}
              disabled={!props.canManage}
              placeholder="https://example.com or https://example.com/sitemap.xml"
              aria-describedby="crawler-url-help"
              onChange={(event) => setSitemapUrl(event.target.value)}
            />
            <Typography.Text id="crawler-url-help" type="secondary" className="kb-crawler-help">
              Enter a website or sitemap URL. Sitemap indexes, nested sitemaps, and compressed
              sitemaps are handled automatically.
            </Typography.Text>
          </div>

          <div className="kb-crawler-controls">
            <div className="kb-crawler-auto-sync">
              <Switch
                checked={autoSyncEnabled}
                disabled={!props.canManage}
                aria-label="Automatic sync every 7 days"
                onChange={setAutoSyncEnabled}
              />
              <Typography.Text>Automatic sync every 7 days</Typography.Text>
            </div>

            {props.canManage && (
              <div className="kb-crawler-actions">
                <Button
                  icon={<SaveOutlined />}
                  loading={props.isActionLoading && !isActive}
                  disabled={!sitemapUrl.trim() || props.isActionLoading}
                  onClick={() => void props.onSaveConfig(sitemapUrl.trim(), autoSyncEnabled)}
                >
                  Save configuration
                </Button>
                <Button
                  type="primary"
                  icon={<SyncOutlined spin={isActive} />}
                  loading={isActive || props.isActionLoading}
                  disabled={!props.config || isActive || props.isActionLoading}
                  onClick={() => void props.onStartCrawl()}
                >
                  {isActive ? 'Crawling...' : 'Start Crawl'}
                </Button>
              </div>
            )}
          </div>

          {props.config && (
            <div className="kb-crawler-schedule" aria-label="Automatic sync schedule">
              <Typography.Text type="secondary">
                Last run: {formatDate(props.config.lastRunAt)}
              </Typography.Text>
              <Typography.Text type="secondary">
                Next scheduled run:{' '}
                {props.config.autoSyncEnabled ? formatDate(props.config.nextRunAt) : 'Disabled'}
              </Typography.Text>
            </div>
          )}
        </Space>
      </Card>

      <Card
        title="Crawler progress"
        extra={<Tag color={jobStatus.color}>Job Status: {jobStatus.label}</Tag>}
      >
        <div aria-live="polite">
          {failedRunError && (
            <Alert
              type="error"
              showIcon
              className="kb-crawler-error"
              message={failedRunError.title}
              description={
                <Space direction="vertical" size={8}>
                  <Typography.Text>{failedRunError.description}</Typography.Text>
                  {showDetails && debugError && (
                    <Typography.Text code className="kb-crawler-error-detail">
                      {debugError}
                    </Typography.Text>
                  )}
                </Space>
              }
              action={
                <Space direction="vertical" size={4}>
                  {props.canManage && props.config && (
                    <Button
                      type="primary"
                      danger
                      icon={<ReloadOutlined />}
                      loading={props.isActionLoading}
                      disabled={isActive || props.isActionLoading}
                      onClick={() => void props.onStartCrawl()}
                    >
                      Retry Crawl
                    </Button>
                  )}
                  {debugError && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setDetailsRunId(showDetails ? null : (run?.id ?? null))}
                    >
                      {showDetails ? 'Hide details' : 'View details'}
                    </Button>
                  )}
                </Space>
              }
            />
          )}

          {run?.errorMessage === 'VECTOR_QUOTA_EXCEEDED' && run.status !== 'failed' && (
            <Alert
              type="warning"
              showIcon
              message="Vector quota reached"
              description="Remaining URLs were skipped."
              className="kb-crawler-error"
            />
          )}

          <CrawlerProgress run={run} isActive={isActive} progressPercent={props.progressPercent} />

          {run && (
            <div className="kb-crawler-metrics">
              <Statistic title="Found" value={run.totalPages} />
              <Statistic title="Processed" value={run.processedPages} />
              <Statistic title="Indexed" value={run.indexedPages} />
              <Statistic title="Unchanged" value={run.unchangedPages} />
              <Statistic title="Skipped" value={run.skippedPages} />
              <Statistic title="Failed URLs" value={run.failedPages + run.quotaExceededPages} />
            </div>
          )}
        </div>
      </Card>

      <Card title="Crawl history and URLs">
        <div className="kb-crawler-history-toolbar">
          <Input.Search
            allowClear
            className="kb-crawler-history-search"
            defaultValue={props.pageSearch}
            placeholder="Search crawled URL"
            aria-label="Search crawled URLs"
            onSearch={props.onSearchPages}
          />
          <Select
            className="kb-crawler-history-run"
            placeholder="Select crawl run"
            aria-label="Select crawl run"
            value={props.selectedRunId ?? undefined}
            options={props.runs.map((historyRun) => ({
              value: historyRun.id,
              label: formatRunLabel(historyRun),
            }))}
            onChange={props.onSelectRun}
          />
          <Select
            allowClear
            className="kb-crawler-history-status"
            placeholder="All statuses"
            aria-label="Filter crawled URLs by status"
            value={props.pageStatusFilter}
            options={ITEM_STATUS_OPTIONS.map((status) => ({
              value: status,
              label: itemStatusLabels[status],
            }))}
            onChange={(value) => props.onStatusFilter(value as CrawlRunItemStatus | undefined)}
          />
          {props.canManage &&
            props.selectedRun &&
            props.selectedRun.failedPages + props.selectedRun.quotaExceededPages > 0 && (
              <Button
                icon={<ReloadOutlined />}
                disabled={isActive}
                onClick={() => void props.onRetryFailed(props.selectedRun!.id)}
              >
                Retry failed URLs
              </Button>
            )}
        </div>

        <Table
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={props.pages}
          loading={props.isLoading}
          scroll={{ x: 900 }}
          pagination={{
            current: props.pagesPage,
            pageSize: props.pagesLimit,
            total: props.pagesTotal,
            showSizeChanger: true,
            onChange: props.onPagesChange,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size={2}>
                    <Typography.Text>No crawled URLs yet</Typography.Text>
                    <Typography.Text type="secondary">
                      Start a crawl to discover and index pages from this website.
                    </Typography.Text>
                  </Space>
                }
              />
            ),
          }}
        />
      </Card>
    </Space>
  );
}
