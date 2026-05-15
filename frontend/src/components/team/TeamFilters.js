import React from 'react';

export default function TeamFilters({ filters, setFilters }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        className="input"
        style={{ minWidth: 180 }}
        placeholder="Search name or email"
        value={filters.search}
        onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
      />
      <select className="input" value={filters.role} onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}>
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="manager">Manager</option>
        <option value="member">Member</option>
      </select>
      <select className="input" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="busy">Busy</option>
        <option value="in-meeting">In Meeting</option>
        <option value="away">Away</option>
        <option value="offline">Offline</option>
      </select>
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
        <input type="checkbox" checked={filters.active} onChange={e => setFilters(f => ({ ...f, active: e.target.checked }))} />
        Active only
      </label>
    </div>
  );
}
