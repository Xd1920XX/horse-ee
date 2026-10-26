import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

type Props = {
  children: ReactNode;
  requireOrganizer?: boolean;
  requireAdmin?: boolean;
};

export function ProtectedRoute({ children, requireOrganizer, requireAdmin }: Props) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-splash">Laadin…</div>;
  if (!user) return <Navigate to="/login" replace />;
  // Any signed-in user may create/manage their own events. The organizer
  // role is just a convenience flag for navigation (shows "Halda" link).
  void requireOrganizer;
  if (requireAdmin && !user.roles.admin) {
    return (
      <div className="page">
        <main className="container">
          <h1>Juurdepääs keelatud</h1>
          <p className="muted">Admini roll vajalik.</p>
        </main>
      </div>
    );
  }
  return <>{children}</>;
}
