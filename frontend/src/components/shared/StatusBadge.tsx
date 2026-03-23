import { STATUS_CONFIG } from '../../features/kanban/config/statusConfig'
import type { Status } from '../../features/kanban/config/statusConfig'

interface StatusBadgeProps {
  status: Status
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return null
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.pillToneClass}`}
    >
      <span className={`h-2 w-2 rounded-full ${cfg.dotToneClass}`} />
      {cfg.label}
    </span>
  )
}
