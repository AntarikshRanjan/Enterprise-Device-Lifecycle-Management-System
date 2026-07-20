import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Search, Loader2, ChevronLeft, ChevronRight, User, X } from 'lucide-react';

interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  activeCheckoutCount: number;
}

interface DepartmentGroup {
  id: string;
  name: string;
  description: string | null;
  _count: {
    users: number;
  };
}

interface EmployeesResponse {
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AssetDetail {
  id: string;
  tag: string;
  brand: string;
  model: string;
  category: { name: string };
}

interface AssignmentLog {
  id: string;
  asset: AssetDetail;
  assignedAt: string;
  returnedAt: string | null;
  returnNotes: string | null;
}

interface EmployeeDetailResponse {
  employee: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    role: string;
    department: string;
  };
  currentCheckouts: AssignmentLog[];
  pastCheckouts: AssignmentLog[];
}

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DepartmentGroup[]>([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Profile history detail state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetailResponse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Fetch departments list
  useEffect(() => {
    async function fetchDeps() {
      try {
        const response = await api.get<DepartmentGroup[]>('/api/employees/departments');
        setDepartments(response.data);
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    }
    fetchDeps();
  }, []);

  // Fetch employees list
  useEffect(() => {
    async function fetchEmployees() {
      setIsLoading(true);
      try {
        const response = await api.get<EmployeesResponse>('/api/employees', {
          params: {
            page,
            search: search || undefined,
            departmentId: departmentFilter || undefined,
            limit: 10,
          },
        });
        setEmployees(response.data.employees);
        setTotalPages(response.data.totalPages);
        setTotalEmployees(response.data.total);
      } catch (err) {
        console.error('Failed to load employees', err);
      } finally {
        setIsLoading(false);
      }
    }
    const debounceTimer = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(debounceTimer);
  }, [page, search, departmentFilter]);

  // Fetch individual details when user selects
  useEffect(() => {
    if (!selectedEmployeeId) {
      setEmployeeDetails(null);
      return;
    }

    async function fetchDetails() {
      setIsLoadingDetails(true);
      try {
        const response = await api.get<EmployeeDetailResponse>(
          `/api/employees/${selectedEmployeeId}`,
        );
        setEmployeeDetails(response.data);
      } catch (err) {
        console.error('Failed to load employee profile details', err);
      } finally {
        setIsLoadingDetails(false);
      }
    }
    fetchDetails();
  }, [selectedEmployeeId]);

  return (
    <div className="space-y-6 relative">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Employees Directory</h1>
        <p className="text-slate-400 mt-1">
          Monitor organizational team structures, security roles, and active hardware checkout
          tallies
        </p>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 border border-slate-900 p-5 rounded-2xl">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by first name, last name, or employee email..."
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
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d._count.users} members)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Grid Table */}
      <div className="border border-slate-900 rounded-2xl bg-slate-950/45 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-lg font-medium">No staff members found</p>
            <p className="text-sm mt-1">Try modifying your filters or check names.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/20 text-slate-400 font-semibold">
                  <th className="p-4 pl-6">Employee details</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Organizational Role</th>
                  <th className="p-4">Active Checkouts</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-900/20 transition-colors text-slate-200"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-400">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 font-medium">{emp.department}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-wider">
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full text-xs font-bold font-mono border ${
                          emp.activeCheckoutCount > 0
                            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_6px_rgba(139,92,246,0.1)]'
                            : 'bg-slate-900 text-slate-500 border-slate-850'
                        }`}
                      >
                        {emp.activeCheckoutCount}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => setSelectedEmployeeId(emp.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-855 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
                      >
                        History Logs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-900 p-4 px-6 bg-slate-950">
              <span className="text-xs text-slate-500 font-mono">
                Showing {employees.length} of {totalEmployees} members
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

      {/* Side Slide-over Panel for Checkout History */}
      {selectedEmployeeId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm p-0">
          <div className="absolute inset-0 -z-10" onClick={() => setSelectedEmployeeId(null)} />

          {/* Panel Container */}
          <div className="w-full max-w-xl h-full border-l border-slate-900 bg-slate-950 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-350">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-900">
              <div>
                <h2 className="text-xl font-bold text-white">Employee Lifecycle profile</h2>
                <p className="text-xs text-slate-500 mt-0.5">Asset assignments audit tracker</p>
              </div>
              <button
                onClick={() => setSelectedEmployeeId(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {isLoadingDetails || !employeeDetails ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto mt-6 space-y-6 pr-1">
                {/* Employee card overview */}
                <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl">
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_8px_rgba(139,92,246,0.15)]">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">
                        {employeeDetails.employee.firstName} {employeeDetails.employee.lastName}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {employeeDetails.employee.email}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-900/60 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                        Department
                      </p>
                      <p className="font-semibold text-slate-300 font-outfit">
                        {employeeDetails.employee.department}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                        System Access Role
                      </p>
                      <p className="font-semibold text-slate-300 font-outfit">
                        {employeeDetails.employee.role}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current assignments lists */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-200 tracking-wide uppercase">
                    Active checked out devices ({employeeDetails.currentCheckouts.length})
                  </h4>
                  {employeeDetails.currentCheckouts.length === 0 ? (
                    <p className="text-xs text-slate-650 italic bg-slate-950/30 border border-slate-900/50 p-4 rounded-xl">
                      No active devices checked out
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {employeeDetails.currentCheckouts.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between border border-violet-500/10 bg-violet-500/5 p-4 rounded-xl shadow-[0_0_6px_rgba(139,92,246,0.05)]"
                        >
                          <div>
                            <p className="font-semibold text-white text-sm">
                              {c.asset.brand} {c.asset.model}
                            </p>
                            <div className="text-[10px] text-slate-550 font-mono mt-0.5">
                              TAG: {c.asset.tag} | CATEGORY: {c.asset.category.name}
                            </div>
                          </div>
                          <div className="text-right text-xs">
                            <span className="text-slate-400 block font-mono">Assigned</span>
                            <span className="text-slate-500 font-mono text-[10px] mt-0.5 block">
                              {new Date(c.assignedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Previous returns list */}
                <div className="space-y-3 pb-4">
                  <h4 className="text-sm font-bold text-slate-200 tracking-wide uppercase">
                    Returned hardware history ({employeeDetails.pastCheckouts.length})
                  </h4>
                  {employeeDetails.pastCheckouts.length === 0 ? (
                    <p className="text-xs text-slate-650 italic bg-slate-950/30 border border-slate-900/50 p-4 rounded-xl">
                      No return history logs registered
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {employeeDetails.pastCheckouts.map((c) => (
                        <div
                          key={c.id}
                          className="border border-slate-900 bg-slate-950/40 p-4 rounded-xl space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-200 text-sm">
                                {c.asset.brand} {c.asset.model}
                              </p>
                              <div className="text-[10px] text-slate-550 font-mono mt-0.5">
                                TAG: {c.asset.tag} | CATEGORY: {c.asset.category.name}
                              </div>
                            </div>
                            <div className="text-right text-xs">
                              <span className="text-slate-400 block font-mono">Returned</span>
                              <span className="text-slate-500 font-mono text-[10px] mt-0.5 block">
                                {c.returnedAt ? new Date(c.returnedAt).toLocaleDateString() : ''}
                              </span>
                            </div>
                          </div>
                          {c.returnNotes && (
                            <p className="text-xs text-slate-450 bg-slate-900/30 p-2.5 rounded-lg border border-slate-900/50 leading-relaxed font-mono">
                              Notes: {c.returnNotes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
