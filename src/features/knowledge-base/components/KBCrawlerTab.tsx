import {
  CloseCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  LinkOutlined,
  ReloadOutlined,
  SaveOutlined,
  SyncOutlined,
  DeleteOutlined,
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
  Row,
  Col,
  AutoComplete,
  type TableProps,
} from 'antd';
import { useState } from 'react';
import { List } from '@refinedev/antd';
import { useParams } from 'next/navigation';
import { useCustom, useCustomMutation } from '@refinedev/core';
import { App } from 'antd';
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
  deleteFailedItem?: (runId: string, itemId: string) => Promise<unknown>;
  siteId?: string;
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
  waiting: 'purple',
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
  if (run.status === 'waiting') return { label: 'Waiting', color: statusColors.waiting };
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

  if (run.status === 'waiting') {
    return (
      <Alert
        type="info"
        showIcon
        message="Waiting for current crawl"
        description="This URL will start automatically after the active crawl finishes."
      />
    );
  }

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

function RunPagesTable({
  siteId,
  runId,
  run,
  isActive,
  canManage,
  onRecrawlSource,
  onRetryFailed,
}: {
  siteId: string;
  runId: string;
  run: CrawlRunDto;
  isActive: boolean;
  canManage: boolean;
  onRecrawlSource: (documentId: string) => Promise<unknown>;
  onRetryFailed: (runId: string) => Promise<unknown>;
}) {
  const { message } = App.useApp();
  const [pageSearch, setPageSearch] = useState('');
  const [pageStatusFilter, setPageStatusFilter] = useState<CrawlRunItemStatus | undefined>();
  const [pagesPage, setPagesPage] = useState(1);
  const [pagesLimit, setPagesLimit] = useState(10);

  const { query: pagesQuery } = useCustom<{ data: CrawlRunPageDto[]; total: number }>({
    url: `/sites/${siteId}/kb/crawls/${runId}/pages`,
    method: 'get',
    config: {
      query: {
        page: String(pagesPage),
        limit: String(pagesLimit),
        ...(pageStatusFilter ? { status: pageStatusFilter } : {}),
        ...(pageSearch ? { search: pageSearch } : {}),
      },
    },
    queryOptions: {
      enabled: !!siteId && !!runId,
    },
  });
  const refetchPages = pagesQuery.refetch;

  const { mutateAsync } = useCustomMutation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  const handleDeleteFailed = async (itemId: string) => {
    setIsDeleting(true);
    try {
      await mutateAsync({
        url: `/sites/${siteId}/kb/crawls/${runId}/pages/${itemId}`,
        method: 'delete',
        values: {},
      });
      message.success('Failed URL deleted');
      void refetchPages();
    } catch {
      message.error('Failed to delete URL');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRetryUrl = async (url: string, itemId: string) => {
    setIsRetrying(itemId);
    try {
      await mutateAsync({
        url: `/sites/${siteId}/kb/upload/url`,
        method: 'post',
        values: { url },
      });
      message.success('URL queued for recrawl');
      void refetchPages();
    } catch {
      message.error('Failed to recrawl URL');
    } finally {
      setIsRetrying(null);
    }
  };

  const pages = pagesQuery.data?.data?.data || [];
  const pagesTotal = pagesQuery.data?.data?.total || 0;
  const isLoading = pagesQuery.isLoading;

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
      title: 'Result Details',
      width: 220,
      ellipsis: true,
      render: (_, item) => {
        const errorMsg = getDebugError(item.errorMessage) || item.errorCode;
        if (!errorMsg) return '—';
        const isError = item.status === 'failed' || item.status === 'quota_exceeded';
        return (
          <Tooltip title={errorMsg}>
            <Typography.Text type={isError ? 'danger' : 'secondary'} style={{ fontSize: '13px' }}>
              {isError && <CloseCircleOutlined style={{ marginRight: '6px' }} />}
              {errorMsg}
            </Typography.Text>
          </Tooltip>
        );
      },
    },
    {
      title: 'Action',
      width: 150,
      render: (_, item) => (
        <Space>
          {item.documentId && canManage && (
            <Tooltip title="Recrawl this URL">
              <Button
                size="small"
                icon={<ReloadOutlined />}
                disabled={isActive}
                onClick={() => void onRecrawlSource(item.documentId!)}
              >
                Recrawl
              </Button>
            </Tooltip>
          )}
          {!item.documentId &&
            canManage &&
            (item.status === 'failed' || item.status === 'quota_exceeded') && (
              <Tooltip title="Retry crawling this URL">
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  disabled={isActive}
                  loading={isRetrying === item.id}
                  onClick={() => void handleRetryUrl(item.url, item.id)}
                >
                  Recrawl
                </Button>
              </Tooltip>
            )}
          {canManage && (item.status === 'failed' || item.status === 'quota_exceeded') && (
            <Tooltip title="Delete failed URL">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={isDeleting}
                onClick={() => void handleDeleteFailed(item.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const urlOptions = Array.from(new Set(pages.map((p) => p.url))).map((url) => ({ value: url }));

  return (
    <div style={{ padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
        <AutoComplete
          allowClear
          options={urlOptions}
          style={{ width: 300 }}
          placeholder="Search crawled URL"
          onSelect={(val) => {
            setPageSearch(val);
            setPagesPage(1);
          }}
          onSearch={(val) => {
            setPageSearch(val);
            setPagesPage(1);
          }}
          onChange={(val) => {
            if (!val) {
              setPageSearch('');
              setPagesPage(1);
            }
          }}
        />
        <Select
          allowClear
          style={{ width: 170 }}
          placeholder="All statuses"
          value={pageStatusFilter}
          options={ITEM_STATUS_OPTIONS.map((status) => ({
            value: status,
            label: itemStatusLabels[status],
          }))}
          onChange={(value) => {
            setPageStatusFilter(value as CrawlRunItemStatus | undefined);
            setPagesPage(1);
          }}
        />
        {canManage && run.failedPages + run.quotaExceededPages > 0 && (
          <Button
            icon={<ReloadOutlined />}
            disabled={isActive}
            onClick={() => void onRetryFailed(runId)}
          >
            Retry all failed URLs
          </Button>
        )}
      </div>
      <Table
        className="kb-custom-table"
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={pages}
        loading={isLoading}
        pagination={{
          current: pagesPage,
          pageSize: pagesLimit,
          total: pagesTotal,
          showSizeChanger: true,
          onChange: (page, limit) => {
            setPagesPage(page);
            setPagesLimit(limit);
          },
        }}
      />
    </div>
  );
}

export function KBCrawlerTab(props: KBCrawlerTabProps) {
  const [sitemapUrl, setSitemapUrl] = useState(props.config?.sitemapUrl ?? '');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(props.config?.autoSyncEnabled ?? false);
  const [detailsRunId, setDetailsRunId] = useState<string | null>(null);

  const params = useParams<{ id: string }>();
  const effectiveSiteId = props.siteId || params?.id || '';

  const run = props.activeRun ?? props.selectedRun;
  const isActive = !!props.activeRun && ACTIVE_STATUSES.has(props.activeRun.status);
  const jobStatus = getJobStatus(run);
  const debugError = getDebugError(run?.errorMessage);
  const showDetails = !!run && detailsRunId === run.id;

  const mainColumns: TableProps<CrawlRunDto>['columns'] = [
    {
      title: 'Run',
      key: 'run',
      render: (_, run) => formatRunLabel(run),
    },
    {
      title: 'Found',
      dataIndex: 'totalPages',
      width: 100,
    },
    {
      title: 'Indexed',
      dataIndex: 'indexedPages',
      width: 100,
      render: (val) => <span style={{ color: '#3f8600' }}>{val}</span>,
    },
    {
      title: 'Failed',
      key: 'failedPages',
      width: 100,
      render: (_, run) => {
        const fails = run.failedPages + run.quotaExceededPages;
        if (fails > 0) {
          return <Tag color="error">{fails} Failed</Tag>;
        }
        return <span style={{ color: '#8c8c8c' }}>0</span>;
      },
    },
  ];

  const failedRunError = run?.status === 'failed' ? getFriendlyError(run.errorMessage) : null;
  const statusDescription = !run
    ? 'Ready to discover pages'
    : isActive
      ? 'Your knowledge base is being updated'
      : run.status === 'waiting'
        ? 'Waiting for the current crawl to finish'
        : run.status === 'completed'
          ? 'All discovered pages are up to date'
          : run.status === 'partial_failed'
            ? 'Some pages need your attention'
            : run.status === 'failed'
              ? 'The last crawl needs to be retried'
              : 'Review the latest crawl activity';

  return (
    <Row gutter={[24, 24]} style={{ width: '100%', marginTop: '16px' }}>
      <Col xs={24} lg={16} xl={17}>
        <List
          wrapperProps={{ className: 'kb-crawler-history-card kb-crawler-hover-effect' }}
          title={
            <Typography.Title
              level={4}
              style={{ margin: 0, padding: '4px 12px', fontSize: '20px' }}
            >
              Crawl history and URLs
            </Typography.Title>
          }
        >
          <Table
            className="kb-custom-table"
            rowKey="id"
            size="small"
            columns={mainColumns}
            dataSource={props.runs}
            loading={props.isLoading}
            expandable={{
              expandedRowRender: (record) => (
                <RunPagesTable
                  siteId={effectiveSiteId}
                  runId={record.id}
                  run={record}
                  isActive={isActive}
                  canManage={props.canManage}
                  onRecrawlSource={props.onRecrawlSource}
                  onRetryFailed={props.onRetryFailed}
                />
              ),
              rowExpandable: (record) => record.totalPages > 0,
            }}
            pagination={{
              pageSize: 5,
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Space direction="vertical" size={2}>
                      <Typography.Text>No crawls yet</Typography.Text>
                      <Typography.Text type="secondary">
                        Start a crawl to discover and index pages from this website.
                      </Typography.Text>
                    </Space>
                  }
                />
              ),
            }}
          />
        </List>
      </Col>

      <Col xs={24} lg={8} xl={7}>
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <Alert
            type={run?.status === 'failed' ? 'error' : isActive ? 'info' : 'success'}
            showIcon
            icon={isActive ? <SyncOutlined spin /> : <GlobalOutlined />}
            message={statusDescription}
            description={run ? `Job Status: ${jobStatus.label}` : 'Ready to configure'}
            style={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
          />

          <Card
            className="kb-crawler-config-card kb-crawler-hover-effect"
            title={
              <Space>
                <LinkOutlined /> Source &amp; sync settings
              </Space>
            }
            extra={
              props.canManage && !props.config ? (
                <Button type="primary" size="small" onClick={props.onAddSitemapClick}>
                  Add URL
                </Button>
              ) : null
            }
            loading={props.isLoading}
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div className="kb-crawler-url-field">
                <label htmlFor="crawler-url">
                  <Typography.Text strong>Website or Sitemap URL</Typography.Text>
                </label>
                <Input
                  id="crawler-url"
                  prefix={<GlobalOutlined />}
                  value={sitemapUrl}
                  disabled={!props.canManage}
                  placeholder="https://example.com"
                  aria-describedby="crawler-url-help"
                  onChange={(event) => setSitemapUrl(event.target.value)}
                />
                <Typography.Text
                  id="crawler-url-help"
                  type="secondary"
                  style={{ fontSize: '12px' }}
                >
                  Sitemap indexes and compressed sitemaps supported.
                </Typography.Text>
              </div>

              <div className="kb-crawler-auto-sync" style={{ margin: '8px 0' }}>
                <Switch
                  checked={autoSyncEnabled}
                  disabled={!props.canManage}
                  aria-label="Automatic sync every 7 days"
                  onChange={setAutoSyncEnabled}
                />
                <Typography.Text>Auto sync every 7 days</Typography.Text>
              </div>

              {props.canManage && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Button
                    type="primary"
                    icon={<SyncOutlined spin={isActive} />}
                    loading={isActive || props.isActionLoading}
                    disabled={!props.config || isActive || props.isActionLoading}
                    onClick={() => void props.onStartCrawl()}
                    style={{ width: '100%' }}
                  >
                    {isActive ? 'Crawling...' : 'Start Crawl'}
                  </Button>
                  <Button
                    icon={<SaveOutlined />}
                    loading={props.isActionLoading && !isActive}
                    disabled={!sitemapUrl.trim() || props.isActionLoading}
                    onClick={() => void props.onSaveConfig(sitemapUrl.trim(), autoSyncEnabled)}
                    style={{ width: '100%' }}
                  >
                    Save configuration
                  </Button>
                </div>
              )}

              {props.config && (
                <div style={{ fontSize: '12px', marginTop: '8px', color: '#6b7280' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <ClockCircleOutlined /> Last run: {formatDate(props.config.lastRunAt)}
                  </div>
                  <div
                    style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}
                  >
                    <SyncOutlined /> Next:{' '}
                    {props.config.autoSyncEnabled ? formatDate(props.config.nextRunAt) : 'Disabled'}
                  </div>
                </div>
              )}
            </Space>
          </Card>

          <Card
            className="kb-crawler-progress-card kb-crawler-hover-effect"
            title="Crawler Progress"
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
                          size="small"
                          icon={<ReloadOutlined />}
                          loading={props.isActionLoading}
                          disabled={isActive || props.isActionLoading}
                          onClick={() => void props.onStartCrawl()}
                        >
                          Retry
                        </Button>
                      )}
                      {debugError && (
                        <Button
                          type="link"
                          size="small"
                          onClick={() => setDetailsRunId(showDetails ? null : (run?.id ?? null))}
                        >
                          {showDetails ? 'Hide' : 'View'}
                        </Button>
                      )}
                    </Space>
                  }
                  style={{ marginBottom: '16px' }}
                />
              )}

              {run?.errorMessage === 'VECTOR_QUOTA_EXCEEDED' && run.status !== 'failed' && (
                <Alert
                  type="warning"
                  showIcon
                  message="Vector quota reached"
                  style={{ marginBottom: '16px' }}
                />
              )}

              <CrawlerProgress
                run={run}
                isActive={isActive}
                progressPercent={props.progressPercent}
              />

              {run && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginTop: '20px',
                  }}
                >
                  <Statistic
                    title="Found"
                    value={run.totalPages}
                    valueStyle={{ fontSize: '18px' }}
                  />
                  <Statistic
                    title="Indexed"
                    value={run.indexedPages}
                    valueStyle={{ fontSize: '18px', color: '#3f8600' }}
                  />
                  <Statistic
                    title="Failed"
                    value={run.failedPages + run.quotaExceededPages}
                    valueStyle={{ fontSize: '18px', color: '#cf1322' }}
                  />
                  <Statistic
                    title="Skipped"
                    value={run.skippedPages}
                    valueStyle={{ fontSize: '18px' }}
                  />
                </div>
              )}
            </div>
          </Card>
        </Space>
      </Col>
    </Row>
  );
}
