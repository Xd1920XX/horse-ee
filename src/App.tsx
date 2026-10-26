import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { seedIfEmpty } from './seed';
import { BACKEND_MODE } from './firebase';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { CompetitionsPublicPage } from './pages/CompetitionsPublicPage';
import { CompetitionDetailPage } from './pages/CompetitionDetailPage';
import { RegisterForCompetitionPage } from './pages/RegisterForCompetitionPage';
import { DesignerPage } from './pages/DesignerPage';
import { ManageDashboard } from './pages/ManageDashboard';
import { NewCompetitionPage } from './pages/NewCompetitionPage';
import { CompetitionEditor } from './pages/CompetitionEditor';
import { LiveScoringPage } from './pages/LiveScoringPage';
import { MyHorsesPage } from './pages/MyHorsesPage';
import { MyEntriesPage } from './pages/MyEntriesPage';
import { ProfilePage } from './pages/ProfilePage';

export default function App() {
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    // Only auto-seed when running against the local mock backend. On real
    // Firebase we never want to overwrite production data.
    if (BACKEND_MODE === 'mock') {
      seedIfEmpty().finally(() => setSeeded(true));
    } else {
      setSeeded(true);
    }
  }, []);

  if (!seeded) return <div className="loading-splash">Laadin…</div>;

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route path="/designer" element={<DesignerPage />} />
          <Route path="/designer/:courseId" element={<DesignerPage />} />

          <Route path="/competitions" element={<CompetitionsPublicPage />} />
          <Route path="/competitions/:id" element={<CompetitionDetailPage />} />
          <Route
            path="/competitions/:id/register"
            element={
              <ProtectedRoute>
                <RegisterForCompetitionPage />
              </ProtectedRoute>
            }
          />

          <Route path="/my/horses" element={<ProtectedRoute><MyHorsesPage /></ProtectedRoute>} />
          <Route path="/my/entries" element={<ProtectedRoute><MyEntriesPage /></ProtectedRoute>} />
          <Route path="/my/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          <Route path="/manage" element={<ProtectedRoute><ManageDashboard /></ProtectedRoute>} />
          <Route path="/manage/competitions/new" element={<ProtectedRoute requireOrganizer><NewCompetitionPage /></ProtectedRoute>} />
          <Route path="/manage/competitions/:id" element={<ProtectedRoute requireOrganizer><CompetitionEditor /></ProtectedRoute>} />
          <Route path="/manage/competitions/:id/live" element={<ProtectedRoute requireOrganizer><LiveScoringPage /></ProtectedRoute>} />

          <Route path="*" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
