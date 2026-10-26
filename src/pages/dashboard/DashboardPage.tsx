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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(() => new Date());
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [activeChartTab, setActiveChartTab] = useState<'tickets' | 'fleet'>('tickets');
  const [hoveredStatusIndex, setHoveredStatusIndex] = useState<number | null>(null);
  const [hoveredAssetIndex, setHoveredAssetIndex] = useState<number | null>(null);

  const userId = user?.id;

  const fetchDashboardData = useCallback(
    async (isManual = false) => {
      try {
        if (isManual) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }

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

        const currentTimestamp = new Date();
        setLastRefreshedAt(currentTimestamp);
        setNow(currentTimestamp.getTime());

        if (isManual) {
          toastSuccess('Dashboard metrics and telemetry updated successfully', 'Refreshed');
        }
      } catch (err) {
        toastError(getErrorMessage(err), 'Failed to load dashboard metrics');
      } finally {
        setLoading(false);
        if (isManual) {
          setTimeout(() => {
            setIsRefreshing(false);
          }, 400);
        }
      }
    },
    [userId, toastError, toastSuccess]
  );

  useEffect(() => {
    fetchDashboardData(false);
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

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Live Telemetry Timestamp Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 px-2.5 py-1.5 rounded-lg shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry &bull; Updated {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
              title={`Refresh metrics (Last updated: ${lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`}
              leftIcon={
                <RefreshCw
                  className={`w-3.5 h-3.5 transition-transform duration-500 ${
                    isRefreshing ? 'animate-spin text-sky-600 dark:text-sky-400' : 'group-hover:rotate-180'
                  }`}
                />
              }
              size="sm"
              className="sm:text-sm group"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/tickets?new=true')}
              leftIcon={<Plus className="w-4 h-4" />}
              size="sm"
              className="sm:text-sm"
            >
              Raise Ticket
            </Button>
          </div>
        </div>
      </div>

      {/* 5 Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
        {/* 1. Open Tickets */}
        <div className="glass-card p-3.5 sm:p-4 rounded-xl sm:rounded-2xl relative overflow-hidden group hover:border-sky-400/50 transition-all flex flex-col justify-between h-full min-h-[115px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Open Tickets
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400 tracking-tight leading-none">
              {summary?.openTickets ?? 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">active queue</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Awaiting technician pickup</div>
        </div>

        {/* 2. Overdue Tickets */}
        <div className="glass-card p-3.5 sm:p-4 rounded-xl sm:rounded-2xl relative overflow-hidden group border-rose-300 dark:border-rose-500/40 bg-gradient-to-br from-rose-50/60 via-white to-white dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900 shadow-xs flex flex-col justify-between h-full min-h-[115px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Overdue SLA
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-100 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 flex items-center justify-center text-rose-600 dark:text-rose-400 animate-pulse shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight leading-none">
              {summary?.overdueTickets ?? 0}
            </span>
            <span className="text-xs text-rose-700 dark:text-rose-300/80 font-bold">past due</span>
          </div>
          <div className="text-[11px] text-rose-600/90 dark:text-rose-300/70 truncate">Urgent field intervention required</div>
        </div>

        {/* 3. Assets Under Maintenance */}
        <div className="glass-card p-3.5 sm:p-4 rounded-xl sm:rounded-2xl relative overflow-hidden group hover:border-amber-400/50 transition-all flex flex-col justify-between h-full min-h-[115px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              In Maintenance
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight leading-none">
              {summary?.assetsUnderMaintenance ?? 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">offline units</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Undergoing repair or service</div>
        </div>

        {/* 4. Total Assets */}
        <div className="glass-card p-3.5 sm:p-4 rounded-xl sm:rounded-2xl relative overflow-hidden group hover:border-emerald-400/50 transition-all flex flex-col justify-between h-full min-h-[115px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Assets
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              {summary?.totalAssets ?? 0}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {summary?.assetsByStatus?.Active ?? 0} active
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Across monitored plant sites</div>
        </div>

        {/* 5. Total Work Orders */}
        <div className="glass-card p-3.5 sm:p-4 rounded-xl sm:rounded-2xl relative overflow-hidden group hover:border-indigo-400/50 transition-all flex flex-col justify-between h-full min-h-[115px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Orders
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <TicketIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              {summary?.totalTickets ?? 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">recorded</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 animate-in fade-in duration-200">
            {/* Chart 1: Tickets by Status */}
            <div className="lg:col-span-6 glass-card p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-1.5">
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
              <div className="relative h-52 sm:h-56 lg:h-60 w-full flex items-center justify-center select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart style={{ outline: 'none' }}>
                    <Pie
                      data={statusChartData}
                      innerRadius={54}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => setHoveredStatusIndex(index)}
                      onMouseLeave={() => setHoveredStatusIndex(null)}
                      style={{ outline: 'none' }}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="none"
                          style={{ outline: 'none' }}
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
                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs shadow-xl select-none pointer-events-none">
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
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 transition-all duration-200 leading-none">
                    {hoveredStatusData ? hoveredStatusData.value : totalTickets}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 select-none">
                {statusChartData.map((item, idx) => {
                  const isHovered = hoveredStatusIndex === idx;
                  const pct = totalTickets > 0 ? Math.round((item.value / totalTickets) * 100) : 0;
                  return (
                    <div
                      key={item.name}
                      onMouseEnter={() => setHoveredStatusIndex(idx)}
                      onMouseLeave={() => setHoveredStatusIndex(null)}
                      className={`flex flex-col items-center text-center p-2 rounded-lg sm:rounded-xl transition-all cursor-pointer border ${
                        isHovered
                          ? 'bg-sky-50/80 dark:bg-slate-800/80 border-sky-300 dark:border-sky-500/50 shadow-xs'
                          : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className="w-2 h-2 rounded-full transition-transform"
                          style={{ backgroundColor: item.color, transform: isHovered ? 'scale(1.25)' : 'scale(1)' }}
                        />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[85px]">{item.name}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{item.value}</span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Tickets by Priority */}
            <div className="lg:col-span-6 glass-card p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-1.5">
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
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              <div className="h-52 sm:h-56 lg:h-60 w-full select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChartData} margin={{ top: 12, right: 10, left: -6, bottom: 0 }} style={{ outline: 'none' }}>
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
                      fontSize={11}
                      fontWeight={600}
                      tickLine={false}
                      axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                    />
                    <YAxis
                      width={26}
                      stroke={isDark ? '#94a3b8' : '#64748b'}
                      fontSize={11}
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                    />
                    <Tooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const pct = totalTickets > 0 ? Math.round((data.count / totalTickets) * 100) : 0;
                          return (
                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 px-3 py-2 rounded-xl text-xs shadow-xl min-w-[140px] select-none pointer-events-none">
                              <div className="flex items-center justify-between gap-3 mb-0.5">
                                <span className="font-bold text-slate-900 dark:text-slate-100">{data.priority} Priority</span>
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{data.sla}</span>
                              </div>
                              <div className="flex items-baseline justify-between gap-3">
                                <span className="text-sm font-extrabold" style={{ color: data.solidColor }}>{data.count} orders</span>
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
                    <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={32} style={{ outline: 'none' }}>
                      {priorityChartData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.fill} stroke="none" style={{ outline: 'none' }} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Quick SLA breakdown cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 select-none">
                {priorityChartData.map((item) => {
                  const pct = totalTickets > 0 ? Math.round((item.count / totalTickets) * 100) : 0;
                  return (
                    <div key={item.priority} className="flex flex-col items-center text-center p-2 rounded-lg sm:rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.solidColor }} />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.priority}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{item.count}</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 animate-in fade-in duration-200">
            {/* Fleet Chart: Asset Status Donut */}
            <div className="lg:col-span-6 glass-card p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-1.5">
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

              <div className="relative h-52 sm:h-56 lg:h-60 w-full flex items-center justify-center select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart style={{ outline: 'none' }}>
                    <Pie
                      data={assetChartData}
                      innerRadius={54}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => setHoveredAssetIndex(index)}
                      onMouseLeave={() => setHoveredAssetIndex(null)}
                      style={{ outline: 'none' }}
                    >
                      {assetChartData.map((entry, index) => (
                        <Cell
                          key={`asset-cell-${index}`}
                          fill={entry.color}
                          stroke="none"
                          style={{ outline: 'none' }}
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
                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs shadow-xl select-none pointer-events-none">
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
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 transition-all duration-200 leading-none">
                    {hoveredAssetData ? hoveredAssetData.value : `${uptimeRate}%`}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
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
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 select-none">
                {assetChartData.map((item, idx) => {
                  const isHovered = hoveredAssetIndex === idx;
                  const pct = totalAssets > 0 ? Math.round((item.value / totalAssets) * 100) : 0;
                  return (
                    <div
                      key={item.name}
                      onMouseEnter={() => setHoveredAssetIndex(idx)}
                      onMouseLeave={() => setHoveredAssetIndex(null)}
                      className={`flex flex-col items-center text-center p-2 rounded-lg sm:rounded-xl transition-all cursor-pointer border ${
                        isHovered
                          ? 'bg-emerald-50/80 dark:bg-slate-800/80 border-emerald-300 dark:border-emerald-500/50 shadow-xs'
                          : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className="w-2 h-2 rounded-full transition-transform"
                          style={{ backgroundColor: item.color, transform: isHovered ? 'scale(1.25)' : 'scale(1)' }}
                        />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{item.name}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{item.value}</span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fleet Reliability Health Rail */}
            <div className="lg:col-span-6 glass-card p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      Reliability & Service Health Index
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Operational capacity ratio and maintenance backlog impact
                    </p>
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>

                {/* Segmented Visual Availability Bar */}
                <div className="mt-3 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Overall Fleet Composition</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{uptimeRate}% Available</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
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
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                  <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/60">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Offline Impact</span>
                      <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                        {totalAssets > 0 ? ((maintenanceAssets / totalAssets) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {maintenanceAssets} {maintenanceAssets === 1 ? 'Unit' : 'Units'} Under Work
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Turbines, compressors, or pumps pulled for maintenance.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/60">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Resolution SLA</span>
                      <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
                        {resolutionRate}%
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {resolvedTickets} Closed Successfully
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Maintenance orders verified without repeat failures.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Navigation */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Access complete fleet registry:
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
        <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {ticketsToDisplay.length === 0 ? (
          <div className="p-8 sm:p-10 text-center text-slate-500 dark:text-slate-400">
            <TicketIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No assigned tickets found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All work orders are currently up to date.</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View (>= md screens) */}
            <div className="hidden md:block famt-table-container">
              <table className="w-full text-left text-sm min-w-[640px]">
                <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Work Order Title</th>
                    <th className="py-2.5 px-3.5">Asset / Site</th>
                    <th className="py-2.5 px-3.5">Priority</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5">Due Date</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
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
                        <td className="py-2.5 sm:py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 max-w-xs">
                          <div className="truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            {ticket.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                            ID: {ticket.id.slice(0, 8)}...
                          </div>
                        </td>

                        <td className="py-2.5 sm:py-3 px-3.5 text-xs">
                          <div className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[180px]">
                            {ticket.asset?.name || 'Unknown Asset'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {ticket.asset?.site?.name || 'Unassigned Site'}
                          </div>
                        </td>

                        <td className="py-2.5 sm:py-3 px-3.5">
                          <TicketPriorityBadge priority={ticket.priority} size="sm" />
                        </td>

                        <td className="py-2.5 sm:py-3 px-3.5">
                          <TicketStatusBadge status={ticket.status} size="sm" />
                        </td>

                        <td className="py-2.5 sm:py-3 px-3.5">
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

                        <td className="py-2.5 sm:py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
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

            {/* Mobile Card List View (< md screens, zero horizontal scroll required) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
              {ticketsToDisplay.map((ticket) => {
                const isOverdue =
                  new Date(ticket.dueDate).getTime() < now &&
                  ticket.status !== 'Resolved' &&
                  ticket.status !== 'Closed';

                return (
                  <div
                    key={ticket.id}
                    className="p-3.5 space-y-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {ticket.title}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          ID: {ticket.id.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <TicketPriorityBadge priority={ticket.priority} size="sm" />
                        <TicketStatusBadge status={ticket.status} size="sm" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="truncate max-w-[180px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {ticket.asset?.name || 'Unknown Asset'}
                        </span>
                        {ticket.asset?.site?.name && (
                          <span className="text-slate-400 dark:text-slate-500"> &bull; {ticket.asset.site.name}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
                        <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                          {new Date(ticket.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                          <AlertCircle className="w-3 h-3" /> SLA Overdue
                        </span>
                      ) : <span />}

                      <div className="flex items-center gap-2">
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
