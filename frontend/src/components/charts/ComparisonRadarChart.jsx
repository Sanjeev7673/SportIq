import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { useChartTheme } from '../../hooks/useChartTheme';

const PLAYER_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const ComparisonRadarChart = ({
  players = [],
  height = 350
}) => {
  const { polarGridStroke, polarAngleFill, polarRadiusFill, tooltipContentStyle, legendTextStyle } = useChartTheme();

  if (!players || players.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-slate-400 dark:text-slate-500">
        Select players to generate multi-player comparison.
      </div>
    );
  }

  const metrics = ['Speed', 'Stamina', 'Strength', 'Agility', 'Accuracy'];

  const chartData = metrics.map((metric) => {
    const dataPoint = { metric };
    players.forEach((p, idx) => {
      const key = p.name || `Player #${idx + 1}`;
      const metricKey = `avg_${metric.toLowerCase()}`;
      dataPoint[key] = p[metricKey] || p[metric.toLowerCase()] || 0;
    });
    return dataPoint;
  });

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke={polarGridStroke} strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: polarAngleFill, fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: polarRadiusFill, fontSize: 9 }}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipContentStyle} />
          <Legend wrapperStyle={{ ...legendTextStyle, fontSize: '12px', paddingTop: '10px' }} />
          {players.map((p, idx) => {
            const key = p.name || `Player #${idx + 1}`;
            const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
            return (
              <Radar
                key={key}
                name={key}
                dataKey={key}
                stroke={color}
                fill={color}
                fillOpacity={0.25}
              />
            );
          })}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
export default ComparisonRadarChart;
