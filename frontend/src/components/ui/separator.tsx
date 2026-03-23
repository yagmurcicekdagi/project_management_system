import React from 'react'

type SeparatorProps = Readonly<{
  className?: string;
}>

export function Separator({ className = '' }: SeparatorProps) {
  return <div className={`h-px w-full bg-gray-200 dark:bg-zinc-800 ${className}`} />
}

export default Separator
