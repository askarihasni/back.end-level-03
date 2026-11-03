import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import { Spinner } from '../components/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { hasErrors, validateRegisterForm } from '../utils/validation.js';

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    const destination = user.role === 'admin' ? '/admin' : from && from.startsWith('/') && !from.startsWith('/admin') ? from : '/';
    return <Navigate to={destination} replace />;
  }

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setServerError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateRegisterForm(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    setServerError('');
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      const destination = from && from.startsWith('/') && !from.startsWith('/admin') ? from : '/';
      navigate(destination, { replace: true });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Join the store"
      title="Create your account"
      subtitle="It takes less than a minute. Your cart stays with you."
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        {serverError ? <div className="form-alert" role="alert">{serverError}</div> : null}

        <div className="form-field">
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={update('name')}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            placeholder="Your full name"
          />
          {errors.name ? <span className="field-error" id="name-error">{errors.name}</span> : null}
        </div>

        <div className="form-field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            placeholder="you@example.com"
          />
          {errors.email ? <span className="field-error" id="email-error">{errors.email}</span> : null}
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={update('password')}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : 'password-hint'}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                className="icon-button password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password ? (
              <span className="field-error" id="password-error">{errors.password}</span>
            ) : (
              <span className="field-hint" id="password-hint">Use at least one letter and one number.</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
              placeholder="Repeat password"
            />
            {errors.confirmPassword ? (
              <span className="field-error" id="confirm-password-error">{errors.confirmPassword}</span>
            ) : null}
          </div>
        </div>

        <button type="submit" className="button button--primary button--large button--full" disabled={submitting}>
          {submitting ? <Spinner size="sm" label="Creating account" /> : <UserPlus size={17} />}
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login" state={{ from }}>Sign in</Link>
      </p>
    </AuthShell>
  );
}
