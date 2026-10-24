import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  BarChart3,
  Activity,
  Users,
  BrainCircuit,
  TrendingUp,
  Award,
  Zap,
  Server
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useChartTheme } from '../../hooks/useChartTheme';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const ROLE_COLORS = {
  PLAYER: '#06b6d4',
  COACH: '#3b82f6',
  SCOUT: '#8b5cf6',
  ADMIN: '#f59e0b',
};

export const SystemAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { gridStroke, axisStroke, tooltipContentStyle, legendTextStyle } = useChartTheme();

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await adminService.getPlatformStats();
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <Loader message="Compiling platform-wide intelligence..." className="py-24" />;
  }

  const rolePieData = stats?.users_by_role
    ? Object.entries(stats.users_by_role).map(([role, count]) => ({
        name: role,
        value: count,
      }))
    : [];

  const sportBarData = stats?.players_per_sport
    ? stats.players_per_sport.map((item) => ({
        sport: item.sport,
        athletes: item.count,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">System & Platform Analytics</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Real-time platform throughput, ecosystem breakdown, and AI inference volume</p>
      </div>

      {/* Health & Throughput Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-cyan-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Users</span>
            <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">{stats?.total_users || 0}</span>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Athletes</span>
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-display">{stats?.total_players || 0}</span>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-amber-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Performance Logs</span>
            <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-display">{stats?.total_performance_records || 0}</span>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">AI Inferences</span>
            <BrainCircuit className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-display">{stats?.total_ai_assessments || 0}</span>
        </Card>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sport Distribution Bar Chart */}
        <Card title="Athletes per Sport Discipline" subtitle="Distribution of registered athletic talent">
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sportBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="sport" stroke={axisStroke} fontSize={11} tickLine={false} />
                <YAxis stroke={axisStroke} fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipContentStyle} />
                <Bar dataKey="athletes" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* User Roles Pie Chart */}
        <Card title="Platform User Demographics" subtitle="Role proportions across platform accounts">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rolePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {rolePieData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={ROLE_COLORS[entry.name] || '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipContentStyle} />
                <Legend wrapperStyle={{ ...legendTextStyle, fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default SystemAnalytics;
