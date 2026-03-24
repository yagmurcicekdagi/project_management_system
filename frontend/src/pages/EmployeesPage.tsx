import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Trash2, UserPlus } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import AccountStatusBadge from "../components/shared/AccountStatusBadge";
import ApiErrorAlert from "../components/shared/ApiErrorAlert";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import DataTable, { type ColumnDef } from "../components/shared/DataTable";
import EmployeeSheet from "../components/shared/EmployeeSheet";
import Pagination from "../components/shared/Pagination";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  useCreateEmployee,
  useDeleteEmployee,
  useEmployees,
} from "../hooks/query/useEmployees";
import type { EmployeeResponse } from "../types";

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-cyan-500",
];

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

const createSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email({ message: "Valid email required" }),
});

type CreateFormValues = z.infer<typeof createSchema>;

export default function EmployeesPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeResponse | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const { data, isLoading } = useEmployees(
    page,
    10,
    debouncedSearch || undefined,
  );
  const createEmployee = useCreateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({ resolver: zodResolver(createSchema) });

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(0);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(
      () => setDebouncedSearch(value.trim()),
      300,
    );
  }

  async function onCreateSubmit(values: CreateFormValues) {
    setCreateError("");
    try {
      await createEmployee.mutateAsync(values);
      reset();
      setCreating(false);
      toast.success("Employee created.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setCreateError(msg ?? "Failed to create employee.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteEmployee.mutateAsync(id);
      toast.success("Employee deleted.");
    } catch {
      toast.error("Failed to delete employee.");
    } finally {
      setConfirmDelete(null);
    }
  }

  const columns: ColumnDef<EmployeeResponse>[] = [
    {
      header: "Employee",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold ${AVATAR_COLORS[row.id % AVATAR_COLORS.length]}`}
          >
            {getInitials(row.firstName, row.lastName)}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">
              {row.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Account",
      className: "w-32",
      cell: (row) => <AccountStatusBadge userId={row.userId} />,
    },
    {
      header: "",
      className: "w-12 text-right",
      cell: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDelete(row.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const total = data?.page?.totalElements ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Employees</h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-zinc-500">
            Manage your team members
            {!isLoading && (
              <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-zinc-400">
                {total} {total === 1 ? "employee" : "employees"}
              </span>
            )}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setCreating(true);
            setCreateError("");
          }}
        >
          <UserPlus className="mr-1 h-4 w-4" />
          New Employee
        </Button>
      </div>

      {/* Create form */}
      {creating && (
        <Card>
          <CardHeader>
            <CardTitle>New Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onCreateSubmit)}
              className="space-y-4"
              noValidate
            >
              <ApiErrorAlert message={createError} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First name
                  </label>
                  <Input id="firstName" {...register("firstName")} />
                  {errors.firstName && (
                    <p className="text-xs text-red-600">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last name
                  </label>
                  <Input id="lastName" {...register("lastName")} />
                  {errors.lastName && (
                    <p className="text-xs text-red-600">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCreating(false);
                    setCreateError("");
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Creating…" : "Create"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search — full width, flush with table */}
      <div className="flex items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <Input
          className="h-7 border-0 shadow-none focus-visible:ring-0 p-0 text-sm"
          placeholder="Search employees…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
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
          page={data.page.number}
          totalPages={data.page.totalPages}
          totalElements={data.page.totalElements}
          size={data.page.size}
          onPageChange={setPage}
        />
      )}

      {/* Edit dialog */}
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
  );
}
