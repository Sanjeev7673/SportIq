import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import {
  Users,
  Calendar,
  ArrowRight,
  Clock,
  Plus
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';

export const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await adminService.getDashboard();
        setDashboard(data);
      } catch (e) {
        console.error('Failed to load admin dashboard:', e);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <Loader message="Loading platform administrative intelligence..." className="py-24" />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F8FAFC] font-display tracking-tight">Admin Dashboard</h1>
            <Badge variant="warning" className="font-bold">
              Superuser Governance
            </Badge>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Manage SportIQ users, organizers, events and platform activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/events/verification">
            <Button variant="secondary" size="sm" icon={Clock} className="border-[#F59E0B]/30 text-[#F59E0B]">
              Verification Queue ({dashboard?.pending_events || 0})
            </Button>
          </Link>
          <Link to="/admin/events/new">
            <Button variant="primary" size="sm" icon={Plus}>+ Add Sports Event</Button>
          </Link>
        </div>
      </div>

      {/* User Demographics KPIs */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-3">
          User & Roster Demographics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <Link to="/admin/users">
            <Card hover className="bg-[#111C2E] border-[#1E293B] p-4">
              <span className="text-[11px] font-semibold text-[#94A3B8] block mb-1">Total Users</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] font-display">
                  {dashboard?.total_users || 0}
                </span>
                <span className="text-[11px] text-[#94A3B8]">Accounts</span>
              </div>
            </Card>
          </Link>

          <Link to="/admin/athletes">
            <Card hover className="bg-[#111C2E] border-[#1E293B] p-4">
              <span className="text-[11px] font-semibold text-[#22C55E] block mb-1">Total Athletes</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#22C55E] font-display">
                  {dashboard?.total_athletes || 0}
                </span>
                <span className="text-[11px] text-[#94A3B8]">Profiles</span>
              </div>
            </Card>
          </Link>

          <Link to="/admin/coaches">
            <Card hover className="bg-[#111C2E] border-[#1E293B] p-4">
              <span className="text-[11px] font-semibold text-[#06B6D4] block mb-1">Total Coaches</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#06B6D4] font-display">
                  {dashboard?.total_coaches || 0}
                </span>
                <span className="text-[11px] text-[#94A3B8]">Trainers</span>
              </div>
            </Card>
          </Link>

          <Link to="/admin/scouts">
            <Card hover className="bg-[#111C2E] border-[#1E293B] p-4">
              <span className="text-[11px] font-semibold text-[#2563EB] block mb-1">Total Scouts</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#2563EB] font-display">
                  {dashboard?.total_scouts || 0}
                </span>
                <span className="text-[11px] text-[#94A3B8]">Recruiters</span>
              </div>
            </Card>
          </Link>

          <Link to="/admin/organizers">
            <Card hover className="bg-[#111C2E] border-[#1E293B] p-4">
              <span className="text-[11px] font-semibold text-[#F59E0B] block mb-1">Total Organizers</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#F59E0B] font-display">
                  {dashboard?.total_organizers || 0}
                </span>
                <span className="text-[11px] text-[#94A3B8]">Hosts</span>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Sports Events Metrics */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-3">
          Sports Events & Verification KPIs
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <Link to="/admin/events">
            <Card hover className="bg-[#111C2E] border-[#1E293B] p-4">
              <span className="text-[11px] font-semibold text-[#94A3B8] block mb-1">Total Events</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] font-display">
                {dashboard?.total_events || 0}
              </span>
            </Card>
          </Link>

          <Link to="/admin/events">
            <Card hover className="bg-[#111C2E] border-[#1E293B] p-4">
              <span className="text-[11px] font-semibold text-[#22C55E] block mb-1">Published Events</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#22C55E] font-display">
                {dashboard?.published_events || 0}
              </span>
            </Card>
          </Link>

          <Link to="/admin/events/verification">
            <Card hover className="bg-[#111C2E] border-[#1E293B] p-4">
              <span className="text-[11px] font-semibold text-[#F59E0B] block mb-1">Pending Events</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#F59E0B] font-display">
                {dashboard?.pending_events || 0}
              </span>
            </Card>
          </Link>

          <Link to="/admin/events">
            <Card hover className="bg-[#111C2E] border-[#1E293B] p-4">
              <span className="text-[11px] font-semibold text-[#EF4444] block mb-1">Rejected Events</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#EF4444] font-display">
                {dashboard?.rejected_events || 0}
              </span>
            </Card>
          </Link>

          <Link to="/events">
            <Card hover className="bg-[#111C2E] border-[#1E293B] p-4">
              <span className="text-[11px] font-semibold text-[#06B6D4] block mb-1">Upcoming Events</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#06B6D4] font-display">
                {dashboard?.upcoming_events || 0}
              </span>
            </Card>
          </Link>
        </div>
      </div>

      {/* Activity Streams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Event Submissions */}
        <Card title="Recent Event Submissions" icon={Calendar}>
          {dashboard?.recent_event_submissions?.length > 0 ? (
            <div className="divide-y divide-[#1E293B]">
              {dashboard.recent_event_submissions.map(e => (
                <div key={e.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="space-y-0.5 max-w-[65%]">
                    <span className="text-xs font-bold text-[#F8FAFC] block truncate">{e.title}</span>
                    <span className="text-[11px] text-[#94A3B8] block">
                      Organizer: <strong>{e.organizer_name}</strong> • Sport: {e.sport}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={e.status === 'PUBLISHED' ? 'success' : e.status === 'PENDING_REVIEW' ? 'warning' : 'default'} size="sm">
                      {e.status}
                    </Badge>
                    <Link to={`/admin/events/${e.id}/review`}>
                      <Button variant="primary" size="sm" className="text-xs py-1 px-2.5">
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#94A3B8] py-4 text-center">No recent event submissions.</p>
          )}
          <div className="pt-3 border-t border-[#1E293B] text-right">
            <Link to="/admin/events/verification" className="text-xs font-bold text-[#06B6D4] hover:underline">
              View All Verification Queue →
            </Link>
          </div>
        </Card>

        {/* Recent User Registrations */}
        <Card title="Recent User Registrations" icon={Users}>
          {dashboard?.recent_users?.length > 0 ? (
            <div className="divide-y divide-[#1E293B]">
              {dashboard.recent_users.map(u => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="space-y-0.5 max-w-[65%]">
                    <span className="text-xs font-bold text-[#F8FAFC] block truncate">{u.name}</span>
                    <span className="text-[11px] text-[#94A3B8] block truncate">
                      {u.email || u.phone_number} • Joined {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="primary" size="sm">
                      {u.role}
                    </Badge>
                    <Link to="/admin/users">
                      <Button variant="secondary" size="sm" className="text-xs py-1 px-2">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#94A3B8] py-4 text-center">No recent registrations.</p>
          )}
          <div className="pt-3 border-t border-[#1E293B] text-right">
            <Link to="/admin/users" className="text-xs font-bold text-[#06B6D4] hover:underline">
              Manage All Users →
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/admin/athletes" className="block group">
          <Card hover className="h-full border-t-2 border-t-[#22C55E] p-4 bg-[#111C2E]">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-bold text-[#F8FAFC] font-display text-xs sm:text-sm">Athlete Management</h3>
              <ArrowRight className="w-3.5 h-3.5 text-[#22C55E] group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Inspect athlete profiles, registered sports, and account statuses.
            </p>
          </Card>
        </Link>

        <Link to="/admin/coaches" className="block group">
          <Card hover className="h-full border-t-2 border-t-[#06B6D4] p-4 bg-[#111C2E]">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-bold text-[#F8FAFC] font-display text-xs sm:text-sm">Coach Management</h3>
              <ArrowRight className="w-3.5 h-3.5 text-[#06B6D4] group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Oversee coach credentials, squad allocations, and recommendations.
            </p>
          </Card>
        </Link>

        <Link to="/admin/organizers" className="block group">
          <Card hover className="h-full border-t-2 border-t-[#F59E0B] p-4 bg-[#111C2E]">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-bold text-[#F8FAFC] font-display text-xs sm:text-sm">Organizer Accreditation</h3>
              <ArrowRight className="w-3.5 h-3.5 text-[#F59E0B] group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Verify sports academies, district bodies, and tournament organizations.
            </p>
          </Card>
        </Link>

        <Link to="/admin/reports" className="block group">
          <Card hover className="h-full border-t-2 border-t-[#2563EB] p-4 bg-[#111C2E]">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-bold text-[#F8FAFC] font-display text-xs sm:text-sm">Platform Reports</h3>
              <ArrowRight className="w-3.5 h-3.5 text-[#2563EB] group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Generate PostgreSQL analytics, user growth rates, and event logs.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
