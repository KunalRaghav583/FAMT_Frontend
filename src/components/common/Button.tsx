import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] select-none';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 min-h-[34px] gap-1.5',
    md: 'text-sm px-4 py-2 min-h-[40px] gap-2',
    lg: 'text-base px-6 py-2.5 min-h-[46px] gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-sm hover:shadow-md shadow-sky-500/20 border border-sky-400/40',
    secondary:
      'bg-slate-100 hover:bg-slate-200/90 text-slate-800 border border-slate-200/90 shadow-xs dark:bg-slate-800 dark:hover:bg-slate-700/90 dark:text-slate-200 dark:border-slate-700/80 dark:shadow-sm',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-sm hover:shadow-md shadow-rose-600/20 border border-rose-500/30',
    success:
      'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-md shadow-emerald-600/20 border border-emerald-500/30',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 dark:hover:bg-slate-800/60 dark:text-slate-300 dark:hover:text-white',
    outline:
      'bg-transparent border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 dark:border-slate-700 dark:hover:border-slate-500 dark:text-slate-300 dark:hover:text-white',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span className="truncate">{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

