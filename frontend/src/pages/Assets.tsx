import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { AssetFormDialog } from '../components/assets/AssetFormDialog';

interface Category {
  id: string;
  name: string;
}

interface Asset {
  id: string;
  tag: string;
  serialNumber: string;
  brand: string;
  model: string;
  cost: string;
  status: string;
  purchaseDate: string;
  warrantyExpiry?: string | null;
  categoryId: string;
  imageUrl?: string | null;
  category: {
    name: string;
  };
}

interface AssetsResponse {
  assets: Asset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const Assets: React.FC = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modal and edit trigger states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const canManage = user?.role.name === 'SUPER_ADMIN' || user?.role.name === 'IT_ADMIN';

  // Fetch Categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.get<Category[]>('/api/categories');
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    fetchCategories();
  }, []);

  // Fetch Assets
  useEffect(() => {
    async function fetchAssets() {
      setIsLoading(true);
      try {
        const response = await api.get<AssetsResponse>('/api/assets', {
          params: {
            page,
            search: search || undefined,
            categoryId: selectedCategory || undefined,
            status: selectedStatus || undefined,
            limit: 10,
          },
        });
        setAssets(response.data.assets);
        setTotalPages(response.data.totalPages);
        setTotalAssets(response.data.total);
      } catch (err) {
        console.error('Failed to load assets', err);
      } finally {
        setIsLoading(false);
      }
    }
    const debounceTimer = setTimeout(fetchAssets, 300);
    return () => clearTimeout(debounceTimer);
  }, [page, search, selectedCategory, selectedStatus, fetchTrigger]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await api.delete(`/api/assets/${id}`);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setTotalAssets((prev) => prev - 1);
    } catch (err) {
      let apiError = 'Failed to delete asset';
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as { error?: string };
        apiError = data.error || apiError;
      }
      alert(apiError);
    }
  };

  const getStatusBadge = (status: string) => {
    const base = 'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ';
    switch (status) {
      case 'AVAILABLE':
        return base + 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'ASSIGNED':
        return base + 'bg-blue-500/10 text-blue-400 border-blue-500/25';
      case 'MAINTENANCE':
        return base + 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'RETURNED':
        return base + 'bg-purple-500/10 text-purple-400 border-purple-500/25';
      case 'RETIRED':
        return base + 'bg-slate-500/10 text-slate-400 border-slate-500/25';
      default:
        return base + 'bg-red-500/10 text-red-400 border-red-500/25';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Asset Inventory</h1>
          <p className="text-slate-400 mt-1">Manage and track physical organization hardware</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setAssetToEdit(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/95 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            Add Asset
          </button>
        )}
      </div>

      {/* Filters & search panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/40 border border-slate-900 p-5 rounded-2xl">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by tag, brand, model or serial..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div>
          <select
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="RETURNED">Returned</option>
            <option value="RETIRED">Retired</option>
            <option value="DISPOSED">Disposed</option>
          </select>
        </div>
      </div>

      {/* Assets Table */}
      <div className="border border-slate-900 rounded-2xl bg-slate-950/45 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : assets.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-lg font-medium">No assets found</p>
            <p className="text-sm mt-1">Try modifying your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/20 text-slate-400 font-semibold">
                  <th className="p-4 pl-6">Asset Tag</th>
                  <th className="p-4">Device Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Cost</th>
                  <th className="p-4">Status</th>
                  {canManage && <th className="p-4 pr-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-slate-900/20 transition-colors text-slate-200"
                  >
                    <td className="p-4 pl-6 font-mono text-xs font-semibold text-slate-400">
                      {asset.tag}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white">
                        {asset.brand} {asset.model}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        S/N: {asset.serialNumber}
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{asset.category.name}</td>
                    <td className="p-4 font-mono text-slate-300">
                      ${parseFloat(asset.cost).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className={getStatusBadge(asset.status)}>{asset.status}</span>
                    </td>
                    {canManage && (
                      <td className="p-4 pr-6 text-right space-x-2">
                        <button
                          onClick={() => {
                            setAssetToEdit(asset);
                            setIsFormOpen(true);
                          }}
                          className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination UI */}
            <div className="flex items-center justify-between border-t border-slate-900 p-4 px-6 bg-slate-950">
              <span className="text-xs text-slate-500 font-mono">
                Showing {assets.length} of {totalAssets} assets
              </span>
              <div className="flex items-center gap-3">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-slate-850 p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-slate-300 font-mono">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-slate-850 p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AssetFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setAssetToEdit(null);
        }}
        onSuccess={() => setFetchTrigger((prev) => prev + 1)}
        assetToEdit={assetToEdit}
        categories={categories}
      />
    </div>
  );
};
