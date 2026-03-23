import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { UserPlus, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import PageHeader from '../../components/shared/PageHeader'
import DataTable, { type ColumnDef } from '../../components/shared/DataTable'
import Pagination from '../../components/shared/Pagination'
import AccountStatusBadge from '../../components/shared/AccountStatusBadge'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import EmployeeSheet from '../../components/shared/EmployeeSheet'
import ApiErrorAlert from '../../components/shared/ApiErrorAlert'
import { useEmployees, useCreateEmployee, useDeleteEmployee } from '../../hooks/useEmployees'
import type { EmployeeResponse } from '../../types'

const createSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email required'),
})

type CreateFormValues = z.infer<typeof createSchema>

export default function EmployeesPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResponse | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const { data, isLoading } = useEmployees(page, 20, debouncedSearch || undefined)
  const createEmployee = useCreateEmployee()
  const deleteEmployee = useDeleteEmployee()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({ resolver: zodResolver(createSchema) })

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(0)
    const trimmed = value.trim()
    clearTimeout((handleSearchChange as unknown as { _t?: ReturnType<typeof setTimeout> })._t)
    ;(handleSearchChange as unknown as { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(
      () => setDebouncedSearch(trimmed),
      300,
    )
  }

  async function onCreateSubmit(values: CreateFormValues) {
    setCreateError('')
    try {
      await createEmployee.mutateAsync(values)
      reset()
      setCreating(false)
      toast.success('Employee created.')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setCreateError(msg ?? 'Failed to create employee.')
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteEmployee.mutateAsync(id)
      toast.success('Employee deleted.')
    } catch {
      toast.error('Failed to delete employee.')
    } finally {
      setConfirmDelete(null)
    }
  }

  const columns: ColumnDef<EmployeeResponse>[] = [
    {
      header: 'Name',
      cell: (row) => (
        <span className="font-medium">{row.firstName} {row.lastName}</span>
      ),
    },
    {
      header: 'Email',
      cell: (row) => <span className="text-sm text-gray-600 dark:text-zinc-400">{row.email}</span>,
    },
    {
      header: 'Account',
      cell: (row) => <AccountStatusBadge userId={row.userId} />,
    },
    {
      header: '',
      className: 'w-16 text-right',
      cell: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600"
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(row.id) }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader
        title="Employees"
        action={
          <Button type="button" size="sm" onClick={() => { setCreating(true); setCreateError('') }}>
            <UserPlus className="mr-1 h-4 w-4" />
            New Employee
          </Button>
        }
      />

      {/* Create form */}
      {creating && (
        <Card>
          <CardHeader>
            <CardTitle>New Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4" noValidate>
              <ApiErrorAlert message={createError} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="firstName" className="text-sm font-medium">First name</label>
                  <Input id="firstName" {...register('firstName')} />
                  {errors.firstName && <p className="text-xs text-red-600">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
                  <Input id="lastName" {...register('lastName')} />
                  {errors.lastName && <p className="text-xs text-red-600">{errors.lastName.message}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setCreating(false); setCreateError(''); reset() }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search employees…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.content ?? []}
        isLoading={isLoading}
        emptyMessage="No employees found."
        onRowClick={setSelectedEmployee}
      />

      {/* Pagination */}
      {data && (
        <Pagination
          page={data.number}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          size={data.size}
          onPageChange={setPage}
        />
      )}

      {/* Edit slide-over */}
      <EmployeeSheet
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete employee"
        description="This will permanently delete the employee. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => confirmDelete !== null && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
