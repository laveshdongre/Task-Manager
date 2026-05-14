import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, Users, Calendar, Trash2, X, Palette } from 'lucide-react';
import { projectsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, isValid } from 'date-fns';
import toast from 'react-hot-toast';

const PROJECT_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6'];

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#7c3aed', dueDate: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name is required.');
    setLoading(true);
    try {
      const { data } = await projectsAPI.create(form);
      onCreated(data.project);
      toast.success('Project created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="input" placeholder="e.g. Website Redesign" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input" placeholder="What's this project about?" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Palette size={14} /> Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PROJECT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                    outline: form.color === c ? `3px solid ${c}` : '3px solid transparent',
                    outlineOffset: 2, transition: 'outline 0.15s',
                  }} />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className="input" value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectCard({ project, currentUserId, onDelete }) {
  const isOwner = project.owner?._id === currentUserId;
  const myMember = project.members?.find(m => m.user?._id === currentUserId);
  const isAdmin = myMember?.role === 'admin';

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await projectsAPI.delete(project._id);
      onDelete(project._id);
      toast.success('Project deleted.');
    } catch {
      toast.error('Failed to delete project.');
    }
  };

  return (
    <Link to={`/projects/${project._id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{
        cursor: 'pointer', transition: 'all 0.18s ease', position: 'relative', overflow: 'hidden',
        borderLeft: `4px solid ${project.color || 'var(--accent)'}`,
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: project.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderOpen size={18} color={project.color} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{project.name}</h3>
              <span className={`badge badge-${myMember?.role || 'member'}`} style={{ marginTop: 2 }}>
                {myMember?.role || 'member'}
              </span>
            </div>
          </div>
          {isAdmin && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={handleDelete}
              style={{ color: 'var(--text-muted)', opacity: 0, transition: 'opacity 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'var(--red)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = 0; e.currentTarget.style.color = 'var(--text-muted)'; }}>
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {project.description && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Users size={13} />
            <span>{project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}</span>
          </div>
          {project.dueDate && isValid(new Date(project.dueDate)) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={13} />
              <span>{format(new Date(project.dueDate), 'MMM d, yyyy')}</span>
            </div>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <span className={`badge badge-${project.status}`}>{project.status}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    projectsAPI.getAll().then(r => { setProjects(r.data.projects); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)' }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{projects.length} workspace{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <FolderOpen size={52} />
          <h3>No projects yet</h3>
          <p style={{ fontSize: 14 }}>Create your first project to start tracking tasks.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Create Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <ProjectCard key={p._id} project={p} currentUserId={user?._id}
              onDelete={id => setProjects(ps => ps.filter(x => x._id !== id))} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={p => setProjects(ps => [p, ...ps])}
        />
      )}
    </div>
  );
}
