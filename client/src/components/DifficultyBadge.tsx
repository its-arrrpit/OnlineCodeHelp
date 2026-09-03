import React from 'react';
import type { Difficulty } from '../types';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty, className = '' }) => {
  const normalized = difficulty.toUpperCase();
  const badgeClass =
    normalized === 'EASY'
      ? 'badge-easy'
      : normalized === 'MEDIUM'
      ? 'badge-medium'
      : 'badge-hard';

  return <span className={`badge ${badgeClass} ${className}`}>{normalized}</span>;
};
