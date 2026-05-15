import React from 'react';

const STATUS_COLORS = {
  active: '#22c55e',
  busy: '#ef4444',
  'in-meeting': '#f59e0b',
  away: '#eab308',
  offline: '#6b7280',
  admin: '#6366f1',
  member: '#0ea5e9',
  manager: '#f43f5e',
};

export default function StatusBadge({ status, role }) {
  // Prefer status if present and valid, else fallback to role
  let display = status;
  let colorKey = status;
  if (!status || !STATUS_COLORS[status]) {
    display = role;
    colorKey = role;
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
      color: STATUS_COLORS[colorKey] || '#6b7280',
      background: (STATUS_COLORS[colorKey] || '#6b7280') + '22',
      borderRadius: 8, padding: '2px 10px',
      minWidth: 60, justifyContent: 'center',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[colorKey] || '#6b7280', display: 'inline-block' }} />
      {display ? (display.charAt(0).toUpperCase() + display.slice(1)) : 'Unknown'}
    </span>
  );
}
