import { HttpError } from './httpError';

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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const normalizePhoneToE164 = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  let normalized = trimmed.replace(/[\s()-]/g, '');

  if (normalized.startsWith('00')) {
    normalized = `+${normalized.slice(2)}`;
  } else if (!normalized.startsWith('+')) {
    if (!/^\d+$/.test(normalized)) {
      return null;
    }
    normalized = `+${normalized}`;
  }

  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    return null;
  }

  return normalized;
};

export const validatePasswordStrength = (password: string): void => {
  if (password.length < 8 || password.length > 72) {
    throw new HttpError(400, 'Password must be between 8 and 72 characters.');
  }

  if (!/[A-Z]/.test(password)) {
    throw new HttpError(400, 'Password must include at least one uppercase letter.');
  }

  if (!/[a-z]/.test(password)) {
    throw new HttpError(400, 'Password must include at least one lowercase letter.');
  }

  if (!/\d/.test(password)) {
    throw new HttpError(400, 'Password must include at least one digit.');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new HttpError(400, 'Password must include at least one special character.');
  }
};

export const parseSignupPayload = (payload: unknown): SignupPayload => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new HttpError(400, 'Invalid payload. Expected JSON object.');
  }

  const body = payload as Record<string, unknown>;

  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  if (fullName.length < 2 || fullName.length > 100) {
    throw new HttpError(400, 'Full name must be between 2 and 100 characters.');
  }

  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
  if (!emailRegex.test(email)) {
    throw new HttpError(400, 'Email is invalid.');
  }

  const phoneRaw = typeof body.phone === 'string' ? body.phone : '';
  const phone = normalizePhoneToE164(phoneRaw);
  if (!phone) {
    throw new HttpError(400, 'Phone number must be a valid E.164 number.');
  }

  const password = typeof body.password === 'string' ? body.password : '';
  const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';

  validatePasswordStrength(password);

  if (password !== confirmPassword) {
    throw new HttpError(400, 'Password and confirm password do not match.');
  }

  return {
    fullName,
    email,
    phone,
    password,
    confirmPassword,
  };
};

export const parseLoginPayload = (payload: unknown): LoginPayload => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new HttpError(400, 'Invalid payload. Expected JSON object.');
  }

  const body = payload as Record<string, unknown>;

  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!emailRegex.test(email)) {
    throw new HttpError(400, 'Email is invalid.');
  }

  if (!password) {
    throw new HttpError(400, 'Password is required.');
  }

  return {
    email,
    password,
  };
};

export const parseUpdateAccountPayload = (payload: unknown): UpdateAccountPayload => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new HttpError(400, 'Invalid payload. Expected JSON object.');
  }

  const body = payload as Record<string, unknown>;

  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  if (!currentPassword) {
    throw new HttpError(400, 'Current password is required.');
  }

  const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
  const email = rawEmail ? normalizeEmail(rawEmail) : undefined;

  if (email && !emailRegex.test(email)) {
    throw new HttpError(400, 'Email is invalid.');
  }

  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  const confirmNewPassword =
    typeof body.confirmNewPassword === 'string' ? body.confirmNewPassword : '';

  const passwordChangeRequested = Boolean(newPassword || confirmNewPassword);

  if (passwordChangeRequested) {
    if (!newPassword || !confirmNewPassword) {
      throw new HttpError(400, 'Both new password and confirm new password are required.');
    }

    validatePasswordStrength(newPassword);

    if (newPassword !== confirmNewPassword) {
      throw new HttpError(400, 'New password and confirm new password do not match.');
    }
  }

  if (!email && !passwordChangeRequested) {
    throw new HttpError(400, 'Provide a new email and/or new password to update your account.');
  }

  return {
    currentPassword,
    email,
    newPassword: passwordChangeRequested ? newPassword : undefined,
    confirmNewPassword: passwordChangeRequested ? confirmNewPassword : undefined,
  };
};
