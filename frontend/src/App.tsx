import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Assets } from './pages/Assets';
import { Assignments } from './pages/Assignments';
import { Maintenance } from './pages/Maintenance';
import { AuditLogs } from './pages/AuditLogs';
import { Employees } from './pages/Employees';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/employees" element={<Employees />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
