import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { ProblemsPage } from './pages/ProblemsPage';
import { ProblemDetailPage } from './pages/ProblemDetailPage';
import { SubmissionsPage } from './pages/SubmissionsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />

          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/problems" element={<ProblemsPage />} />
              <Route path="/problems/:id" element={<ProblemDetailPage />} />
              <Route
                path="/submissions"
                element={
                  <ProtectedRoute>
                    <SubmissionsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/problems" replace />} />
            </Routes>
          </main>

          {/* Minimalist Footer */}
          <footer
            style={{
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-subtle)',
              padding: '1.25rem 0',
              marginTop: 'auto',
            }}
          >
            <div className="container flex items-center justify-between flex-wrap gap-4">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                © 2026 CodeJudge Engine. Isolated Docker Sandboxes + BullMQ Queue + Redis Cache-Aside.
              </span>
              <div className="flex items-center gap-4" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span className="badge badge-accepted" style={{ fontSize: '0.65rem', padding: '1px 8px' }}>
                  SYSTEM HEALTHY
                </span>
                <span>Port 4000 (API)</span>
                <span>Port 3000 (UI)</span>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
