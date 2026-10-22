import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  MapPin,
  Plus,
  Search,
  Cpu,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { sitesApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Site, Asset } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { AssetStatusBadge } from '../../components/common/Badge';

export const SitesPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected site & form states
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [siteDetails, setSiteDetails] = useState<(Site & { assets?: Asset[] }) | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchSites = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sitesApi.getAll();
      setSites(res.sites);
    } catch (err) {
      toastError(getErrorMessage(err), 'Failed to fetch plant sites');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleOpenCreate = () => {
    setFormName('');
    setFormLocation('');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (site: Site) => {
    setSelectedSite(site);
    setFormName(site.name);
    setFormLocation(site.location);
    setIsEditOpen(true);
  };

  const handleOpenDetails = async (site: Site) => {
    setSelectedSite(site);
    setIsDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const res = await sitesApi.getById(site.id);
      setSiteDetails(res.site);
    } catch (err) {
      toastError(getErrorMessage(err), 'Failed to load site assets');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenDelete = (site: Site) => {
    setSelectedSite(site);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await sitesApi.create({ name: formName, location: formLocation });
      toastSuccess('Plant site created successfully');
      setIsCreateOpen(false);
      await fetchSites();
    } catch (err) {
      toastError(getErrorMessage(err), 'Failed to create site');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) return;
    setFormSubmitting(true);
    try {
      await sitesApi.update(selectedSite.id, { name: formName, location: formLocation });
      toastSuccess('Plant site updated successfully');
      setIsEditOpen(false);
      await fetchSites();
    } catch (err) {
      toastError(getErrorMessage(err), 'Failed to update site');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSite) return;
    setFormSubmitting(true);
    try {
      await sitesApi.delete(selectedSite.id);
      toastSuccess(`Plant site "${selectedSite.name}" deleted`);
      setIsDeleteOpen(false);
      await fetchSites();
    } catch (err) {
      toastError(getErrorMessage(err), 'Deletion Blocked');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filtered sites
  const filteredSites = sites.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Operational Plant Sites
            </h1>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-400 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              {sites.length} Facilities
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Industrial geographic installations hosting critical machinery, turbines, and pipeline equipment.
          </p>
        </div>

        {/* Add Site Button (Admin Only) */}
        {isAdmin && (
          <Button
            variant="primary"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Site
          </Button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-none">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plant by name or location (e.g. Baytown, Midland)..."
            aria-label="Search plant by name or location"
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading plant locations..." />
      ) : filteredSites.length === 0 ? (
        <EmptyState
          title="No Plant Sites Found"
          description={
            search
              ? `No sites matching "${search}". Try refining your search query.`
              : 'No operational facilities registered in the database.'
          }
          icon={<Building2 className="w-7 h-7 text-slate-400 dark:text-slate-500" />}
          actionText={isAdmin ? 'Register Plant Site' : undefined}
          onAction={isAdmin ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSites.map((site) => {
            const assetCount = site._count?.assets ?? 0;

            return (
              <div
                key={site.id}
                className="bg-white dark:bg-slate-900/70 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md dark:shadow-black/20"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-700 dark:text-sky-400">
                      <Cpu className="w-3.5 h-3.5" />
                      {assetCount} {assetCount === 1 ? 'Asset' : 'Assets'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-4 group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                    {site.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
                    <MapPin className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                    <span className="truncate">{site.location}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Registered {new Date(site.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenDetails(site)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors cursor-pointer"
                  >
                    <span>View Assets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(site)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                        title="Edit site"
                        aria-label={`Edit ${site.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(site)}
                        className="p-1.5 text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                        title="Delete site"
                        aria-label={`Delete ${site.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Create Plant Site (Admin Only) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Operational Plant Site"
        description="Register a new geographic facility or industrial refining station."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="create-site-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Site Name
            </label>
            <input
              id="create-site-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Gulf Coast Refining Plant 5"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label
              htmlFor="create-site-location"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Geographic Location
            </label>
            <input
              id="create-site-location"
              type="text"
              required
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="e.g. Baytown, TX or Midland, TX"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={formSubmitting}>
              Create Site
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Edit Plant Site (Admin Only) */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Update Plant Site"
        description={`Modify information for ${selectedSite?.name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-site-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Site Name
            </label>
            <input
              id="edit-site-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label
              htmlFor="edit-site-location"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Geographic Location
            </label>
            <input
              id="edit-site-location"
              type="text"
              required
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
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

      {/* MODAL: Site Details & Associated Assets */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedSite?.name || 'Site Overview'}
        description={`Location: ${selectedSite?.location}`}
        maxWidth="2xl"
      >
        {detailsLoading ? (
          <LoadingSpinner message="Fetching equipment installed at this facility..." />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Equipment Inventory ({siteDetails?.assets?.length || 0})
              </span>
            </div>

            {!siteDetails?.assets || siteDetails.assets.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                No active equipment registered at this plant location yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {siteDetails.assets.map((asset) => (
                  <div key={asset.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{asset.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                          {asset.serialNo}
                        </span>
                        <span>&bull;</span>
                        <span>{asset.type}</span>
                      </div>
                    </div>
                    <AssetStatusBadge status={asset.status} size="sm" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Delete Site Confirmation */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Plant Site"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 dark:text-rose-200">
              <p className="font-bold text-rose-900 dark:text-rose-100">Database Foreign Key Protection:</p>
              <p className="mt-1">
                A plant site can only be deleted if it has 0 associated assets. If assets are still assigned to &quot;{selectedSite?.name}&quot;, the backend will reject this request with a 400 Bad Request.
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-slate-100">{selectedSite?.name}</span>?
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
              Delete Site
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
