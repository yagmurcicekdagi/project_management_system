import type { ReactNode } from 'react'

type PageHeaderProps = Readonly<{
  title: string
  breadcrumb?: string
  action?: ReactNode
}>

export default function PageHeader({ title, breadcrumb, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        {breadcrumb && (
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-0.5">{breadcrumb}</p>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
