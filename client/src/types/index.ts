export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  createdAt?: string;
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  timeLimitMs?: number;
  memoryLimitMb?: number;
  isSample?: boolean;
  orderIndex?: number;
  explanation?: string | null;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  constraints?: string | null;
  examples?: string | null;
  isPublished?: boolean;
  timeLimitMs?: number;
  memoryLimitMb?: number;
  tags?: string[];
  createdAt: string;
  testCases?: TestCase[];
}

export type Language = 'PYTHON' | 'CPP' | 'JAVA';

export type SubmissionStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'SYSTEM_ERROR';

export type Verdict = SubmissionStatus | 'PENDING';

export interface TestCaseResult {
  testCaseId?: string;
  status: string;
  executionTimeMs: number;
  memoryUsedMb?: number;
  memoryUsedKb?: number;
  actualOutput?: string;
  expectedOutput?: string;
  input?: string;
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  language: Language;
  sourceCode?: string;
  code?: string;
  status: SubmissionStatus;
  verdict?: Verdict;
  executionTimeMs?: number | null;
  memoryUsedMb?: number | null;
  memoryUsedKb?: number | null;
  errorOutput?: string | null;
  compilerOutput?: string | null;
  failedTestCaseIndex?: number | null;
  testCaseResults?: TestCaseResult[] | null;
  createdAt: string;
  updatedAt?: string;
  problem?: {
    id?: string;
    title: string;
    difficulty: Difficulty;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedProblems {
  items: Problem[];
  total: number;
  page: number;
  totalPages: number;
  limit?: number;
}
