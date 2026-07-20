import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Laptop, CheckSquare, Wrench, DollarSign, Loader2, Activity, Clock } from 'lucide-react';

interface CategoryAllocation {
  categoryId: string;
  name: string;
  count: number;
}

interface RecentActivity {
  id: string;
  action: string;
  timestamp: string;
  actor: string;
  description: string;
}

interface DashboardData {
  stats: {
    total: number;
    available: number;
    assigned: number;
    maintenance: number;
    retired: number;
  };
  categorySplit: CategoryAllocation[];
  maintenanceSummary: {
    totalCost: number;
    activeTickets: number;
  };
  recentActivities: RecentActivity[];
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await api.get<DashboardData>('/api/dashboard/summary');
        setData(response.data);
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { stats, categorySplit, maintenanceSummary, recentActivities } = data;

  const cardStats = [
    {
      title: 'Total Assets',
      value: stats.total.toString(),
      desc: 'All registered hardware devices',
      icon: Laptop,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Active Checkouts',
      value: stats.assigned.toString(),
      desc:
        stats.total > 0
          ? `${((stats.assigned / stats.total) * 100).toFixed(0)}% utilization rate`
          : '0% utilization rate',
      icon: CheckSquare,
      color: 'text-green-500 bg-green-500/10 border-green-500/20',
    },
    {
      title: 'Under Repair',
      value: stats.maintenance.toString(),
      desc: `${maintenanceSummary.activeTickets} pending tickets`,
      icon: Wrench,
      color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    },
    {
      title: 'Repair Expenses',
      value: `$${maintenanceSummary.totalCost.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      desc: 'Total logged maintenance cost',
      icon: DollarSign,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
  ];

  const formatTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-outfit">
          Dashboard Summary
        </h1>
        <p className="text-slate-400 mt-1">
          Real-time summary metrics, category utilization splits, and audit events tracing.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-slate-900/60 backdrop-blur-md border border-slate-900 rounded-2xl p-5 shadow-lg shadow-black/20 hover:border-slate-800 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">{stat.title}</span>
                <div
                  className={`rounded-xl border p-2.5 transition-transform group-hover:scale-110 duration-300 ${stat.color}`}
                >
                  <Icon size={20} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {stat.value}
                </span>
                <p className="text-xs text-slate-500 mt-1">{stat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Allocations Chart */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 shadow-lg lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-outfit">
              Asset Allocations by Category
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Asset allocations across primary hardware classifications
            </p>
          </div>

          {categorySplit.length === 0 ? (
            <div className="py-12 text-center text-slate-600">
              No categories found. Add categories to start.
            </div>
          ) : (
            <div className="space-y-4">
              {categorySplit.map((cat) => {
                const maxVal = Math.max(...categorySplit.map((c) => c.count), 1);
                const percent = (cat.count / maxVal) * 100;
                return (
                  <div key={cat.categoryId} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-300">{cat.name}</span>
                      <span className="text-slate-400 font-mono">{cat.count} devices</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-3.5 overflow-hidden border border-slate-900/60 p-0.5">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Distribution Visuals */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-outfit">Device Status Split</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Physical lifecycle statuses of inventory
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                label: 'Available',
                count: stats.available,
                color: 'bg-emerald-500 text-emerald-400',
                glow: 'rgba(16,185,129,0.2)',
              },
              {
                label: 'Assigned',
                count: stats.assigned,
                color: 'bg-violet-500 text-violet-400',
                glow: 'rgba(139,92,246,0.2)',
              },
              {
                label: 'In Maintenance',
                count: stats.maintenance,
                color: 'bg-amber-500 text-amber-400',
                glow: 'rgba(245,158,11,0.2)',
              },
              {
                label: 'Retired / Disposed',
                count: stats.retired,
                color: 'bg-slate-500 text-slate-400',
                glow: 'rgba(107,114,128,0.2)',
              },
            ].map((item) => {
              const share = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-sm p-2 rounded-xl bg-slate-950/30 border border-slate-900/20"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-3 w-3 rounded-full ${item.color.split(' ')[0]}`}
                      style={{ boxShadow: `0 0 6px ${item.glow}` }}
                    />
                    <span className="font-medium text-slate-300">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white font-mono">{item.count} </span>
                    <span className="text-xs text-slate-500 font-mono">({share.toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="w-full bg-slate-950 rounded-xl h-4 overflow-hidden flex border border-slate-900 p-0.5">
            {stats.total === 0 ? (
              <div className="bg-slate-800 w-full h-full rounded-lg" />
            ) : (
              <>
                <div
                  style={{ width: `${(stats.available / stats.total) * 100}%` }}
                  className="bg-emerald-500 h-full rounded-l"
                  title="Available"
                />
                <div
                  style={{ width: `${(stats.assigned / stats.total) * 100}%` }}
                  className="bg-violet-500 h-full"
                  title="Assigned"
                />
                <div
                  style={{ width: `${(stats.maintenance / stats.total) * 100}%` }}
                  className="bg-amber-500 h-full"
                  title="Maintenance"
                />
                <div
                  style={{ width: `${(stats.retired / stats.total) * 100}%` }}
                  className="bg-slate-500 h-full rounded-r"
                  title="Retired"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Activities Audit Feed */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 shadow-lg space-y-6">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-slate-100 font-outfit">
              Live Operations Timeline
            </h2>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-12 text-center text-slate-600">
              No actions recorded yet. All operations logs appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3.5 bg-slate-950/45 border border-slate-900/70 p-4 rounded-xl hover:border-slate-850 transition-colors"
                >
                  <div className="rounded-lg bg-primary/10 border border-primary/10 p-2 mt-0.5 text-primary">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1 text-sm min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-semibold text-slate-200 truncate">{act.actor}</span>
                      <span className="text-xs text-slate-500 font-mono flex-shrink-0">
                        {formatTime(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed break-words">
                      {act.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
