import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Code2, Terminal, User as UserIcon, LogOut, ShieldCheck, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SystemHealthModal } from './SystemHealthModal';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [telemetryOpen, setTelemetryOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="glass-nav">
        <div className="container flex items-center justify-between py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-decoration-none">
            <div
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Terminal size={20} color="#ffffff" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Code<span style={{ color: 'var(--accent-indigo)' }}>Judge</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/problems"
              className="flex items-center gap-1.5"
              style={{
                fontSize: '0.9rem',
                fontWeight: 500,
                color: isActive('/problems') ? 'var(--text-primary)' : 'var(--text-secondary)',
                transition: 'color 150ms',
              }}
            >
              <Code2 size={16} />
              Problems
            </Link>

            {isAuthenticated && (
              <Link
                to="/submissions"
                className="flex items-center gap-1.5"
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive('/submissions') ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'color 150ms',
                }}
              >
                Submissions
              </Link>
            )}

            {/* Platform Telemetry Trigger */}
            <button
              onClick={() => setTelemetryOpen(true)}
              className="btn btn-ghost btn-sm flex items-center gap-1.5"
              title="System Telemetry & Live Gauges"
              style={{
                fontSize: '0.825rem',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                background: 'rgba(6, 182, 212, 0.08)',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              <Activity size={13} className="animate-pulse" />
              Telemetry
            </button>
          </div>

          {/* User Auth Pill */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-full)',
                    padding: '4px 12px 4px 8px',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <UserIcon size={14} color="#ffffff" />
                  </div>
                  <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{user?.username}</span>
                  {isAdmin && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: 'var(--accent-indigo)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <ShieldCheck size={10} />
                      ADMIN
                    </span>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm"
                  title="Sign Out"
                  style={{ padding: '6px 10px' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Live System Health Modal */}
      <SystemHealthModal isOpen={telemetryOpen} onClose={() => setTelemetryOpen(false)} />
    </>
  );
};
