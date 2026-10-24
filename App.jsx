import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts & Guards
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Common Event Hub Pages
import EventHubPage from './pages/events/EventHubPage';
import EventDetailPage from './pages/events/EventDetailPage';

// Player Pages
import PlayerDashboard from './pages/player/PlayerDashboard';
import PlayerProfile from './pages/player/PlayerProfile';
import PlayerPerformance from './pages/player/PlayerPerformance';
import AIAnalysisPage from './pages/player/AIAnalysisPage';
import AIVideoAnalysis from './pages/player/AIVideoAnalysis';

// Coach Pages
import CoachDashboard from './pages/coach/CoachDashboard';
import PlayerDiscovery from './pages/coach/PlayerDiscovery';
import PlayerComparison from './pages/coach/PlayerComparison';
import TrainingRecommendations from './pages/coach/TrainingRecommendations';

// Scout Pages
import ScoutDashboard from './pages/scout/ScoutDashboard';
import ShortlistedPlayers from './pages/scout/ShortlistedPlayers';

// Organizer Pages
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import OrganizerEvents from './pages/organizer/OrganizerEvents';
import CreateEditEventPage from './pages/organizer/CreateEditEventPage';
import OrganizerProfile from './pages/organizer/OrganizerProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AthleteManagement from './pages/admin/AthleteManagement';
import CoachManagement from './pages/admin/CoachManagement';
import ScoutManagement from './pages/admin/ScoutManagement';
import OrganizerManagement from './pages/admin/OrganizerManagement';
import AdminEventsManagement from './pages/admin/AdminEventsManagement';
import EventVerificationPage from './pages/admin/EventVerificationPage';
import EventReviewPage from './pages/admin/EventReviewPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import SportManagement from './pages/admin/SportManagement';
import SystemAnalytics from './pages/admin/SystemAnalytics';

import { USER_ROLES } from './utils/constants';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing & Authentication */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Dashboard Shell */}
            <Route element={<DashboardLayout />}>
              {/* Event Hub (Accessible to all logged in users & roles) */}
              <Route path="/events" element={<EventHubPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />

              {/* Player Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.PLAYER, USER_ROLES.ADMIN]} />}>
                <Route path="/player/dashboard" element={<PlayerDashboard />} />
                <Route path="/player/tasks" element={<Navigate to="/player/dashboard" replace />} />
                <Route path="/player/profile" element={<PlayerProfile />} />
                <Route path="/player/performance" element={<PlayerPerformance />} />
                <Route path="/player/ai-analysis" element={<AIAnalysisPage />} />
                <Route path="/player/video-analysis" element={<AIVideoAnalysis />} />
              </Route>

              {/* Coach Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.COACH, USER_ROLES.ADMIN]} />}>
                <Route path="/coach/dashboard" element={<CoachDashboard />} />
                <Route path="/coach/players" element={<PlayerDiscovery />} />
                <Route path="/coach/compare" element={<PlayerComparison />} />
                <Route path="/coach/recommendations" element={<TrainingRecommendations />} />
              </Route>

              {/* Scout Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.SCOUT, USER_ROLES.ADMIN]} />}>
                <Route path="/scout/dashboard" element={<ScoutDashboard />} />
                <Route path="/scout/shortlist" element={<ShortlistedPlayers />} />
              </Route>

              {/* Organizer Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.ORGANIZER, USER_ROLES.ADMIN]} />}>
                <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
                <Route path="/organizer/events" element={<OrganizerEvents />} />
                <Route path="/organizer/events/new" element={<CreateEditEventPage />} />
                <Route path="/organizer/events/:id/edit" element={<CreateEditEventPage />} />
                <Route path="/organizer/profile" element={<OrganizerProfile />} />
              </Route>

              {/* Admin Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/athletes" element={<AthleteManagement />} />
                <Route path="/admin/coaches" element={<CoachManagement />} />
                <Route path="/admin/scouts" element={<ScoutManagement />} />
                <Route path="/admin/organizers" element={<OrganizerManagement />} />
                <Route path="/admin/events" element={<AdminEventsManagement />} />
                <Route path="/admin/events/new" element={<CreateEditEventPage />} />
                <Route path="/admin/events/:id/review" element={<EventReviewPage />} />
                <Route path="/admin/events/verification" element={<EventVerificationPage />} />
                <Route path="/admin/reports" element={<AdminReportsPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
                <Route path="/admin/profile" element={<AdminProfilePage />} />
                <Route path="/admin/sports" element={<SportManagement />} />
                <Route path="/admin/analytics" element={<SystemAnalytics />} />
              </Route>
            </Route>

            {/* 404 Handler */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
