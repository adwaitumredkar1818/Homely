import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
          <div className="absolute w-8 h-8 border-4 border-indigo-400/20 border-b-indigo-400 rounded-full animate-spin animate-duration-1000 animate-reverse"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
          Loading Homely...
        </p>
      </div>
    );
  }

  if (!user) {
    // Save current location if needed for redirect back after login
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user role is not allowed, redirect to correct dashboard
    if (user.role === 'HOST') {
      return <Navigate to="/host" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return children;
}
