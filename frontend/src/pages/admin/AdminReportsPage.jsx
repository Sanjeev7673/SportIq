import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  FileBarChart,
  Users,
  Calendar,
  Building,
  Trophy,
  Activity,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';

export const AdminReportsPage = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const data = await adminService.getReports();
        setReports(data);
      } catch (err) {
        console.error('Failed to load platform reports:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  if (loading) {
    return <Loader message="Generating live platform reports from database..." className="py-24" />;
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
              Platform Intelligence & Reports
            </h1>
            <Badge variant="primary" className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30">
              Live Database Analytics
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time PostgreSQL metrics across athletes, coaches, scouts, organizers, and tournament opportunities.
          </p>
        </div>
      </div>

      {/* Aggregate Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Users</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">{reports?.total_users || 0}</span>
            <span className="text-xs text-slate-400">Accounts</span>
          </div>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">Live Published Events</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-display">{reports?.published_events || 0}</span>
            <span className="text-xs text-slate-400">Active</span>
          </div>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block mb-1">Pending Verification</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-display">{reports?.pending_events || 0}</span>
            <span className="text-xs text-slate-400">In Queue</span>
          </div>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4">
          <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 block mb-1">Total Event Views</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 font-display">{reports?.total_views || 0}</span>
            <span className="text-xs text-slate-400">Impressions</span>
          </div>
        </Card>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Distribution by Role */}
        <Card title="User Demographics by Role" icon={Users}>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Athletes / Players</span>
              <Badge variant="primary">{reports?.users_by_role?.PLAYER || 0} Athletes</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Coaches & Trainers</span>
              <Badge variant="primary" className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30">{reports?.users_by_role?.COACH || 0} Coaches</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Scouts & Recruiters</span>
              <Badge variant="primary" className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30">{reports?.users_by_role?.SCOUT || 0} Scouts</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Tournament Organizers</span>
              <Badge variant="primary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">{reports?.users_by_role?.ORGANIZER || 0} Organizers</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Platform Administrators</span>
              <Badge variant="secondary">{reports?.users_by_role?.ADMIN || 0} Admins</Badge>
            </div>
          </div>
        </Card>

        {/* Sports Events Lifecycle Statuses */}
        <Card title="Events Lifecycle Status Distribution" icon={Calendar}>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Published & Active</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{reports?.published_events || 0} Listings</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Pending Review</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{reports?.pending_events || 0} Listings</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Rejected Submissions</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{reports?.rejected_events || 0} Listings</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Historical Expired Events</span>
              <span className="font-bold text-slate-500">{reports?.expired_events || 0} Listings</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Sport Disciplinary Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Athletes per Sport Discipline" icon={Trophy}>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {reports?.athletes_per_sport?.length > 0 ? (
              reports.athletes_per_sport.map(item => (
                <div key={item.sport} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.sport}</span>
                  <Badge variant="primary" size="sm">{item.count} Athletes</Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No athlete disciplines logged.</p>
            )}
          </div>
        </Card>

        <Card title="Tournament Opportunities per Sport" icon={Calendar}>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {reports?.events_per_sport?.length > 0 ? (
              reports.events_per_sport.map(item => (
                <div key={item.sport} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.sport}</span>
                  <Badge variant="primary" size="sm" className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30">{item.count} Events</Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No events categorized.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminReportsPage;
