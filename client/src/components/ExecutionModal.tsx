// ===================================================================
// Execution Modal Component — Real-Time Evaluation HUD
// ===================================================================
// Automatically pops up on screen when the user clicks "Submit",
// displaying live execution progress and immediate verdict results
// without requiring any page scrolling.
// ===================================================================

import React, { useEffect } from 'react';
import {
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Cpu,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import type { Submission, Language } from '../types';
import { StatusBadge } from './StatusBadge';

interface ExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  isSubmitting: boolean;
  isPolling: boolean;
  problemTitle: string;
  language: Language;
  onViewHistory?: () => void;
}

export const ExecutionModal: React.FC<ExecutionModalProps> = ({
  isOpen,
  onClose,
  submission,
  isSubmitting,
  isPolling,
  problemTitle,
  language,
  onViewHistory,
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPending = isSubmitting || isPolling || submission?.status === 'QUEUED' || submission?.status === 'RUNNING';
  const isAccepted = submission?.verdict === 'ACCEPTED' || submission?.status === 'ACCEPTED';
  const isWrongAnswer = submission?.verdict === 'WRONG_ANSWER' || submission?.status === 'WRONG_ANSWER';
  const isTle = submission?.verdict === 'TIME_LIMIT_EXCEEDED' || submission?.status === 'TIME_LIMIT_EXCEEDED';
  const isRuntimeErr = submission?.status === 'RUNTIME_ERROR' || submission?.status === 'COMPILATION_ERROR';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 9, 20, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel w-full"
        style={{
          maxWidth: '680px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(15, 23, 42, 0.96)',
          border: isPending
            ? '1px solid rgba(99, 102, 241, 0.4)'
            : isAccepted
            ? '1px solid rgba(16, 185, 129, 0.4)'
            : '1px solid rgba(244, 63, 94, 0.4)',
          boxShadow: isPending
            ? '0 25px 60px rgba(99, 102, 241, 0.25)'
            : isAccepted
            ? '0 25px 60px rgba(16, 185, 129, 0.25)'
            : '0 25px 60px rgba(244, 63, 94, 0.25)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                background: isPending
                  ? 'rgba(99, 102, 241, 0.2)'
                  : isAccepted
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(244, 63, 94, 0.2)',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
              }}
            >
              {isPending ? (
                <Loader2 size={20} className="animate-spin" color="var(--accent-indigo)" />
              ) : isAccepted ? (
                <CheckCircle2 size={20} color="var(--accent-emerald)" />
              ) : (
                <XCircle size={20} color="var(--accent-rose)" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  {isPending ? 'Executing Solution' : 'Execution Verdict'}
                </h3>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  {language}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {problemTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px', borderRadius: '50%' }}
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Pending / Evaluating Screen */}
          {isPending && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
                    animation: 'pulse 2s infinite',
                  }}
                />
                <Loader2 size={44} className="animate-spin" color="var(--accent-indigo)" />
              </div>

              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                {isSubmitting ? 'Queueing in Evaluation Queue...' : 'Running Inside Docker Sandbox...'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5 }}>
                Your code is being compiled and tested against isolated test cases with strict CPU and memory limits.
              </p>

              {/* Step indicator */}
              <div
                className="flex items-center gap-3 mt-6 p-3"
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>1. Queued</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ color: isPolling ? 'var(--accent-indigo)' : 'var(--text-muted)', fontWeight: 600 }}>
                  2. Sandbox Execution
                </span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>3. Verdict</span>
              </div>
            </div>
          )}

          {/* Finished Verdict View */}
          {!isPending && submission && (
            <div>
              {/* Top Verdict Status Banner */}
              <div className="flex items-center justify-between mb-4">
                <StatusBadge status={submission.status} verdict={submission.verdict} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Submission ID: <code style={{ color: 'var(--text-secondary)' }}>{submission.id.slice(0, 8)}</code>
                </span>
              </div>

              {/* Callout Notice */}
              {isAccepted && (
                <div
                  className="flex items-center gap-3 p-3 mb-4"
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    color: '#6ee7b7',
                    fontSize: '0.875rem',
                  }}
                >
                  <CheckCircle2 size={18} color="var(--accent-emerald)" />
                  <div>
                    <strong>All Test Cases Passed!</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Your solution is optimal and produced the exact expected output.
                    </div>
                  </div>
                </div>
              )}

              {isWrongAnswer && (
                <div
                  className="flex items-center gap-3 p-3 mb-4"
                  style={{
                    background: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fda4af',
                    fontSize: '0.875rem',
                  }}
                >
                  <XCircle size={18} color="var(--accent-rose)" />
                  <div>
                    <strong>Wrong Answer on Test Case {((submission.failedTestCaseIndex ?? 0) + 1)}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Output did not match expected result. Check edge cases or off-by-one errors.
                    </div>
                  </div>
                </div>
              )}

              {isTle && (
                <div
                  className="flex items-center gap-3 p-3 mb-4"
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fde68a',
                    fontSize: '0.875rem',
                  }}
                >
                  <AlertTriangle size={18} color="var(--accent-amber)" />
                  <div>
                    <strong>Time Limit Exceeded</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Execution exceeded the time limit. Optimize your algorithmic time complexity.
                    </div>
                  </div>
                </div>
              )}

              {isRuntimeErr && (
                <div
                  className="flex items-center gap-3 p-3 mb-4"
                  style={{
                    background: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fda4af',
                    fontSize: '0.875rem',
                  }}
                >
                  <AlertTriangle size={18} color="var(--accent-rose)" />
                  <div>
                    <strong>{submission.status === 'COMPILATION_ERROR' ? 'Compilation Error' : 'Runtime Error'}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      See compiler and stack trace below for debugging.
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Metrics Bar */}
              <div
                className="grid grid-cols-2 gap-3 mb-4"
                style={{
                  background: 'var(--bg-surface)',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '6px', borderRadius: '6px' }}>
                    <Clock size={16} color="var(--accent-cyan)" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>Runtime</span>
                    <strong style={{ fontSize: '0.95rem' }}>
                      {submission.executionTimeMs !== undefined && submission.executionTimeMs !== null
                        ? `${submission.executionTimeMs} ms`
                        : '—'}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '6px', borderRadius: '6px' }}>
                    <Cpu size={16} color="var(--accent-indigo)" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>Memory</span>
                    <strong style={{ fontSize: '0.95rem' }}>
                      {submission.memoryUsedMb !== undefined && submission.memoryUsedMb !== null
                        ? `${submission.memoryUsedMb} MB`
                        : submission.memoryUsedKb !== undefined && submission.memoryUsedKb !== null
                        ? `${(submission.memoryUsedKb / 1024).toFixed(2)} MB`
                        : '—'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Output / Trace / Error Log */}
              {(submission.compilerOutput || submission.errorOutput) && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-1.5" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    <Terminal size={14} color="var(--text-muted)" />
                    <span>Output Log / Diagnostics</span>
                  </div>
                  <pre
                    style={{
                      background: '#090d16',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      fontSize: '0.8rem',
                      color: isAccepted ? '#a7f3d0' : '#fca5a5',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5,
                      fontFamily: 'monospace',
                    }}
                  >
                    {submission.compilerOutput || submission.errorOutput}
                  </pre>
                </div>
              )}

              {/* Test Cases Results Details */}
              {submission.testCaseResults && submission.testCaseResults.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Test Cases Breakdown ({submission.testCaseResults.filter((tc) => tc.status === 'ACCEPTED').length} /{' '}
                    {submission.testCaseResults.length} Passed)
                  </span>

                  <div className="flex flex-col gap-1.5 mt-2 max-h-48 overflow-y-auto pr-1">
                    {submission.testCaseResults.map((tc, idx) => {
                      const passed = tc.status === 'ACCEPTED';
                      return (
                        <div
                          key={tc.testCaseId || idx}
                          className="flex items-center justify-between p-2"
                          style={{
                            background: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.775rem',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {passed ? (
                              <CheckCircle2 size={14} color="var(--accent-emerald)" />
                            ) : (
                              <XCircle size={14} color="var(--accent-rose)" />
                            )}
                            <span style={{ fontWeight: 500 }}>Case {idx + 1}</span>
                            <span
                              style={{
                                color: passed ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                                fontWeight: 600,
                              }}
                            >
                              {tc.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                            <span>{tc.executionTimeMs} ms</span>
                            <span>{tc.memoryUsedMb ? `${tc.memoryUsedMb} MB` : '—'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          className="flex items-center justify-between px-6 py-3"
          style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {onViewHistory ? (
            <button
              onClick={() => {
                onClose();
                onViewHistory();
              }}
              className="btn btn-ghost btn-sm flex items-center gap-1.5"
              style={{ fontSize: '0.8rem' }}
            >
              <ExternalLink size={14} /> View All Submissions
            </button>
          ) : (
            <div />
          )}

          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ minWidth: '80px' }}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
