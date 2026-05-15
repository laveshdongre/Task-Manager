import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields.');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'fixed', top: '-30%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '40px 36px',
        width: '100%', maxWidth: 420, animation: 'slideUp 0.3s ease',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, background: 'var(--accent)', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px var(--accent-glow)',
          }}>
            <Zap size={22} color="#fff" fill="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>TaskNest</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Team Task Manager</p>
          </div>
        </div>

        <h2 style={{ fontSize: 26, fontFamily: 'var(--font-display)', marginBottom: 6 }}>Welcome back</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Sign in to your workspace</p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="email" name="email" className="input"
                style={{ paddingLeft: 38 }}
                placeholder="you@example.com"
                value={form.email} onChange={handle}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type={showPw ? 'text' : 'password'} name="password" className="input"
                style={{ paddingLeft: 38, paddingRight: 38 }}
                placeholder="Your password"
                value={form.password} onChange={handle}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: 4, padding: '13px 20px', fontSize: 15 }}>
            {loading ? <span className="spinner spinner-sm" /> : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Access */}
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 1.2, marginBottom: 10 }}>
            QUICK DEMO ACCESS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              {
                title: 'Admin demo',
                email: 'demo-admin@taskflow.test',
                password: 'DemoSeed123!',
                desc: 'Full admin access, project controls, and role management.',
              },
              {
                title: 'Member demo',
                email: 'demo-member@taskflow.test',
                password: 'DemoSeed123!',
                desc: 'Member-level experience focused on execution and task updates.',
              },
            ].map(({ title, email, password, desc }) => (
              <div
                key={title}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 16,
                  background: 'var(--bg-secondary)',
                }}
              >
                {/* Title row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
                  <button
                    type="button"
                    onClick={() => setForm({ email, password })}
                    style={{
                      background: 'none',
                      border: '1px solid var(--accent-light)',
                      color: 'var(--accent-light)',
                      borderRadius: 8,
                      padding: '4px 14px',
                      fontSize: 13,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Use now
                  </button>
                </div>

                {/* Credentials */}
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {email} / {password}
                </div>

                {/* Description */}
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
        Create an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 500 }}>Sign Up</Link>
      </div>
    </div>
  );
}
