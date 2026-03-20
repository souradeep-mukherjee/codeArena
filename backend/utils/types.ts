export type SupportedLanguage = 'python' | 'javascript' | 'c' | 'cpp';

export type ExecutionStatus =
  | 'success'
  | 'runtime_error'
  | 'timeout'
  | 'output_limit_exceeded'
  | 'internal_error'
  | 'validation_error';

export interface ExecuteRequest {
  language: SupportedLanguage;
  code: string;
  stdin: string;
}

export interface ExecuteResponse {
  stdout: string;
  stderr: string;
  status: ExecutionStatus;
  executionTimeMs: number;
  truncated: boolean;
}

export interface SubmissionRecord {
  userId: number;
  code: string;
  language: SupportedLanguage;
  input: string;
  output: string;
  status: ExecutionStatus;
}

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}
