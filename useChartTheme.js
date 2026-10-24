import { useTheme } from '../context/ThemeContext';

export const useChartTheme = () => {
  const { isDark } = useTheme();

  return {
    isDark,
    gridStroke: isDark ? '#1f2937' : '#e2e8f0',
    axisStroke: isDark ? '#6b7280' : '#64748b',
    tickFill: isDark ? '#9ca3af' : '#475569',
    polarGridStroke: isDark ? '#374151' : '#cbd5e1',
    polarAngleFill: isDark ? '#9ca3af' : '#334155',
    polarRadiusFill: isDark ? '#4b5563' : '#64748b',
    tooltipContentStyle: {
      backgroundColor: isDark ? '#111827' : '#ffffff',
      borderColor: isDark ? '#374151' : '#e2e8f0',
      borderRadius: '0.75rem',
      color: isDark ? '#f3f4f6' : '#0f172a',
      fontSize: '12px',
      boxShadow: isDark
        ? '0 10px 25px -5px rgba(0,0,0,0.5)'
        : '0 10px 25px -5px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
    },
    legendTextStyle: {
      color: isDark ? '#cbd5e1' : '#334155',
      fontSize: '11px',
    },
  };
};

export default useChartTheme;
