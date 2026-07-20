import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Search, Loader2, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';

interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    name: string;
  };
}

interface AuditLog {
  id: string;
  userId: string | null;
  user: UserDetail | null;
  action: string;
  targetTable: string;
  targetId: string | null;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  timestamp: string;
}

interface LogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // JSON Details Modal state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Fetch logs
  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true);
      try {
        const response = await api.get<LogsResponse>('/api/audit-logs', {
          params: {
            page,
            search: search || undefined,
            action: actionFilter || undefined,
            limit: 15,
          },
        });
        setLogs(response.data.logs);
        setTotalPages(response.data.totalPages);
        setTotalLogs(response.data.total);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setIsLoading(false);
      }
    }
    const debounceTimer = setTimeout(fetchLogs, 300);
    return () => clearTimeout(debounceTimer);
  }, [page, search, actionFilter]);

  const getActionBadge = (action: string) => {
    const base = 'px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ';
    if (action.includes('RESOLVE') || action.includes('RETURN')) {
      return base + 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
    }
    if (action.includes('CREATE') || action.includes('CHECKOUT') || action.includes('ADD')) {
      return base + 'bg-blue-500/10 text-blue-400 border-blue-500/25';
    }
    if (action.includes('DELETE') || action.includes('REMOVE')) {
      return base + 'bg-red-500/10 text-red-400 border-red-500/25';
    }
    return base + 'bg-slate-500/10 text-slate-400 border-slate-500/25';
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Audit Logs</h1>
        <p className="text-slate-400 mt-1">
          Review system configuration events, security logs, and database transactions
        </p>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 border border-slate-900 p-5 rounded-2xl">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search logs by action, table, IP address or actor email..."
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
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Action Types</option>
            <option value="CREATE">Create Asset</option>
            <option value="UPDATE">Update Asset</option>
            <option value="DELETE">Delete Asset</option>
            <option value="CHECKOUT">Checkout Asset</option>
            <option value="RETURN">Return Asset</option>
            <option value="MAINTENANCE_CREATE">Log Maintenance</option>
            <option value="MAINTENANCE_RESOLVE">Resolve Maintenance</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="border border-slate-900 rounded-2xl bg-slate-950/45 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-lg font-medium">No audit logs found</p>
            <p className="text-sm mt-1">Try modifying your query or selecting other filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/20 text-slate-400 font-semibold">
                  <th className="p-4 pl-6">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Target Table (ID)</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4 pr-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-900/20 transition-colors text-slate-200"
                  >
                    <td className="p-4 pl-6 text-slate-400 font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={getActionBadge(log.action)}>{log.action}</span>
                    </td>
                    <td className="p-4">
                      {log.user ? (
                        <div>
                          <div className="font-semibold text-slate-200">
                            {log.user.firstName} {log.user.lastName}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">System Auto</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-300">{log.targetTable}</div>
                      {log.targetId && (
                        <div className="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-[150px]">
                          {log.targetId}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-xs">
                      {log.ipAddress || 'N/A'}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {(log.previousValue || log.newValue) && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/50 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
                        >
                          <Eye size={12} />
                          Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-900 p-4 px-6 bg-slate-950">
              <span className="text-xs text-slate-500 font-mono">
                Showing {logs.length} of {totalLogs} events
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

      {/* JSON Details Dialog Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-900">
              <div>
                <h2 className="text-lg font-bold text-white">Event Log Details</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Previous value details */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Previous Data State
                </label>
                <pre className="rounded-xl border border-slate-900 bg-slate-900/30 p-4 text-xs font-mono text-slate-400 overflow-x-auto select-all max-h-[40vh]">
                  {selectedLog.previousValue
                    ? JSON.stringify(selectedLog.previousValue, null, 2)
                    : '// No prior state modifications logged'}
                </pre>
              </div>

              {/* New value details */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Target / Modified State
                </label>
                <pre className="rounded-xl border border-slate-900 bg-slate-900/30 p-4 text-xs font-mono text-violet-300 overflow-x-auto select-all max-h-[40vh]">
                  {selectedLog.newValue
                    ? JSON.stringify(selectedLog.newValue, null, 2)
                    : '// No change updates recorded'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-900 mt-6">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
