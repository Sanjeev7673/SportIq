import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatDate } from '../../utils/formatters';
import { useChartTheme } from '../../hooks/useChartTheme';

export const PerformanceTrendChart = ({
  records = [],
  height = 300
}) => {
  const { gridStroke, axisStroke, tooltipContentStyle, legendTextStyle } = useChartTheme();

  if (!records || records.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-slate-400 dark:text-slate-500">
        No assessment records logged yet.
      </div>
    );
  }

  const chartData = records.map((r, idx) => ({
    date: formatDate(r.assessment_date) || `Session #${idx + 1}`,
    Speed: r.speed,
    Stamina: r.stamina,
    Strength: r.strength,
    Agility: r.agility,
    Accuracy: r.accuracy,
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorStamina" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis dataKey="date" stroke={axisStroke} fontSize={11} tickLine={false} />
          <YAxis domain={[0, 100]} stroke={axisStroke} fontSize={11} tickLine={false} />
          <Tooltip contentStyle={tooltipContentStyle} />
          <Legend wrapperStyle={{ ...legendTextStyle, paddingTop: '10px' }} />
          <Area type="monotone" dataKey="Speed" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorSpeed)" />
          <Area type="monotone" dataKey="Stamina" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorStamina)" />
          <Area type="monotone" dataKey="Strength" stroke="#f59e0b" strokeWidth={2} fill="none" />
          <Area type="monotone" dataKey="Agility" stroke="#8b5cf6" strokeWidth={2} fill="none" />
          <Area type="monotone" dataKey="Accuracy" stroke="#ec4899" strokeWidth={2} fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
export default PerformanceTrendChart;
