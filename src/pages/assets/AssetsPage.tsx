import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Building2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
  RefreshCw,
} from 'lucide-react';
import { assetsApi, sitesApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Asset, Site, AssetStatus, PaginationMetadata } from '../../types';
import { AssetStatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

const ASSET_TYPES = [
  'Pump',
  'Turbine',
  'Compressor',
  'Generator',
  'Sensor',
  'Valve',
  'Heat Exchanger',
  'Transformer',
  'Motor',
  'Piping System',
];

export const AssetsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus | ''>('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected asset
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Pump');
  const [formSerialNo, setFormSerialNo] = useState('');
  const [formStatus, setFormStatus] = useState<AssetStatus>('Active');
  const [formSiteId, setFormSiteId] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load sites once for dropdown
  useEffect(() => {
    const loadSites = async () => {
      try {
        const res = await sitesApi.getAll();
        setSites(res.sites);
      } catch {
        // Handled silently
      }
    };
    loadSites();
  }, []);

  const fetchAssets = useCallback(
    async (pageToLoad = 1) => {
      try {
        setLoading(true);
        const res = await assetsApi.getAll({
          search: search || undefined,
          siteId: selectedSiteId || undefined,
          status: selectedStatus || undefined,
          page: pageToLoad,
          limit: 10,
        });
        setAssets(res.assets);
        setPagination(res.pagination);
      } catch (err) {
        toastError(getErrorMessage(err), 'Failed to fetch equipment assets');
      } finally {
        setLoading(false);
      }
    },
    [search, selectedSiteId, selectedStatus, toastError]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchAssets(1);
    }, 250);
    return () => clearTimeout(timeout);
  }, [fetchAssets]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchAssets(pagination.page);
      toastSuccess('Equipment assets inventory refreshed', 'Refreshed');
    } catch (err) {
      toastError(getErrorMessage(err), 'Failed to refresh assets');
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 350);
    }
  };

  const handleOpenCreate = () => {
    setFormName('');
    setFormType('Pump');
    setFormSerialNo('');
    setFormStatus('Active');
    setFormSiteId(sites[0]?.id || '');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormName(asset.name);
    setFormType(asset.type);
    setFormSerialNo(asset.serialNo);
    setFormStatus(asset.status);
    setFormSiteId(asset.siteId || '');
    setIsEditOpen(true);
  };

  const handleOpenDetails = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDetailsOpen(true);
  };

  const handleOpenDelete = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSiteId) {
      toastError('Please designate an operational plant site');
      return;
    }
    setFormSubmitting(true);
    try {
      await assetsApi.create({
        name: formName,
        type: formType,
        serialNo: formSerialNo,
        status: formStatus,
        siteId: formSiteId,
      });
      toastSuccess('Asset registered successfully');
      setIsCreateOpen(false);
      await fetchAssets(1);
    } catch (err) {
      toastError(getErrorMessage(err), 'Failed to create asset');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setFormSubmitting(true);
    try {
      await assetsApi.update(selectedAsset.id, {
        name: formName,
        type: formType,
        serialNo: formSerialNo,
        status: formStatus,
        siteId: formSiteId || undefined,
      });
      toastSuccess('Asset record updated');
      setIsEditOpen(false);
      await fetchAssets(pagination.page);
    } catch (err) {
      toastError(getErrorMessage(err), 'Failed to update asset');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAsset) return;
    setFormSubmitting(true);
    try {
      await assetsApi.delete(selectedAsset.id);
      toastSuccess(`Asset "${selectedAsset.name}" decommissioned and removed`);
      setIsDeleteOpen(false);
      await fetchAssets(pagination.page);
    } catch (err) {
      toastError(getErrorMessage(err), 'Deletion Blocked');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 sm:pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Field Asset Equipment
            </h1>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              {pagination.total} Units
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Turbines, compressors, sensors, and rotating machinery tracked across field operations.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            leftIcon={
              <RefreshCw
                className={`w-3.5 h-3.5 transition-transform duration-500 ${
                  isRefreshing ? 'animate-spin text-sky-600 dark:text-sky-400' : 'group-hover:rotate-180'
                }`}
              />
            }
            size="sm"
            className="group"
            title="Refresh assets list"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          {isAdmin && (
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4" />}
              size="sm"
            >
              New Asset
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
          {/* Search */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, serial no (e.g. PUMP-001)..."
              aria-label="Search assets by name or serial number"
              className="w-full pl-9 pr-3.5 py-1.5 sm:py-2 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          {/* Site Filter */}
          <div className="sm:col-span-4 relative">
            <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              aria-label="Filter assets by plant site"
              className="w-full pl-9 pr-3.5 py-1.5 sm:py-2 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
            >
              <option value="">All Plant Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.location})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3 relative">
            <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as AssetStatus | '')}
              aria-label="Filter assets by status"
              className="w-full pl-9 pr-3.5 py-1.5 sm:py-2 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under_maintenance">Under Maintenance</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets Table & Mobile Cards */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-10 sm:p-12">
            <LoadingSpinner message="Querying equipment database..." />
          </div>
        ) : assets.length === 0 ? (
          <EmptyState
            title="No Assets Found"
            description="No equipment matching current filter criteria. Adjust your filters or register a new asset."
            icon={<Cpu className="w-7 h-7 text-slate-400" />}
            actionText={isAdmin ? 'Add Asset' : undefined}
            onAction={isAdmin ? handleOpenCreate : undefined}
          />
        ) : (
          <div>
            {/* Desktop Table (>= md screens) */}
            <div className="hidden md:block famt-table-container">
              <table className="w-full text-left text-sm min-w-[680px]">
                <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Asset Name</th>
                    <th className="py-2.5 px-3.5">Type</th>
                    <th className="py-2.5 px-3.5">Serial No</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5">Plant Site</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {assets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => handleOpenDetails(asset)}
                    >
                      <td className="py-2.5 sm:py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors font-bold">{asset.name}</div>
                      </td>

                      <td className="py-2.5 sm:py-3 px-3.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {asset.type}
                      </td>

                      <td className="py-2.5 sm:py-3 px-3.5">
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800/90 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/80 font-bold">
                          {asset.serialNo}
                        </span>
                      </td>

                      <td className="py-2.5 sm:py-3 px-3.5">
                        <AssetStatusBadge status={asset.status} size="sm" />
                      </td>

                      <td className="py-2.5 sm:py-3 px-3.5 text-xs text-slate-700 dark:text-slate-300">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{asset.site?.name || 'Unassigned'}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{asset.site?.location}</div>
                      </td>

                      <td className="py-2.5 sm:py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetails(asset)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="View telemetry & tickets"
                            aria-label={`View details of ${asset.name}`}
                          >
                            <Info className="w-4 h-4" />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(asset)}
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Edit asset"
                                aria-label={`Edit ${asset.name}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(asset)}
                                className="p-1.5 text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete asset"
                                aria-label={`Delete ${asset.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards List (< md screens) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-3.5 space-y-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => handleOpenDetails(asset)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {asset.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {asset.type}
                      </p>
                    </div>
                    <AssetStatusBadge status={asset.status} size="sm" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                    <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                        {asset.site?.name || 'Unassigned Site'}
                      </span>
                    </div>

                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold">
                      {asset.serialNo}
                    </span>
                  </div>

                  <div
                    className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                      {asset.site?.location || 'No location set'}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDetails(asset)}
                        leftIcon={<Info className="w-3.5 h-3.5 text-sky-500" />}
                        className="text-xs py-1 px-2 min-h-[30px]"
                      >
                        Details
                      </Button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(asset)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer min-h-[30px] min-w-[30px] flex items-center justify-center"
                            title="Edit asset"
                            aria-label={`Edit ${asset.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(asset)}
                            className="p-1.5 text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer min-h-[30px] min-w-[30px] flex items-center justify-center"
                            title="Delete asset"
                            aria-label={`Delete ${asset.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-3 sm:p-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Page <span className="text-slate-900 dark:text-slate-100 font-bold">{pagination.page}</span> of{' '}
              <span className="text-slate-900 dark:text-slate-100 font-bold">{pagination.totalPages}</span> ({pagination.total} units recorded)
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchAssets(pagination.page - 1)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchAssets(pagination.page + 1)}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Create Asset */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Equipment"
        description="Add a physical asset unit to the field maintenance registry."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div>
            <label
              htmlFor="create-asset-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
            >
              Equipment Name
            </label>
            <input
              id="create-asset-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. High Pressure Feed Pump #3"
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="create-asset-type"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                Machinery Type
              </label>
              <select
                id="create-asset-type"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="create-asset-serial"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                Serial Number
              </label>
              <input
                id="create-asset-serial"
                type="text"
                required
                value={formSerialNo}
                onChange={(e) => setFormSerialNo(e.target.value)}
                placeholder="e.g. PUMP-TX-8821"
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="create-asset-status"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                Initial Status
              </label>
              <select
                id="create-asset-status"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as AssetStatus)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Under_maintenance">Under Maintenance</option>
                <option value="Retired">Retired</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="create-asset-site"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                Assigned Plant Site
              </label>
              <select
                id="create-asset-site"
                required
                value={formSiteId}
                onChange={(e) => setFormSiteId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">Select location site...</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
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
              Register Asset
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Edit Asset */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Equipment Details"
        description="Update machinery specs, operational status, or location."
      >
        <form onSubmit={handleEditSubmit} className="space-y-3.5">
          <div>
            <label
              htmlFor="edit-asset-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
            >
              Equipment Name
            </label>
            <input
              id="edit-asset-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="edit-asset-type"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                Machinery Type
              </label>
              <select
                id="edit-asset-type"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-asset-serial"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                Serial Number
              </label>
              <input
                id="edit-asset-serial"
                type="text"
                required
                value={formSerialNo}
                onChange={(e) => setFormSerialNo(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="edit-asset-status"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                Status
              </label>
              <select
                id="edit-asset-status"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as AssetStatus)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Under_maintenance">Under Maintenance</option>
                <option value="Retired">Retired</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-asset-site"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                Assigned Plant Site
              </label>
              <select
                id="edit-asset-site"
                value={formSiteId}
                onChange={(e) => setFormSiteId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
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
              isLoading={formSubmitting}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Asset Details */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Asset Equipment Telemetry"
        description="Detailed specification record and plant association."
      >
        {selectedAsset && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] uppercase font-semibold">
                    Machinery Name
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedAsset.name}
                  </h4>
                </div>
                <AssetStatusBadge status={selectedAsset.status} size="md" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-semibold text-[11px]">
                    Serial Number
                  </span>
                  <span className="font-mono text-xs text-sky-700 dark:text-sky-300 font-bold block mt-0.5">
                    {selectedAsset.serialNo}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-semibold text-[11px]">
                    Equipment Classification
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                    {selectedAsset.type}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-semibold text-[11px]">
                    Assigned Facility
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 block mt-0.5">
                    {selectedAsset.site?.name || 'Unassigned'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-semibold text-[11px]">
                    Installation Location
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 block mt-0.5">
                    {selectedAsset.site?.location || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                Registered on: {new Date(selectedAsset.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* DIALOG: Confirm Delete */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Asset Decommissioning"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-700 dark:text-slate-300">
              <p className="font-bold text-rose-700 dark:text-rose-300">Permanent Equipment Decommission</p>
              <p>
                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{selectedAsset?.name}</strong>?
                Assets with active work tickets cannot be removed until all tickets are resolved.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={formSubmitting}
              onClick={handleDeleteConfirm}
            >
              Delete Asset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssetsPage;
