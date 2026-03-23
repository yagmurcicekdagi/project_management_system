import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/layout/ProtectedRoute'
import KanbanPage from './features/kanban/KanbanPage'
import EmployeesPage from './pages/employees/EmployeesPage'

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected — all roles */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/app/projects" element={<KanbanPage />} />

          {/* MANAGER only */}
          <Route element={<ProtectedRoute requiredRole="MANAGER" />}>
            <Route path="/app/employees" element={<EmployeesPage />} />
          </Route>

          <Route path="/app" element={<Navigate to="/app/projects" replace />} />
          <Route path="/app/*" element={<Navigate to="/app/projects" replace />} />
        </Route>
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/app/projects" replace />} />
      <Route path="*" element={<Navigate to="/app/projects" replace />} />
    </Routes>
  )
}
