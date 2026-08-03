import React from 'react';
import type { AnalyticsData } from '@/src/features/analytics/types/analytics.types';

interface PerformanceTabProps {
  data: AnalyticsData['performance'];
}

export function PerformanceTab({ data }: PerformanceTabProps) {
  return (
    <div className="analytics-tab-content analytics-grid-2">
      {/* Knowledge Base Performance */}
      <div className="analytics-card">
        <h3 className="analytics-card-title">Knowledge Base Performance</h3>
        <div className="metrics-list">
          <div className="metric-item">
            <span className="metric-label">KB Query Success Rate</span>
            <div className="metric-value-row">
              <span className="metric-value">{data.kb.querySuccessRate}</span>
              <span
                className={`metric-trend ${data.kb.querySuccessTrend.includes('↓') ? 'down' : 'up'}`}
              >
                {data.kb.querySuccessTrend}
              </span>
            </div>
            <span className="metric-label mt-1">
              Percentage of queries where relevant information was found in the KB
            </span>
          </div>

          <div className="metric-item">
            <span className="metric-label">Average KB Retrieval Time</span>
            <div className="metric-value-row">
              <span className="metric-value">{data.kb.avgRetrievalTime}</span>
              <span
                className={`metric-trend ${data.kb.avgRetrievalTrend.includes('↓') ? 'down' : 'up'}`}
              >
                {data.kb.avgRetrievalTrend}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <span className="metric-label">Top Performing KB Documents</span>
          <div className="simple-list">
            {data.kb.topDocuments.map((doc, idx) => (
              <div key={idx} className="simple-list-item">
                <span className="simple-list-label">{doc.name}</span>
                <span className="simple-list-value">{doc.hits} hits</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Model Performance */}
      <div className="analytics-card">
        <h3 className="analytics-card-title">Model Performance</h3>
        <div className="metrics-list">
          <div className="metric-item">
            <span className="metric-label">Average Response Generation Time</span>
            <div className="metric-value-row">
              <span className="metric-value">{data.model.avgGenerationTime}</span>
              <span
                className={`metric-trend ${data.model.avgGenerationTrend.includes('↓') ? 'down' : 'up'}`}
              >
                {data.model.avgGenerationTrend}
              </span>
            </div>
          </div>

          <div className="metric-item">
            <span className="metric-label">Intent Detection Accuracy</span>
            <div className="metric-value-row">
              <span className="metric-value">{data.model.intentAccuracy}</span>
              <span
                className={`metric-trend ${data.model.intentAccuracyTrend.includes('↓') ? 'down' : 'up'}`}
              >
                {data.model.intentAccuracyTrend}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <span className="metric-label">Top Unhandled Intents</span>
          <div className="simple-list">
            {data.model.topUnhandledIntents.map((intent, idx) => (
              <div key={idx} className="simple-list-item">
                <span className="simple-list-label">{intent.name}</span>
                <span className="simple-list-value">{intent.occurrences} occurrences</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
