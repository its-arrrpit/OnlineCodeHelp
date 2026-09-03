import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import type { SubmissionStatus, Verdict } from '../types';

interface StatusBadgeProps {
  status?: SubmissionStatus;
  verdict?: Verdict;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, verdict, showIcon = true }) => {
  const currentVerdict = (verdict && verdict !== 'PENDING' ? verdict : status) || 'QUEUED';

  if (currentVerdict === 'QUEUED') {
    return (
      <span className="badge badge-queued">
        {showIcon && <Clock size={13} className="animate-pulse" />}
        QUEUED
      </span>
    );
  }

  if (currentVerdict === 'RUNNING') {
    return (
      <span className="badge badge-running">
        {showIcon && <Loader2 size={13} className="animate-spin" />}
        RUNNING
      </span>
    );
  }

  switch (currentVerdict) {
    case 'ACCEPTED':
      return (
        <span className="badge badge-accepted">
          {showIcon && <CheckCircle2 size={13} />}
          ACCEPTED
        </span>
      );
    case 'WRONG_ANSWER':
      return (
        <span className="badge badge-wrong_answer">
          {showIcon && <XCircle size={13} />}
          WRONG ANSWER
        </span>
      );
    case 'TIME_LIMIT_EXCEEDED':
      return (
        <span className="badge badge-tle">
          {showIcon && <Clock size={13} />}
          TIME LIMIT EXCEEDED
        </span>
      );
    case 'MEMORY_LIMIT_EXCEEDED':
      return (
        <span className="badge badge-tle">
          {showIcon && <AlertTriangle size={13} />}
          MEMORY LIMIT EXCEEDED
        </span>
      );
    case 'COMPILATION_ERROR':
      return (
        <span className="badge badge-ce">
          {showIcon && <AlertTriangle size={13} />}
          COMPILATION ERROR
        </span>
      );
    case 'RUNTIME_ERROR':
      return (
        <span className="badge badge-re">
          {showIcon && <AlertTriangle size={13} />}
          RUNTIME ERROR
        </span>
      );
    case 'SYSTEM_ERROR':
      return (
        <span className="badge badge-re">
          {showIcon && <AlertTriangle size={13} />}
          SYSTEM ERROR
        </span>
      );
    default:
      return <span className="badge badge-queued">{currentVerdict}</span>;
  }
};
