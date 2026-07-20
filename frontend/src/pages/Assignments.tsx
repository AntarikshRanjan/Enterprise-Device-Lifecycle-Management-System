import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import axios from 'axios';

interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AssetDetail {
  id: string;
  tag: string;
  brand: string;
  model: string;
  serialNumber: string;
  category: {
    name: string;
  };
}

interface Assignment {
  id: string;
  assetId: string;
  asset: AssetDetail;
  userId: string;
  user: UserDetail;
  assignedBy: UserDetail;
  assignedAt: string;
  returnedAt: string | null;
  returnNotes: string | null;
  status: string;
}

interface AssignmentsResponse {
  assignments: Assignment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const Assignments: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const canManage = user?.role.name === 'SUPER_ADMIN' || user?.role.name === 'IT_ADMIN';

  // Fetch assignments
  useEffect(() => {
    async function fetchAssignments() {
      setIsLoading(true);
      try {
        const response = await api.get<AssignmentsResponse>('/api/assignments', {
          params: {
            page,
            search: search || undefined,
            status: statusFilter || undefined,
            limit: 10,
          },
        });
        setAssignments(response.data.assignments);
        setTotalPages(response.data.totalPages);
        setTotalAssignments(response.data.total);
      } catch (err) {
        console.error('Failed to load assignments', err);
      } finally {
        setIsLoading(false);
      }
    }
    const debounceTimer = setTimeout(fetchAssignments, 300);
    return () => clearTimeout(debounceTimer);
  }, [page, search, statusFilter]);

  const handleReturn = async (id: string) => {
    const notes = window.prompt('Enter return notes (optional):');
    if (notes === null) return; // Cancelled
    try {
      await api.post(`/api/assignments/${id}/return`, { notes });
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: 'RETURNED',
                returnedAt: new Date().toISOString(),
                returnNotes: notes,
              }
            : a,
        ),
      );
    } catch (err) {
      let apiError = 'Failed to return asset';
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as { error?: string };
        apiError = data.error || apiError;
      }
      alert(apiError);
    }
  };

  const getStatusBadge = (status: string) => {
    const base = 'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ';
    if (status === 'ACTIVE') {
      return base + 'bg-violet-500/10 text-violet-400 border-violet-500/25';
    }
    return base + 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Device Assignments</h1>
          <p className="text-slate-400 mt-1">Track checked-out hardware and active assignments</p>
        </div>
        {canManage && (
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/95 transition-all shadow-lg shadow-primary/20">
            <Plus size={18} />
            Checkout Asset
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 border border-slate-900 p-5 rounded-2xl">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by asset tag, brand, model or employee name..."
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active (Checked Out)</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="border border-slate-900 rounded-2xl bg-slate-950/45 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-lg font-medium">No assignment records found</p>
            <p className="text-sm mt-1">Try modifying your filters or checkouts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/20 text-slate-400 font-semibold">
                  <th className="p-4 pl-6">Asset details</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4">Checkout Date</th>
                  <th className="p-4">Return Date</th>
                  <th className="p-4">Status</th>
                  {canManage && <th className="p-4 pr-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {assignments.map((assignment) => (
                  <tr
                    key={assignment.id}
                    className="hover:bg-slate-900/20 transition-colors text-slate-200"
                  >
                    <td className="p-4 pl-6">
                      <div className="font-semibold text-white">
                        {assignment.asset.brand} {assignment.asset.model}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        TAG: {assignment.asset.tag} | S/N: {assignment.asset.serialNumber}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-200">
                        {assignment.user.firstName} {assignment.user.lastName}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {assignment.user.email}
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 font-mono text-xs">
                      {new Date(assignment.assignedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-slate-300 font-mono text-xs">
                      {assignment.returnedAt ? (
                        <div className="space-y-0.5">
                          <span>{new Date(assignment.returnedAt).toLocaleDateString()}</span>
                          {assignment.returnNotes && (
                            <p
                              className="text-[10px] text-slate-500 max-w-[200px] truncate"
                              title={assignment.returnNotes}
                            >
                              Notes: {assignment.returnNotes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Not returned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={getStatusBadge(assignment.status)}>{assignment.status}</span>
                    </td>
                    {canManage && (
                      <td className="p-4 pr-6 text-right">
                        {assignment.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleReturn(assignment.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
                          >
                            <Check size={12} />
                            Return
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-900 p-4 px-6 bg-slate-950">
              <span className="text-xs text-slate-500 font-mono">
                Showing {assignments.length} of {totalAssignments} assignments
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
    </div>
  );
};
