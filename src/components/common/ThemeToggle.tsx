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
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        className={`relative inline-flex items-center h-7 w-14 p-0.5 rounded-full cursor-pointer transition-colors duration-300 select-none border outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 shadow-inner ${
          isDark
            ? 'bg-slate-800 border-slate-700/80 shadow-black/40'
            : 'bg-amber-100 border-amber-300 shadow-amber-900/10'
        }`}
      >
        {/* Track Icons */}
        <Sun
          className={`w-3.5 h-3.5 text-amber-500 absolute left-1.5 transition-opacity duration-200 pointer-events-none ${
            isDark ? 'opacity-40' : 'opacity-0'
          }`}
        />
        <Moon
          className={`w-3.5 h-3.5 text-sky-400 absolute right-1.5 transition-opacity duration-200 pointer-events-none ${
            isDark ? 'opacity-0' : 'opacity-40'
          }`}
        />

        {/* Sliding Toggle Thumb */}
        <span
          className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 transform shadow-md ${
            isDark
              ? 'translate-x-7 bg-slate-900 text-sky-400 border border-slate-700 shadow-black/50'
              : 'translate-x-0 bg-white text-amber-500 border border-amber-200 shadow-amber-500/20'
          }`}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-sky-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
        </span>
      </button>

      {showLabel && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;

