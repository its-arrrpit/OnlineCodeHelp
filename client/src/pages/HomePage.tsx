import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  Play,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Terminal,
  Flame,
  Cpu,
  Zap,
  TrendingUp,
  RotateCcw,
  Check,
} from 'lucide-react';
import { problemsApi } from '../services/api';
import type { Problem } from '../types';

type SupportedLang = 'python' | 'cpp' | 'java';

interface CodeSnippet {
  filename: string;
  lines: Array<{ num: number; code: React.ReactNode }>;
}

const SNIPPETS: Record<SupportedLang, CodeSnippet> = {
  python: {
    filename: 'two_sum.py',
    lines: [
      {
        num: 1,
        code: (
          <>
            <span className="syn-kw">def</span> <span className="syn-fn">two_sum</span>(
            <span className="syn-var">nums</span>: <span className="syn-type">list[int]</span>,{' '}
            <span className="syn-var">target</span>: <span className="syn-type">int</span>) -&gt;{' '}
            <span className="syn-type">list[int]</span>:
          </>
        ),
      },
      {
        num: 2,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-var">seen</span> = {'{}'}{' '}
            <span className="syn-com"># val -&gt; index</span>
          </>
        ),
      },
      {
        num: 3,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-kw">for</span> <span className="syn-var">i</span>,{' '}
            <span className="syn-var">n</span> <span className="syn-kw">in</span>{' '}
            <span className="syn-fn">enumerate</span>(<span className="syn-var">nums</span>):
          </>
        ),
      },
      {
        num: 4,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-var">diff</span> ={' '}
            <span className="syn-var">target</span> - <span className="syn-var">n</span>
          </>
        ),
      },
      {
        num: 5,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-kw">if</span>{' '}
            <span className="syn-var">diff</span> <span className="syn-kw">in</span>{' '}
            <span className="syn-var">seen</span>:
          </>
        ),
      },
      {
        num: 6,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <span className="syn-kw">return</span> [<span className="syn-var">seen</span>[
            <span className="syn-var">diff</span>], <span className="syn-var">i</span>]
          </>
        ),
      },
      {
        num: 7,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-var">seen</span>[
            <span className="syn-var">n</span>] = <span className="syn-var">i</span>
          </>
        ),
      },
      {
        num: 8,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-kw">return</span> []
          </>
        ),
      },
    ],
  },
  cpp: {
    filename: 'two_sum.cpp',
    lines: [
      {
        num: 1,
        code: (
          <>
            <span className="syn-kw">#include</span> <span className="syn-str">&lt;unordered_map&gt;</span>
          </>
        ),
      },
      {
        num: 2,
        code: (
          <>
            <span className="syn-kw">#include</span> <span className="syn-str">&lt;vector&gt;</span>
          </>
        ),
      },
      {
        num: 3,
        code: (
          <>
            <span className="syn-type">vector&lt;int&gt;</span> <span className="syn-fn">twoSum</span>(
            <span className="syn-type">vector&lt;int&gt;&</span> <span className="syn-var">nums</span>,{' '}
            <span className="syn-type">int</span> <span className="syn-var">target</span>) {'{'}
          </>
        ),
      },
      {
        num: 4,
        code: (
          <>
            &nbsp;&nbsp;<span className="syn-type">unordered_map&lt;int, int&gt;</span>{' '}
            <span className="syn-var">seen</span>;
          </>
        ),
      },
      {
        num: 5,
        code: (
          <>
            &nbsp;&nbsp;<span className="syn-kw">for</span> (<span className="syn-type">int</span>{' '}
            <span className="syn-var">i</span> = <span className="syn-num">0</span>;{' '}
            <span className="syn-var">i</span> &lt; <span className="syn-var">nums</span>.
            <span className="syn-fn">size</span>(); ++<span className="syn-var">i</span>) {'{'}
          </>
        ),
      },
      {
        num: 6,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-type">int</span> <span className="syn-var">diff</span> ={' '}
            <span className="syn-var">target</span> - <span className="syn-var">nums</span>[
            <span className="syn-var">i</span>];
          </>
        ),
      },
      {
        num: 7,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-kw">if</span> (<span className="syn-var">seen</span>.
            <span className="syn-fn">count</span>(<span className="syn-var">diff</span>)){' '}
            <span className="syn-kw">return</span> {'{'}{' '}
            <span className="syn-var">seen</span>[<span className="syn-var">diff</span>],{' '}
            <span className="syn-var">i</span> {'}'};
          </>
        ),
      },
      {
        num: 8,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-var">seen</span>[<span className="syn-var">nums</span>[
            <span className="syn-var">i</span>]] = <span className="syn-var">i</span>;
          </>
        ),
      },
      {
        num: 9,
        code: (
          <>
            &nbsp;&nbsp;{'}'} <span className="syn-kw">return</span> {'{}'};
          </>
        ),
      },
      {
        num: 10,
        code: (
          <>
            {'}'}
          </>
        ),
      },
    ],
  },
  java: {
    filename: 'Solution.java',
    lines: [
      {
        num: 1,
        code: (
          <>
            <span className="syn-kw">import</span> <span className="syn-var">java.util.HashMap</span>;
          </>
        ),
      },
      {
        num: 2,
        code: (
          <>
            <span className="syn-kw">class</span> <span className="syn-type">Solution</span> {'{'}
          </>
        ),
      },
      {
        num: 3,
        code: (
          <>
            &nbsp;&nbsp;<span className="syn-kw">public int</span>[]{' '}
            <span className="syn-fn">twoSum</span>(<span className="syn-type">int</span>[]{' '}
            <span className="syn-var">nums</span>, <span className="syn-type">int</span>{' '}
            <span className="syn-var">target</span>) {'{'}
          </>
        ),
      },
      {
        num: 4,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-type">HashMap&lt;Integer, Integer&gt;</span>{' '}
            <span className="syn-var">seen</span> = <span className="syn-kw">new</span>{' '}
            <span className="syn-type">HashMap</span>&lt;&gt;();
          </>
        ),
      },
      {
        num: 5,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-kw">for</span> (<span className="syn-type">int</span>{' '}
            <span className="syn-var">i</span> = <span className="syn-num">0</span>;{' '}
            <span className="syn-var">i</span> &lt; <span className="syn-var">nums</span>.
            <span className="syn-var">length</span>; <span className="syn-var">i</span>++) {'{'}
          </>
        ),
      },
      {
        num: 6,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-type">int</span>{' '}
            <span className="syn-var">diff</span> = <span className="syn-var">target</span> -{' '}
            <span className="syn-var">nums</span>[<span className="syn-var">i</span>];
          </>
        ),
      },
      {
        num: 7,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-kw">if</span> (<span className="syn-var">seen</span>.
            <span className="syn-fn">containsKey</span>(<span className="syn-var">diff</span>)) {'{'}
          </>
        ),
      },
      {
        num: 8,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="syn-kw">return new int</span>[]{' '}
            {'{'} <span className="syn-var">seen</span>.<span className="syn-fn">get</span>(
            <span className="syn-var">diff</span>), <span className="syn-var">i</span> {'}'};
          </>
        ),
      },
      {
        num: 9,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{'}'} <span className="syn-var">seen</span>.
            <span className="syn-fn">put</span>(<span className="syn-var">nums</span>[
            <span className="syn-var">i</span>], <span className="syn-var">i</span>);
          </>
        ),
      },
      {
        num: 10,
        code: (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;{'}'} <span className="syn-kw">return new int</span>[<span className="syn-num">0</span>];
          </>
        ),
      },
      {
        num: 11,
        code: (
          <>
            &nbsp;&nbsp;{'}'}
          </>
        ),
      },
      {
        num: 12,
        code: (
          <>
            {'}'}
          </>
        ),
      },
    ],
  },
};

