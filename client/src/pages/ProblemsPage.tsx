import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Code2,
  Clock,
  Cpu,
  X,
} from 'lucide-react';
import type { Problem, Difficulty } from '../types';
import { problemsApi } from '../services/api';
import { DifficultyBadge } from '../components/DifficultyBadge';

export const ProblemsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || '';
  const urlDifficulty = searchParams.get('difficulty') || '';

  const [problems, setProblems] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [difficulty, setDifficulty] = useState<string>(urlDifficulty);
  const [search, setSearch] = useState<string>(urlSearch);
  const [loading, setLoading] = useState(true);

  // Sync state if URL query params change (e.g. from browser navigation)
  useEffect(() => {
    const s = searchParams.get('search') || '';
    const d = searchParams.get('difficulty') || '';
    setSearch(s);
    setDifficulty(d);
    setPage(1);
  }, [searchParams]);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await problemsApi.getAll({
        page,
        limit: 20,
        difficulty: difficulty || undefined,
        search: search || undefined,
      });
      setProblems(data.items || []);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load problems', err);
    } finally {
      setLoading(false);
    }
  }, [page, difficulty, search]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleDifficultyChange = (diff: string) => {
    setDifficulty(diff);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (diff) {
      nextParams.set('difficulty', diff);
    } else {
      nextParams.delete('difficulty');
    }
    setSearchParams(nextParams);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (val) {
      nextParams.set('search', val);
    } else {
      nextParams.delete('search');
    }
    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    setSearch('');
    setDifficulty('');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="container py-8 flex-1">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Problem Catalog</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Explore curated algorithm challenges and benchmark your code solutions
          </p>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {search || difficulty ? (
            <span>
              Showing <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{total}</span> filtered problems
            </span>
          ) : (
            <span>
              Total Problems: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{total}</span>
            </span>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
        {/* Search Bar */}
        <div className="flex items-center gap-2 flex-1" style={{ minWidth: '240px', maxWidth: '420px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="input-field"
              placeholder="Search by problem title..."
              value={search}
              onChange={handleSearchChange}
              style={{ paddingLeft: '2.25rem' }}
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  const next = new URLSearchParams(searchParams);
                  next.delete('search');
                  setSearchParams(next);
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Difficulty Filter Tabs */}
        <div className="flex items-center gap-2">
          {['', 'EASY', 'MEDIUM', 'HARD'].map((diff) => {
            const isActive = difficulty === diff;
            const label = diff === '' ? 'All Difficulties' : diff.charAt(0) + diff.slice(1).toLowerCase();
            return (
              <button
                key={diff}
                onClick={() => handleDifficultyChange(diff)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Problem Table / List */}
      {loading ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center">
          <Loader2 size={36} className="animate-spin" color="var(--accent-indigo)" />
          <span style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Loading problems from Redis cache...
          </span>
        </div>
      ) : problems.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <Code2 size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No problems found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Try adjusting your search criteria or difficulty filter
          </p>
          <button onClick={clearAllFilters} className="btn btn-secondary btn-sm">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: '720px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(250px, 3fr) 120px minmax(180px, 2fr) 140px 110px',
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
              <span>Title</span>
              <span>Difficulty</span>
              <span>Tags</span>
              <span>Limits</span>
              <span style={{ textAlign: 'right' }}>Action</span>
            </div>

            <div>
              {problems.map((prob, idx) => (
                <div
                  key={prob.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(250px, 3fr) 120px minmax(180px, 2fr) 140px 110px',
                    padding: '1rem 1.25rem',
                    alignItems: 'center',
                    borderBottom: idx < problems.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Title */}
                  <div>
                    <Link
                      to={`/problems/${prob.id}`}
                      style={{
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        color: 'var(--text-primary)',
                        transition: 'color 150ms',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-indigo)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    >
                      {prob.title}
                    </Link>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <DifficultyBadge difficulty={prob.difficulty as Difficulty} />
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {prob.tags && prob.tags.length > 0 ? (
                      prob.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '0.7rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        Algorithm
                      </span>
                    )}
                  </div>

                  {/* Resource Limits */}
                  <div className="flex flex-col gap-1" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1">
                      <Clock size={12} color="var(--accent-cyan)" />
                      {prob.timeLimitMs || 2000} ms
                    </span>
                    <span className="flex items-center gap-1">
                      <Cpu size={12} color="var(--accent-indigo)" />
                      {prob.memoryLimitMb || 256} MB
                    </span>
                  </div>

                  {/* Action button */}
                  <div style={{ textAlign: 'right' }}>
                    <Link to={`/problems/${prob.id}`} className="btn btn-primary btn-sm">
                      Solve
                    </Link>
                  </div>
                </div>
              ))}
            </div>
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
