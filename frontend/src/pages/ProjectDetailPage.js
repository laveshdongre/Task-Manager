import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, X, ArrowLeft, Users, Trash2,
  UserPlus, Calendar, Tag, MessageSquare
} from 'lucide-react';
import { projectsAPI, tasksAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, isValid, isPast } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['todo', 'in-progress', 'review', 'done'];
const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };
const STATUS_COLORS = { todo: '#6b7280', 'in-progress': '#3b82f6', review: '#f59e0b', done: '#10b981' };
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const PRIORITY_COLORS = { low: '#6b7280', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };

function Avatar({ user, size = 28 }) {
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div title={user?.name} style={{
      width: size, height: size, borderRadius: '50%', background: 'var(--accent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0,
      fontFamily: 'var(--font-display)',
    }}>{initials}</div>
  );
}

function TaskCard({ task, onUpdate, onDelete, members, role, currentUserId }) {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOverdue = task.dueDate && task.status !== 'done' && isPast(new Date(task.dueDate));
  const canEdit = role === 'admin' || task.createdBy?._id === currentUserId;
  const isAssignee = task.assignedTo?._id === currentUserId;

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
    <div className="card" style={{
      cursor: 'default', borderLeft: `3px solid ${PRIORITY_COLORS[task.priority] || '#666'}`,
      transition: 'box-shadow 0.15s',
    }}>
      {/* Card header */}
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

      {/* Status + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <select
          value={task.status}
          onChange={e => handleStatusChange(e.target.value)}
          style={{
            background: STATUS_COLORS[task.status] + '22',
            border: `1px solid ${STATUS_COLORS[task.status]}44`,
            color: STATUS_COLORS[task.status],
            borderRadius: 20, padding: '3px 10px', fontSize: 11,
            fontWeight: 600, cursor: 'pointer', outline: 'none',
          }}
        >
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setExpanded(e => !e)} title="Comments">
            <MessageSquare size={13} />
            {task.comments?.length > 0 && <span style={{ fontSize: 10, color: 'var(--accent-light)' }}>{task.comments.length}</span>}
          </button>
          {canEdit && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={handleDelete}
              style={{ color: 'var(--text-muted)' }} title="Delete">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
          {task.description && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{task.description}</p>
          )}

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

          {/* Comments */}
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

function CreateTaskModal({ projectId, members, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', assignedTo: '', dueDate: '', tags: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Task title is required.');
    setLoading(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.dueDate) delete payload.dueDate;
      const { data } = await tasksAPI.create(projectId, payload);
      onCreated(data.task);
      toast.success('Task created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Task</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="input" placeholder="What needs to be done?" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input" placeholder="Add details..." value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select className="input" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="input" value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input className="input" placeholder="frontend, bug, urgent" value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MembersModal({ project, onClose, onUpdate, role }) {
  const [email, setEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const invite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { data } = await projectsAPI.addMember(project._id, { email: email.trim(), role: memberRole });
      onUpdate({ ...project, members: data.members });
      setEmail('');
      toast.success('Member added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member.');
    } finally { setLoading(false); }
  };

  const removeMember = async (userId) => {
    try {
      await projectsAPI.removeMember(project._id, userId);
      onUpdate({ ...project, members: project.members.filter(m => m.user._id !== userId) });
      toast.success('Member removed.');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to remove member.'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Team Members</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {role === 'admin' && (
          <form onSubmit={invite} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input className="input" placeholder="member@email.com" type="email" value={email}
              onChange={e => setEmail(e.target.value)} />
            <select className="input" style={{ width: 110 }} value={memberRole} onChange={e => setMemberRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading} style={{ flexShrink: 0 }}>
              {loading ? <span className="spinner spinner-sm" /> : <UserPlus size={15} />}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {project.members?.map(m => (
            <div key={m.user._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)' }}>
              <Avatar user={m.user} size={34} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{m.user.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.user.email}</p>
              </div>
              <span className={`badge badge-${m.role}`}>{m.role}</span>
              {role === 'admin' && m.user._id !== project.owner._id && (
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeMember(m.user._id)}
                  style={{ color: 'var(--text-muted)' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('member');
  const [showCreate, setShowCreate] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([projectsAPI.getOne(id), tasksAPI.getAll(id)]);
      setProject(pRes.data.project);
      setRole(pRes.data.role);
      setTasks(tRes.data.tasks);
    } catch { navigate('/projects'); }
    finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const filteredTasks = tasks.filter(t => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'mine') return t.assignedTo?._id === user?._id;
    return t.priority === activeFilter;
  });

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = filteredTasks.filter(t => t.status === s);
    return acc;
  }, {});

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;
  if (!project) return null;

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: 16, color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} /> Back to Projects
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: (project.color || 'var(--accent)') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: project.color || 'var(--accent)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontFamily: 'var(--font-display)' }}>{project.name}</h1>
              {project.description && <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>{project.description}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowMembers(true)}>
              <Users size={14} /> {project.members?.length} Members
            </button>
            {/* All project members can create tasks */}
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Add Task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `All (${tasks.length})` },
            { key: 'mine', label: 'Assigned to me' },
            { key: 'critical', label: 'Critical' },
            { key: 'high', label: 'High' },
          ].map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              className="btn btn-sm"
              style={{
                background: activeFilter === f.key ? 'var(--accent)' : 'var(--bg-elevated)',
                color: activeFilter === f.key ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${activeFilter === f.key ? 'var(--accent)' : 'var(--border)'}`,
                boxShadow: activeFilter === f.key ? '0 0 12px var(--accent-glow)' : 'none',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, overflowX: 'auto' }}>
        {STATUSES.map(status => (
          <div key={status}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status] }} />
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
                  {STATUS_LABELS[status]}
                </span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 12 }}>
                {tasksByStatus[status].length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 60 }}>
              {tasksByStatus[status].map(task => (
                <TaskCard key={task._id} task={task} role={role} members={project.members || []}
                  currentUserId={user?._id}
                  onUpdate={updated => setTasks(ts => ts.map(t => t._id === updated._id ? updated : t))}
                  onDelete={taskId => setTasks(ts => ts.filter(t => t._id !== taskId))}
                />
              ))}
              {tasksByStatus[status].length === 0 && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, border: '2px dashed var(--border-light)', borderRadius: 'var(--radius)', opacity: 0.6 }}>
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateTaskModal
          projectId={id}
          members={project.members || []}
          onClose={() => setShowCreate(false)}
          onCreated={task => setTasks(ts => [task, ...ts])}
        />
      )}

      {showMembers && (
        <MembersModal
          project={project}
          role={role}
          onClose={() => setShowMembers(false)}
          onUpdate={setProject}
        />
      )}
    </div>
  );
}