export const HomePage: React.FC = () => {
  const [activeLang, setActiveLang] = useState<SupportedLang>('python');
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(true);
  const [trendingProblems, setTrendingProblems] = useState<Problem[]>([]);
  const [dailyProblem, setDailyProblem] = useState<Problem | null>(null);

  useEffect(() => {
    // Fetch live problems from database
    problemsApi
      .getAll({ page: 1, limit: 5 })
      .then((res) => {
        if (res && res.items && res.items.length > 0) {
          setDailyProblem(res.items[0]);
          setTrendingProblems(res.items.slice(1, 5));
        }
      })
      .catch(() => {
        // Fallback placeholder if backend offline
        setDailyProblem({
          id: '1',
          title: 'Rotate Image (90 Degrees Clockwise)',
          description: 'You are given an n x n 2D matrix representing an image, rotate the image by 90 degrees (clockwise).',
          difficulty: 'MEDIUM',
          createdAt: new Date().toISOString(),
        });
      });
  }, []);

  const handleSimulateRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasRun(true);
    }, 450);
  };

  return (
    <div className="container py-8 flex-1 flex flex-col justify-center">
      {/* ─── Hero Section: Split Layout ──────────────────────────────────── */}
      <div className="hero-split-grid">
        {/* Left Hero Column */}
        <div className="flex flex-col items-start text-left">
          {/* Top subtle tag */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-6"
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              color: 'var(--accent-indigo)',
              fontWeight: 600,
            }}
          >
            <Sparkles size={14} />
            <span>Interactive Algorithmic Sandbox</span>
          </div>

          <h1
            style={{
              fontSize: '3.5rem',
              lineHeight: 1.1,
              fontWeight: 800,
              marginBottom: '1.25rem',
              letterSpacing: '-0.03em',
            }}
          >
            Crack Algorithms.{' '}
            <span className="text-gradient-accent">Code Faster.</span>
          </h1>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-secondary)',
              marginBottom: '2rem',
              lineHeight: 1.6,
              maxWidth: '540px',
            }}
          >
            Practice curated coding interview challenges with sub-millisecond execution feedback,
            isolated runtime sandboxes, and clean automated test suites.
          </p>

          {/* Metric Chips */}
          <div className="flex items-center gap-3 flex-wrap mb-8">
            <div className="hero-stat-chip">
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>1,500+</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Curated Problems</div>
            </div>
            <div className="hero-stat-chip">
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>&lt; 50ms</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sandbox Verdicts</div>
            </div>
            <div className="hero-stat-chip">
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>Py, C++, Java</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Multi-Language</div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              to="/problems"
              className="btn btn-primary"
              style={{
                padding: '0.85rem 2rem',
                fontSize: '1rem',
                boxShadow: '0 8px 25px -4px rgba(99, 102, 241, 0.4)',
              }}
            >
              Start Practicing
              <ArrowRight size={18} />
            </Link>
            {dailyProblem && (
              <Link
                to={`/problems/${dailyProblem.id}`}
                className="btn btn-secondary"
                style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
              >
                <Flame size={18} color="var(--accent-amber)" />
                Daily Challenge
              </Link>
            )}
          </div>
        </div>

        {/* Right Hero Column: Interactive IDE Preview */}
        <div>
          <div className="code-preview-window">
            {/* Window Titlebar */}
            <div className="code-window-header">
              <div className="flex items-center gap-3">
                <div className="window-dots">
                  <div className="window-dot window-dot-red" />
                  <div className="window-dot window-dot-yellow" />
                  <div className="window-dot window-dot-green" />
                </div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    marginLeft: '0.5rem',
                  }}
                >
                  {SNIPPETS[activeLang].filename}
                </span>
              </div>

              {/* Language Tabs & Run Simulator */}
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center"
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '2px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <button
                    className={`lang-tab-btn ${activeLang === 'python' ? 'active' : ''}`}
                    onClick={() => setActiveLang('python')}
                  >
                    Python
                  </button>
                  <button
                    className={`lang-tab-btn ${activeLang === 'cpp' ? 'active' : ''}`}
                    onClick={() => setActiveLang('cpp')}
                  >
                    C++
                  </button>
                  <button
                    className={`lang-tab-btn ${activeLang === 'java' ? 'active' : ''}`}
                    onClick={() => setActiveLang('java')}
                  >
                    Java
                  </button>
                </div>

                <button
                  onClick={handleSimulateRun}
                  disabled={isRunning}
                  className="btn btn-primary"
                  style={{
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-sm)',
                    gap: '0.35rem',
                  }}
                  title="Run code against test suite"
                >
                  {isRunning ? (
                    <>
                      <RotateCcw size={13} className="spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Play size={13} fill="currentColor" />
                      Run
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="code-editor-body">
              {SNIPPETS[activeLang].lines.map((line) => (
                <div key={line.num} className="code-line">
                  <span className="code-line-num">{line.num}</span>
                  <div style={{ flex: 1 }}>{line.code}</div>
                </div>
              ))}
            </div>

            {/* Terminal / Test Result Box */}
            <div className="code-terminal-box">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Terminal size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    SANDBOX OUTPUT
                  </span>
                </div>
                {hasRun && !isRunning && (
                  <span className="terminal-badge-accepted">
                    <Check size={14} /> Accepted · 18ms · 14.2 MB
                  </span>
                )}
              </div>

              {isRunning ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: '0.25rem 0' }}>
                  ⚡ Dispatching to isolated container sandbox...
                </div>
              ) : hasRun ? (
                <div
                  className="flex flex-col gap-1.5"
                  style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>✓ Case 1:</span> nums = [2, 7, 11, 15], target = 9
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Expected: [0, 1]</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>✓ Case 2:</span> nums = [3, 2, 4], target = 6
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Expected: [1, 2]</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Daily Challenge Spotlight & Quick Bites ───────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: dailyProblem ? '1.2fr 1fr' : '1fr',
          gap: '1.5rem',
          marginTop: '3.5rem',
        }}
      >
        {/* Daily Challenge Spotlight */}
        {dailyProblem && (
          <div className="spotlight-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame size={18} color="var(--accent-amber)" />
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--accent-amber)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Daily Algorithm Challenge
                  </span>
                </div>
                <span
                  className={`badge badge-${dailyProblem.difficulty.toLowerCase()}`}
                  style={{ textTransform: 'uppercase', fontSize: '0.72rem' }}
                >
                  {dailyProblem.difficulty}
                </span>
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.65rem' }}>
                {dailyProblem.title}
              </h3>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Practice in-place transformations, spatial complexity optimization, and matrix manipulations in Python,
                C++, or Java with live judge verification.
              </p>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="flex items-center gap-4 text-muted" style={{ fontSize: '0.8rem' }}>
                <span className="flex items-center gap-1">
                  <Cpu size={14} /> 256MB Limit
                </span>
                <span className="flex items-center gap-1">
                  <Zap size={14} /> 2.0s Timeout
                </span>
              </div>

              <Link
                to={`/problems/${dailyProblem.id}`}
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.35rem', fontSize: '0.85rem' }}
              >
                Solve Challenge
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}

        {/* Quick Problem Feed */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Popular Problems
                </span>
              </div>
              <Link to="/problems" style={{ fontSize: '0.8rem', color: 'var(--accent-indigo)' }}>
                View All
              </Link>
            </div>

            <div className="flex flex-col gap-2.5">
              {trendingProblems.map((prob) => (
                <Link
                  key={prob.id}
                  to={`/problems/${prob.id}`}
                  className="quick-problem-item"
                >
                  <div className="flex items-center gap-3">
                    <Code2 size={16} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {prob.title}
                    </span>
                  </div>
                  <span
                    className={`badge badge-${prob.difficulty.toLowerCase()}`}
                    style={{ fontSize: '0.68rem', padding: '1px 6px' }}
                  >
                    {prob.difficulty}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div
            className="flex items-center justify-between mt-4 pt-3"
            style={{ borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-muted)' }}
          >
            <span>Total Catalog: 1,504 problems</span>
            <span className="flex items-center gap-1" style={{ color: 'var(--accent-emerald)' }}>
              <CheckCircle2 size={14} /> Docker Sandboxes Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
