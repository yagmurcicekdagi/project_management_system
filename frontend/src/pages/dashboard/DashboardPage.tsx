import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import PageHeader from '../../components/shared/PageHeader'
import StatusBadge from '../../components/shared/StatusBadge'
import { useProjects } from '../../hooks/useProjects'
import { useEmployees } from '../../hooks/useEmployees'
import { useAuthStore } from '../../store/authStore'
import type { Status } from '../../features/kanban/config/statusConfig'

export default function DashboardPage() {
  const { role, email } = useAuthStore()
  const navigate = useNavigate()
  const isManager = role === 'MANAGER'

  return isManager ? <ManagerDashboard email={email} navigate={navigate} /> : <UserDashboard navigate={navigate} />
}

function ManagerDashboard({
  email,
  navigate,
}: {
  email: string | null
  navigate: ReturnType<typeof useNavigate>
}) {
  const { data: projectsData, isLoading: projectsLoading } = useProjects(0, 200)
  const { data: employeesData, isLoading: employeesLoading } = useEmployees(0, 1)

  const projects = projectsData?.content ?? []
  const counts = {
    NEW: projects.filter((p) => p.status === 'NEW').length,
    IN_PROGRESS: projects.filter((p) => p.status === 'IN_PROGRESS').length,
    COMPLETED: projects.filter((p) => p.status === 'COMPLETED').length,
  }
  const total = projects.length
  const employeeCount = employeesData?.totalElements ?? 0

  const recent = [...projects]
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, 5)

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader title="Dashboard" />
      {email && (
        <p className="text-sm text-gray-500 dark:text-zinc-400">Welcome back, {email}</p>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Projects"
          value={projectsLoading ? '—' : String(total)}
        />
        <StatCard
          label="New"
          value={projectsLoading ? '—' : String(counts.NEW)}
        />
        <StatCard
          label="In Progress"
          value={projectsLoading ? '—' : String(counts.IN_PROGRESS)}
        />
        <StatCard
          label="Employees"
          value={employeesLoading ? '—' : String(employeeCount)}
        />
      </div>

      {/* Recent projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-5 w-full animate-pulse rounded bg-gray-100 dark:bg-zinc-800" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500">No projects yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
              {recent.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <button
                    type="button"
                    className="text-sm font-medium hover:underline text-left"
                    onClick={() => navigate(`/app/projects/${p.id}`)}
                  >
                    {p.name}
                  </button>
                  <StatusBadge status={p.status as Status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function UserDashboard({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const { data, isLoading } = useProjects(0, 20)
  const { email } = useAuthStore()
  const projects = data?.content ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader title="Dashboard" />
      {email && (
        <p className="text-sm text-gray-500 dark:text-zinc-400">Welcome back, {email}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-5 w-full animate-pulse rounded bg-gray-100 dark:bg-zinc-800" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500">You have not been assigned to any projects.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
              {projects.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <button
                    type="button"
                    className="text-sm font-medium hover:underline text-left"
                    onClick={() => navigate(`/app/projects/${p.id}`)}
                  >
                    {p.name}
                  </button>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={p.status as Status} />
                    {p.endDate && (
                      <span className="text-xs text-gray-400 dark:text-zinc-500">
                        Due {p.endDate.slice(0, 10)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">{label}</p>
        <p className="mt-1 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
