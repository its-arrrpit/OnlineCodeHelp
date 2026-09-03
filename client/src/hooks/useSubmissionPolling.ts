import { useState, useRef, useCallback } from 'react';
import type { Submission } from '../types';
import { submissionsApi } from '../services/api';

interface PollingOptions {
  intervalMs?: number;
  maxAttempts?: number;
  onUpdate?: (submission: Submission) => void;
  onComplete?: (submission: Submission) => void;
  onError?: (err: unknown) => void;
}

export const useSubmissionPolling = (options: PollingOptions = {}) => {
  const { intervalMs = 1000, maxAttempts = 60, onUpdate, onComplete, onError } = options;

  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const poll = useCallback(
    async (submissionId: string) => {
      attemptsRef.current += 1;

      try {
        const sub = await submissionsApi.getById(submissionId);
        setCurrentSubmission(sub);
        onUpdate?.(sub);

        // Check if submission reached terminal status
        if (sub.status !== 'QUEUED' && sub.status !== 'RUNNING') {
          stopPolling();
          onComplete?.(sub);
          return;
        }

        // Check max attempts safeguard
        if (attemptsRef.current >= maxAttempts) {
          stopPolling();
          onError?.(new Error('Submission timed out waiting for worker execution.'));
          return;
        }

        // Schedule next poll
        timerRef.current = setTimeout(() => {
          poll(submissionId);
        }, intervalMs);
      } catch (err) {
        stopPolling();
        onError?.(err);
      }
    },
    [intervalMs, maxAttempts, onComplete, onError, onUpdate, stopPolling]
  );

  const startPolling = useCallback(
    (initialSubmission: Submission) => {
      stopPolling();
      setCurrentSubmission(initialSubmission);
      setIsPolling(true);
      attemptsRef.current = 0;

      // If already terminal, don't poll
      if (initialSubmission.status !== 'QUEUED' && initialSubmission.status !== 'RUNNING') {
        setIsPolling(false);
        onComplete?.(initialSubmission);
        return;
      }

      // Schedule first poll
      timerRef.current = setTimeout(() => {
        poll(initialSubmission.id);
      }, intervalMs);
    },
    [intervalMs, onComplete, poll, stopPolling]
  );

  return {
    currentSubmission,
    isPolling,
    startPolling,
    stopPolling,
  };
};
