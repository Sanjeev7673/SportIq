import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts & Guards
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Public Pages





// Common Event Hub Pages



// Player Pages






// Coach Pages





// Scout Pages



// Organizer Pages





// Admin Pages















import { USER_ROLES } from './utils/constants';

const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const EventHubPage = React.lazy(() => import('./pages/events/EventHubPage'));
const EventDetailPage = React.lazy(() => import('./pages/events/EventDetailPage'));
const PlayerDashboard = React.lazy(() => import('./pages/player/PlayerDashboard'));
const PlayerProfile = React.lazy(() => import('./pages/player/PlayerProfile'));
const PlayerPerformance = React.lazy(() => import('./pages/player/PlayerPerformance'));
const AIAnalysisPage = React.lazy(() => import('./pages/player/AIAnalysisPage'));
const AIVideoAnalysis = React.lazy(() => import('./pages/player/AIVideoAnalysis'));
const CoachDashboard = React.lazy(() => import('./pages/coach/CoachDashboard'));
const PlayerDiscovery = React.lazy(() => import('./pages/coach/PlayerDiscovery'));
const PlayerComparison = React.lazy(() => import('./pages/coach/PlayerComparison'));
const TrainingRecommendations = React.lazy(() => import('./pages/coach/TrainingRecommendations'));
const ScoutDashboard = React.lazy(() => import('./pages/scout/ScoutDashboard'));
const ShortlistedPlayers = React.lazy(() => import('./pages/scout/ShortlistedPlayers'));
const OrganizerDashboard = React.lazy(() => import('./pages/organizer/OrganizerDashboard'));
const OrganizerEvents = React.lazy(() => import('./pages/organizer/OrganizerEvents'));
const CreateEditEventPage = React.lazy(() => import('./pages/organizer/CreateEditEventPage'));
const OrganizerProfile = React.lazy(() => import('./pages/organizer/OrganizerProfile'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const AthleteManagement = React.lazy(() => import('./pages/admin/AthleteManagement'));
const CoachManagement = React.lazy(() => import('./pages/admin/CoachManagement'));
const ScoutManagement = React.lazy(() => import('./pages/admin/ScoutManagement'));
const OrganizerManagement = React.lazy(() => import('./pages/admin/OrganizerManagement'));
const AdminEventsManagement = React.lazy(() => import('./pages/admin/AdminEventsManagement'));
const EventVerificationPage = React.lazy(() => import('./pages/admin/EventVerificationPage'));
const EventReviewPage = React.lazy(() => import('./pages/admin/EventReviewPage'));
const AdminReportsPage = React.lazy(() => import('./pages/admin/AdminReportsPage'));
const AdminSettingsPage = React.lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminProfilePage = React.lazy(() => import('./pages/admin/AdminProfilePage'));
const SportManagement = React.lazy(() => import('./pages/admin/SportManagement'));
const SystemAnalytics = React.lazy(() => import('./pages/admin/SystemAnalytics'));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<div role="status" className="min-h-[50vh] flex items-center justify-center text-sm text-slate-500">Loading SportIQ…</div>}>
          <Routes>
            {/* Public presentation routes: no login required. */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/player/dashboard" element={<PlayerDashboard />} />
            <Route path="/player/video-analysis" element={<AIVideoAnalysis />} />
            <Route path="/login" element={<Navigate to="/player/dashboard?showcase=1" replace />} />
            <Route path="/register" element={<Navigate to="/player/dashboard?showcase=1" replace />} />

            {/* Dashboard Shell */}
            <Route element={<DashboardLayout />}>
              {/* Event Hub (Accessible to all logged in users & roles) */}
              <Route path="/events" element={<EventHubPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />

              {/* Player Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.PLAYER, USER_ROLES.ADMIN]} />}>
                <Route path="/player/tasks" element={<Navigate to="/player/dashboard" replace />} />
                <Route path="/player/profile" element={<PlayerProfile />} />
                <Route path="/player/performance" element={<PlayerPerformance />} />
                <Route path="/player/ai-analysis" element={<AIAnalysisPage />} />
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
