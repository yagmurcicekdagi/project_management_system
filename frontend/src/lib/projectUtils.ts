export const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-rose-500',
]

export function formatRelativeDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
  if (diff < 0) return 'Overdue'
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return `in ${diff}d`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
