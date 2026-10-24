import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { useChartTheme } from '../../hooks/useChartTheme';

export const TalentRadarChart = ({
  speed = 50,
  stamina = 50,
  strength = 50,
  agility = 50,
  accuracy = 50,
  height = 300
}) => {
  const { polarGridStroke, polarAngleFill, polarRadiusFill, tooltipContentStyle } = useChartTheme();

  const data = [
    { metric: 'Speed', value: speed, fullMark: 100 },
    { metric: 'Stamina', value: stamina, fullMark: 100 },
    { metric: 'Strength', value: strength, fullMark: 100 },
    { metric: 'Agility', value: agility, fullMark: 100 },
    { metric: 'Accuracy', value: accuracy, fullMark: 100 },
  ];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
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
          <Radar
            name="Athletic Metric"
            dataKey="value"
            stroke="#06b6d4"
            fill="#06b6d4"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
export default TalentRadarChart;
