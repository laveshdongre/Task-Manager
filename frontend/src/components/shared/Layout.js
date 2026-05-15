import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, LogOut, Menu, X, User, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NavItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 14px', borderRadius: 'var(--radius)',
      color: isActive ? '#fff' : 'var(--text-secondary)',
      background: isActive ? 'var(--accent)' : 'transparent',
      fontWeight: isActive ? 600 : 400,
      fontSize: 14, textDecoration: 'none',
      transition: 'all 0.15s ease',
      boxShadow: isActive ? '0 0 20px var(--accent-glow)' : 'none',
    })}
    onMouseEnter={(e) => {
      if (!e.currentTarget.style.background.includes('var(--accent)')) {
        e.currentTarget.style.background = 'var(--bg-hover)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }
    }}
    onMouseLeave={(e) => {
      if (!e.currentTarget.style.background.includes('var(--accent)')) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }
    }}
  >
    <Icon size={18} />
    {label}
  </NavLink>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';


  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 16px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, paddingLeft: 4 }}>
        <div style={{
          width: 34, height: 34, background: 'var(--accent)', borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px var(--accent-glow)',
        }}>
          <Zap size={18} color="#fff" fill="#fff" />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>
          TaskNest
        </span>
      </div>

      {/* Theme Toggle (top right for desktop, mobile) */}
      <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 100 }}>
        <button
          aria-label="Toggle theme"
          onClick={toggleTheme}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            borderRadius: '50%', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', fontSize: 22
          }}
        >
          {theme === 'dark' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 6.95-1.41-1.41M6.46 6.46 5.05 5.05m12.02 0-1.41 1.41M6.46 17.54l-1.41 1.41"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>
          )}
        </button>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', paddingLeft: 14, marginBottom: 8 }}>
          Navigation
        </p>
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setMobileOpen(false)} />
        <NavItem to="/projects" icon={FolderOpen} label="Projects" onClick={() => setMobileOpen(false)} />
      </nav>

      {/* User section */}
      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderRadius: 'var(--radius)',
          marginBottom: 8,
        }}>
          <div className="avatar" style={{ background: 'var(--accent)' }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: 13, truncate: true }}>{user?.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-secondary)' }}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  // Main return for Layout component
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-light)',
        display: 'flex', flexDirection: 'column',
      }} className="hide-mobile">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        >
          <aside
            style={{ width: 260, height: '100%', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile topbar */}
        <div style={{
          display: 'none', padding: '16px 20px',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--bg-secondary)',
          alignItems: 'center', justifyContent: 'space-between',
        }} className="mobile-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>TaskNest</span>
          </div>
          {/* Theme toggle for mobile topbar */}
          <button
            aria-label="Toggle theme"
            onClick={toggleTheme}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              borderRadius: '50%', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', fontSize: 22
            }}
          >
            {theme === 'dark' ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 6.95-1.41-1.41M6.46 6.46 5.05 5.05m12.02 0-1.41 1.41M6.46 17.54l-1.41 1.41"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>
            )}
          </button>
          <button className="btn btn-ghost btn-icon" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
        </div>

        <main style={{ flex: 1, padding: '32px', maxWidth: 1200, width: '100%', margin: '0 auto' }} className="page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
