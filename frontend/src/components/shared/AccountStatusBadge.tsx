interface AccountStatusBadgeProps {
  userId: number | null
}

export default function AccountStatusBadge({ userId }: AccountStatusBadgeProps) {
  if (userId != null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Registered
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
      <span className="h-2 w-2 rounded-full bg-slate-400" />
      Pending Registration
    </span>
  )
}
