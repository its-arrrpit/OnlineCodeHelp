import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Terminal,
  Activity,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
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

  const isActive = (path: string) => {
    if (path === '/problems') {
      return location.pathname === '/problems' || location.pathname.startsWith('/problems/');
    }
    return location.pathname === path;
  };

  return (
    <>
      <nav className="glass-nav">
        <div
          className="container flex items-center justify-between"
          style={{ maxWidth: '1800px', height: '100%' }}
        >
          {/* Brand Logo & Main Nav Links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-decoration-none">
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Terminal size={16} color="#818cf8" />
              </div>
              <span
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: '#f8fafc',
                }}
              >
                Code<span style={{ color: '#818cf8' }}>Judge</span>
              </span>
            </Link>

            {/* Clean Desktop Nav Links */}
            <div className="flex items-center gap-2 hide-on-mobile">
              <Link
                to="/problems"
                className={`nav-link ${isActive('/problems') ? 'active' : ''}`}
              >
                Problems
              </Link>

              {isAuthenticated && (
                <Link
                  to="/submissions"
                  className={`nav-link ${isActive('/submissions') ? 'active' : ''}`}
                >
                  Submissions
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Right Controls */}
          <div className="flex items-center gap-3 hide-on-mobile">
            {/* Telemetry Button */}
            <button
              onClick={() => setTelemetryOpen(true)}
              className="nav-icon-btn"
              title="System Telemetry & Health Metrics"
            >
              <Activity size={13} color="#34d399" />
              <span>Telemetry</span>
            </button>

            {isAuthenticated ? (
              <div className="nav-user-chip">
                <div className="nav-avatar">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{user?.username}</span>
                {isAdmin && (
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: '#818cf8',
                      background: 'rgba(99, 102, 241, 0.15)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                    }}
                  >
                    ADMIN
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="nav-logout-btn"
                  title="Sign Out"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  style={{
                    fontSize: '0.85rem',
                    color: '#94a3b8',
                    fontWeight: 500,
                    transition: 'color 150ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm"
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                  }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="show-on-mobile items-center gap-2">
            <button
              onClick={() => setTelemetryOpen(true)}
              className="nav-icon-btn"
              style={{ padding: '5px 7px' }}
              aria-label="Telemetry"
            >
              <Activity size={14} color="#34d399" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '6px', borderRadius: '6px' }}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            className="show-on-mobile flex-col p-3"
            style={{
              position: 'absolute',
              top: '52px',
              left: 0,
              right: 0,
              background: '#090d16',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6)',
              zIndex: 60,
              animation: 'fadeIn 150ms ease-out',
            }}
          >
            <div className="flex flex-col gap-1">
              <Link
                to="/problems"
                onClick={() => setMobileMenuOpen(false)}
                className={`nav-link ${isActive('/problems') ? 'active' : ''}`}
                style={{ padding: '0.5rem 0.75rem' }}
              >
                Problems
              </Link>

              {isAuthenticated && (
                <Link
                  to="/submissions"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-link ${isActive('/submissions') ? 'active' : ''}`}
                  style={{ padding: '0.5rem 0.75rem' }}
                >
                  Submissions
                </Link>
              )}

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '0.35rem 0' }} />

              {isAuthenticated ? (
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <div className="nav-avatar">
                      {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user?.username}</span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                  >
                    <LogOut size={13} />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-secondary btn-sm flex-1"
                    style={{ justifyContent: 'center', fontSize: '0.8rem' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-primary btn-sm flex-1"
                    style={{ justifyContent: 'center', fontSize: '0.8rem' }}
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
