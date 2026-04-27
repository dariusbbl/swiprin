import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireRole({ role, children }) {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
