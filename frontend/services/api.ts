export type SupportedLanguage = 'python' | 'javascript' | 'c' | 'cpp';

export interface ExecutePayload {
  language: SupportedLanguage;
  code: string;
  stdin?: string;
}

export interface ExecuteResponse {
  stdout: string;
  stderr: string;
  status:
    | 'success'
    | 'runtime_error'
    | 'timeout'
    | 'output_limit_exceeded'
    | 'internal_error'
    | 'validation_error';
  executionTimeMs: number;
  truncated: boolean;
}

export interface ProblemTestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
}

export interface ProblemDefinition {
  id: string;
  leetCodeNumber: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sourceUrl: string;
  summary: string;
  inputFormat: string;
  outputFormat: string;
  testCases: ProblemTestCase[];
}

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

export interface SignupPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateAccountPayload {
  currentPassword: string;
  email?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

export interface SubmissionItem {
  id: number;
  language: string;
  code: string;
  input: string;
  output: string;
  status: string;
  createdAt: string;
}

export interface SubmissionListResponse {
  items: SubmissionItem[];
  total: number;
  page: number;
  limit: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const apiFetch = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers || {});
  const hasBody = typeof init.body !== 'undefined';
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  const text = await response.text();
  let body: unknown = null;

  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = { message: text };
    }
  }

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body as T;
};

export const signup = async (payload: SignupPayload): Promise<AuthUser> => {
  const response = await apiFetch<{ user: AuthUser }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.user;
};

export const login = async (payload: LoginPayload): Promise<AuthUser> => {
  const response = await apiFetch<{ user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.user;
};

export const logout = async (): Promise<void> => {
  await apiFetch<{ message: string }>('/auth/logout', {
    method: 'POST',
  });
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await apiFetch<{ user: AuthUser }>('/auth/me');
  return response.user;
};

export const updateAccount = async (payload: UpdateAccountPayload): Promise<AuthUser> => {
  const response = await apiFetch<{ user: AuthUser; message: string }>('/auth/account', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return response.user;
};

export const executeCode = async (payload: ExecutePayload): Promise<ExecuteResponse> => {
  return apiFetch<ExecuteResponse>('/execute', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getProblemBank = async (): Promise<ProblemDefinition[]> => {
  const response = await apiFetch<{ count?: number; problems?: ProblemDefinition[] }>('/problems');
  if (!response.problems || !Array.isArray(response.problems)) {
    throw new Error('Problem bank response is invalid');
  }

  return response.problems;
};

export const getSubmissions = async (page = 1, limit = 20): Promise<SubmissionListResponse> => {
  return apiFetch<SubmissionListResponse>(`/submissions?page=${page}&limit=${limit}`);
};

export const checkHealth = async (): Promise<{
  status: string;
  dockerAvailable: boolean;
  persistenceEnabled: boolean;
}> => {
  return apiFetch<{
    status: string;
    dockerAvailable: boolean;
    persistenceEnabled: boolean;
  }>('/health');
};
