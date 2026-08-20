import React from 'react';
import { Select } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { BookingConfig } from '../types/booking.types';

interface BookingHeaderProps {
  sites: { id: string; name: string }[];
  activeSiteId: string | null;
  onSelectSite: (siteId: string) => void;
  isAdmin: boolean;
  config: BookingConfig | null;
}

export function BookingHeader({
  sites,
  activeSiteId,
  onSelectSite,
  isAdmin,
  config,
}: BookingHeaderProps) {
  const router = useRouter();
  const activeSite = sites.find((s) => s.id === activeSiteId);

  return (
    <div>
      {/* Top Bar */}
      <div className="bookings-header">
        <div>
          <h1 className="bookings-title">Bookings</h1>
          <p className="bookings-subtitle">
            Day calendar, list search, and walk-in booking for your sites
          </p>
        </div>
        <div className="bookings-header-actions">
          <Select
            value={activeSiteId}
            onChange={onSelectSite}
            style={{ width: 220 }}
            options={sites.map((s) => ({ label: `🌐 ${s.name}`, value: s.id }))}
          />
          {isAdmin && activeSiteId && (
            <button
              className="site-settings-btn"
              onClick={() => router.push(`/sites/${activeSiteId}`)}
            >
              <SettingOutlined /> Site settings
            </button>
          )}
        </div>
      </div>

      {/* Meta Chips */}
      {config && (
        <div className="bookings-meta">
          <span className={`meta-chip ${config.bookingEnabled ? 'enabled' : 'gray'}`}>
            🗓 Booking {config.bookingEnabled ? 'enabled' : 'disabled'}
          </span>
          <span className="meta-chip gray">{activeSite?.name}</span>
          <span className="meta-chip purple">{config.timezone}</span>
          <span className="meta-chip gray">
            {config.resourceDetails?.length || 0} staff · {config.serviceDetails?.length || 0}{' '}
            services
          </span>
        </div>
      )}
    </div>
  );
}
