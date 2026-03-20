import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthUser, signup } from '../services/api';

interface SignupPageProps {
  onSignupSuccess: (user: AuthUser) => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizePhoneCandidate = (value: string): string => {
  const stripped = value.trim().replace(/[\s()-]/g, '');
  if (stripped.startsWith('00')) {
    return `+${stripped.slice(2)}`;
  }

  if (stripped.startsWith('+')) {
    return stripped;
  }

  if (/^\d+$/.test(stripped)) {
    return `+${stripped}`;
  }

  return stripped;
};

const validatePasswordStrength = (value: string): string | null => {
  if (value.length < 8 || value.length > 72) {
    return 'Password must be between 8 and 72 characters.';
  }

  if (!/[A-Z]/.test(value)) {
    return 'Password must include at least one uppercase letter.';
  }

  if (!/[a-z]/.test(value)) {
    return 'Password must include at least one lowercase letter.';
  }

  if (!/\d/.test(value)) {
    return 'Password must include at least one digit.';
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return 'Password must include at least one special character.';
  }

  return null;
};

const SignupPage = ({ onSignupSuccess }: SignupPageProps) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizePhoneCandidate(phone);

    if (normalizedFullName.length < 2 || normalizedFullName.length > 100) {
      setError('Full name must be between 2 and 100 characters.');
      return;
    }

    if (!normalizedEmail || !normalizedPhone || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      setError('Email is invalid.');
      return;
    }

    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setError('Phone number must be a valid E.164 number.');
      return;
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await signup({
        fullName: normalizedFullName,
        email: normalizedEmail,
        phone: normalizedPhone,
        password,
        confirmPassword,
      });
      onSignupSuccess(user);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Signup failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-root">
      <section className="auth-card auth-card-wide">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Join CodeArena and start practicing coding challenges.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Full Name</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="John Doe"
              autoComplete="name"
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            <span>Phone Number</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+14155552671"
              autoComplete="tel"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Use a strong password"
              autoComplete="new-password"
            />
          </label>
          <p className="auth-hint">
            Use 8-72 chars with uppercase, lowercase, number, and special symbol.
          </p>

          <label>
            <span>Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Retype password"
              autoComplete="new-password"
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
};

export default SignupPage;
