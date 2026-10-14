'use client';

import React from 'react';

export function SubTabBooking() {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: '#f9fafb',
        borderRadius: 12,
        border: '1px dashed #d1d5db',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>🚧</div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 6px 0' }}>
        Booking Configuration
      </h3>
      <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
        Phần này sẽ được hiện thực sau bởi thành viên khác trong team.
      </p>
    </div>
  );
}
