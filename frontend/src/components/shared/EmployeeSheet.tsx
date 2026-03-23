import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import ApiErrorAlert from './ApiErrorAlert'
import { useUpdateEmployee } from '../../hooks/useEmployees'
import type { EmployeeResponse } from '../../types'

type EmployeeSheetProps = Readonly<{
  employee: EmployeeResponse | null
  onClose: () => void
}>

export default function EmployeeSheet({ employee, onClose }: EmployeeSheetProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [apiError, setApiError] = useState<string | string[]>('')

  const updateEmployee = useUpdateEmployee()

  useEffect(() => {
    if (employee) {
      setFirstName(employee.firstName)
      setLastName(employee.lastName)
      setApiError('')
    }
  }, [employee])

  async function handleSave() {
    if (!employee) return
    setApiError('')
    try {
      await updateEmployee.mutateAsync({
        id: employee.id,
        payload: { firstName, lastName },
      })
      onClose()
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data
      if (data && typeof data === 'object' && !('message' in data)) {
        // Spring validation error: { field: message, ... }
        const messages = Object.values(data as Record<string, string>)
        setApiError(messages.length ? messages : 'Failed to update employee.')
      } else {
        const msg = (data as { message?: string } | undefined)?.message
        setApiError(msg ?? 'Failed to update employee.')
      }
    }
  }

  return (
    <Dialog open={!!employee} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>{employee?.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ApiErrorAlert message={apiError} />

          <div className="space-y-1">
            <label htmlFor="firstName" className="text-sm font-medium">First name</label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={updateEmployee.isPending}
          >
            {updateEmployee.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
