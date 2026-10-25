import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../common/Loader';

const roleHome = {
  PLAYER: '/player/dashboard',
  COACH: '/coach/dashboard',
  SCOUT: '/scout/dashboard',
  ORGANIZER: '/organizer/dashboard',
  ADMIN: '/admin/dashboard',
};

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-main)]">
        <Loader message="Verifying authentication session..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={roleHome[user?.role] || '/'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
