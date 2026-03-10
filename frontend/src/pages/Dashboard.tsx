import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import api from '../api/client'
import { USE_MOCK } from '../mock/useMock'
import * as mock from '../mock/api'
import {
  RefreshCcw,
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { STATUS_CONFIG, STATUSES, type Status } from '../features/kanban/config/statusConfig'
import type { EntityId, Project } from '../features/kanban/types/kanban'
import {
  AVATAR_COLORS,
  formatRelativeDate,
  getInitials,
} from '../features/kanban/utils/projectUtils'
import ProjectModal from '../features/kanban/components/ProjectModal'
import useProjectForm from '../features/kanban/hooks/useProjectForm'
import { useUserRole } from '../context/UserRoleContext'

// ─── helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ─── component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { role } = useUserRole()
  const form = useProjectForm()
  const [allProjects, setAllProjects] = React.useState<Project[]>([])
  const [employeeCount, setEmployeeCount] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [selectedProject, setSelectedProject] = React.useState<Project | undefined>(undefined)
  const [showModal, setShowModal] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      if (USE_MOCK) {
        const [proj, emp] = await Promise.all([
          mock.getProjects({ page: 0, size: 200 }),
          mock.getEmployees({ page: 0, size: 1 }),
        ])
        setAllProjects(proj.content)
        setEmployeeCount(emp.totalElements)
      } else {
        const [proj, emp] = await Promise.all([
          api.get('/v1/projects', { params: { page: 0, size: 200 } }),
          api.get('/v1/employees', { params: { page: 0, size: 1 } }),
        ])
        setAllProjects(proj.data?.content ?? [])
        setEmployeeCount(emp.data?.totalElements ?? 0)
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  function openProject(project: Project) {
    form.loadProject(project)
    setSelectedProject(project)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setSelectedProject(undefined)
    form.resetForm()
  }

  function handleSave() {
    const updated = form.buildProject()
    if (!updated) return
    setAllProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
    if (USE_MOCK) {
      mock.updateProject(updated.id, updated).catch(() => {})
    } else {
      api.put(`/v1/projects/${updated.id}`, updated).catch(() => {})
    }
    closeModal()
  }

  function handleDelete(id: EntityId) {
    setAllProjects((prev) => prev.filter((p) => p.id !== id))
    if (USE_MOCK) {
      mock.deleteProject(id).catch(() => {})
    } else {
      api.delete(`/v1/projects/${id}`).catch(() => {})
    }
    closeModal()
  }

  const statusCounts = React.useMemo(() => {
    const counts: Record<Status, number> = { TODO: 0, IN_PROGRESS: 0, COMPLETED: 0 }
    for (const p of allProjects) {
      if (p.status && p.status in counts) counts[p.status as Status]++
    }
    return counts
  }, [allProjects])

  const recentProjects = allProjects.slice(0, 6)
  const total = allProjects.length

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">{formatDate()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/kanban')} className="gap-2">
            <Plus size={16} /> New Project
          </Button>
          <Button onClick={load} disabled={loading} variant="secondary" size="icon">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ── KPI Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<FolderKanban size={20} />}
          iconBg="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
          label="Total Projects"
          value={total}
        />
        <KpiCard
          icon={<Users size={20} />}
          iconBg="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300"
          label="Team Members"
          value={employeeCount}
        />
        <KpiCard
          icon={<CheckCircle2 size={20} />}
          iconBg="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"
          label="Completed"
          value={statusCounts.COMPLETED}
        />
        <KpiCard
          icon={<Clock size={20} />}
          iconBg="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300"
          label="In Progress"
          value={statusCounts.IN_PROGRESS}
        />
      </div>

      {/* ── Status Distribution ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {STATUSES.map((status) => {
          const cfg = STATUS_CONFIG[status]
          const count = statusCounts[status]
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <Card
              key={status}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/kanban')}
            >
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.pillToneClass}`}>
                    {cfg.label}
                  </span>
                  <span className={`text-xl font-bold ${cfg.countToneClass}`}>{count}</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400 mb-1">
                    <span>{pct}% of total</span>
                    <span>{count} project{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cfg.dotToneClass} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Recent Projects list ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Recent Projects</h2>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
            <a href="/projects">View all <ArrowRight size={12} /></a>
          </Button>
        </div>

        {!loading && recentProjects.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-zinc-400 py-8 text-center">No projects found</p>
        ) : (
          <Card className="overflow-hidden rounded-2xl shadow-sm">
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {recentProjects.map((p) => {
                const dueStr = p.dueDate ?? p.endDate
                const rel = formatRelativeDate(dueStr)
                const isOverdue = rel === 'Overdue'
                const assignees = p.assignees ?? []
                const progress = p.progress != null ? Math.min(100, Number(p.progress)) : null
                const status = p.status as Status | undefined
                const cfg = status ? STATUS_CONFIG[status] : null

                return (
                  <button type="button" key={p.id} onClick={() => openProject(p)} className="flex w-full items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors text-left">

                    {/* Status badge */}
                    <div className="w-24 shrink-0">
                      {cfg && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.pillToneClass}`}>
                          {cfg.label}
                        </span>
                      )}
                    </div>

                    {/* Name + description */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">{p.description || '—'}</p>
                    </div>

                    {/* Progress bar */}
                    <div className="hidden sm:flex items-center gap-2 w-32 shrink-0">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${cfg?.dotToneClass ?? 'bg-emerald-500'}`}
                          style={{ width: `${progress ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-zinc-400 w-8 text-right">
                        {progress != null ? `${progress}%` : '—'}
                      </span>
                    </div>

                    {/* Avatars */}
                    <div className="hidden md:flex -space-x-2 shrink-0">
                      {assignees.slice(0, 3).map((a, i) => (
                        <span
                          key={a.id}
                          title={a.name}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-white text-[10px] font-semibold ring-2 ring-white dark:ring-zinc-900 ${AVATAR_COLORS[Number(a.id) % AVATAR_COLORS.length]}`}
                          style={{ zIndex: 3 - i }}
                        >
                          {getInitials(a.name)}
                        </span>
                      ))}
                      {assignees.length > 3 && (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-700 text-[10px] font-semibold ring-2 ring-white dark:ring-zinc-900">
                          +{assignees.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Due date */}
                    <span className={`text-xs font-medium w-16 text-right shrink-0 ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-zinc-500'}`}>
                      {rel}
                    </span>

                  </button>
                )
              })}
            </div>
          </Card>
        )}
      </div>

      {showModal && (
        <ProjectModal
          open={showModal}
          onClose={closeModal}
          project={selectedProject}
          form={form}
          onCancel={closeModal}
          onSave={handleSave}
          onDelete={role === 'manager' ? handleDelete : undefined}
          readonly={role === 'employee' && !!selectedProject}
        />
      )}
    </div>
  )
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: number
}

function KpiCard({ icon, iconBg, label, value }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5 flex items-center gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}
