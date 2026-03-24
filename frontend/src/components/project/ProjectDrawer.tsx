import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BarChart3,
  CalendarDays,
  Check,
  TrendingUp,
  Users2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { getEmployees } from "../../api/employees";
import {
  STATUS_CONFIG,
  STATUS_OPTIONS,
  type Status,
} from "../../config/statusConfig";
import {
  useAssignEmployee,
  useProjectAssignments,
  useUnassignEmployee,
} from "../../hooks/query/useAssignments";
import { useProject, useUpdateProject } from "../../hooks/query/useProjects";
import {
  AVATAR_COLORS,
  formatRelativeDate,
  getInitials,
} from "../../lib/projectUtils";
import { useAuthStore } from "../../store/authStore";
import type { EmployeeResponse } from "../../types";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Calendar } from "../ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";

// ─── types ───────────────────────────────────────────────────────────────────

type ProjectDrawerProps = Readonly<{
  projectId: number | null;
  onClose: () => void;
}>;

// ─── component ───────────────────────────────────────────────────────────────

export default function ProjectDrawer({
  projectId,
  onClose,
}: ProjectDrawerProps) {
  const { role } = useAuthStore();
  const isManager = role === "MANAGER";

  const { data: project, isLoading } = useProject(projectId ?? 0);
  const { data: assignments = [] } = useProjectAssignments(projectId ?? 0);
  const updateProject = useUpdateProject();

  function handleStatusChange(newStatus: Status) {
    if (!projectId) return;
    updateProject.mutate({ id: projectId, payload: { status: newStatus } });
  }

  const STATUS_PROGRESS: Record<string, number> = {
    NEW: 0,
    IN_PROGRESS: 50,
    COMPLETED: 100,
  };
  const progressNum = project ? (STATUS_PROGRESS[project.status] ?? 0) : null;

  const dueDate = project?.endDate ?? null;
  const dueStr = formatRelativeDate(dueDate ?? undefined);
  const isOverdue = dueStr === "Overdue";

  return (
    <Sheet
      open={projectId !== null}
      onOpenChange={(open) => {
        if (!open) {
          (document.activeElement as HTMLElement)?.blur();
          onClose();
        }
      }}
    >
      <SheetContent
        side="right"
        aria-describedby={undefined}
        className="w-[480px] sm:max-w-[480px] flex flex-col overflow-y-auto p-0"
      >
        <SheetTitle className="sr-only">
          {project?.name ?? "Project details"}
        </SheetTitle>
        {isLoading || !project ? (
          <div className="flex-1 space-y-4 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-5 rounded bg-gray-100 dark:bg-zinc-800 animate-pulse"
                style={{ width: `${80 - i * 8}%` }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* ── Header ── */}
            <SheetHeader className="px-6 pt-6 pb-4">
              {isManager ? (
                <TitleEditor
                  projectId={projectId!}
                  initialValue={project.name}
                />
              ) : (
                <p className="text-xl font-semibold leading-tight pr-8">
                  {project.name}
                </p>
              )}
            </SheetHeader>

            <Separator />

            {/* ── Metadata ── */}
            <div className="px-6 py-5 space-y-5">
              {/* Status */}
              <MetaRow icon={<BarChart3 size={14} />} label="Status">
                <Select
                  value={project.status}
                  onValueChange={(v) => handleStatusChange(v as Status)}
                  disabled={updateProject.isPending}
                >
                  <SelectTrigger className="h-auto w-auto border-0 p-0 shadow-none focus:ring-0 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </MetaRow>

              {/* Assignees */}
              <MetaRow icon={<Users2 size={14} />} label="Assignees">
                <AssigneeSelector
                  projectId={projectId!}
                  assignments={assignments}
                  isManager={isManager}
                />
              </MetaRow>

              {/* Due date */}
              <MetaRow icon={<CalendarDays size={14} />} label="Due date">
                {isManager ? (
                  <DueDatePicker
                    projectId={projectId!}
                    value={dueDate}
                    isOverdue={isOverdue}
                  />
                ) : (
                  <span
                    className={`text-sm ${isOverdue ? "text-red-500 dark:text-red-400" : ""}`}
                  >
                    {dueDate
                      ? new Date(dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                    {isOverdue && (
                      <span className="ml-1.5 text-xs font-medium">
                        (Overdue)
                      </span>
                    )}
                  </span>
                )}
              </MetaRow>

              {/* Progress */}
              <MetaRow icon={<TrendingUp size={14} />} label="Progress">
                {progressNum != null ? (
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden max-w-[160px]">
                      <div
                        className={`h-full rounded-full transition-all ${STATUS_CONFIG[project.status as Status]?.dotToneClass ?? "bg-emerald-500"}`}
                        style={{ width: `${progressNum}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">
                      {progressNum}%
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </MetaRow>
            </div>

            <Separator />

            {/* ── Description ── */}
            <DescriptionEditor
              projectId={projectId!}
              initialValue={project.description ?? ""}
              readonly={!isManager}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── DescriptionEditor ───────────────────────────────────────────────────────

function DescriptionEditor({
  projectId,
  initialValue,
  readonly = false,
}: {
  projectId: number;
  initialValue: string;
  readonly?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const valueRef = useRef(initialValue);
  const savedRef = useRef(initialValue);
  const isFocused = useRef(false);
  const updateProject = useUpdateProject();

  // Keep a ref to mutate so the unmount cleanup always has the latest version
  const mutateRef = useRef(updateProject.mutate);
  useEffect(() => {
    mutateRef.current = updateProject.mutate;
  });

  // Only sync from server when the user is NOT actively editing
  useEffect(() => {
    if (!isFocused.current) {
      setValue(initialValue);
      valueRef.current = initialValue;
      savedRef.current = initialValue;
    }
  }, [initialValue]);

  // Save on unmount (fires when drawer closes before onBlur can fire)
  useEffect(() => {
    return () => {
      if (valueRef.current !== savedRef.current) {
        mutateRef.current({
          id: projectId,
          payload: { description: valueRef.current },
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    valueRef.current = e.target.value;
  }

  function handleFocus() {
    isFocused.current = true;
  }

  function handleBlur() {
    isFocused.current = false;
    const current = valueRef.current;
    if (current === savedRef.current) return;
    savedRef.current = current;
    updateProject.mutate(
      { id: projectId, payload: { description: current } },
      {
        onError: () => {
          savedRef.current = initialValue;
        },
      },
    );
  }

  return (
    <textarea
      className="flex-1 w-full resize-none bg-transparent px-6 py-5 text-sm outline-none placeholder:text-muted-foreground/50 disabled:cursor-default disabled:opacity-100"
      placeholder={readonly ? "—" : "Add a description…"}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={readonly}
    />
  );
}

// ─── TitleEditor ─────────────────────────────────────────────────────────────

function TitleEditor({
  projectId,
  initialValue,
}: {
  projectId: number;
  initialValue: string;
}) {
  const [value, setValue] = useState(initialValue);
  const valueRef = useRef(initialValue);
  const savedRef = useRef(initialValue);
  const isFocused = useRef(false);
  const updateProject = useUpdateProject();
  const mutateRef = useRef(updateProject.mutate);
  useEffect(() => {
    mutateRef.current = updateProject.mutate;
  });

  useEffect(() => {
    if (!isFocused.current) {
      setValue(initialValue);
      valueRef.current = initialValue;
      savedRef.current = initialValue;
    }
  }, [initialValue]);

  useEffect(() => {
    return () => {
      const current = valueRef.current.trim();
      if (current && current !== savedRef.current) {
        mutateRef.current({ id: projectId, payload: { name: current } });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    valueRef.current = e.target.value;
  }

  function handleFocus() {
    isFocused.current = true;
  }

  function handleBlur() {
    isFocused.current = false;
    const current = valueRef.current.trim();
    if (!current || current === savedRef.current) {
      setValue(savedRef.current);
      valueRef.current = savedRef.current;
      return;
    }
    savedRef.current = current;
    setValue(current);
    valueRef.current = current;
    updateProject.mutate(
      { id: projectId, payload: { name: current } },
      {
        onError: () => {
          savedRef.current = initialValue;
        },
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") {
      setValue(savedRef.current);
      valueRef.current = savedRef.current;
      e.currentTarget.blur();
    }
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-full pr-8 text-xl font-semibold leading-tight bg-transparent outline-none rounded focus:bg-muted/40 transition-colors placeholder:text-muted-foreground/50"
      placeholder="Project title"
    />
  );
}

// ─── DueDatePicker ────────────────────────────────────────────────────────────

function DueDatePicker({
  projectId,
  value,
  isOverdue,
}: {
  projectId: number;
  value: string | null;
  isOverdue: boolean;
}) {
  const [open, setOpen] = useState(false);
  const updateProject = useUpdateProject();
  const selected = value ? new Date(value) : undefined;

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    setOpen(false);
    updateProject.mutate({
      id: projectId,
      payload: { endDate: format(date, "yyyy-MM-dd") },
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`text-sm hover:underline underline-offset-2 transition-colors text-left ${isOverdue ? "text-red-500 dark:text-red-400" : ""}`}
        >
          {value ? (
            new Date(value).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          ) : (
            <span className="text-muted-foreground">Pick a date</span>
          )}
          {isOverdue && (
            <span className="ml-1.5 text-xs font-medium">(Overdue)</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// ─── MetaRow ─────────────────────────────────────────────────────────────────

function MetaRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center gap-1.5 w-24 shrink-0 text-xs font-medium text-muted-foreground pt-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex-1 min-w-0 pt-0.5">{children}</div>
    </div>
  );
}

// ─── AssigneeSelector ────────────────────────────────────────────────────────

type AssigneeSelectorProps = Readonly<{
  projectId: number;
  assignments: EmployeeResponse[];
  isManager: boolean;
}>;

function AssigneeSelector({
  projectId,
  assignments,
  isManager,
}: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const assignEmployee = useAssignEmployee(projectId);
  const unassignEmployee = useUnassignEmployee(projectId);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: employeesPage, isLoading: empLoading } = useQuery({
    queryKey: ["employees", 0, 20, debouncedSearch, "drawer"],
    queryFn: () => getEmployees(0, 20, debouncedSearch || undefined),
    enabled: open,
  });

  const assignedIds = new Set(assignments.map((a) => a.id));

  function handleToggle(emp: EmployeeResponse) {
    if (assignedIds.has(emp.id)) {
      unassignEmployee.mutate(emp.id);
    } else {
      assignEmployee.mutate(emp.id);
    }
  }

  const visible = assignments.slice(0, 4);
  const overflow = assignments.length - visible.length;

  const avatarStack = (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map((a, i) => (
          <span
            key={a.id}
            title={`${a.firstName} ${a.lastName}`}
            style={{ zIndex: visible.length - i }}
          >
            <Avatar className="h-8 w-8 ring-2 ring-background">
              <AvatarFallback
                className={`text-[11px] font-semibold text-white ${AVATAR_COLORS[a.id % AVATAR_COLORS.length]}`}
              >
                {getInitials(`${a.firstName} ${a.lastName}`)}
              </AvatarFallback>
            </Avatar>
          </span>
        ))}
        {overflow > 0 && (
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-zinc-700 ring-2 ring-background flex items-center justify-center text-[11px] font-semibold z-0">
            +{overflow}
          </div>
        )}
      </div>
      {assignments.length === 0 && (
        <span className="text-sm text-muted-foreground ml-1">
          {isManager ? "Click to assign" : "No assignees"}
        </span>
      )}
    </div>
  );

  if (!isManager) {
    if (assignments.length === 0) return avatarStack;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 hover:opacity-75 transition-opacity rounded"
          >
            {avatarStack}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start" side="bottom">
          <div className="space-y-1">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded text-sm"
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-semibold ${AVATAR_COLORS[a.id % AVATAR_COLORS.length]}`}
                >
                  {getInitials(`${a.firstName} ${a.lastName}`)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {a.firstName} {a.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {a.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 hover:opacity-75 transition-opacity rounded"
        >
          {avatarStack}
          {assignments.length > 0 && (
            <span className="text-xs text-muted-foreground">Edit</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" side="bottom">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search members…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {empLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Searching…
              </div>
            ) : (
              <>
                <CommandEmpty>No employees found.</CommandEmpty>
                <CommandGroup>
                  {employeesPage?.content.map((emp) => {
                    const assigned = assignedIds.has(emp.id);
                    return (
                      <CommandItem
                        key={emp.id}
                        value={`${emp.firstName} ${emp.lastName} ${emp.email}`}
                        onSelect={() => handleToggle(emp)}
                        className="cursor-pointer gap-3"
                      >
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-semibold ${AVATAR_COLORS[emp.id % AVATAR_COLORS.length]}`}
                        >
                          {getInitials(`${emp.firstName} ${emp.lastName}`)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {emp.firstName} {emp.lastName}
                          </p>
                        </div>
                        {assigned && (
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
