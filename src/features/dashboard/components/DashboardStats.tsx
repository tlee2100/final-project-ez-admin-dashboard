'use client';

import React from 'react';
import { StatCard } from '@/src/components/ui/StatCard/StatCard';
import type { StatCardData } from '../types/dashboard.types';

interface DashboardStatsProps {
  stats: StatCardData[];
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="dashboard-stats-grid" role="region" aria-label="Key metrics">
      {stats.map((stat) => (
        <StatCard key={stat.id} data={stat} />
      ))}
    </div>
  );
}
