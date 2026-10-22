import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-95 border outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
        isDark
          ? 'bg-slate-800/90 hover:bg-slate-700/90 text-sky-400 border-slate-700/80 hover:border-sky-500/40 shadow-sm hover:shadow-sky-500/10'
          : 'bg-white hover:bg-slate-50 text-amber-600 border-slate-200 hover:border-amber-400/60 shadow-xs hover:shadow-amber-500/15'
      } ${className}`}
      title={isDark ? 'Switch to Mirror Light Theme' : 'Switch to Obsidian Dark Theme'}
      aria-label={isDark ? 'Switch to Mirror Light Theme' : 'Switch to Obsidian Dark Theme'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-sky-400 transition-transform duration-200 group-hover:-rotate-12" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-transform duration-200 group-hover:rotate-45" />
        )}
      </div>
      <span className="text-xs font-semibold tracking-tight text-slate-700 dark:text-slate-200">
        {isDark ? 'Dark' : 'Light'}
      </span>
      {showLabel && (
        <span className="text-[10px] uppercase font-mono tracking-wider opacity-70">
          Mode
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
