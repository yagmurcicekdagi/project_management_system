import * as React from 'react'
import { cn } from '../../lib/utils'

export function Table({ className, ...props }: React.ComponentPropsWithoutRef<'table'>) {
  return <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
}

export function THead({ className, ...props }: React.ComponentPropsWithoutRef<'thead'>) {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />
}

export function TBody({ className, ...props }: React.ComponentPropsWithoutRef<'tbody'>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

export function TR({ className, ...props }: React.ComponentPropsWithoutRef<'tr'>) {
  return <tr className={cn('border-b transition-colors hover:bg-gray-50 dark:hover:bg-zinc-900/50', className)} {...props} />
}

export function TH({ className, ...props }: React.ComponentPropsWithoutRef<'th'>) {
  return <th className={cn('h-10 px-2 text-left align-middle font-medium text-gray-500 dark:text-zinc-400', className)} {...props} />
}

export function TD({ className, ...props }: React.ComponentPropsWithoutRef<'td'>) {
  return <td className={cn('p-2 align-middle', className)} {...props} />
}
