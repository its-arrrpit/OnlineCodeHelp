import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Code2, Terminal, User as UserIcon, LogOut, ShieldCheck, Activity, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SystemHealthModal } from './SystemHealthModal';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
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

          {/* Desktop Navigation Links */}
          <div className="flex items-center gap-6 hide-on-mobile">
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

          {/* Desktop User Auth Pill */}
          <div className="flex items-center gap-3 hide-on-mobile">
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

          {/* Mobile Right Controls: Telemetry Icon + Hamburger */}
          <div className="show-on-mobile items-center gap-2">
            <button
              onClick={() => setTelemetryOpen(true)}
              className="btn btn-ghost btn-sm"
              style={{
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '6px',
                borderRadius: '8px',
              }}
              aria-label="Telemetry"
            >
              <Activity size={16} className="animate-pulse" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '6px', borderRadius: '8px' }}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            className="show-on-mobile flex-col p-4"
            style={{
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-subtle)',
              animation: 'fadeIn 150ms ease-out',
            }}
          >
            <div className="flex flex-col gap-3">
              <Link
                to="/problems"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2"
                style={{
                  color: isActive('/problems') ? 'var(--accent-indigo)' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                <Code2 size={18} />
                Problems Catalog
              </Link>

              {isAuthenticated && (
                <Link
                  to="/submissions"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2"
                  style={{
                    color: isActive('/submissions') ? 'var(--accent-indigo)' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                  }}
                >
                  <Terminal size={18} />
                  My Submissions
                </Link>
              )}

              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.25rem 0' }} />

              {isAuthenticated ? (
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <UserIcon size={16} color="#ffffff" />
                    </div>
                    <span style={{ fontWeight: 600 }}>{user?.username}</span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-secondary btn-sm flex-1"
                    style={{ justifyContent: 'center' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-primary btn-sm flex-1"
                    style={{ justifyContent: 'center' }}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Live System Health Modal */}
      <SystemHealthModal isOpen={telemetryOpen} onClose={() => setTelemetryOpen(false)} />
    </>
  );
};
