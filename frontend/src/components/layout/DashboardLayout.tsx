import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Laptop,
  CheckSquare,
  Wrench,
  History,
  Users,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Bell,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'IT_ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Assets',
      path: '/assets',
      icon: Laptop,
      roles: ['SUPER_ADMIN', 'IT_ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Assignments',
      path: '/assignments',
      icon: CheckSquare,
      roles: ['SUPER_ADMIN', 'IT_ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Maintenance',
      path: '/maintenance',
      icon: Wrench,
      roles: ['SUPER_ADMIN', 'IT_ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Audit Logs',
      path: '/audit-logs',
      icon: History,
      roles: ['SUPER_ADMIN', 'IT_ADMIN'],
    },
    {
      title: 'Employees',
      path: '/employees',
      icon: Users,
      roles: ['SUPER_ADMIN', 'IT_ADMIN'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => user && item.roles.includes(user.role.name));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-900 bg-slate-950 transition-all duration-300 md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header/Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-lg">
              AF
            </span>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              AssetFlow
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'}
                />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Sign Out */}
        <div className="border-t border-slate-900 p-4 bg-slate-950">
          <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-900 rounded-xl p-3.5">
            <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase">
              {user ? user.firstName[0] + user.lastName[0] : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-200">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500 truncate font-mono">
                {user?.role.name.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-red-450 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-900 bg-slate-950 px-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-4">
            <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary"></span>
            </button>

            <div className="h-8 w-px bg-slate-900"></div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                <UserIcon size={16} className="text-slate-400" />
              </div>
              <span className="text-sm font-medium text-slate-300 hidden sm:inline">
                {user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* View Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-950/60 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
