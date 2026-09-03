import axios from 'axios';
import type { AxiosError } from 'axios';
import type { ApiResponse, PaginatedProblems, Problem, Submission, User } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('codejudge_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: standardized error extraction
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: { message?: string } }>) => {
    if (error.response?.status === 401) {
      // Clear token on unauthorized
      localStorage.removeItem('codejudge_token');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', credentials);
    return res.data.data;
  },
  register: async (data: { email: string; username: string; password: string }) => {
    const res = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', data);
    return res.data.data;
  },
  me: async () => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
};

// Problems API
export const problemsApi = {
  getAll: async (params?: { page?: number; limit?: number; difficulty?: string; search?: string }) => {
    const res = await api.get<ApiResponse<PaginatedProblems>>('/problems', { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Problem>>(`/problems/${id}`);
    return res.data.data;
  },
};

// Submissions API
export const submissionsApi = {
  create: async (data: { problemId: string; language: string; code?: string; sourceCode?: string }) => {
    const payload = {
      problemId: data.problemId,
      language: data.language,
      sourceCode: data.sourceCode || data.code,
    };
    const res = await api.post<ApiResponse<Submission>>('/submissions', payload);
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Submission>>(`/submissions/${id}`);
    return res.data.data;
  },
  getMySubmissions: async (params?: { problemId?: string; page?: number; limit?: number }) => {
    const res = await api.get<ApiResponse<{ items: Submission[]; total: number; page: number; totalPages: number }>>(
      '/users/me/submissions',
      { params }
    );
    return res.data.data;
  },
};
