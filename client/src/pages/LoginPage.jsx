import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import { Spinner } from '../components/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { hasErrors, validateLoginForm } from '../utils/validation.js';

function safeDestination(user, from) {
  if (user.role === 'admin') {
    return from && from.startsWith('/admin') ? from : '/admin';
  }
  if (from && from.startsWith('/') && !from.startsWith('/admin')) return from;
  return '/';
}

export default function LoginPage() {
  const { user, loading, login } = useAuth();
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

  if (!loading && user) {
    return <Navigate to={safeDestination(user, from)} replace />;
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
      navigate(safeDestination(loggedInUser, from), { replace: true });
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
      eyebrow="Welcome back"
      title="Sign in to your account"
      subtitle="Continue to checkout, track orders and manage your purchases."
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        {serverError ? <div className="form-alert" role="alert">{serverError}</div> : null}

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
          <strong>Demo accounts</strong>
          <span>Development seed data only</span>
        </div>
        <div className="demo-credentials__actions">
          <button type="button" className="chip" onClick={() => fillDemo('ayesha@example.com', 'Customer@123')}>
            Customer
          </button>
          <button type="button" className="chip" onClick={() => fillDemo('admin@shop.pk', 'Admin@12345')}>
            Admin
          </button>
        </div>
      </div>

      <p className="auth-switch">
        New to Nexa Market?{' '}
        <Link to="/register" state={{ from }}>Create an account</Link>
      </p>
    </AuthShell>
  );
}
