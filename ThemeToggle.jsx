import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = ({ className = '', size = 'md' }) => {
  const { isDark, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'p-1.5 rounded-lg text-xs',
    md: 'p-2 rounded-xl text-sm',
    lg: 'p-2.5 rounded-xl text-base',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex items-center justify-center transition-all duration-200 border cursor-pointer ${
        isDark
          ? 'bg-slate-800/80 text-amber-300 hover:text-amber-200 hover:bg-slate-700/80 border-slate-700 shadow-sm'
          : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border-slate-300 shadow-sm'
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {isDark ? (
        <Sun className={`${iconSizes[size] || iconSizes.md} transition-transform duration-200 hover:rotate-45`} />
      ) : (
        <Moon className={`${iconSizes[size] || iconSizes.md} transition-transform duration-200 hover:-rotate-12`} />
      )}
    </button>
  );
};

export default ThemeToggle;
