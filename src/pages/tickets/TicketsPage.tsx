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
  Wrench,
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

// Technician profile for ticket assignment from database seed
const SEEDED_TECH = {
  id: '182f4407-8a52-4276-8426-1ca8c97c12bb',
  name: 'Field Service Technician',
  role: 'Technician',
};

export const TicketsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
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

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | ''>('');
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | ''>('');
  const [onlyMyTickets, setOnlyMyTickets] = useState(false);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<TicketPriority>('Medium');
  const [formDueDate, setFormDueDate] = useState('');
  const [formAssetId, setFormAssetId] = useState('');
  const [formAssigneeId, setFormAssigneeId] = useState(SEEDED_TECH.id);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load assets once for ticket assignment dropdown
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

  const userId = user?.id;

  // Fetch tickets with server-side filters and pagination
  const fetchTickets = useCallback(
    async (pageToLoad = 1) => {
      try {
        setLoading(true);
        const res = await ticketsApi.getAll({
          status: selectedStatus || undefined,
          priority: selectedPriority || undefined,
          assigneeId: onlyMyTickets && userId ? userId : undefined,
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
    [selectedStatus, selectedPriority, onlyMyTickets, userId, toastError]
  );

  useEffect(() => {
    fetchTickets(1);
  }, [fetchTickets]);

  const handleOpenCreate = useCallback(() => {
    setFormTitle('');
    setFormDescription('');
    setFormPriority('Medium');
    // Default due date: 7 days from now
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setFormDueDate(nextWeek.toISOString().slice(0, 16));
    setFormAssetId(assets[0]?.id || '');
    setFormAssigneeId(SEEDED_TECH.id);
    setIsCreateOpen(true);
  }, [assets]);

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
  }, [searchParams, user?.id, setSearchParams, handleOpenCreate]);

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
      toastError(getErrorMessage(err), 'Failed to create ticket');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Client-side text filter on current page results
  const filteredTickets = tickets.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.asset?.name?.toLowerCase().includes(q) ||
      t.asset?.serialNo?.toLowerCase().includes(q)
    );
  });

  const [now] = useState(() => Date.now());

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Maintenance Work Orders
            </h1>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              {pagination.total} Tickets
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dispatch, track, progress, and close operational maintenance tickets across facilities.
          </p>
        </div>

        {/* New Ticket Button */}
        <Button
          variant="primary"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
          size="sm"
          className="sm:text-sm shrink-0"
        >
          New Ticket
        </Button>
      </div>

      {/* Filter Bar with Chips */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title, description, asset, or serial..."
              aria-label="Filter tickets by title, description, asset, or serial"
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          {/* Status Select */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as TicketStatus | '')}
              aria-label="Filter tickets by status"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
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
              aria-label="Filter tickets by priority"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
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
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-semibold mr-1">Status:</span>
            {(['', 'Open', 'In_progress', 'Resolved', 'Closed'] as (TicketStatus | '')[]).map((st) => (
              <button
                key={st || 'all'}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                  selectedStatus === st
                    ? 'bg-sky-500 text-slate-950 shadow-xs font-bold'
                    : 'bg-slate-100 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {st ? st.replace('_', ' ') : 'All'}
              </button>
            ))}
          </div>

          {/* Only My Tickets Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300 font-semibold">
            <input
              type="checkbox"
              checked={onlyMyTickets}
              onChange={(e) => setOnlyMyTickets(e.target.checked)}
              className="rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sky-500 focus:ring-sky-400 w-4 h-4 cursor-pointer"
            />
            <span>Only My Assigned Tickets</span>
          </label>
        </div>
      </div>

      {/* Tickets List / Table */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Retrieving work orders..." />
          </div>
        ) : filteredTickets.length === 0 ? (
          <EmptyState
            title="No Maintenance Tickets Found"
            description="No tickets match your active filters. Try resetting status/priority filters or create a new ticket."
            icon={<TicketIcon className="w-7 h-7 text-slate-400" />}
            actionText="Raise Ticket"
            onAction={handleOpenCreate}
          />
        ) : (
          <div>
            {/* Desktop Table View (>= md screens) */}
            <div className="hidden md:block famt-table-container">
              <table className="w-full text-left text-sm min-w-[680px]">
                <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-5">Work Order Title</th>
                    <th className="py-3.5 px-4">Equipment / Site</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Assignee</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {filteredTickets.map((ticket) => {
                    const isOverdue =
                      new Date(ticket.dueDate).getTime() < now &&
                      ticket.status !== 'Resolved' &&
                      ticket.status !== 'Closed';

                    const canAccessDetail = isAdmin || ticket.assigneeId === user?.id;

                    return (
                      <tr
                        key={ticket.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group ${
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
                        <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-slate-100 max-w-xs">
                          <div className="group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors font-bold truncate">
                            {ticket.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 line-clamp-1">
                            {ticket.description}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px] flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{ticket.asset?.name || 'Unknown Asset'}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono pl-5">
                            {ticket.asset?.serialNo}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <TicketPriorityBadge priority={ticket.priority} size="sm" />
                        </td>

                        <td className="py-3.5 px-4">
                          <TicketStatusBadge status={ticket.status} size="sm" />
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          {ticket.assignee ? (
                            <div className="flex items-center gap-1.5">
                              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                                {ticket.assignee.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
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

            {/* Mobile Cards List (< md screens) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTickets.map((ticket) => {
                const isOverdue =
                  new Date(ticket.dueDate).getTime() < now &&
                  ticket.status !== 'Resolved' &&
                  ticket.status !== 'Closed';

                const canAccessDetail = isAdmin || ticket.assigneeId === user?.id;

                return (
                  <div
                    key={ticket.id}
                    className={`p-4 space-y-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
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
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {ticket.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {ticket.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <TicketPriorityBadge priority={ticket.priority} size="sm" />
                        <TicketStatusBadge status={ticket.status} size="sm" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                        <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                          {ticket.asset?.name || 'Unknown Asset'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
                        <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                          {new Date(ticket.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/50" onClick={(e) => e.stopPropagation()}>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-slate-400" />
                        <span>{ticket.assignee ? ticket.assignee.name : 'Unassigned'}</span>
                      </div>

                      <div>
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
                          <span className="text-[11px] text-slate-400 italic">Protected</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Page <span className="text-slate-900 dark:text-slate-100 font-bold">{pagination.page}</span> of{' '}
              <span className="text-slate-900 dark:text-slate-100 font-bold">{pagination.totalPages}</span> ({pagination.total} total tickets)
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

      {/* MODAL: Create Ticket */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Raise Maintenance Ticket"
        description="Log an operational issue or scheduled inspection against field machinery."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="ticket-create-title"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Ticket Title
            </label>
            <input
              id="ticket-create-title"
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Excessive vibration and heat signature on turbine rotor"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="ticket-create-desc"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Detailed Description
            </label>
            <textarea
              id="ticket-create-desc"
              required
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Provide exact symptoms, operational parameters, or safety hazards..."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="ticket-create-priority"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Priority Tier
              </label>
              <select
                id="ticket-create-priority"
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as TicketPriority)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical (Immediate Stop)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="ticket-create-duedate"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Due Date & Time
              </label>
              <input
                id="ticket-create-duedate"
                type="datetime-local"
                required
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="ticket-create-asset"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Equipment Asset
            </label>
            <select
              id="ticket-create-asset"
              required
              value={formAssetId}
              onChange={(e) => setFormAssetId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
            >
              <option value="">Select an asset...</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.serialNo}) — {a.site?.name || 'Site unassigned'}
                </option>
              ))}
            </select>
          </div>

          {isAdmin && (
            <div>
              <label
                htmlFor="ticket-create-assignee"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Assigned Technician
              </label>
              <select
                id="ticket-create-assignee"
                value={formAssigneeId}
                onChange={(e) => setFormAssigneeId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
              >
                <option value={SEEDED_TECH.id}>Field Service Technician (tech@famt.dev)</option>
                <option value="">Leave unassigned (Open pool)</option>
              </select>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={formSubmitting}
            >
              Create Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TicketsPage;
