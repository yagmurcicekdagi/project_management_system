import React from 'react'
import { Button } from './ui/button'

export function SidebarTrigger({ collapsed, onClick, className = '' }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={className}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" className="opacity-80">
        <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
      </svg>
    </Button>
  )
}

export default SidebarTrigger

