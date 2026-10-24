import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Activity,
  BrainCircuit,
  Video,
  Search,
  Scale,
  ClipboardList,
  Bookmark,
  Users,
  Calendar,
  ShieldCheck,
  PlusCircle,
  FolderKanban,
  Building,
  FileBarChart,
  Settings,
  X,
  LogOut
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const role = user?.role;

  const playerNavItems = [
    { name: 'Dashboard', path: '/player/dashboard', icon: LayoutDashboard },
    { name: 'Athletic Profile', path: '/player/profile', icon: User },
    { name: 'Performance Logs', path: '/player/performance', icon: Activity },
    { name: 'AI Video Analysis', path: '/player/video-analysis', icon: Video, isAI: true },
    { name: 'AI Talent Analysis', path: '/player/ai-analysis', icon: BrainCircuit, isAI: true },
    { name: 'Event Hub', path: '/events', icon: Calendar },
  ];

  const coachNavItems = [
    { name: 'Coach Dashboard', path: '/coach/dashboard', icon: LayoutDashboard },
    { name: 'Player Discovery', path: '/coach/players', icon: Search },
    { name: 'Player Comparison', path: '/coach/compare', icon: Scale },
    { name: 'Recommendations', path: '/coach/recommendations', icon: ClipboardList },
    { name: 'Event Hub', path: '/events', icon: Calendar },
  ];

  const scoutNavItems = [
    { name: 'Scout Dashboard', path: '/scout/dashboard', icon: LayoutDashboard },
    { name: 'Shortlisted Prospects', path: '/scout/shortlist', icon: Bookmark },
    { name: 'Prospect Comparison', path: '/coach/compare', icon: Scale },
    { name: 'Event Hub', path: '/events', icon: Calendar },
  ];

  const organizerNavItems = [
    { name: 'Organizer Dashboard', path: '/organizer/dashboard', icon: LayoutDashboard },
    { name: 'Create Event', path: '/organizer/events/new', icon: PlusCircle },
    { name: 'My Events', path: '/organizer/events', icon: FolderKanban },
    { name: 'Event Hub', path: '/events', icon: Calendar },
    { name: 'Organization Profile', path: '/organizer/profile', icon: Building },
  ];

  const adminNavItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Athlete Management', path: '/admin/athletes', icon: User },
    { name: 'Coach Management', path: '/admin/coaches', icon: ClipboardList },
    { name: 'Scout Management', path: '/admin/scouts', icon: Search },
    { name: 'Organizer Management', path: '/admin/organizers', icon: Building },
    { name: 'Sports Events', path: '/admin/events', icon: Calendar },
    { name: 'Event Verification', path: '/admin/events/verification', icon: ShieldCheck },
    { name: 'Platform Reports', path: '/admin/reports', icon: FileBarChart },
    { name: 'System Settings', path: '/admin/settings', icon: Settings },
    { name: 'Admin Profile', path: '/admin/profile', icon: User },
  ];

  const getNavItems = () => {
    switch (role) {
      case 'PLAYER':
        return playerNavItems;
      case 'COACH':
        return coachNavItems;
      case 'SCOUT':
        return scoutNavItems;
      case 'ORGANIZER':
        return organizerNavItems;
      case 'ADMIN':
        return adminNavItems;
      default:
        return [
          { name: 'Event Hub', path: '/events', icon: Calendar },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#0B1220]/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-[#1E293B] bg-[#0B1220] p-4 transition-transform duration-300 lg:translate-x-0 flex flex-col justify-between overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between px-3 py-2 mb-2 lg:hidden">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Navigation</span>
            <button onClick={onClose} aria-label="Close sidebar" className="p-1 text-[#94A3B8] hover:text-[#F8FAFC]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]/70 flex items-center justify-between">
              <span>{role || 'Public'} Workspace</span>
              {role === 'ADMIN' && (
                <span className="px-1.5 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 text-[9px] font-extrabold">ADMIN</span>
              )}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? item.isAI
                          ? 'bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30 font-semibold'
                          : 'bg-[#2563EB] text-[#F8FAFC] font-semibold shadow-sm'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111C2E]'
                    }`
                  }
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.isAI ? 'text-[#06B6D4]' : ''}`} />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="pt-4 mt-4 border-t border-[#1E293B]">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
