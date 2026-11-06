import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageLoader } from '../components/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({
  roles,
  loginPath = '/login',
  unauthorizedPath,
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Checking your session..." />;

  if (!user) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <Navigate
        to={unauthorizedPath || (user.role === 'admin' ? '/admin' : '/')}
        replace
      />
    );
  }

  return <Outlet />;
}
