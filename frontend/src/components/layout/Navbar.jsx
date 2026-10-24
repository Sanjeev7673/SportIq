import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import {
  Activity,
  LogOut,
  User,
  Shield,
  Menu,
  Bell,
  Clock,
  Building,
  Users,
  ChevronRight
} from 'lucide-react';
import Badge from '../common/Badge';
import ThemeToggle from '../common/ThemeToggle';
import { getRoleBadgeColor } from '../../utils/formatters';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      const fetchNotifs = async () => {
        try {
          const data = await adminService.getNotifications();
          setNotifications(data || []);
        } catch (e) {
          console.error('Failed to load admin notifications:', e);
        }
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000); // 30s polling for admin alerts
      return () => clearInterval(interval);
    }
  }, [user?.role]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalNotifCount = notifications.reduce((acc, n) => acc + (n.count || 0), 0);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#1E293B] bg-[#111C2E] px-4 sm:px-6 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] rounded-lg hover:bg-[#16243B] lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] shadow-sm">
            <Activity className="h-5 w-5 text-[#F8FAFC]" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-[#F8FAFC]">
            Sport<span className="text-[#06B6D4]">IQ</span>
          </span>
          {user?.role === 'ADMIN' && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 text-[10px] font-extrabold uppercase tracking-wider ml-1">
              Admin Portal
            </span>
          )}
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Admin Notifications Bell */}
        {user?.role === 'ADMIN' && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#16243B] transition-all cursor-pointer"
              title="Admin Alerts & Notifications"
            >
              <Bell className="w-5 h-5 text-[#2563EB]" />
              {totalNotifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#F59E0B] px-1 text-[10px] font-bold text-[#0B1220] shadow">
                  {totalNotifCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#111C2E] border border-[#1E293B] shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 pb-2 border-b border-[#1E293B] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                    Admin Notifications
                  </span>
                  <span className="text-[11px] text-[#94A3B8] font-medium">{notifications.length} alerts</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#1E293B]">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        to={n.link}
                        onClick={() => setShowNotifs(false)}
                        className="p-3.5 flex items-start gap-3 hover:bg-[#16243B] transition-colors block"
                      >
                        <div className="p-2 rounded-xl bg-[#2563EB]/10 text-[#2563EB] shrink-0 mt-0.5">
                          {n.category === 'EVENT_SUBMISSION' ? <Clock className="w-4 h-4 text-[#F59E0B]" /> :
                           n.category === 'ORGANIZER_VERIFICATION' ? <Building className="w-4 h-4 text-[#22C55E]" /> :
                           <Users className="w-4 h-4 text-[#06B6D4]" />}
                        </div>
                        <div className="flex-1 space-y-0.5 text-xs">
                          <p className="font-bold text-[#F8FAFC]">{n.title}</p>
                          <p className="text-[#94A3B8] text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 self-center" />
                      </Link>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-[#94A3B8]">
                      No active notifications. All queues clear.
                    </div>
                  )}
                </div>

                <div className="px-4 pt-2 border-t border-[#1E293B] text-center">
                  <Link
                    to="/admin/events/verification"
                    onClick={() => setShowNotifs(false)}
                    className="text-[11px] font-bold text-[#06B6D4] hover:underline"
                  >
                    Open Event Verification Queue →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Theme Toggle */}
        <ThemeToggle size="sm" />

        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to={user.role === 'ADMIN' ? '/admin/profile' : user.role === 'PLAYER' ? '/player/profile' : user.role === 'ORGANIZER' ? '/organizer/profile' : '#'}
              className="hidden sm:flex flex-col items-end hover:opacity-80 transition-opacity"
            >
              <span className="text-xs sm:text-sm font-semibold text-[#F8FAFC]">{user.name}</span>
              <span className="text-[11px] text-[#94A3B8]">{user.email || user.phone_number}</span>
            </Link>

            <Badge variant="primary" className={getRoleBadgeColor(user.role)}>
              {user.role}
            </Badge>

            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign out of account"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#EF4444] rounded-lg hover:bg-[#EF4444]/10 border border-transparent hover:border-[#EF4444]/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#16243B] rounded-xl transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium text-[#F8FAFC] bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-sm transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
