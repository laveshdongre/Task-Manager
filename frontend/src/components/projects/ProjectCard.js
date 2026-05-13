import React from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Users, Calendar, Trash2 } from 'lucide-react';
import { projectsAPI } from '../../utils/api';
import { format, isValid } from 'date-fns';
import toast from 'react-hot-toast';

export default function ProjectCard({ project, currentUserId, onDelete }) {
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
      <div
        className="card"
        style={{ cursor: 'pointer', transition: 'all 0.18s ease', position: 'relative', overflow: 'hidden', borderLeft: `4px solid ${project.color || 'var(--accent)'}` }}
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
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={handleDelete}
              style={{ color: 'var(--text-muted)', opacity: 0, transition: 'opacity 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'var(--red)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = 0; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
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
