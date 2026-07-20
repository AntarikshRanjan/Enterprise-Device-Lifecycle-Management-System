import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Laptop, CheckSquare, Wrench, ShieldAlert } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Assets',
      value: '128',
      desc: 'Registered IT assets',
      icon: Laptop,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Assigned Assets',
      value: '94',
      desc: 'Active checkouts',
      icon: CheckSquare,
      color: 'text-green-500 bg-green-500/10 border-green-500/20',
    },
    {
      title: 'Under Maintenance',
      value: '8',
      desc: 'Active tickets',
      icon: Wrench,
      color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    },
    {
      title: 'Pending Returns',
      value: '3',
      desc: 'Approvals required',
      icon: ShieldAlert,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Welcome back, {user?.firstName}! Here is an overview of your organization's device
          lifecycles.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg shadow-black/30 hover:border-slate-800 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">{stat.title}</span>
                <div className={`rounded-xl border p-2.5 ${stat.color}`}>
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

      {/* Main Sections (Placeholder Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activities */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 lg:col-span-2 shadow-lg">
          <h2 className="text-lg font-bold text-slate-100 mb-4">Recent Activities</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3.5 bg-slate-950/40 border border-slate-900 p-4 rounded-xl">
              <div className="h-2 w-2 rounded-full bg-green-500 mt-2"></div>
              <div className="flex-1 text-sm">
                <p className="text-slate-200">
                  <strong className="text-white">Admin User</strong> assigned a{' '}
                  <strong className="text-white">MacBook Pro (AST-0042)</strong> to Jane Doe.
                </p>
                <span className="text-xs text-slate-500 block mt-1">2 hours ago</span>
              </div>
            </div>
            <div className="flex items-start gap-3.5 bg-slate-950/40 border border-slate-900 p-4 rounded-xl">
              <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2"></div>
              <div className="flex-1 text-sm">
                <p className="text-slate-200">
                  <strong className="text-white">Jane Doe</strong> logged a ticket:{' '}
                  <strong className="text-white">"Keyboard key stuck"</strong> on Dell XPS.
                </p>
                <span className="text-xs text-slate-500 block mt-1">4 hours ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 mb-4">System Settings</h2>
            <p className="text-sm text-slate-400">
              Welcome to the AssetFlow prototype console. All modules are secured with token
              validation protocols.
            </p>
          </div>
          <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl mt-6 text-center text-xs text-slate-500 font-mono">
            CONNECTED AS: {user?.role.name}
          </div>
        </div>
      </div>
    </div>
  );
};
