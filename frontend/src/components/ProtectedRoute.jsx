import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const currentUser = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    } catch {
      return null;
    }
  })();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}