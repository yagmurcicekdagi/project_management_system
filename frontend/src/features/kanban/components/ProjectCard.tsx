import { CalendarDays, ListTodo } from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/card'
import { STATUS_CONFIG } from '../config/statusConfig'
import { useProjectAssignments } from '../../../hooks/useAssignments'
import type { Project } from '../types/kanban'
import { AVATAR_COLORS, formatRelativeDate, getInitials } from '../utils/projectUtils'

interface ProjectCardProps {
  project: Project
  dragging?: boolean
  onClick?: () => void
}

export function ProjectCard({ project, dragging = false, onClick }: ProjectCardProps) {
  const dueStr = project.dueDate ?? project.endDate
  const rel = formatRelativeDate(dueStr)
  const isOverdue = rel === 'Overdue'
  const { data: assignmentData = [] } = useProjectAssignments(Number(project.id))
  const assignees = assignmentData
  const STATUS_PROGRESS: Record<string, number> = { NEW: 0, IN_PROGRESS: 50, COMPLETED: 100 }
  const progress = project.status ? (STATUS_PROGRESS[project.status] ?? null) : null
  const status = project.status
  const cfg = status ? STATUS_CONFIG[status] : null

  return (
    <Card
      onClick={onClick}
      className={`flex flex-col overflow-hidden rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 ${
        dragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <CardContent className="flex flex-col flex-1 p-5 gap-4">

        {/* Title + description */}
        <div>
          <p className="font-bold text-base leading-snug">{project.name || 'Untitled'}</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-zinc-500 line-clamp-1">
            {project.description || '—'}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400">
              <ListTodo size={14} />
              Progress
            </span>
            <span className="text-xs font-semibold text-gray-600 dark:text-zinc-300">
              {progress != null ? `${progress}%` : '—'}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${cfg?.dotToneClass ?? 'bg-emerald-500'}`}
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
        </div>

        {/* Due date chip */}
        {dueStr && (
          <div className={`inline-flex items-center gap-1.5 self-start text-xs px-3 py-1.5 rounded-xl font-medium ${
            isOverdue
              ? 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400'
              : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'
          }`}>
            <CalendarDays size={13} />
            Due: {new Date(dueStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        )}

        {/* Footer: avatar stack */}
        <div className="flex items-center pt-2 border-t border-gray-100 dark:border-zinc-800">
          <div className="flex -space-x-2">
            {assignees.slice(0, 3).map((a, i) => (
              <span
                key={a.id}
                title={`${a.firstName} ${a.lastName}`}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-white text-[11px] font-semibold ring-2 ring-white dark:ring-zinc-900 ${AVATAR_COLORS[a.id % AVATAR_COLORS.length]}`}
                style={{ zIndex: 3 - i }}
              >
                {getInitials(`${a.firstName} ${a.lastName}`)}
              </span>
            ))}
            {assignees.length > 3 && (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-700 text-[11px] font-semibold ring-2 ring-white dark:ring-zinc-900">
                +{assignees.length - 3}
              </span>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
