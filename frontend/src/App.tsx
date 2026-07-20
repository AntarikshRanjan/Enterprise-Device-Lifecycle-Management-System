import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';

function DashboardPlaceholder() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AssetFlow</h1>
            <p className="text-slate-400 mt-1">Enterprise Device Lifecycle Management</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-slate-300">
              {user?.firstName} {user?.lastName} ({user?.role.name})
            </span>
            <button
              onClick={logout}
              className="bg-red-650 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-2">Authentication Status</h2>
            <p className="text-green-450 font-semibold mb-4">✓ Successfully Logged In</p>
            <div className="space-y-2 text-sm text-slate-400">
              <p>
                <strong className="text-slate-200">User ID:</strong> {user?.id}
              </p>
              <p>
                <strong className="text-slate-200">Email:</strong> {user?.email}
              </p>
              <p>
                <strong className="text-slate-200">Role:</strong> {user?.role.name}
              </p>
              <p>
                <strong className="text-slate-200">Department:</strong>{' '}
                {user?.departmentId || 'None Assigned'}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-2">Next Steps</h2>
            <p className="text-slate-400 mb-4">
              You have set up a type-safe authentication context.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <span className="text-sm font-medium">Phase 3: Dashboard Layout</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                <span className="text-sm font-medium">Phase 4: Lifecycles & Audits</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPlaceholder />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
