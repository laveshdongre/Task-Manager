import React from 'react';
import ReactDOM from 'react-dom';
import StatusBadge from './StatusBadge';

export default function MemberModal({ member, onClose }) {
  // Render modal using portal to ensure overlay covers viewport
  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2 className="modal-title">Member Details</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>&times;</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', marginTop: 12 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
            {member.avatar ? <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : (member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?')}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{member.name}</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{member.email}</div>
            <StatusBadge status={member.status} role={member.role} />
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div><b>Role:</b> {member.role}</div>
            <div><b>Projects:</b> {member.projects?.map(p => p.name).join(', ') || 'None'}</div>
            <div><b>Active Tasks:</b> {member.activeTasks || 0}</div>
            <div><b>Joined:</b> {new Date(member.createdAt).toLocaleDateString()}</div>
            <div><b>Last Active:</b> {member.lastSeen ? new Date(member.lastSeen).toLocaleString() : 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
