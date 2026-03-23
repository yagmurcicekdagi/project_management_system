import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Trash2, UserPlus, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../../components/ui/select'
import PageHeader from '../../components/shared/PageHeader'
import StatusBadge from '../../components/shared/StatusBadge'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import ApiErrorAlert from '../../components/shared/ApiErrorAlert'
import { useProject, useUpdateProject } from '../../hooks/useProjects'
import {
  useProjectAssignments,
  useAssignEmployee,
  useUnassignEmployee,
  useUnassignAll,
} from '../../hooks/useAssignments'
import { useEmployees } from '../../hooks/useEmployees'
import { useAuthStore } from '../../store/authStore'
import type { Status } from '../../features/kanban/config/statusConfig'

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETED']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role } = useAuthStore()
  const projectId = Number(id)

  const { data: project, isLoading, error } = useProject(projectId)
  const { data: assignments = [] } = useProjectAssignments(projectId)
  const updateProject = useUpdateProject()
  const assignEmployee = useAssignEmployee(projectId)
  const unassignEmployee = useUnassignEmployee(projectId)
  const unassignAll = useUnassignAll(projectId)

  const [editing, setEditing] = useState(false)
  const [apiError, setApiError] = useState('')
  const [confirmUnassign, setConfirmUnassign] = useState<number | null>(null)
  const [confirmRemoveAll, setConfirmRemoveAll] = useState(false)

  // Assign employee search
  const [assignSearch, setAssignSearch] = useState('')
  const [debouncedAssignSearch, setDebouncedAssignSearch] = useState('')
  useEffect(() => {
    const id = setTimeout(() => setDebouncedAssignSearch(assignSearch.trim()), 300)
    return () => clearTimeout(id)
  }, [assignSearch])
  const { data: searchResults } = useEmployees(0, 10, debouncedAssignSearch || undefined)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: '', description: '', status: 'NEW', startDate: '', endDate: '' },
  })

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description ?? '',
        status: project.status as 'NEW' | 'IN_PROGRESS' | 'COMPLETED',
        startDate: project.startDate?.slice(0, 10) ?? '',
        endDate: project.endDate?.slice(0, 10) ?? '',
      })
    }
  }, [project, reset])

  async function onSave(values: ProjectFormValues) {
    setApiError('')
    try {
      await updateProject.mutateAsync({ id: projectId, payload: values })
      setEditing(false)
      toast.success('Project updated.')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setApiError(msg ?? 'Failed to update project.')
    }
  }

  async function handleAssign(employeeId: number) {
    try {
      await assignEmployee.mutateAsync(employeeId)
      setAssignSearch('')
      toast.success('Employee assigned.')
    } catch {
      toast.error('Failed to assign employee.')
    }
  }

  async function handleUnassign(employeeId: number) {
    try {
      await unassignEmployee.mutateAsync(employeeId)
      toast.success('Employee removed.')
    } catch {
      toast.error('Failed to remove employee.')
    } finally {
      setConfirmUnassign(null)
    }
  }

  async function handleRemoveAll() {
    try {
      await unassignAll.mutateAsync()
      toast.success('All employees removed.')
    } catch {
      toast.error('Failed to remove all employees.')
    } finally {
      setConfirmRemoveAll(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100 dark:bg-zinc-800" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <ApiErrorAlert message="Project not found or failed to load." />
      </div>
    )
  }

  const isManager = role === 'MANAGER'
  const assignedIds = new Set(assignments.map((a) => a.id))

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader
        title={project.name}
        breadcrumb="Projects"
        action={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/projects')}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        }
      />

      {/* ── Project details ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Details</CardTitle>
          {isManager && !editing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {editing ? (
            <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
              <ApiErrorAlert message={apiError} />

              <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <textarea
                  id="description"
                  {...register('description')}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={watch('status')}
                  onValueChange={(v) => setValue('status', v as 'NEW' | 'IN_PROGRESS' | 'COMPLETED')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
                  <Input id="startDate" type="date" {...register('startDate')} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
                  <Input id="endDate" type="date" {...register('endDate')} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setEditing(false); setApiError('') }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex gap-4">
                <dt className="w-28 shrink-0 font-medium text-gray-500">Status</dt>
                <dd><StatusBadge status={project.status as Status} /></dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-28 shrink-0 font-medium text-gray-500">Description</dt>
                <dd className="text-gray-800 dark:text-zinc-200">{project.description || '—'}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-28 shrink-0 font-medium text-gray-500">Start Date</dt>
                <dd className="text-gray-800 dark:text-zinc-200">{project.startDate?.slice(0, 10) || '—'}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-28 shrink-0 font-medium text-gray-500">End Date</dt>
                <dd className="text-gray-800 dark:text-zinc-200">{project.endDate?.slice(0, 10) || '—'}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-28 shrink-0 font-medium text-gray-500">Created</dt>
                <dd className="text-gray-800 dark:text-zinc-200">{project.createdAt?.slice(0, 10) || '—'}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {/* ── Assignments — MANAGER only ── */}
      {isManager && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Team</CardTitle>
            {assignments.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => setConfirmRemoveAll(true)}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Remove All
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Assign search */}
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  placeholder="Search employee to assign…"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                />
                {assignSearch && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Clear search"
                    onClick={() => setAssignSearch('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {debouncedAssignSearch && searchResults && searchResults.content.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-900">
                  {searchResults.content
                    .filter((e) => !assignedIds.has(e.id))
                    .map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
                        onClick={() => handleAssign(e.id)}
                      >
                        <UserPlus className="h-4 w-4 text-gray-400" />
                        {e.firstName} {e.lastName}
                        <span className="ml-auto text-xs text-gray-400">{e.email}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Assigned employees list */}
            {assignments.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-zinc-500">No employees assigned.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                {assignments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{a.firstName} {a.lastName}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{a.email}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => setConfirmUnassign(a.id)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Confirm dialogs ── */}
      <ConfirmDialog
        open={confirmUnassign !== null}
        title="Remove employee"
        description="Remove this employee from the project?"
        confirmLabel="Remove"
        onConfirm={() => confirmUnassign !== null && handleUnassign(confirmUnassign)}
        onCancel={() => setConfirmUnassign(null)}
      />
      <ConfirmDialog
        open={confirmRemoveAll}
        title="Remove all employees"
        description="Remove all assigned employees from this project?"
        confirmLabel="Remove All"
        onConfirm={handleRemoveAll}
        onCancel={() => setConfirmRemoveAll(false)}
      />
    </div>
  )
}
