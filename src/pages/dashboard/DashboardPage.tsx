import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  Wrench,
  Cpu,
  Ticket as TicketIcon,
  Plus,
  ArrowRight,
  TrendingUp,
  Calendar,
  AlertCircle,
  RefreshCw,
  Activity,
  PieChart as PieChartIcon,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { dashboardApi, ticketsApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import type { DashboardSummary, Ticket } from '../../types';
import { TicketStatusBadge, TicketPriorityBadge, RoleBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { user, isTechnician } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [assignedTickets, setAssignedTickets] = useState<Ticket[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const [activeChartTab, setActiveChartTab] = useState<'tickets' | 'fleet'>('tickets');
  const [hoveredStatusIndex, setHoveredStatusIndex] = useState<number | null>(null);
  const [hoveredAssetIndex, setHoveredAssetIndex] = useState<number | null>(null);

  const userId = user?.id;

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const summaryRes = await dashboardApi.getSummary();
      setSummary(summaryRes.summary);

      // If user is logged in, fetch their assigned tickets
      if (userId) {
        const assignedRes = await ticketsApi.getAll({
          assigneeId: userId,
          limit: 6,
        });
        setAssignedTickets(assignedRes.tickets);
      }

      // Also fetch recent active tickets for overview
      const recentRes = await ticketsApi.getAll({
        limit: 6,
      });
      setRecentTickets(recentRes.tickets);
    } catch (err) {
      toastError(getErrorMessage(err), 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, [userId, toastError]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle rapid status progression from dashboard
  const handleProgressStatus = async (ticket: Ticket, nextStatus: 'In_progress' | 'Resolved' | 'Closed') => {
    try {
      setUpdatingTicketId(ticket.id);
      await ticketsApi.updateStatus(ticket.id, nextStatus);
      toastSuccess(`Ticket moved to ${nextStatus.replace('_', ' ')}`);
      await fetchDashboardData();
    } catch (err) {
      toastError(getErrorMessage(err), 'Status update failed');
    } finally {
      setUpdatingTicketId(null);
    }
  };

  if (loading && !summary) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Calculating operational telemetry..." size="lg" />
      </div>
    );
  }

  const totalTickets = summary?.totalTickets || 0;
  const resolvedTickets = summary?.ticketsByStatus?.Resolved || 0;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

  const totalAssets = summary?.totalAssets || 0;
  const activeAssets = summary?.assetsByStatus?.Active || 0;
  const maintenanceAssets = summary?.assetsByStatus?.['Under maintenance'] || 0;
  const retiredAssets = summary?.assetsByStatus?.Retired || 0;
  const uptimeRate = totalAssets > 0 ? Math.round((activeAssets / totalAssets) * 100) : 0;
  const criticalTickets = summary?.ticketsByPriority?.Critical || 0;

  // Data for Status Breakdown Donut
  const statusChartData = summary
    ? [
        {
          name: 'Open',
          value: summary.ticketsByStatus?.Open || 0,
          color: '#0284c7',
          textColor: 'text-sky-700 dark:text-sky-300',
          badgeBg: 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20',
          description: 'Awaiting triage or tech pickup',
        },
        {
          name: 'In Progress',
          value: summary.ticketsByStatus?.['In progress'] || 0,
          color: '#d97706',
          textColor: 'text-amber-700 dark:text-amber-300',
          badgeBg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
          description: 'Active field diagnostic & repair',
        },
        {
          name: 'Resolved',
          value: summary.ticketsByStatus?.Resolved || 0,
          color: '#059669',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
          description: 'Service completed successfully',
        },
        {
          name: 'Closed',
          value: summary.ticketsByStatus?.Closed || 0,
          color: '#64748b',
          textColor: 'text-slate-700 dark:text-slate-300',
          badgeBg: 'bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20',
          description: 'Archived maintenance record',
        },
      ]
    : [];

  // Data for Priority Breakdown Bar Chart
  const priorityChartData = summary
    ? [
        {
          priority: 'Low',
          count: summary.ticketsByPriority?.Low || 0,
          fill: 'url(#lowPriorityGrad)',
          solidColor: '#64748b',
          sla: '72h SLA',
          textColor: 'text-slate-700 dark:text-slate-300',
          badgeBg: 'bg-slate-100 dark:bg-slate-800',
        },
        {
          priority: 'Medium',
          count: summary.ticketsByPriority?.Medium || 0,
          fill: 'url(#medPriorityGrad)',
          solidColor: '#0284c7',
          sla: '24h SLA',
          textColor: 'text-sky-700 dark:text-sky-300',
          badgeBg: 'bg-sky-50 dark:bg-sky-500/15',
        },
        {
          priority: 'High',
          count: summary.ticketsByPriority?.High || 0,
          fill: 'url(#highPriorityGrad)',
          solidColor: '#d97706',
          sla: '8h SLA',
          textColor: 'text-amber-700 dark:text-amber-300',
          badgeBg: 'bg-amber-50 dark:bg-amber-500/15',
        },
        {
          priority: 'Critical',
          count: summary.ticketsByPriority?.Critical || 0,
          fill: 'url(#critPriorityGrad)',
          solidColor: '#e11d48',
          sla: '2h SLA Urgent',
          textColor: 'text-rose-700 dark:text-rose-300',
          badgeBg: 'bg-rose-50 dark:bg-rose-500/15',
        },
      ]
    : [];

  // Data for Asset Status Breakdown
  const assetChartData = summary
    ? [
        {
          name: 'Active',
          value: activeAssets,
          color: '#10b981',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
          description: 'Online & operating at nominal parameters',
        },
        {
          name: 'In Maintenance',
          value: maintenanceAssets,
          color: '#f59e0b',
          textColor: 'text-amber-700 dark:text-amber-300',
          badgeBg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
          description: 'Undergoing repair or inspection',
        },
        {
          name: 'Retired',
          value: retiredAssets,
          color: '#64748b',
          textColor: 'text-slate-700 dark:text-slate-300',
          badgeBg: 'bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20',
          description: 'Decommissioned from plant operations',
        },
      ]
    : [];

  const hoveredStatusData = hoveredStatusIndex !== null ? statusChartData[hoveredStatusIndex] : null;
  const hoveredAssetData = hoveredAssetIndex !== null ? assetChartData[hoveredAssetIndex] : null;

  const ticketsToDisplay = isTechnician ? assignedTickets : recentTickets;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & Industrial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Operational Command Center
            </h1>
            {user?.role && <RoleBadge role={user.role} size="md" />}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time telemetry, equipment uptime, and field work order lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <Button
            variant="primary"
            onClick={() => navigate('/tickets?new=true')}
            leftIcon={<Plus className="w-4 h-4" />}
            size="sm"
            className="sm:text-sm"
          >
            Raise Ticket
          </Button>
          <Button
            variant="secondary"
            onClick={fetchDashboardData}
            title="Refresh metrics"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            size="sm"
            className="sm:text-sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 5 Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* 1. Open Tickets */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group hover:border-sky-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Open Tickets
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400 tracking-tight">
              {summary?.openTickets ?? 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">active queue</span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">Awaiting technician pickup</div>
        </div>

        {/* 2. Overdue Tickets (Highlighted in vibrant Alert Red per spec) */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group border-rose-300 dark:border-rose-500/40 bg-gradient-to-br from-rose-50/60 via-white to-white dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Overdue SLA
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-100 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 flex items-center justify-center text-rose-600 dark:text-rose-400 animate-pulse">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
              {summary?.overdueTickets ?? 0}
            </span>
            <span className="text-xs text-rose-700 dark:text-rose-300/80 font-bold">past due</span>
          </div>
          <div className="mt-1.5 text-[11px] text-rose-600/90 dark:text-rose-300/70">Urgent field intervention required</div>
        </div>

        {/* 3. Assets Under Maintenance */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group hover:border-amber-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              In Maintenance
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              {summary?.assetsUnderMaintenance ?? 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">offline units</span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">Undergoing repair or service</div>
        </div>

        {/* 4. Total Assets */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Assets
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {summary?.totalAssets ?? 0}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {summary?.assetsByStatus?.Active ?? 0} active
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">Across monitored plant sites</div>
        </div>

        {/* 5. Total Work Orders */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Work Orders
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TicketIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {summary?.totalTickets ?? 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">recorded</span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            {summary?.ticketsByStatus?.Resolved ?? 0} resolved successfully
          </div>
        </div>
      </div>

      {/* Visual Telemetry Charts & Controls */}
      <div className="space-y-4">
        {/* Section Header with Segmented Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Operational Telemetry & Insights
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live breakdown of maintenance throughput, service severity, and equipment availability.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Switcher Tabs */}
            <div className="flex p-1 bg-slate-100/90 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveChartTab('tickets')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === 'tickets'
                    ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 shadow-xs border border-slate-200/80 dark:border-slate-700/60'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Work Orders</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveChartTab('fleet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === 'fleet'
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs border border-slate-200/80 dark:border-slate-700/60'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Fleet Health</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: WORK ORDER ANALYTICS */}
        {activeChartTab === 'tickets' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* Chart 1: Tickets by Status */}
            <div className="lg:col-span-6 glass-card p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Ticket Lifecycle Distribution
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live progression across workflow states
                  </p>
                </div>
                <span className="text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-200 dark:border-sky-500/20">
                  {totalTickets} Total
                </span>
              </div>

              {/* Donut with Interactive Central Metric */}
              <div className="relative h-64 sm:h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      innerRadius={65}
                      outerRadius={92}
                      paddingAngle={4}
                      dataKey="value"
                      onMouseEnter={(_, index) => setHoveredStatusIndex(index)}
                      onMouseLeave={() => setHoveredStatusIndex(null)}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={isDark ? '#0f172a' : '#ffffff'}
                          strokeWidth={hoveredStatusIndex === index ? 3 : 1}
                          className="transition-all duration-200 cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const pct = totalTickets > 0 ? Math.round((data.value / totalTickets) * 100) : 0;
                          return (
                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs shadow-xl">
                              <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                                {data.name}
                              </p>
                              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{data.description}</p>
                              <p className="font-extrabold mt-1 text-slate-900 dark:text-slate-100">
                                {data.value} tickets ({pct}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Central Telemetry Metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 transition-all duration-200">
                    {hoveredStatusData ? hoveredStatusData.value : totalTickets}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                    {hoveredStatusData ? hoveredStatusData.name : 'Total Orders'}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mt-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20">
                    {hoveredStatusData
                      ? `${totalTickets > 0 ? Math.round((hoveredStatusData.value / totalTickets) * 100) : 0}% share`
                      : `${resolutionRate}% resolved`}
                  </span>
                </div>
              </div>

              {/* Interactive Legend Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                {statusChartData.map((item, idx) => {
                  const isHovered = hoveredStatusIndex === idx;
                  const pct = totalTickets > 0 ? Math.round((item.value / totalTickets) * 100) : 0;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onMouseEnter={() => setHoveredStatusIndex(idx)}
                      onMouseLeave={() => setHoveredStatusIndex(null)}
                      onClick={() => setHoveredStatusIndex(hoveredStatusIndex === idx ? null : idx)}
                      className={`flex flex-col items-center text-center p-2.5 rounded-xl transition-all cursor-pointer border ${
                        isHovered
                          ? 'bg-sky-50/80 dark:bg-slate-800/80 border-sky-300 dark:border-sky-500/50 shadow-sm'
                          : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full transition-transform"
                          style={{ backgroundColor: item.color, transform: isHovered ? 'scale(1.25)' : 'scale(1)' }}
                        />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[85px]">{item.name}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">{item.value}</span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">({pct}%)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Tickets by Priority */}
            <div className="lg:col-span-6 glass-card p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      Workload by Severity
                    </h3>
                    {criticalTickets > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        {criticalTickets} Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tickets distributed across priority tiers & SLA requirements
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="lowPriorityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#64748b" stopOpacity={0.9} />
                      </linearGradient>
                      <linearGradient id="medPriorityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity={0.95} />
                      </linearGradient>
                      <linearGradient id="highPriorityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0.95} />
                      </linearGradient>
                      <linearGradient id="critPriorityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb7185" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#e11d48" stopOpacity={0.95} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={isDark ? '#1e293b' : '#f1f5f9'}
                    />
                    <XAxis
                      dataKey="priority"
                      stroke={isDark ? '#94a3b8' : '#64748b'}
                      fontSize={12}
                      fontWeight={600}
                      tickLine={false}
                      axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                    />
                    <YAxis
                      stroke={isDark ? '#94a3b8' : '#64748b'}
                      fontSize={12}
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                    />
                    <Tooltip
                      cursor={{ fill: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(2, 132, 199, 0.04)', radius: 8 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const pct = totalTickets > 0 ? Math.round((data.count / totalTickets) * 100) : 0;
                          return (
                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 px-3.5 py-2.5 rounded-xl text-xs shadow-xl min-w-[150px]">
                              <div className="flex items-center justify-between gap-3 mb-1">
                                <span className="font-bold text-slate-900 dark:text-slate-100">{data.priority} Priority</span>
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{data.sla}</span>
                              </div>
                              <div className="flex items-baseline justify-between gap-3">
                                <span className="text-base font-extrabold" style={{ color: data.solidColor }}>{data.count} orders</span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {pct}% workload
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {priorityChartData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Quick SLA breakdown cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                {priorityChartData.map((item) => {
                  const pct = totalTickets > 0 ? Math.round((item.count / totalTickets) * 100) : 0;
                  return (
                    <div key={item.priority} className="flex flex-col items-center text-center p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.solidColor }} />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.priority}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">{item.count}</span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">({pct}%)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.sla}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FLEET RELIABILITY & UPTIME */}
        {activeChartTab === 'fleet' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* Fleet Chart: Asset Status Donut */}
            <div className="lg:col-span-6 glass-card p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Plant Machinery Availability
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Equipment distribution across operational readiness states
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                  {totalAssets} Total Assets
                </span>
              </div>

              <div className="relative h-64 sm:h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetChartData}
                      innerRadius={65}
                      outerRadius={92}
                      paddingAngle={4}
                      dataKey="value"
                      onMouseEnter={(_, index) => setHoveredAssetIndex(index)}
                      onMouseLeave={() => setHoveredAssetIndex(null)}
                    >
                      {assetChartData.map((entry, index) => (
                        <Cell
                          key={`asset-cell-${index}`}
                          fill={entry.color}
                          stroke={isDark ? '#0f172a' : '#ffffff'}
                          strokeWidth={hoveredAssetIndex === index ? 3 : 1}
                          className="transition-all duration-200 cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const pct = totalAssets > 0 ? Math.round((data.value / totalAssets) * 100) : 0;
                          return (
                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs shadow-xl">
                              <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                                {data.name}
                              </p>
                              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{data.description}</p>
                              <p className="font-extrabold mt-1 text-slate-900 dark:text-slate-100">
                                {data.value} equipment units ({pct}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Central Telemetry Metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 transition-all duration-200">
                    {hoveredAssetData ? hoveredAssetData.value : `${uptimeRate}%`}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                    {hoveredAssetData ? hoveredAssetData.name : 'Fleet Uptime'}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mt-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20">
                    {hoveredAssetData
                      ? `${totalAssets > 0 ? Math.round((hoveredAssetData.value / totalAssets) * 100) : 0}% fleet share`
                      : `${activeAssets} of ${totalAssets} online`}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                {assetChartData.map((item, idx) => {
                  const isHovered = hoveredAssetIndex === idx;
                  const pct = totalAssets > 0 ? Math.round((item.value / totalAssets) * 100) : 0;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onMouseEnter={() => setHoveredAssetIndex(idx)}
                      onMouseLeave={() => setHoveredAssetIndex(null)}
                      onClick={() => setHoveredAssetIndex(hoveredAssetIndex === idx ? null : idx)}
                      className={`flex flex-col items-center text-center p-2.5 rounded-xl transition-all cursor-pointer border ${
                        isHovered
                          ? 'bg-emerald-50/80 dark:bg-slate-800/80 border-emerald-300 dark:border-emerald-500/50 shadow-sm'
                          : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full transition-transform"
                          style={{ backgroundColor: item.color, transform: isHovered ? 'scale(1.25)' : 'scale(1)' }}
                        />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{item.name}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">{item.value}</span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">({pct}%)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fleet Reliability Health Rail */}
            <div className="lg:col-span-6 glass-card p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      Reliability & Service Health Index
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Operational capacity ratio and maintenance backlog impact
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                {/* Segmented Visual Availability Bar */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Overall Fleet Composition</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{uptimeRate}% Available</span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${totalAssets > 0 ? (activeAssets / totalAssets) * 100 : 0}%` }}
                      className="bg-emerald-500 h-full transition-all duration-500"
                      title={`Active: ${activeAssets}`}
                    />
                    <div
                      style={{ width: `${totalAssets > 0 ? (maintenanceAssets / totalAssets) * 100 : 0}%` }}
                      className="bg-amber-500 h-full transition-all duration-500"
                      title={`Maintenance: ${maintenanceAssets}`}
                    />
                    <div
                      style={{ width: `${totalAssets > 0 ? (retiredAssets / totalAssets) * 100 : 0}%` }}
                      className="bg-slate-400 dark:bg-slate-600 h-full transition-all duration-500"
                      title={`Retired: ${retiredAssets}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Active ({totalAssets > 0 ? Math.round((activeAssets / totalAssets) * 100) : 0}%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Maintenance ({totalAssets > 0 ? Math.round((maintenanceAssets / totalAssets) * 100) : 0}%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      Retired ({totalAssets > 0 ? Math.round((retiredAssets / totalAssets) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                {/* 2 Strategic Breakdown Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Offline Impact</span>
                      <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                        {totalAssets > 0 ? ((maintenanceAssets / totalAssets) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {maintenanceAssets} {maintenanceAssets === 1 ? 'Unit' : 'Units'} Undergoing Work
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Turbines, compressors, or pumps pulled for maintenance.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Resolution SLA Ratio</span>
                      <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
                        {resolutionRate}%
                      </span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {resolvedTickets} Closed Successfully
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Maintenance orders verified without repeat failures.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Navigation */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Access complete registry with serial numbers and plant sites:
                </span>
                <Link
                  to="/assets"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors"
                >
                  <span>Explore Asset Fleet</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assigned / Recent Work Orders Table */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {isTechnician ? 'My Assigned Work Orders' : 'Recent Work Orders'}
              </h2>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                {ticketsToDisplay.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isTechnician
                ? 'Tasks assigned directly to your field technician profile.'
                : 'Latest maintenance orders recorded across all equipment.'}
            </p>
          </div>

          <Link
            to={isTechnician && user?.id ? `/tickets?assigneeId=${user.id}` : '/tickets'}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors"
          >
            <span>View All in Tickets Hub</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {ticketsToDisplay.length === 0 ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400">
            <TicketIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No assigned tickets found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All work orders are currently up to date.</p>
          </div>
        ) : (
          <div className="famt-table-container">
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-5">Work Order Title</th>
                  <th className="py-3 px-4">Asset / Site</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {ticketsToDisplay.map((ticket) => {
                  const isOverdue =
                    new Date(ticket.dueDate).getTime() < now &&
                    ticket.status !== 'Resolved' &&
                    ticket.status !== 'Closed';

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-slate-100 max-w-xs">
                        <div className="truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {ticket.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                          ID: {ticket.id.slice(0, 8)}...
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[180px]">
                          {ticket.asset?.name || 'Unknown Asset'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {ticket.asset?.site?.name || 'Unassigned Site'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <TicketPriorityBadge priority={ticket.priority} size="sm" />
                      </td>

                      <td className="py-3.5 px-4">
                        <TicketStatusBadge status={ticket.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
                          <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                            {new Date(ticket.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                            <AlertCircle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        {ticket.status === 'Open' && (user?.role === 'Admin' || ticket.assigneeId === user?.id) && (
                          <Button
                            size="sm"
                            variant="secondary"
                            isLoading={updatingTicketId === ticket.id}
                            onClick={() => handleProgressStatus(ticket, 'In_progress')}
                          >
                            Start Work
                          </Button>
                        )}

                        {ticket.status === 'In_progress' && (user?.role === 'Admin' || ticket.assigneeId === user?.id) && (
                          <Button
                            size="sm"
                            variant="success"
                            isLoading={updatingTicketId === ticket.id}
                            onClick={() => handleProgressStatus(ticket, 'Resolved')}
                          >
                            Resolve
                          </Button>
                        )}

                        {ticket.status === 'Resolved' && (user?.role === 'Admin' || ticket.assigneeId === user?.id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={updatingTicketId === ticket.id}
                            onClick={() => handleProgressStatus(ticket, 'Closed')}
                          >
                            Close
                          </Button>
                        )}

                        {ticket.status === 'Closed' && (
                          <button
                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            Details &rarr;
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
