import { Navigate, Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'

interface ProtectedRouteProps {
  requiredRole?: 'MANAGER' | 'USER'
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { accessToken, role } = useAuthStore()

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && role !== requiredRole) {
    toast.error('You do not have permission to access that page.')
    return <Navigate to="/app/dashboard" replace />
  }

  return <Outlet />
}
