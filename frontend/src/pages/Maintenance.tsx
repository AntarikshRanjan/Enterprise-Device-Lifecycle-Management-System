import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { LogTicketDialog } from '../components/maintenance/LogTicketDialog';
import { ResolveTicketDialog } from '../components/maintenance/ResolveTicketDialog';

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
}

interface MaintenanceTicket {
  id: string;
  assetId: string;
  asset: AssetDetail;
  reporterId: string;
  reporter: UserDetail;
  technicianId: string | null;
  technician: UserDetail | null;
  title: string;
  description: string;
  priority: string;
  status: string;
  cost: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface TicketsResponse {
  tickets: MaintenanceTicket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const Maintenance: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modal toggle states
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [activeAssetTag, setActiveAssetTag] = useState('');
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const canManage = user?.role.name === 'SUPER_ADMIN' || user?.role.name === 'IT_ADMIN';

  // Fetch tickets
  useEffect(() => {
    async function fetchTickets() {
      setIsLoading(true);
      try {
        const response = await api.get<TicketsResponse>('/api/maintenance', {
          params: {
            page,
            search: search || undefined,
            status: statusFilter || undefined,
            priority: priorityFilter || undefined,
            limit: 10,
          },
        });
        setTickets(response.data.tickets);
        setTotalPages(response.data.totalPages);
        setTotalTickets(response.data.total);
      } catch (err) {
        console.error('Failed to load maintenance tickets', err);
      } finally {
        setIsLoading(false);
      }
    }
    const debounceTimer = setTimeout(fetchTickets, 300);
    return () => clearTimeout(debounceTimer);
  }, [page, search, statusFilter, priorityFilter, fetchTrigger]);

  const getPriorityBadge = (prio: string) => {
    const base = 'px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ';
    switch (prio) {
      case 'CRITICAL':
        return base + 'bg-red-500/10 text-red-400 border-red-500/25';
      case 'HIGH':
        return base + 'bg-orange-500/10 text-orange-400 border-orange-500/25';
      case 'MEDIUM':
        return base + 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      default:
        return base + 'bg-slate-500/10 text-slate-400 border-slate-500/25';
    }
  };

  const getStatusBadge = (status: string) => {
    const base = 'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ';
    switch (status) {
      case 'RESOLVED':
        return base + 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'IN_PROGRESS':
        return base + 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'CLOSED':
        return base + 'bg-slate-500/10 text-slate-400 border-slate-500/25';
      default:
        return base + 'bg-blue-500/10 text-blue-400 border-blue-500/25';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Maintenance & Repairs</h1>
          <p className="text-slate-400 mt-1">
            Monitor active repair tickets, priority flags, and resolutions
          </p>
        </div>
        <button
          onClick={() => setIsLogOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/95 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          Log Ticket
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/40 border border-slate-900 p-5 rounded-2xl">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search tickets by title, description or tag..."
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
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div>
          <select
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="border border-slate-900 rounded-2xl bg-slate-950/45 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-lg font-medium">No maintenance logs found</p>
            <p className="text-sm mt-1">Try modifying your query or select filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/20 text-slate-400 font-semibold">
                  <th className="p-4 pl-6">Device</th>
                  <th className="p-4">Ticket Info</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Technician / Cost</th>
                  <th className="p-4">Status</th>
                  {canManage && <th className="p-4 pr-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-900/20 transition-colors text-slate-200"
                  >
                    <td className="p-4 pl-6">
                      <div className="font-semibold text-white">
                        {ticket.asset.brand} {ticket.asset.model}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        TAG: {ticket.asset.tag} | S/N: {ticket.asset.serialNumber}
                      </div>
                    </td>
                    <td className="p-4 max-w-[280px]">
                      <div className="font-semibold text-slate-200">{ticket.title}</div>
                      <p
                        className="text-xs text-slate-400 mt-1 line-clamp-2"
                        title={ticket.description}
                      >
                        {ticket.description}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className={getPriorityBadge(ticket.priority)}>{ticket.priority}</span>
                    </td>
                    <td className="p-4">
                      {ticket.status === 'RESOLVED' ? (
                        <div className="space-y-0.5 text-xs text-slate-300">
                          <p>
                            Resolved at{' '}
                            {ticket.resolvedAt
                              ? new Date(ticket.resolvedAt).toLocaleDateString()
                              : ''}
                          </p>
                          <p className="font-mono text-emerald-400">
                            Cost: ${ticket.cost ? parseFloat(ticket.cost).toFixed(2) : '0.00'}
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic">
                          {ticket.technician
                            ? `Assigned to: ${ticket.technician.firstName} ${ticket.technician.lastName}`
                            : 'Unassigned'}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={getStatusBadge(ticket.status)}>{ticket.status}</span>
                    </td>
                    {canManage && (
                      <td className="p-4 pr-6 text-right">
                        {ticket.status !== 'RESOLVED' && (
                          <button
                            onClick={() => {
                              setActiveTicketId(ticket.id);
                              setActiveAssetTag(ticket.asset.tag);
                              setIsResolveOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
                          >
                            <Check size={12} />
                            Resolve
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
                Showing {tickets.length} of {totalTickets} tickets
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

      <LogTicketDialog
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        onSuccess={() => setFetchTrigger((prev) => prev + 1)}
      />

      <ResolveTicketDialog
        isOpen={isResolveOpen}
        onClose={() => {
          setIsResolveOpen(false);
          setActiveTicketId(null);
        }}
        onSuccess={() => setFetchTrigger((prev) => prev + 1)}
        ticketId={activeTicketId}
        assetTag={activeAssetTag}
      />
    </div>
  );
};
