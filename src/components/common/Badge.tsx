import React from 'react';
import type { Role, AssetStatus, TicketPriority, TicketStatus } from '../../types';
import { Shield, Wrench, Eye, CheckCircle2, Clock, Check, XCircle } from 'lucide-react';

export const RoleBadge: React.FC<{ role: Role; size?: 'sm' | 'md' }> = ({ role, size = 'md' }) => {
  const configs = {
    Admin: {
      bg: 'bg-purple-50 text-purple-700 border-purple-200/90 ring-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30',
      icon: <Shield className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
      label: 'Admin',
    },
    Technician: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200/90 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
      icon: <Wrench className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
      label: 'Technician',
    },
    Viewer: {
      bg: 'bg-cyan-50 text-cyan-700 border-cyan-200/90 ring-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30',
      icon: <Eye className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
      label: 'Viewer',
    },
  };

  const config = configs[role] || configs.Viewer;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ring-1 ${config.bg} ${padding} transition-all`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

export const TicketStatusBadge: React.FC<{ status: TicketStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const configs = {
    Open: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30',
      icon: <Clock className="w-3.5 h-3.5" />,
      label: 'Open',
    },
    In_progress: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
      icon: <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />,
      label: 'In Progress',
    },
    Resolved: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
      icon: <Check className="w-3.5 h-3.5" />,
      label: 'Resolved',
    },
    Closed: {
      bg: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: 'Closed',
    },
  };

  const config = configs[status] || configs.Open;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-md border ${config.bg} ${padding}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

export const TicketPriorityBadge: React.FC<{ priority: TicketPriority; size?: 'sm' | 'md' }> = ({
  priority,
  size = 'md',
}) => {
  const configs = {
    Low: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
    Medium: {
      bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/80 dark:text-sky-400 dark:border-sky-800/60',
      dot: 'bg-sky-500 dark:bg-sky-400',
    },
    High: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-800/60',
      dot: 'bg-amber-500 dark:bg-amber-400',
    },
    Critical: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200 pulse-critical dark:bg-rose-950/90 dark:text-rose-300 dark:border-rose-700',
      dot: 'bg-rose-500 animate-ping',
    },
  };

  const config = configs[priority] || configs.Low;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-md border ${config.bg} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {priority}
    </span>
  );
};

export const AssetStatusBadge: React.FC<{ status: AssetStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const configs = {
    Active: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: 'Active',
    },
    Under_maintenance: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
      icon: <Wrench className="w-3.5 h-3.5" />,
      label: 'Under Maintenance',
    },
    Retired: {
      bg: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/40 dark:text-slate-400 dark:border-slate-700',
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: 'Retired',
    },
  };

  const config = configs[status] || configs.Active;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${padding}`}>
      {config.icon}
      {config.label}
    </span>
  );
};
