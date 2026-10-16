import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Ticket as TicketIcon,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { ticketsApi, assetsApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type {
  Ticket,
  Asset,
  TicketStatus,
  TicketPriority,
  PaginationMetadata,
} from '../../types';
import {
  TicketStatusBadge,
  TicketPriorityBadge,
} from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

// Known seeded technician
const SEEDED_TECH = {
  id: '182f4407-8a52-4276-8426-1ca8c97c12bb',
  name: 'Field Service Technician',
  email: 'tech@famt.dev',
};

export const TicketsPage: React.FC = () => {
  const { user, isAdmin, isTechnician } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Filters from URL or state
  const statusParam = (searchParams.get('status') as TicketStatus | null) || '';
  const priorityParam = (searchParams.get('priority') as TicketPriority | null) || '';
  const assigneeIdParam = searchParams.get('assigneeId') || '';

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | ''>(statusParam);
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | ''>(priorityParam);
  const [onlyMyTickets, setOnlyMyTickets] = useState<boolean>(assigneeIdParam === user?.id);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get('new') === 'true');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<TicketPriority>('Medium');
  const [formDueDate, setFormDueDate] = useState('');
  const [formAssetId, setFormAssetId] = useState('');
  const [formAssigneeId, setFormAssigneeId] = useState<string>(SEEDED_TECH.id);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load available assets for dropdown
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const res = await assetsApi.getAll({ limit: 100 });
        setAssets(res.assets);
      } catch {
        // Handled silently
      }
    };
    loadAssets();
  }, []);

  // Fetch tickets
  const fetchTickets = useCallback(
    async (pageToLoad = 1) => {
      try {
        setLoading(true);
        const res = await ticketsApi.getAll({
          status: selectedStatus || undefined,
          priority: selectedPriority || undefined,
          assigneeId: onlyMyTickets && user?.id ? user.id : undefined,
          page: pageToLoad,
          limit: 10,
        });
        setTickets(res.tickets);
        setPagination(res.pagination);
      } catch (err) {
        toastError(getErrorMessage(err), 'Failed to fetch tickets');
      } finally {
        setLoading(false);
      }
    },
    [selectedStatus, selectedPriority, onlyMyTickets, user?.id, toastError]
  );

  useEffect(() => {
    fetchTickets(1);
  }, [fetchTickets]);

  // Handle URL query changes (e.g. from dashboard links)
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      handleOpenCreate();
      // clean param
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    if (searchParams.get('assigneeId') === user?.id) {
      setOnlyMyTickets(true);
    }
  }, [searchParams, user?.id, setSearchParams]);

  const handleOpenCreate = () => {
    setFormTitle('');
    setFormDescription('');
    setFormPriority('Medium');
    // Default due date: 7 days from now
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setFormDueDate(nextWeek.toISOString().slice(0, 16));
    setFormAssetId(assets[0]?.id || '');
    setFormAssigneeId(SEEDED_TECH.id);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAssetId) {
      toastError('Please select an asset equipment');
      return;
    }
    setFormSubmitting(true);
    try {
      await ticketsApi.create({
        title: formTitle,
        description: formDescription,
        priority: formPriority,
        dueDate: new Date(formDueDate).toISOString(),
        assetId: formAssetId,
        assigneeId: formAssigneeId || null,
      });
      toastSuccess('Maintenance ticket created successfully');
      setIsCreateOpen(false);
      await fetchTickets(1);
    } catch (err) {
      toastError(getErrorMessage(err), 'Ticket Creation Failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Local filter for search text in title or description
  const filteredTickets = tickets.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.asset?.name.toLowerCase().includes(search.toLowerCase()) ||
      t.asset?.serialNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Maintenance Work Orders
            </h1>
            <span className="text-xs bg-slate-800 text-sky-400 border border-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              {pagination.total} Tickets
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Dispatch, track, progress, and close operational maintenance tickets across facilities.
          </p>
        </div>

        {/* New Ticket Button: Visible to all roles per spec */}
        <Button
          variant="primary"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Ticket
        </Button>
      </div>

      {/* Filter Bar with Chips */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title, description, asset, or serial..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Status Select */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as TicketStatus | '')}
              className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In_progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Priority Select */}
          <div className="sm:col-span-3">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as TicketPriority | '')}
              className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Status Chips and "My Assigned" Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1">Status:</span>
            {(['', 'Open', 'In_progress', 'Resolved', 'Closed'] as (TicketStatus | '')[]).map((st) => (
              <button
                key={st || 'all'}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-sky-500 text-slate-950 shadow-sm shadow-sky-500/20'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {st ? st.replace('_', ' ') : 'All'}
              </button>
            ))}
          </div>

          {/* Only My Tickets Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 font-semibold">
            <input
              type="checkbox"
              checked={onlyMyTickets}
              onChange={(e) => setOnlyMyTickets(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-sky-400 w-4 h-4 cursor-pointer"
            />
            <span>Only My Assigned Tickets</span>
          </label>
        </div>
      </div>

      {/* Tickets List / Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Retrieving work orders..." />
          </div>
        ) : filteredTickets.length === 0 ? (
          <EmptyState
            title="No Maintenance Tickets Found"
            description="No tickets match your active filters. Try resetting status/priority filters or create a new ticket."
            icon={<TicketIcon className="w-7 h-7 text-slate-500" />}
            actionText="Raise Ticket"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Work Order Title</th>
                  <th className="py-3.5 px-4">Equipment / Site</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assignee</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTickets.map((ticket) => {
                  const isOverdue =
                    new Date(ticket.dueDate).getTime() < Date.now() &&
                    ticket.status !== 'Resolved' &&
                    ticket.status !== 'Closed';

                  // Note: /tickets/:id requires Admin or assigned Technician.
                  const canAccessDetail = isAdmin || ticket.assigneeId === user?.id;

                  return (
                    <tr
                      key={ticket.id}
                      className={`hover:bg-slate-800/40 transition-colors group ${
                        canAccessDetail ? 'cursor-pointer' : 'cursor-default'
                      }`}
                      onClick={() => {
                        if (canAccessDetail) {
                          navigate(`/tickets/${ticket.id}`);
                        } else {
                          toastError(
                            'Access Restricted: Detail view is limited to Admins and the Assigned Technician.',
                            '403 Forbidden'
                          );
                        }
                      }}
                    >
                      <td className="py-4 px-6 font-semibold text-slate-100 max-w-xs">
                        <div className="group-hover:text-sky-400 transition-colors font-bold truncate">
                          {ticket.title}
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5 line-clamp-1">
                          {ticket.description}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs">
                        <div className="font-semibold text-slate-200 truncate max-w-[170px]">
                          {ticket.asset?.name || 'Unknown Asset'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {ticket.asset?.serialNo}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <TicketPriorityBadge priority={ticket.priority} size="sm" />
                      </td>

                      <td className="py-4 px-4">
                        <TicketStatusBadge status={ticket.status} size="sm" />
                      </td>

                      <td className="py-4 px-4 text-xs">
                        {ticket.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium text-slate-200 truncate max-w-[120px]">
                              {ticket.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
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
                        {canAccessDetail ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                            rightIcon={<ArrowRight className="w-3 h-3" />}
                          >
                            Open
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Page <span className="text-slate-100 font-bold">{pagination.page}</span> of{' '}
              <span className="text-slate-100 font-bold">{pagination.totalPages}</span> ({pagination.total} total tickets)
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchTickets(pagination.page - 1)}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchTickets(pagination.page + 1)}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Create Ticket (Visible to any logged in user) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Raise Maintenance Ticket"
        description="Log an operational issue or scheduled inspection against field machinery."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Ticket Title
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Excessive vibration and heat signature on turbine rotor"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Detailed Description
            </label>
            <textarea
              required
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Provide exact symptoms, operational parameters, or safety hazards..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Priority Tier
              </label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as TicketPriority)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical (Immediate Stop)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Equipment Asset
            </label>
            <select
              required
              value={formAssetId}
              onChange={(e) => setFormAssetId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Select an asset...</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.serialNo}) — {a.site?.name || 'Site unassigned'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Assignee (Must be Role: Technician)
            </label>
            <select
              value={formAssigneeId}
              onChange={(e) => setFormAssigneeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value={SEEDED_TECH.id}>
                {SEEDED_TECH.name} ({SEEDED_TECH.email}) [Technician]
              </option>
              {isTechnician && user && user.id !== SEEDED_TECH.id && (
                <option value={user.id}>
                  {user.name} ({user.email}) [Me - Technician]
                </option>
              )}
              <option value="">Unassigned (None)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Backend validates that the assignee belongs to Role: Technician.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={formSubmitting}>
              Create Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
