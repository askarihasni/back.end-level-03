import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import { Spinner } from '../components/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { hasErrors, validateLoginForm } from '../utils/validation.js';

function safeDestination(user, from, adminOnly = false) {
  if (user.role === 'admin') {
    return from && from.startsWith('/admin') ? from : '/admin';
  }
  if (adminOnly) return null;
  if (from && from.startsWith('/') && !from.startsWith('/admin')) return from;
  return '/';
}

export default function LoginPage({ adminOnly = false }) {
  const { user, loading, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setServerError('');
  }, [form.email, form.password]);

  if (!loading && user && (!adminOnly || user.role === 'admin')) {
    return <Navigate to={safeDestination(user, from, adminOnly)} replace />;
  }

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateLoginForm(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    setServerError('');
    try {
      const loggedInUser = await login(form.email.trim(), form.password);

      if (adminOnly && loggedInUser.role !== 'admin') {
        try {
          await logout();
        } catch {
          // The local session is cleared even if the logout request fails.
        }
        setServerError('This account is not an administrator. Please sign in with an admin account.');
        return;
      }

      navigate(safeDestination(loggedInUser, from, adminOnly) || '/admin', { replace: true });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (email, password) => {
    setForm({ email, password });
    setErrors({});
    setServerError('');
  };

  return (
    <AuthShell
      eyebrow={adminOnly ? 'Admin access' : 'Welcome back'}
      title={adminOnly ? 'Sign in to the admin panel' : 'Sign in to your account'}
      subtitle={
        adminOnly
          ? 'Use an administrator account to manage orders, products and analytics.'
          : 'Continue to checkout, track orders and manage your purchases.'
      }
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        {serverError ? <div className="form-alert" role="alert">{serverError}</div> : null}
        {adminOnly && user?.role === 'customer' ? (
          <p className="field-hint">
            You are signed in as a customer. Sign in below with an administrator account to switch.
          </p>
        ) : null}

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
            style={{ color: '#0F172A', backgroundColor: '#FFFFFF', WebkitTextFillColor: '#0F172A' }}
          />
          {errors.email ? <span className="field-error" id="email-error">{errors.email}</span> : null}
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <div className="password-input">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={update('password')}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              placeholder="Enter your password"
              style={{ color: '#0F172A', backgroundColor: '#FFFFFF', WebkitTextFillColor: '#0F172A' }}
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
          {errors.password ? <span className="field-error" id="password-error">{errors.password}</span> : null}
        </div>

        <button type="submit" className="button button--primary button--large button--full" disabled={submitting}>
          {submitting ? <Spinner size="sm" label="Signing in" /> : <LogIn size={17} />}
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="demo-credentials">
        <div>
          <strong>{adminOnly ? 'Demo administrator' : 'Demo accounts'}</strong>
          <span>Development seed data only</span>
        </div>
        <div className="demo-credentials__actions">
          {!adminOnly ? (
            <button type="button" className="chip" onClick={() => fillDemo('ayesha@example.com', 'Customer@123')}>
              Customer
            </button>
          ) : null}
          <button type="button" className="chip" onClick={() => fillDemo('admin@shop.pk', 'Admin@12345')}>
            Admin
          </button>
        </div>
      </div>

      {adminOnly ? (
        <p className="auth-switch">
          <Link to="/">Back to storefront</Link>
        </p>
      ) : (
        <p className="auth-switch">
          New to Nexa Market?{' '}
          <Link to="/register" state={{ from }}>Create an account</Link>
        </p>
      )}
    </AuthShell>
  );
}
