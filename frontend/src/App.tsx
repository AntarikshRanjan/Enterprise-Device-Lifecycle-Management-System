import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 animate-fade-in">
        This is a placeholder view for the <strong className="text-white">{title}</strong> panel.
        Implementation of this module is scheduled in subsequent development phases.
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
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assets" element={<PlaceholderPage title="Asset Inventory" />} />
              <Route path="/assignments" element={<PlaceholderPage title="Assignments" />} />
              <Route path="/maintenance" element={<PlaceholderPage title="Maintenance" />} />
              <Route path="/audit-logs" element={<PlaceholderPage title="Audit Logs" />} />
              <Route path="/employees" element={<PlaceholderPage title="Employees" />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
