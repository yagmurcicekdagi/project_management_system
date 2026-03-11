import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

interface NavItem {
  label: string
  to: string
  icon?: ReactNode
}

interface SidebarItemProps {
  item: NavItem
  collapsed: boolean
  active: boolean
}

function SidebarItem({ item, collapsed, active }: SidebarItemProps) {
  const content = (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
        collapsed && 'justify-center',
        active
          ? 'bg-white/10 text-white'
          : 'text-slate-400 hover:text-white hover:bg-white/10',
      )}
    >
      {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </div>
  )

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to={item.to} className="block">
              {content}
            </Link>
          </TooltipTrigger>
          <TooltipContent>{item.label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Link to={item.to} className="block">
      {content}
    </Link>
  )
}

interface SidebarProps {
  items?: NavItem[]
  logo?: ReactNode
  collapsed?: boolean
  onCollapseChange?: (collapsed: boolean) => void
  className?: string
}

export function Sidebar({
  items = [],
  logo = null,
  collapsed = false,
  onCollapseChange = () => {},
  className = '',
}: SidebarProps) {
  const location = useLocation()
  const width = collapsed ? 'w-[72px]' : 'w-64'

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 border-r border-[#252842] bg-[#1a1c2e] transition-[width] duration-200 ease-in-out',
        width,
        className,
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-3">
          <div className="flex items-center gap-2 overflow-hidden">
            {!collapsed && logo}
            {!collapsed && (
              <span className="font-semibold truncate text-white">
                Project Manager
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapseChange(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'shrink-0 text-slate-400 hover:text-white hover:bg-white/10',
              collapsed ? 'mx-auto' : 'ml-auto',
            )}
          >
            {collapsed ? (
              <svg width="22" height="22" viewBox="0 0 24 24" className="opacity-80">
                <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" className="opacity-80">
                <path fill="currentColor" d="M15.41 16.59L14 18l-6-6l6-6l1.41 1.41L10.83 12z" />
              </svg>
            )}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.to}>
                <SidebarItem
                  item={item}
                  collapsed={collapsed}
                  active={location.pathname === item.to}
                />
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
