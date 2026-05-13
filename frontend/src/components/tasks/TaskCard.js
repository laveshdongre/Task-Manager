import React, { useState } from 'react';
import { Calendar, Tag, MessageSquare, Trash2 } from 'lucide-react';
import { tasksAPI } from '../../utils/api';
import { format, isValid, isPast } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['todo', 'in-progress', 'review', 'done'];
const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };
const STATUS_COLORS = { todo: '#6b7280', 'in-progress': '#3b82f6', review: '#f59e0b', done: '#10b981' };
const PRIORITY_COLORS = { low: '#6b7280', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };

function Avatar({ user, size = 28 }) {
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div title={user?.name} style={{
      width: size, height: size, borderRadius: '50%', background: 'var(--accent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>{initials}</div>
  );
}

export default function TaskCard({ task, onUpdate, onDelete, members, role, currentUserId }) {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOverdue = task.dueDate && task.status !== 'done' && isPast(new Date(task.dueDate));
  const canEdit = role === 'admin' || task.createdBy?._id === currentUserId;

  const handleStatusChange = async (status) => {
    try {
      const { data } = await tasksAPI.update(task.project, task._id, { status });
      onUpdate(data.task);
    } catch { toast.error('Failed to update status.'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(task.project, task._id);
      onDelete(task._id);
      toast.success('Task deleted.');
    } catch { toast.error('Failed to delete task.'); }
  };

  const handleAssign = async (userId) => {
    try {
      const { data } = await tasksAPI.update(task.project, task._id, { assignedTo: userId || null });
      onUpdate(data.task);
    } catch { toast.error('Failed to assign task.'); }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await tasksAPI.addComment(task.project, task._id, comment.trim());
      onUpdate({ ...task, comments: data.comments });
      setComment('');
    } catch { toast.error('Failed to add comment.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="card" style={{ borderLeft: `3px solid ${PRIORITY_COLORS[task.priority] || '#666'}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, marginBottom: 8 }}>{task.title}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
            {task.dueDate && isValid(new Date(task.dueDate)) && (
              <span style={{ fontSize: 11, color: isOverdue ? 'var(--red)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Calendar size={10} />
                {format(new Date(task.dueDate), 'MMM d')}
                {isOverdue && ' (overdue)'}
              </span>
            )}
          </div>
        </div>
        {task.assignedTo && <Avatar user={task.assignedTo} size={26} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <select
          value={task.status}
          onChange={e => handleStatusChange(e.target.value)}
          style={{
            background: STATUS_COLORS[task.status] + '22',
            border: `1px solid ${STATUS_COLORS[task.status]}44`,
            color: STATUS_COLORS[task.status],
            borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none',
          }}
        >
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setExpanded(e => !e)}>
            <MessageSquare size={13} />
            {task.comments?.length > 0 && <span style={{ fontSize: 10, color: 'var(--accent-light)' }}>{task.comments.length}</span>}
          </button>
          {canEdit && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={handleDelete} style={{ color: 'var(--text-muted)' }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
          {task.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{task.description}</p>}
          {canEdit && (
            <div style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ marginBottom: 6 }}>Assign to</label>
              <select className="input" value={task.assignedTo?._id || ''} onChange={e => handleAssign(e.target.value || null)}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
              </select>
            </div>
          )}
          {task.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {task.tags.map(t => (
                <span key={t} style={{ fontSize: 11, background: 'var(--accent-soft)', color: 'var(--accent-light)', padding: '2px 8px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tag size={9} />{t}
                </span>
              ))}
            </div>
          )}
          <div>
            {task.comments?.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <Avatar user={c.user} size={22} />
                <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-light)', marginBottom: 3 }}>{c.user?.name}</p>
                  <p style={{ fontSize: 13 }}>{c.text}</p>
                </div>
              </div>
            ))}
            <form onSubmit={addComment} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input className="input" placeholder="Add a comment..." value={comment}
                onChange={e => setComment(e.target.value)} style={{ fontSize: 13, padding: '8px 12px' }} />
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || !comment.trim()}>
                {submitting ? <span className="spinner spinner-sm" /> : 'Post'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
