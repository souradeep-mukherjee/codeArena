import { config } from './config';
import { HttpError } from './httpError';
import { ExecuteRequest, SupportedLanguage } from './types';

const supportedLanguages: SupportedLanguage[] = ['python', 'javascript', 'c', 'cpp'];

const hasNullByte = (value: string): boolean => value.includes('\0');

export const validateExecutePayload = (payload: unknown): ExecuteRequest => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new HttpError(400, 'Invalid payload. Expected JSON object.');
  }

  const body = payload as Record<string, unknown>;

  if (typeof body.language !== 'string') {
    throw new HttpError(400, 'Field "language" is required and must be a string.');
  }

  const language = body.language.toLowerCase().trim() as SupportedLanguage;
  if (!supportedLanguages.includes(language)) {
    throw new HttpError(400, `Unsupported language. Use one of: ${supportedLanguages.join(', ')}`);
  }

  if (typeof body.code !== 'string') {
    throw new HttpError(400, 'Field "code" is required and must be a string.');
  }

  const code = body.code;
  if (!code.trim()) {
    throw new HttpError(400, 'Code cannot be empty.');
  }

  if (code.length > config.maxCodeSize) {
    throw new HttpError(400, `Code exceeds maximum size of ${config.maxCodeSize} characters.`);
  }

  if (hasNullByte(code)) {
    throw new HttpError(400, 'Code contains unsupported null byte.');
  }

  const rawInput = body.stdin ?? body.input ?? '';
  if (typeof rawInput !== 'string') {
    throw new HttpError(400, 'Field "stdin" (or "input") must be a string.');
  }

  if (rawInput.length > config.maxStdinSize) {
    throw new HttpError(400, `Input exceeds maximum size of ${config.maxStdinSize} characters.`);
  }

  if (hasNullByte(rawInput)) {
    throw new HttpError(400, 'Input contains unsupported null byte.');
  }

  return {
    language,
    code,
    stdin: rawInput,
  };
};
