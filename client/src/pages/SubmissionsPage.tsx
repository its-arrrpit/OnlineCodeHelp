import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { History, Loader2, ChevronLeft, ChevronRight, Clock, Cpu } from 'lucide-react';
import type { Submission } from '../types';
import { submissionsApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const SubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await submissionsApi.getMySubmissions({ page, limit: 12 });
      setSubmissions(data.items || []);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return (
    <div className="container py-8 flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Submissions Log</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Track and benchmark your code executions across all challenges
          </p>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Total Submissions: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{total}</span>
        </div>
      </div>

      {/* Submissions Table */}
      {loading ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center">
          <Loader2 size={36} className="animate-spin" color="var(--accent-indigo)" />
          <span style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Retrieving submission history...
          </span>
        </div>
      ) : submissions.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <History size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Submissions Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            You have not submitted any solutions yet. Pick a challenge and give it a try!
          </p>
          <Link to="/problems" className="btn btn-primary">
            Browse Problems
          </Link>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(200px, 3fr) 120px 160px 120px 120px 150px',
              padding: '0.85rem 1.25rem',
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>Problem</span>
            <span>Language</span>
            <span>Verdict</span>
            <span>Runtime</span>
            <span>Memory</span>
            <span style={{ textAlign: 'right' }}>Submitted</span>
          </div>

          <div>
            {submissions.map((sub, idx) => (
              <div
                key={sub.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(200px, 3fr) 120px 160px 120px 120px 150px',
                  padding: '1rem 1.25rem',
                  alignItems: 'center',
                  borderBottom: idx < submissions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                {/* Problem Title */}
                <div>
                  <Link
                    to={`/problems/${sub.problemId}`}
                    style={{
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                      transition: 'color 150ms',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-indigo)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  >
                    {sub.problem?.title || `Problem #${sub.problemId.slice(0, 8)}`}
                  </Link>
                </div>

                {/* Language */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                    {sub.language}
                  </code>
                </div>

                {/* Verdict Badge */}
                <div>
                  <StatusBadge status={sub.status} verdict={sub.verdict} />
                </div>

                {/* Runtime */}
                <div className="flex items-center gap-1.5" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Clock size={13} color="var(--accent-cyan)" />
                  <span>{sub.executionTimeMs !== null && sub.executionTimeMs !== undefined ? `${sub.executionTimeMs} ms` : '—'}</span>
                </div>

                {/* Memory */}
                <div className="flex items-center gap-1.5" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Cpu size={13} color="var(--accent-indigo)" />
                  <span>
                    {sub.memoryUsedMb !== null && sub.memoryUsedMb !== undefined
                      ? `${sub.memoryUsedMb} MB`
                      : sub.memoryUsedKb !== null && sub.memoryUsedKb !== undefined
                      ? `${(sub.memoryUsedKb / 1024).toFixed(1)} MB`
                      : '—'}
                  </span>
                </div>

                {/* Date */}
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(sub.createdAt).toLocaleDateString()}{' '}
                  {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
