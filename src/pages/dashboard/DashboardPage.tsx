import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  Wrench,
  Cpu,
  Ticket as TicketIcon,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi, ticketsApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { DashboardSummary, Ticket } from '../../types';
import { TicketStatusBadge, TicketPriorityBadge, RoleBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';

export const DashboardPage: React.FC = () => {
  const { user, isTechnician } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [assignedTickets, setAssignedTickets] = useState<Ticket[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const summaryRes = await dashboardApi.getSummary();
      setSummary(summaryRes.summary);

      // If user is logged in, fetch their assigned tickets
      if (user?.id) {
        const assignedRes = await ticketsApi.getAll({
          assigneeId: user.id,
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
  }, [user?.id, toastError]);

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

  // Data for Status Breakdown Donut
  const statusChartData = summary
    ? [
        { name: 'Open', value: summary.ticketsByStatus?.Open || 0, color: '#3b82f6' },
        { name: 'In Progress', value: summary.ticketsByStatus?.['In progress'] || 0, color: '#f59e0b' },
        { name: 'Resolved', value: summary.ticketsByStatus?.Resolved || 0, color: '#10b981' },
        { name: 'Closed', value: summary.ticketsByStatus?.Closed || 0, color: '#64748b' },
      ]
    : [];

  // Data for Priority Breakdown Bar Chart
  const priorityChartData = summary
    ? [
        { priority: 'Low', count: summary.ticketsByPriority?.Low || 0, fill: '#64748b' },
        { priority: 'Medium', count: summary.ticketsByPriority?.Medium || 0, fill: '#38bdf8' },
        { priority: 'High', count: summary.ticketsByPriority?.High || 0, fill: '#f59e0b' },
        { priority: 'Critical', count: summary.ticketsByPriority?.Critical || 0, fill: '#f43f5e' },
      ]
    : [];

  const ticketsToDisplay = isTechnician ? assignedTickets : recentTickets;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & Industrial Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Operational Command Center
            </h1>
            {user?.role && <RoleBadge role={user.role} size="md" />}
          </div>
          <p className="text-sm text-slate-400">
            Real-time telemetry, equipment uptime, and field work order lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/tickets?new=true')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Raise Ticket
          </Button>
          <Button
            variant="secondary"
            onClick={fetchDashboardData}
            title="Refresh metrics"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 3 Key Required Metric Stat Cards (plus 2 auxiliary metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Open Tickets */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Open Tickets</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-400">{summary?.openTickets ?? 0}</span>
            <span className="text-xs text-slate-400">active queue</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Awaiting technician pickup</div>
        </div>

        {/* 2. Overdue Tickets (Highlighted in vibrant Red per spec) */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 shadow-lg shadow-rose-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-300">Overdue SLA</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">{summary?.overdueTickets ?? 0}</span>
            <span className="text-xs text-rose-300/80 font-semibold">past due</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-300/70">Urgent field intervention required</div>
        </div>

        {/* 3. Assets Under Maintenance */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">In Maintenance</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">
              {summary?.assetsUnderMaintenance ?? 0}
            </span>
            <span className="text-xs text-slate-400">offline units</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Serviced or undergoing repairs</div>
        </div>

        {/* 4. Total Assets */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Assets</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">{summary?.totalAssets ?? 0}</span>
            <span className="text-xs text-emerald-400 font-semibold">
              {summary?.assetsByStatus?.Active ?? 0} active
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Across monitored plant sites</div>
        </div>

        {/* 5. Total Work Tickets */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Work Orders</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TicketIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">{summary?.totalTickets ?? 0}</span>
            <span className="text-xs text-slate-400">logged</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {summary?.ticketsByStatus?.Resolved ?? 0} resolved
          </div>
        </div>
      </div>

      {/* Visual Telemetry Charts (Two required charts per specification) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Tickets by Status (Pie / Donut Breakdown) */}
        <div className="lg:col-span-6 glass-card p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">Ticket Lifecycle Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Status breakdown of all maintenance tickets</p>
            </div>
            <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
              {summary?.totalTickets ?? 0} Total
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-xs shadow-xl">
                          <p className="font-bold text-slate-200">{data.name}</p>
                          <p className="text-sky-400 font-extrabold">{data.value} tickets</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-800/80">
            {statusChartData.map((item) => (
              <div key={item.name} className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-950/40">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-semibold text-slate-300">{item.name}</span>
                </div>
                <span className="text-sm font-extrabold text-slate-100">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Tickets by Priority (Distribution Bar Chart) */}
        <div className="lg:col-span-6 glass-card p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">Workload by Severity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tickets distributed across priority tiers</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="priority"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-xs shadow-xl">
                          <p className="font-bold text-slate-200">{data.priority} Priority</p>
                          <p className="text-sky-400 font-extrabold">{data.count} tickets</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Asset health overview bar */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
              <span>Plant Fleet Availability:</span>
              <span className="text-emerald-400 font-bold">
                {summary?.totalAssets
                  ? Math.round(((summary.assetsByStatus?.Active || 0) / summary.totalAssets) * 100)
                  : 0}
                % Operational
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{
                  width: `${
                    summary?.totalAssets
                      ? ((summary.assetsByStatus?.Active || 0) / summary.totalAssets) * 100
                      : 0
                  }%`,
                }}
                title="Active"
              />
              <div
                className="bg-amber-500 h-full"
                style={{
                  width: `${
                    summary?.totalAssets
                      ? ((summary.assetsByStatus?.['Under maintenance'] || 0) / summary.totalAssets) * 100
                      : 0
                  }%`,
                }}
                title="Under Maintenance"
              />
              <div
                className="bg-slate-600 h-full"
                style={{
                  width: `${
                    summary?.totalAssets
                      ? ((summary.assetsByStatus?.Retired || 0) / summary.totalAssets) * 100
                      : 0
                  }%`,
                }}
                title="Retired"
              />
            </div>
          </div>
        </div>
      </div>

      {/* "My Assigned Tickets" / Operational Worklist */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">
                {isTechnician ? 'My Assigned Tickets' : 'Recent Work Orders'}
              </h2>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                {ticketsToDisplay.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTechnician
                ? 'Tasks assigned directly to your field technician profile.'
                : 'Latest maintenance orders recorded across all equipment.'}
            </p>
          </div>

          <Link
            to={isTechnician ? `/tickets?assigneeId=${user?.id}` : '/tickets'}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
          >
            <span>View All in Tickets Hub</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {ticketsToDisplay.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <TicketIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold">No assigned tickets found</p>
            <p className="text-xs text-slate-400 mt-1">All work orders are up to date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Ticket Title</th>
                  <th className="py-3.5 px-4">Asset / Site</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {ticketsToDisplay.map((ticket) => {
                  const isOverdue =
                    new Date(ticket.dueDate).getTime() < Date.now() &&
                    ticket.status !== 'Resolved' &&
                    ticket.status !== 'Closed';

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <td className="py-4 px-6 font-semibold text-slate-100 max-w-xs">
                        <div className="truncate group-hover:text-sky-400 transition-colors">
                          {ticket.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                          ID: {ticket.id.slice(0, 8)}...
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-slate-200 font-medium truncate max-w-[180px]">
                          {ticket.asset?.name || 'Unknown Asset'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {ticket.asset?.site?.name || 'Unassigned Site'}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <TicketPriorityBadge priority={ticket.priority} size="sm" />
                      </td>

                      <td className="py-4 px-4">
                        <TicketStatusBadge status={ticket.status} size="sm" />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`} />
                          <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            {new Date(ticket.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-400 font-bold mt-0.5">
                            <AlertCircle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        {/* Contextual quick status step buttons */}
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
                            className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
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
