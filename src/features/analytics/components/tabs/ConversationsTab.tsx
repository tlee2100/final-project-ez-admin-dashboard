import React from 'react';
import type { AnalyticsData } from '@/src/features/analytics/types/analytics.types';

interface ConversationsTabProps {
  data?: AnalyticsData['conversations'];
}

export function ConversationsTab({ data }: ConversationsTabProps) {
  if (!data) return null;

  return (
    <div className="analytics-tab-content analytics-grid-2">
      {/* Top Conversation Topics */}
      <div className="analytics-card">
        <h3 className="analytics-card-title">Top Conversation Topics</h3>
        <div className="horizontal-bar-list">
          {data.topTopics?.map((topic, idx) => (
            <div key={idx} className="horizontal-bar-item">
              <div className="horizontal-bar-header">
                <span className="horizontal-bar-label">{topic.name}</span>
                <div className="horizontal-bar-value">
                  <span>{topic.count} conversations</span>
                  <span className="horizontal-bar-percent">{topic.percentage}%</span>
                </div>
              </div>
              <div className="horizontal-bar-track">
                <div
                  className="horizontal-bar-fill"
                  style={{ width: `${topic.percentage}%`, backgroundColor: '#3b82f6' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation Metrics */}
      <div className="analytics-card">
        <h3 className="analytics-card-title">Conversation Metrics</h3>
        <div className="metrics-list">
          <div className="metric-item">
            <span className="metric-label">Average Conversation Length</span>
            <div className="metric-value-row">
              <span className="metric-value">{data.metrics?.avgLength}</span>
              <span
                className={`metric-trend ${data.metrics?.avgLengthTrend?.includes('↓') ? 'down' : 'up'}`}
              >
                {data.metrics?.avgLengthTrend}
              </span>
            </div>
          </div>

          <div className="metric-item">
            <span className="metric-label">Average Messages per Conversation</span>
            <div className="metric-value-row">
              <span className="metric-value">{data.metrics?.avgMessages}</span>
              <span
                className={`metric-trend ${data.metrics?.avgMessagesTrend?.includes('↓') ? 'down' : 'up'}`}
              >
                {data.metrics?.avgMessagesTrend}
              </span>
            </div>
          </div>

          <div className="metric-item">
            <span className="metric-label">Human Handoff Rate</span>
            <div className="metric-value-row">
              <span className="metric-value">{data.metrics?.humanHandoffRate}</span>
              <span
                className={`metric-trend ${data.metrics?.humanHandoffTrend?.includes('↓') ? 'down' : 'up'}`}
              >
                {data.metrics?.humanHandoffTrend}
              </span>
            </div>
          </div>

          <div className="metric-item">
            <span className="metric-label">First Response Time</span>
            <div className="metric-value-row">
              <span className="metric-value">{data.metrics?.firstResponseTime}</span>
              <span
                className={`metric-trend ${data.metrics?.firstResponseTrend?.includes('↓') ? 'down' : 'up'}`}
              >
                {data.metrics?.firstResponseTrend}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
