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
          ? 'bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border-[var(--border-color)] shadow-sm'
          : 'bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border-[var(--border-color)] shadow-sm'
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
