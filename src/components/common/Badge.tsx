import React from 'react';
import type { Role, AssetStatus, TicketPriority, TicketStatus } from '../../types';
import { Shield, Wrench, Eye, CheckCircle2, Clock, Check, XCircle } from 'lucide-react';

export const RoleBadge: React.FC<{ role: Role; size?: 'sm' | 'md' }> = ({ role, size = 'md' }) => {
  const configs = {
    Admin: {
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30 ring-purple-500/20',
      icon: <Shield className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
      label: 'Admin',
    },
    Technician: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30 ring-amber-500/20',
      icon: <Wrench className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
      label: 'Technician',
    },
    Viewer: {
      bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 ring-cyan-500/20',
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
  // Spec:
  // Open: Blue
  // In_progress: Yellow / Amber
  // Resolved: Emerald / Green
  // Closed: Slate / Gray
  const configs = {
    Open: {
      bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      icon: <Clock className="w-3.5 h-3.5" />,
      label: 'Open',
    },
    In_progress: {
      bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      icon: <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />,
      label: 'In Progress',
    },
    Resolved: {
      bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      icon: <Check className="w-3.5 h-3.5" />,
      label: 'Resolved',
    },
    Closed: {
      bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
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
      bg: 'bg-slate-800 text-slate-300 border-slate-700',
      dot: 'bg-slate-400',
    },
    Medium: {
      bg: 'bg-sky-950/80 text-sky-400 border-sky-800/60',
      dot: 'bg-sky-400',
    },
    High: {
      bg: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
      dot: 'bg-amber-400',
    },
    Critical: {
      bg: 'bg-rose-950/90 text-rose-300 border-rose-700 pulse-critical',
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
      bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: 'Active',
    },
    Under_maintenance: {
      bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      icon: <Wrench className="w-3.5 h-3.5" />,
      label: 'Under Maintenance',
    },
    Retired: {
      bg: 'bg-slate-700/40 text-slate-400 border-slate-700',
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
