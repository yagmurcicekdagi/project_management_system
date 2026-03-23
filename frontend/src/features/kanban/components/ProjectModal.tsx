import { createPortal } from "react-dom";
import { format } from "date-fns";
import { CalendarDays, Trash2, X } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../../../components/ui/popover";
import { Calendar } from "../../../components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../../components/ui/select";
import { STATUS_OPTIONS, type Status } from "../config/statusConfig";
import type {
  Employee,
  EntityId,
  Project,
  ProjectFormState,
} from "../types/kanban";

type ProjectModalMode = "create" | "edit";

type ProjectModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  /** Provide an existing project to open in edit mode; omit for create mode */
  project?: Project;
  form: ProjectFormState;
  onCancel: () => void;
  /** Called with the built project on create or save */
  onSave: () => void;
  /** Called with the project id when the manager deletes (edit mode only) */
  onDelete?: (id: EntityId) => void;
  /** When true all fields are read-only (employee role in edit mode) */
  readonly?: boolean;
}>;

export default function ProjectModal({
  open,
  onClose,
  project,
  form,
  onCancel,
  onSave,
  onDelete,
  readonly = false,
}: ProjectModalProps) {
  const mode: ProjectModalMode = project ? "edit" : "create";

  if (!open) return null;

  const title =
    mode === "create" ? "New Project" : (project?.name ?? "Project Details");

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-neutral-950/60 p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-2">
            <ProjectDetailsSection
              title={form.title}
              titleError={form.titleError}
              onTitleChange={form.onTitleChange}
              onTitleBlur={form.onTitleBlur}
              desc={form.desc}
              onDescChange={form.setDesc}
              readonly={readonly}
            />
            <ProjectScheduleSection
              endDate={form.endDate}
              onEndDateChange={form.setEndDate}
              statusValue={form.statusValue}
              onStatusChange={form.setStatusValue}
              readonly={readonly}
            />
            <AssigneeSection
              empQuery={form.empQuery}
              onEmpQueryChange={form.setEmpQuery}
              empLoading={form.empLoading}
              empResults={form.empResults}
              assignees={form.assignees}
              onAddAssignee={form.addAssignee}
              onRemoveAssignee={form.removeAssignee}
              readonly={readonly}
            />
            <ModalActions
              mode={mode}
              readonly={readonly}
              onCancel={onCancel}
              onSave={onSave}
              onDelete={
                project && onDelete ? () => onDelete(project.id) : undefined
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>,
    document.body,
  );
}

// ─── Section components ───────────────────────────────────────────────────────

type ProjectDetailsSectionProps = Readonly<{
  title: string;
  titleError: boolean;
  onTitleChange: (next: string) => void;
  onTitleBlur: () => void;
  desc: string;
  onDescChange: (next: string) => void;
  readonly: boolean;
}>;

function ProjectDetailsSection({
  title,
  titleError,
  onTitleChange,
  onTitleBlur,
  desc,
  onDescChange,
  readonly,
}: ProjectDetailsSectionProps) {
  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
          disabled={readonly}
          className={
            titleError ? "border-red-500 focus-visible:ring-red-500" : ""
          }
          placeholder="Project title"
        />
        {titleError && (
          <p className="mt-1 text-xs font-medium text-red-600">
            Title is required
          </p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          value={desc}
          onChange={(e) => onDescChange(e.target.value)}
          disabled={readonly}
          placeholder="Short description"
          className="min-h-[90px] w-full rounded-md border border-input bg-background p-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
    </>
  );
}

type ProjectScheduleSectionProps = Readonly<{
  endDate: Date | null;
  onEndDateChange: (next: Date | undefined) => void;
  statusValue: Status;
  onStatusChange: (next: Status) => void;
  readonly: boolean;
}>;

function ProjectScheduleSection({
  endDate,
  onEndDateChange,
  statusValue,
  onStatusChange,
  readonly,
}: ProjectScheduleSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">End Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={readonly}
              className="w-full justify-start text-left font-normal"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {endDate ? (
                format(endDate, "dd MMM yyyy")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0">
            <Calendar
              mode="single"
              selected={endDate ?? undefined}
              onSelect={(next) => onEndDateChange(next)}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Status</label>
        <Select
          value={statusValue}
          onValueChange={(v) => onStatusChange(v as Status)}
          disabled={readonly}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

type AssigneeSectionProps = Readonly<{
  empQuery: string;
  onEmpQueryChange: (next: string) => void;
  empLoading: boolean;
  empResults: Employee[];
  assignees: Employee[];
  onAddAssignee: (employee: Employee) => void;
  onRemoveAssignee: (id: EntityId) => void;
  readonly: boolean;
}>;

function AssigneeSection({
  empQuery,
  onEmpQueryChange,
  empLoading,
  empResults,
  assignees,
  onAddAssignee,
  onRemoveAssignee,
  readonly,
}: AssigneeSectionProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        Assign
        {!readonly && (
          <Input
            value={empQuery}
            onChange={(e) => onEmpQueryChange(e.target.value)}
            placeholder="Type a name..."
          />
        )}
      </label>
      {!readonly && empQuery && (
        <div className="mt-2 max-h-56 w-full overflow-auto rounded-md border bg-background shadow">
          {empLoading && (
            <div className="p-2 text-xs text-muted-foreground">Searching…</div>
          )}
          {!empLoading &&
            (empResults.length === 0 ? (
              <div className="p-2 text-xs text-muted-foreground">
                No matches
              </div>
            ) : (
              empResults.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onAddAssignee(e)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  {`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim()}
                </button>
              ))
            ))}
        </div>
      )}
      {assignees.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {assignees.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs"
            >
              {`${a.firstName ?? ""}`.charAt(0)}
              {`${a.lastName ?? ""}`.charAt(0)}
              {!readonly && (
                <button
                  type="button"
                  onClick={() => onRemoveAssignee(a.id)}
                  className="opacity-70 hover:opacity-100"
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

type ModalActionsProps = Readonly<{
  mode: ProjectModalMode;
  readonly: boolean;
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
}>;

function ModalActions({
  mode,
  readonly,
  onCancel,
  onSave,
  onDelete,
}: ModalActionsProps) {
  if (readonly) {
    return (
      <div className="flex justify-end pt-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between pt-2">
      <div>
        {mode === "edit" && onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="gap-1.5"
          >
            <Trash2 size={14} /> Delete
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSave}>
          {mode === "create" ? "Create" : "Save"}
        </Button>
      </div>
    </div>
  );
}
