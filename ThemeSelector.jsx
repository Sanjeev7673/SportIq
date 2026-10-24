import React from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, THEME_MODES } from '../../context/ThemeContext';

export const ThemeSelector = ({ className = '', layout = 'grid' }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const options = [
    {
      id: THEME_MODES.LIGHT,
      title: 'Light',
      description: 'Clean high-contrast daytime theme',
      icon: Sun,
      color: 'text-amber-500',
    },
    {
      id: THEME_MODES.DARK,
      title: 'Dark',
      description: 'Focused dark mode for lower eye strain',
      icon: Moon,
      color: 'text-cyan-400',
    },
    {
      id: THEME_MODES.SYSTEM,
      title: 'System',
      description: `Follows device OS (Currently ${resolvedTheme})`,
      icon: Laptop,
      color: 'text-indigo-400',
    },
  ];

  return (
    <div className={`w-full ${className}`}>
      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-3 gap-3'
            : 'flex flex-col sm:flex-row gap-3'
        }
        role="radiogroup"
        aria-label="Appearance Theme Selection"
      >
        {options.map((opt) => {
          const isSelected = theme === opt.id;
          const Icon = opt.icon;

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(opt.id)}
              className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md shadow-cyan-500/10'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={`p-2 rounded-xl border ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-500 dark:text-cyan-400'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 ' + opt.color
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-cyan-500 border-cyan-500 text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <div className="space-y-0.5">
                <span
                  className={`text-sm font-bold tracking-tight block ${
                    isSelected
                      ? 'text-cyan-600 dark:text-cyan-300'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {opt.title}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block leading-tight">
                  {opt.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeSelector;
