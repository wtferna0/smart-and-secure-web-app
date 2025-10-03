import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allow = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check user role based on Django's is_staff field
  const userRole = user?.is_staff ? 'admin' : 'customer';
  
  if (allow.length > 0 && !allow.includes(userRole)) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return children;
}