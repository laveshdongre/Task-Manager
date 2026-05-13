import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, BarChart3, FolderOpen } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, isValid } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color} />
      </div>
    </div>
    <div>
      <p style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>}
    </div>
  </div>
);

const PRIORITY_COLORS = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#6b7280' };
const STATUS_COLORS = { todo: '#6b7280', 'in-progress': '#3b82f6', review: '#f59e0b', done: '#10b981' };

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
      <p style={{ fontWeight: 600 }}>{payload[0].name}: {payload[0].value}</p>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboardAPI.get()
      .then(r => { setData(r.data); setLoading(false); })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load dashboard.');
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div className="spinner" />
    </div>
  );

  if (error) return (
    <div className="empty-state" style={{ padding: '80px 0' }}>
      <AlertTriangle size={40} color="var(--red)" style={{ opacity: 0.7 }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{error}</p>
      <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  const { stats, recentTasks = [], overdueTasks = [], projects = [] } = data || {};

  const statusData = stats ? [
    { name: 'To Do', value: stats.statusCounts.todo, color: STATUS_COLORS.todo },
    { name: 'In Progress', value: stats.statusCounts['in-progress'], color: STATUS_COLORS['in-progress'] },
    { name: 'Review', value: stats.statusCounts.review, color: STATUS_COLORS.review },
    { name: 'Done', value: stats.statusCounts.done, color: STATUS_COLORS.done },
  ].filter(d => d.value > 0) : [];

  const priorityData = stats ? [
    { name: 'Critical', value: stats.priorityCounts.critical, fill: PRIORITY_COLORS.critical },
    { name: 'High', value: stats.priorityCounts.high, fill: PRIORITY_COLORS.high },
    { name: 'Medium', value: stats.priorityCounts.medium, fill: PRIORITY_COLORS.medium },
    { name: 'Low', value: stats.priorityCounts.low, fill: PRIORITY_COLORS.low },
  ] : [];

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 30, fontFamily: 'var(--font-display)' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          <span style={{ color: 'var(--accent-light)' }}>{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>Here's what's happening with your tasks today.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon={FolderOpen} label="Projects" value={stats?.totalProjects || 0} color="var(--accent-light)" sub="Active workspaces" />
        <StatCard icon={BarChart3} label="My Tasks" value={stats?.totalTasks || 0} color="var(--blue)" sub="Assigned to you" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats?.completed || 0} color="var(--green)" sub="All time" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdue || 0} color="var(--red)" sub="Need attention" />
        <StatCard icon={Clock} label="Due Today" value={stats?.dueToday || 0} color="var(--yellow)" sub="Today's deadlines" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
        {/* Status donut */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 20 }}>Task Status</h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                {statusData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No tasks yet</p>}
        </div>

        {/* Priority bar */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 20 }}>Tasks by Priority</h3>
          {priorityData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px 0' }}>No tasks yet</p>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Overdue tasks */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color="var(--red)" />
              Overdue Tasks
            </h3>
            <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, background: 'var(--red-soft)', padding: '2px 8px', borderRadius: 20 }}>{overdueTasks.length}</span>
          </div>
          {overdueTasks.length > 0 ? overdueTasks.map(t => (
            <div key={t._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
              <p style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--red)' }}>
                  Due {t.dueDate && isValid(new Date(t.dueDate)) ? format(new Date(t.dueDate), 'MMM d') : 'N/A'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>•</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.project?.name}</span>
              </div>
            </div>
          )) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <CheckCircle2 size={32} color="var(--green)" style={{ opacity: 0.5 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No overdue tasks 🎉</p>
            </div>
          )}
        </div>

        {/* Recent tasks */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 16 }}>Recent Tasks</h3>
          {recentTasks.length > 0 ? recentTasks.slice(0, 6).map(t => (
            <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[t.status] || '#666', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.project?.name}</p>
              </div>
              <span className={`badge badge-${t.status}`} style={{ flexShrink: 0 }}>
                {t.status === 'in-progress' ? 'In Progress' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
              </span>
            </div>
          )) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p style={{ fontSize: 13 }}>No tasks assigned yet</p>
            </div>
          )}
          <Link to="/projects" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 500 }}>
            View all projects →
          </Link>
        </div>
      </div>
    </div>
  );
}
