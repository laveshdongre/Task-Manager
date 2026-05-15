import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import MemberModal from './MemberModal';

export default function MemberCard({ member }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="card"
      style={{
        padding: '18px 14px',
        borderRadius: 16,
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        cursor: 'pointer',
        position: 'relative',
        minWidth: 0,
        background: 'var(--bg-card)',
        transition: 'box-shadow 0.2s',
      }}
      onClick={() => setOpen(true)}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 700,
            color: '#fff',
            fontFamily: 'var(--font-display)',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.email}</div>
        </div>
        <StatusBadge status={member.status} role={member.role} />
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          fontSize: 13,
          color: 'var(--text-muted)',
          marginTop: 2,
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{member.role}</span>
        <span>Projects: {member.projectCount || 0}</span>
        <span>Active tasks: {member.activeTasks || 0}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        Joined: {new Date(member.createdAt).toLocaleDateString()}
      </div>
      {open && <MemberModal member={member} onClose={() => setOpen(false)} />}
      <style>{`
        @media (max-width: 600px) {
          .card {
            padding: 12px 6px !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
