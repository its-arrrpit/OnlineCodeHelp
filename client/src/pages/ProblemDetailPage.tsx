import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Send,
  Loader2,
  Clock,
  Cpu,
  ArrowLeft,
  FileText,
  History,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import type { Problem, Language, Submission, Difficulty } from '../types';
import { problemsApi, submissionsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CodeEditor, STARTER_TEMPLATES } from '../components/CodeEditor';
import { VerdictCard } from '../components/VerdictCard';
import { useSubmissionPolling } from '../hooks/useSubmissionPolling';

export const ProblemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'description' | 'history'>('description');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Editor State per language (persisted to localStorage)
  const getInitialCodeMap = useCallback((problemId?: string): Record<Language, string> => {
    if (problemId) {
      const saved = localStorage.getItem(`ocj_code_${problemId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            PYTHON: parsed.PYTHON || STARTER_TEMPLATES.PYTHON,
            CPP: parsed.CPP || STARTER_TEMPLATES.CPP,
            JAVA: parsed.JAVA || STARTER_TEMPLATES.JAVA,
          };
        } catch {
          // ignore corrupted JSON
        }
      }
    }
    return {
      PYTHON: STARTER_TEMPLATES.PYTHON,
      CPP: STARTER_TEMPLATES.CPP,
      JAVA: STARTER_TEMPLATES.JAVA,
    };
  }, []);

  const [language, setLanguage] = useState<Language>('PYTHON');
  const [codeMap, setCodeMap] = useState<Record<Language, string>>(() => getInitialCodeMap(id));

  // Sync if problem ID changes
  useEffect(() => {
    if (id) {
      setCodeMap(getInitialCodeMap(id));
    }
  }, [id, getInitialCodeMap]);

  const handleCodeChange = (newVal: string) => {
    setCodeMap((prev) => {
      const next = { ...prev, [language]: newVal };
      if (id) {
        localStorage.setItem(`ocj_code_${id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  // Submission History State
  const [history, setHistory] = useState<Submission[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Rate Limiting / Error State
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time Polling Hook
  const { currentSubmission, isPolling, startPolling } = useSubmissionPolling({
    intervalMs: 1000,
    maxAttempts: 60,
    onComplete: () => {
      fetchHistory();
    },
    onError: (err: any) => {
      console.error('Polling error:', err);
    },
  });

  // Load Problem Details
  useEffect(() => {
    if (!id) return;
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const data = await problemsApi.getById(id);
        setProblem(data);
      } catch (err) {
        console.error('Failed to load problem', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [id]);

  // Fetch submission history
  const fetchHistory = useCallback(async () => {
    if (!id || !isAuthenticated) return;
    setLoadingHistory(true);
    try {
      const data = await submissionsApi.getMySubmissions({ problemId: id, limit: 10 });
      setHistory(data.items || []);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  // Handle language switch: preserves code typed in each language!
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
  };

  // Handle code reset for current language
  const handleResetCode = () => {
    setCodeMap((prev) => {
      const next = { ...prev, [language]: STARTER_TEMPLATES[language] };
      if (id) {
        localStorage.setItem(`ocj_code_${id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  // Submit Code
  const handleSubmit = async () => {
    if (!id) return;
    if (!isAuthenticated) {
      setSubmissionError('Please sign in to submit your solution.');
      return;
    }

    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      const initialSub = await submissionsApi.create({
        problemId: id,
        language,
        code: codeMap[language],
      });

      // Start real-time polling
      startPolling(initialSub);
    } catch (err: any) {
      if (err.response?.status === 429) {
        const retryAfter = err.response.headers['retry-after'] || 60;
        setSubmissionError(
          `Rate limit exceeded: Max 5 submissions per minute. Please wait ${retryAfter}s before retrying.`
        );
      } else {
        const msg =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to submit solution. Please check your connection.';
        setSubmissionError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 py-16">
        <Loader2 size={36} className="animate-spin" color="var(--accent-indigo)" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="container py-12 text-center">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Problem Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          The requested problem does not exist or has been unpublished.
        </p>
        <Link to="/problems" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Problems
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4 flex-1 flex flex-col" style={{ maxWidth: '1600px' }}>
      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/problems"
          className="flex items-center gap-1.5"
          style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={15} />
          Back to Problem Catalog
        </Link>

        <div className="flex items-center gap-4" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <Clock size={13} color="var(--accent-cyan)" /> Time Limit: {problem.timeLimitMs} ms
          </span>
          <span className="flex items-center gap-1">
            <Cpu size={13} color="var(--accent-indigo)" /> Memory Limit: {problem.memoryLimitMb} MB
          </span>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(350px, 4.5fr) minmax(400px, 5.5fr)',
          gap: '1rem',
          flex: 1,
          alignItems: 'stretch',
        }}
      >
        {/* ============================================================ */}
        {/* LEFT COLUMN: Problem Specification & Submission History      */}
        {/* ============================================================ */}
        <div
          className="glass-panel flex flex-col"
          style={{ height: 'calc(100vh - 130px)', overflow: 'hidden' }}
        >
          {/* Panel Tabs Header */}
          <div
            className="flex items-center gap-2 px-4 py-2"
            style={{
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setActiveTab('description')}
              className="btn btn-ghost btn-sm"
              style={{
                color: activeTab === 'description' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'description' ? '2px solid var(--accent-indigo)' : '2px solid transparent',
                borderRadius: 0,
                padding: '6px 12px',
              }}
            >
              <FileText size={15} />
              Description
            </button>

            {isAuthenticated && (
              <button
                onClick={() => setActiveTab('history')}
                className="btn btn-ghost btn-sm"
                style={{
                  color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'history' ? '2px solid var(--accent-indigo)' : '2px solid transparent',
                  borderRadius: 0,
                  padding: '6px 12px',
                }}
              >
                <History size={15} />
                Submissions
              </button>
            )}
          </div>

          {/* Tab Content Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
            {activeTab === 'description' ? (
              <div>
                {/* Title & Difficulty Row */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{problem.title}</h2>
                  <DifficultyBadge difficulty={problem.difficulty as Difficulty} />
                </div>

                {/* Tags */}
                {problem.tags && problem.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-4">
                    {problem.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '0.725rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Problem Statement Body */}
                <div
                  style={{
                    fontSize: '0.9rem',
                    lineHeight: 1.65,
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    marginBottom: '1.5rem',
                  }}
                >
                  {problem.description}
                </div>

                {/* Public Sample Test Cases */}
                {problem.testCases && problem.testCases.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Sample Test Cases</h4>
                    <div className="flex flex-col gap-3">
                      {problem.testCases.map((tc, idx) => (
                        <div
                          key={tc.id || idx}
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem',
                          }}
                        >
                          <div
                            className="flex items-center justify-between mb-2"
                            style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}
                          >
                            <span>EXAMPLE {idx + 1}</span>
                            <button
                              onClick={() => handleCopy(`Input:\n${tc.input}\nExpected:\n${tc.expectedOutput}`, idx)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                            >
                              {copiedIndex === idx ? (
                                <>
                                  <Check size={12} color="var(--accent-emerald)" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy size={12} /> Copy
                                </>
                              )}
                            </button>
                          </div>

                          <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                              Input:
                            </span>
                            <pre
                              style={{
                                background: '#0a0e17',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                color: 'var(--accent-cyan)',
                              }}
                            >
                              {tc.input}
                            </pre>
                          </div>

                          <div style={{ fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                              Expected Output:
                            </span>
                            <pre
                              style={{
                                background: '#0a0e17',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                color: 'var(--accent-emerald)',
                              }}
                            >
                              {tc.expectedOutput}
                            </pre>
                          </div>

                          {tc.explanation && (
                            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                              <span style={{ fontWeight: 600 }}>Explanation: </span>
                              {tc.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Submissions History Tab */
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Past Submissions</h4>

                {loadingHistory ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 size={24} className="animate-spin" color="var(--accent-indigo)" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-secondary" style={{ fontSize: '0.875rem' }}>
                    No previous submissions recorded for this problem yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {history.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-3"
                        style={{
                          background: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <StatusBadge status={sub.status} verdict={sub.verdict} />
                          <span style={{ color: 'var(--text-muted)' }}>{sub.language}</span>
                        </div>

                        <div className="flex items-center gap-4" style={{ color: 'var(--text-secondary)' }}>
                          <span>{sub.executionTimeMs ? `${sub.executionTimeMs} ms` : '—'}</span>
                          <span>
                            {sub.memoryUsedMb
                              ? `${sub.memoryUsedMb} MB`
                              : sub.memoryUsedKb
                              ? `${(sub.memoryUsedKb / 1024).toFixed(1)} MB`
                              : '—'}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Monaco IDE, Language Switcher, Controls & Verdict */}
        {/* ============================================================ */}
        <div
          className="glass-panel flex flex-col p-3"
          style={{ height: 'calc(100vh - 130px)', overflow: 'hidden' }}
        >
          {/* Top IDE Toolbar */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Language:
              </span>
              <select
                className="select-field"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
              >
                <option value="PYTHON">Python 3 (3.11)</option>
                <option value="CPP">C++ (GCC 13 / C++17)</option>
                <option value="JAVA">Java 21 (OpenJDK)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isPolling}
                className="btn btn-success btn-sm"
              >
                {isSubmitting || isPolling ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                {isSubmitting ? 'Queueing...' : isPolling ? 'Evaluating...' : 'Submit Solution'}
              </button>
            </div>
          </div>

          {/* Rate Limiting / Submission Warning Toast */}
          {submissionError && (
            <div className="alert-banner alert-warning mb-3">
              <AlertTriangle size={16} />
              <span>{submissionError}</span>
            </div>
          )}

          {/* Monaco Code Editor Container */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <CodeEditor
              language={language}
              code={codeMap[language]}
              onChange={handleCodeChange}
              onReset={handleResetCode}
              readOnly={isSubmitting || isPolling}
            />
          </div>

          {/* Verdict Card & Live Evaluation Stats */}
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            <VerdictCard submission={currentSubmission} isPolling={isPolling} />
          </div>
        </div>
      </div>
    </div>
  );
};
