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

  // Refetch when filters or pagination change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssets(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedSiteId, selectedStatus, fetchAssets]);

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
    setFormSiteId(asset.siteId);
    setIsEditOpen(true);
  };

  const handleOpenDetails = async (asset: Asset) => {
    try {
      const res = await assetsApi.getById(asset.id);
      setSelectedAsset(res.asset);
      setIsDetailsOpen(true);
    } catch (err) {
      toastError(getErrorMessage(err), 'Failed to load asset details');
    }
  };

  const handleOpenDelete = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSiteId) {
      toastError('Please select a plant site for this asset');
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
      toastSuccess(`Asset "${formName}" added to inventory`);
      setIsCreateOpen(false);
      await fetchAssets(pagination.page);
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
        siteId: formSiteId,
      });
      toastSuccess(`Asset "${formName}" updated`);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Field Asset Equipment
            </h1>
            <span className="text-xs bg-slate-800 text-sky-400 border border-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              {pagination.total} Units
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Turbines, compressors, sensors, and rotating machinery tracked across field operations.
          </p>
        </div>

        {/* New Asset Button (Admin Only per spec) */}
        {isAdmin && (
          <Button
            variant="primary"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Asset
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, serial no (e.g. PUMP-001)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Site Filter */}
        <div className="sm:col-span-4 relative">
          <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
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
          <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as AssetStatus | '')}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under_maintenance">Under Maintenance</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Assets Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Querying equipment database..." />
          </div>
        ) : assets.length === 0 ? (
          <EmptyState
            title="No Assets Found"
            description="No equipment matching current filter criteria. Adjust your filters or register a new asset."
            icon={<Cpu className="w-7 h-7 text-slate-500" />}
            actionText={isAdmin ? 'Add Asset' : undefined}
            onAction={isAdmin ? handleOpenCreate : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Asset Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Serial No</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Plant Site</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => handleOpenDetails(asset)}
                  >
                    <td className="py-4 px-6 font-semibold text-slate-100">
                      <div className="group-hover:text-sky-400 transition-colors">{asset.name}</div>
                    </td>

                    <td className="py-4 px-4 text-xs font-medium text-slate-400">
                      {asset.type}
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-mono text-xs bg-slate-800/90 text-sky-300 px-2.5 py-1 rounded-md border border-slate-700/80">
                        {asset.serialNo}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <AssetStatusBadge status={asset.status} size="sm" />
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-300">
                      <div className="font-medium">{asset.site?.name || 'Unassigned'}</div>
                      <div className="text-[11px] text-slate-400">{asset.site?.location}</div>
                    </td>

                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDetails(asset)}
                          className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="View telemetry & tickets"
                        >
                          <Info className="w-4 h-4" />
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(asset)}
                              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit asset"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(asset)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Delete asset"
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
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Showing Page <span className="text-slate-100 font-bold">{pagination.page}</span> of{' '}
              <span className="text-slate-100 font-bold">{pagination.totalPages}</span> ({pagination.total} total assets)
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchAssets(pagination.page - 1)}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchAssets(pagination.page + 1)}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Create Asset (Admin Only) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Field Asset"
        description="Add a new machinery unit or sensor device to the maintenance roster."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Asset Name
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Centrifugal Crude Oil Pump"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Equipment Type
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Serial Number
              </label>
              <input
                type="text"
                required
                value={formSerialNo}
                onChange={(e) => setFormSerialNo(e.target.value)}
                placeholder="e.g. PUMP-TX-042"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Initial Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as AssetStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Active">Active</option>
                <option value="Under_maintenance">Under Maintenance</option>
                <option value="Retired">Retired</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Plant Site Location
              </label>
              <select
                required
                value={formSiteId}
                onChange={(e) => setFormSiteId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Select a plant site...</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={formSubmitting}>
              Register Asset
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Edit Asset (Admin Only) */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Asset Details"
        description={`Updating equipment profile for ${selectedAsset?.name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Asset Name
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Equipment Type
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Serial Number
              </label>
              <input
                type="text"
                required
                value={formSerialNo}
                onChange={(e) => setFormSerialNo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as AssetStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Active">Active</option>
                <option value="Under_maintenance">Under Maintenance</option>
                <option value="Retired">Retired</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Assigned Plant Site
              </label>
              <select
                required
                value={formSiteId}
                onChange={(e) => setFormSiteId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={formSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Asset Details */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedAsset?.name || 'Asset Specifications'}
        description={`Serial No: ${selectedAsset?.serialNo}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 block font-semibold uppercase">Equipment Type</span>
              <span className="text-sm font-bold text-slate-200">{selectedAsset?.type}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-semibold uppercase">Operational Status</span>
              {selectedAsset && <AssetStatusBadge status={selectedAsset.status} size="sm" />}
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-semibold uppercase">Plant Location</span>
              <span className="text-sm font-bold text-slate-200">
                {selectedAsset?.site?.name}
              </span>
              <span className="text-xs text-slate-400 block">{selectedAsset?.site?.location}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-semibold uppercase">Total Work Orders</span>
              <span className="text-sm font-bold text-sky-400">
                {selectedAsset?._count?.tickets ?? 0} Tickets
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Delete Asset Confirmation */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Decommission Equipment Asset"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200">
              <p className="font-bold">Active Ticket Constraint:</p>
              <p className="mt-1">
                Assets with associated maintenance tickets cannot be deleted. If this asset has work orders logged against it, the backend will reject this request with 400 Bad Request.
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-300">
            Are you sure you want to permanently remove{' '}
            <span className="font-bold text-slate-100">{selectedAsset?.name}</span> ({selectedAsset?.serialNo})?
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
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
