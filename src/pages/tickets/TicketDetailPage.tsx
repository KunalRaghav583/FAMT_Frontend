import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  Wrench,
  User as UserIcon,
  CheckCircle2,
  Clock,
  Check,
  Building2,
  Cpu,
  MessageSquare,
  Send,
  Edit3,
  RotateCcw,
} from 'lucide-react';
import { ticketsApi, commentsApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Ticket, Comment, TicketStatus, TicketPriority } from '../../types';
import {
  TicketStatusBadge,
  TicketPriorityBadge,
  AssetStatusBadge,
  RoleBadge,
} from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const WORKFLOW_STEPS: { status: TicketStatus; label: string }[] = [
  { status: 'Open', label: '1. Open' },
  { status: 'In_progress', label: '2. In Progress' },
  { status: 'Resolved', label: '3. Resolved' },
  { status: 'Closed', label: '4. Closed' },
];

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // New Comment Form
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [now] = useState(() => Date.now());

  // Edit Ticket Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<TicketPriority>('Medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Fetch Ticket Data
  const fetchTicketDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setAccessDenied(false);

      const ticketRes = await ticketsApi.getById(id);
      setTicket(ticketRes.ticket);

      // Comments might be nested or from separate endpoint
      if (ticketRes.ticket.comments && ticketRes.ticket.comments.length > 0) {
        setComments(ticketRes.ticket.comments);
      } else {
        try {
          const commentsRes = await commentsApi.getByTicketId(id);
          setComments(commentsRes.comments || []);
        } catch {
          // Comments can be empty
        }
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { status?: number; data?: { error?: string } } };
        if (ax.response?.status === 403) {
          setAccessDenied(true);
        } else {
          toastError(getErrorMessage(err), 'Failed to load ticket');
        }
      } else {
        toastError('Failed to connect to backend server');
      }
    } finally {
      setLoading(false);
    }
  }, [id, toastError]);

  useEffect(() => {
    fetchTicketDetails();
  }, [fetchTicketDetails]);

  // Handle Workflow State Machine Transition
  const handleTransitionStatus = async (nextStatus: TicketStatus) => {
    if (!ticket) return;
    setTransitioning(true);
    try {
      await ticketsApi.updateStatus(ticket.id, nextStatus);
      toastSuccess(`Ticket progressed to ${nextStatus.replace('_', ' ')}`);
      await fetchTicketDetails();
    } catch (err) {
      toastError(getErrorMessage(err), 'State Machine Transition Rejected');
    } finally {
      setTransitioning(false);
    }
  };

  // Handle Post Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await commentsApi.create(ticket.id, newComment.trim());
      toastSuccess('Comment posted');
      setNewComment('');
      if (res.comment) {
        setComments((prev) => [...prev, res.comment]);
      } else {
        await fetchTicketDetails();
      }
    } catch (err) {
      toastError(getErrorMessage(err), 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!ticket) return;
    setEditTitle(ticket.title);
    setEditDescription(ticket.description);
    setEditPriority(ticket.priority);
    setEditDueDate(ticket.dueDate ? new Date(ticket.dueDate).toISOString().slice(0, 16) : '');
    setIsEditOpen(true);
  };

  // Submit Edit Modal
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;
    setEditSubmitting(true);
    try {
      await ticketsApi.update(ticket.id, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : undefined,
      });
      toastSuccess('Ticket updated successfully');
      setIsEditOpen(false);
      await fetchTicketDetails();
    } catch (err) {
      toastError(getErrorMessage(err), 'Failed to update ticket');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Verifying permissions and pulling ticket telemetry..." size="lg" />
      </div>
    );
  }

  // 403 Forbidden Access State (Per Spec Section 5)
  if (accessDenied) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 sm:p-8 rounded-3xl glass-card border border-rose-200 dark:border-rose-900/60 text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">403 Access Forbidden</h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          In accordance with industrial security rules, individual ticket telemetry is restricted to{' '}
          <span className="font-bold text-slate-800 dark:text-slate-200">Administrators</span> and the{' '}
          <span className="font-bold text-slate-800 dark:text-slate-200">Assigned Technician</span>.
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/tickets')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Tickets Hub
          </Button>
          <Button variant="primary" onClick={() => navigate('/')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Ticket Not Found</h2>
        <Button variant="secondary" onClick={() => navigate('/tickets')}>
          Return to Tickets
        </Button>
      </div>
    );
  }

  const isAssignedTech = ticket.assigneeId === user?.id;
  const canModifyTicket = isAdmin || isAssignedTech;
  const isOverdue =
    new Date(ticket.dueDate).getTime() < now &&
    ticket.status !== 'Resolved' &&
    ticket.status !== 'Closed';

  const currentStepIndex = WORKFLOW_STEPS.findIndex((s) => s.status === ticket.status);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/tickets')}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 shadow-xs"
            title="Back to Tickets"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800/60 font-bold">
                TKT-{ticket.id.slice(0, 8)}
              </span>
              <TicketStatusBadge status={ticket.status} size="sm" />
              <TicketPriorityBadge priority={ticket.priority} size="sm" />
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 truncate">
              {ticket.title}
            </h1>
          </div>
        </div>

        {canModifyTicket && (
          <Button
            variant="secondary"
            onClick={handleOpenEdit}
            leftIcon={<Edit3 className="w-4 h-4" />}
            size="sm"
            className="shrink-0"
          >
            Edit Ticket
          </Button>
        )}
      </div>

      {/* Prominent Workflow State Machine Visualizer */}
      <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 sm:space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Workflow State Machine Transition
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Strict progressive lifecycle: Open &rarr; In Progress &rarr; Resolved &rarr; Closed (Admin Reopen)
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Current State:</span>
            <TicketStatusBadge status={ticket.status} size="md" />
          </div>
        </div>

        {/* 4-Step Interactive Pipeline Progress Bar (Responsive 2x2 on mobile, 4 on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 relative">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.status}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-sky-50 dark:bg-sky-500/15 border-sky-400 text-sky-800 dark:text-sky-300 ring-2 ring-sky-500/20 shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-500 opacity-70'
                }`}
              >
                <div className="flex items-center justify-center mb-1.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : isCurrent ? (
                    <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400 animate-pulse" />
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                      {idx + 1}
                    </span>
                  )}
                </div>
                <div
                  className={`text-xs font-bold truncate ${
                    isCurrent ? 'text-sky-700 dark:text-sky-300' : isCompleted ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contextual Action Buttons based on current state */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {canModifyTicket ? (
              <span>Authorized as <strong className="text-slate-800 dark:text-slate-200">{isAdmin ? 'Admin' : 'Assigned Technician'}</strong></span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 italic">Read-only permissions for your role</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {ticket.status === 'Open' && canModifyTicket && (
              <Button
                variant="primary"
                isLoading={transitioning}
                onClick={() => handleTransitionStatus('In_progress')}
                leftIcon={<Wrench className="w-4 h-4" />}
                size="sm"
              >
                Start Work (In progress)
              </Button>
            )}

            {ticket.status === 'In_progress' && canModifyTicket && (
              <Button
                variant="success"
                isLoading={transitioning}
                onClick={() => handleTransitionStatus('Resolved')}
                leftIcon={<Check className="w-4 h-4" />}
                size="sm"
              >
                Mark Resolved
              </Button>
            )}

            {ticket.status === 'Resolved' && canModifyTicket && (
              <Button
                variant="outline"
                isLoading={transitioning}
                onClick={() => handleTransitionStatus('Closed')}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                size="sm"
              >
                Close Ticket
              </Button>
            )}

            {ticket.status === 'Closed' && isAdmin && (
              <Button
                variant="secondary"
                isLoading={transitioning}
                onClick={() => handleTransitionStatus('Open')}
                leftIcon={<RotateCcw className="w-4 h-4 text-amber-500" />}
                size="sm"
              >
                Reopen Ticket (Admin)
              </Button>
            )}

            {ticket.status === 'Closed' && !isAdmin && (
              <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                Only an Administrator can reopen a Closed ticket.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Details & Comments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Metadata & Asset Card (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Work Description Card */}
          <div className="glass-card p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Work Order Description
            </h3>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
              {ticket.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Due SLA Date</span>
                <div className="flex items-center gap-1.5 mt-1 font-bold">
                  <Calendar className={`w-4 h-4 ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
                  <span className={isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}>
                    {new Date(ticket.dueDate).toLocaleString()}
                  </span>
                </div>
                {isOverdue && (
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block mt-0.5">
                    OVERDUE SLA
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Created By</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-800 dark:text-slate-200 font-bold truncate">
                    {ticket.creator?.name || 'Operations'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  {ticket.creator?.role || 'Admin'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Assigned Technician</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Wrench className="w-4 h-4 text-amber-500" />
                  <span className="text-slate-800 dark:text-slate-200 font-bold truncate">
                    {ticket.assignee?.name || 'Unassigned'}
                  </span>
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400/80 block truncate">
                  {ticket.assignee?.email || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Associated Equipment Asset Card */}
          <div className="glass-card p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Equipment Specifications
                </h3>
              </div>
              {ticket.asset?.status && <AssetStatusBadge status={ticket.asset.status} size="sm" />}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 uppercase font-semibold block text-[11px]">
                  Asset Name
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-200 mt-0.5 block">
                  {ticket.asset?.name || 'Unknown'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 uppercase font-semibold block text-[11px]">
                  Serial Identifier
                </span>
                <span className="font-mono text-xs bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 px-2 py-1 rounded inline-block mt-0.5 border border-slate-200 dark:border-slate-800 font-bold">
                  {ticket.asset?.serialNo || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 uppercase font-semibold block text-[11px]">
                  Plant Site
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-800 dark:text-slate-200 font-bold">
                    {ticket.asset?.site?.name || 'Unassigned Site'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 uppercase font-semibold block text-[11px]">
                  Facility Location
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium mt-1 block">
                  {ticket.asset?.site?.location || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Comments Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col h-full min-h-[460px] shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Maintenance Log & Comments
                </h3>
              </div>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                {comments.length}
              </span>
            </div>

            {/* Comments List Feed */}
            <div className="flex-1 py-4 space-y-3 overflow-y-auto max-h-[380px] pr-1">
              {comments.length === 0 ? (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-xs">
                  <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No comments posted yet</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Record inspection results, part serials, or operational observations.
                  </p>
                </div>
              ) : (
                comments.map((comment) => {
                  const text = comment.body || comment.message || '';
                  const author = comment.user;

                  return (
                    <div
                      key={comment.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-200">{author?.name || 'Operator'}</span>
                          {author?.role && <RoleBadge role={author.role} size="sm" />}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-300 leading-relaxed">{text}</p>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-900">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Post Comment Input */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
              <div className="relative">
                <textarea
                  rows={2}
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Record an inspection update or comment..."
                  className="w-full p-3 pr-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="absolute right-2.5 bottom-3 p-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-sky-500/20"
                  aria-label="Send comment"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL: Edit Ticket */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Work Order"
        description="Update ticket scope, severity priority, or due completion date."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Priority Tier
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as TicketPriority)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={editSubmitting}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TicketDetailPage;
