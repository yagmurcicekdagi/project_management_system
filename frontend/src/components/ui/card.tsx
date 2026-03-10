import * as React from 'react'
import { cn } from '../../lib/utils'

function Card({ className = "", ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('rounded-lg border border-gray-200 bg-white text-gray-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100', className)} {...props} />
}

function CardHeader({ className = "", ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
}

function CardTitle({ className = "", ...props }: React.ComponentPropsWithoutRef<'h3'>) {
  return <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
}

function CardDescription({ className = "", ...props }: React.ComponentPropsWithoutRef<'p'>) {
  return <p className={cn('text-sm text-gray-500 dark:text-zinc-400', className)} {...props} />
}

function CardContent({ className = "", ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

function CardFooter({ className = "", ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
