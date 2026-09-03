import React from 'react';
import { Clock, Cpu, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import type { Submission } from '../types';
import { StatusBadge } from './StatusBadge';

interface VerdictCardProps {
  submission: Submission | null;
  isPolling?: boolean;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({ submission, isPolling = false }) => {
  if (!submission && !isPolling) {
    return null;
  }

  const isPending = isPolling || submission?.status === 'QUEUED' || submission?.status === 'RUNNING';
  const isAccepted = submission?.verdict === 'ACCEPTED' || submission?.status === 'ACCEPTED';
  const isWrongAnswer = submission?.verdict === 'WRONG_ANSWER' || submission?.status === 'WRONG_ANSWER';

  return (
    <div
      className="glass-panel p-4"
      style={{
        marginTop: '1rem',
        borderLeft:
          (submission?.verdict === 'ACCEPTED' || submission?.status === 'ACCEPTED')
            ? '4px solid var(--accent-emerald)'
            : (submission?.verdict === 'WRONG_ANSWER' || submission?.status === 'WRONG_ANSWER')
            ? '4px solid var(--accent-rose)'
            : (submission?.verdict === 'TIME_LIMIT_EXCEEDED' || submission?.status === 'TIME_LIMIT_EXCEEDED')
            ? '4px solid var(--accent-amber)'
            : undefined,
      }}
    >
      {/* Top row: Verdict / Status + ID */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <StatusBadge status={submission?.status} verdict={submission?.verdict} />
          {isPending && (
            <span
              className="flex items-center gap-1.5"
              style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}
            >
              <Loader2 size={14} className="animate-spin" />
              Executing in isolated Docker sandbox...
            </span>
          )}
        </div>

        {submission?.id && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ID: <code style={{ color: 'var(--text-secondary)' }}>{submission.id.slice(0, 8)}</code>
          </span>
        )}
      </div>

      {/* Wrong Answer Test Case Failure Callout */}
      {submission && !isPending && (submission.status === 'WRONG_ANSWER' || submission.verdict === 'WRONG_ANSWER') && (
        <div
          className="flex items-center gap-2 p-2.5 mb-3"
          style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fda4af',
            fontSize: '0.825rem',
          }}
        >
          <XCircle size={16} color="var(--accent-rose)" />
          <span>
            Wrong Answer on <strong>Test Case {((submission.failedTestCaseIndex ?? 0) + 1)}</strong>. Output did not match expected result.
          </span>
        </div>
      )}

      {/* Accepted Success Banner */}
      {submission && !isPending && (submission.status === 'ACCEPTED' || submission.verdict === 'ACCEPTED') && (
        <div
          className="flex items-center gap-2 p-2.5 mb-3"
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#6ee7b7',
            fontSize: '0.825rem',
          }}
        >
          <CheckCircle2 size={16} color="var(--accent-emerald)" />
          <span>
            <strong>All Test Cases Passed!</strong> Your solution produced the expected output across all test cases.
          </span>
        </div>
      )}

      {/* Stats Bar */}
      {submission && !isPending && (
        <div
          className="flex items-center gap-6 py-2 px-3 mb-3"
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2" style={{ fontSize: '0.85rem' }}>
            <Clock size={16} color="var(--accent-cyan)" />
            <span style={{ color: 'var(--text-muted)' }}>Runtime:</span>
            <span style={{ fontWeight: 600 }}>
              {submission.executionTimeMs !== undefined && submission.executionTimeMs !== null
                ? `${submission.executionTimeMs} ms`
                : 'N/A'}
            </span>
          </div>

          <div className="flex items-center gap-2" style={{ fontSize: '0.85rem' }}>
            <Cpu size={16} color="var(--accent-indigo)" />
            <span style={{ color: 'var(--text-muted)' }}>Memory:</span>
            <span style={{ fontWeight: 600 }}>
              {submission.memoryUsedMb !== undefined && submission.memoryUsedMb !== null
                ? `${submission.memoryUsedMb} MB`
                : submission.memoryUsedKb !== undefined && submission.memoryUsedKb !== null
                ? `${(submission.memoryUsedKb / 1024).toFixed(2)} MB`
                : 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* Test Case Output / Output Diff / Error Trace */}
      {(submission?.compilerOutput || submission?.errorOutput) && (
        <div className="mt-3">
          <div
            className="flex items-center gap-1.5 mb-1.5"
            style={{
              fontSize: '0.8rem',
              color: isAccepted ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              fontWeight: 600,
            }}
          >
            {isAccepted ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            {isAccepted
              ? 'Sample Test Case Evaluation'
              : isWrongAnswer
              ? 'Test Case Output Diff'
              : 'Compiler / Runtime Trace'}
          </div>
          <pre
            style={{
              padding: '0.85rem',
              background: '#090d16',
              border: isAccepted
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.825rem',
              fontFamily: 'monospace',
              color: isAccepted ? '#a7f3d0' : '#fca5a5',
              overflowX: 'auto',
              maxHeight: '220px',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.5,
            }}
          >
            {submission.compilerOutput || submission.errorOutput}
          </pre>
        </div>
      )}

      {/* Test Cases Results Breakdown */}
      {submission?.testCaseResults && submission.testCaseResults.length > 0 && (
        <div className="mt-3">
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Test Case Results ({submission.testCaseResults.filter((tc) => tc.status === 'ACCEPTED').length} /{' '}
            {submission.testCaseResults.length} Passed)
          </span>

          <div className="flex flex-col gap-2 mt-2">
            {submission.testCaseResults.map((tc, idx) => {
              const isSuccess = tc.status === 'ACCEPTED';
              return (
                <div
                  key={tc.testCaseId || idx}
                  className="flex items-center justify-between p-2"
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div className="flex items-center gap-2">
                    {isSuccess ? (
                      <CheckCircle2 size={15} color="var(--accent-emerald)" />
                    ) : (
                      <XCircle size={15} color="var(--accent-rose)" />
                    )}
                    <span style={{ fontWeight: 500 }}>Case {idx + 1}</span>
                    <span
                      style={{
                        color: isSuccess ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    >
                      {tc.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <span>{tc.executionTimeMs} ms</span>
                    <span>
                      {tc.memoryUsedMb
                        ? `${tc.memoryUsedMb} MB`
                        : tc.memoryUsedKb
                        ? `${(tc.memoryUsedKb / 1024).toFixed(1)} MB`
                        : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
