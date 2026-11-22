// import { Navigate } from 'react-router-dom';
// import { useAuth } from './AuthContext';

// export default function ProtectedRoute({ role, children }) {
//   const { user } = useAuth();

//   if (!user) return <Navigate to="/" replace />;
//   if (role && user.role !== role) return <Navigate to="/homepage" replace />;

//   return children;
// }

import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!user) return <Navigate to="/" replace />;

  if (role && user.role !== role) {
    return <Navigate to="/homepage" replace />;
  }

  return children;
}