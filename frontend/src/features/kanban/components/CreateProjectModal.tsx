import { createPortal } from "react-dom";
import { format } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
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
import type { ProjectFormState, Employee, EntityId } from "../types/kanban";

type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
  form: ProjectFormState;
  onCancel: () => void;
  onCreate: () => void;
};

export default function CreateProjectModal({
  open,
  onClose,
  form,
  onCancel,
  onCreate,
}: CreateProjectModalProps) {
  const {
    title,
    onTitleChange,
    titleError,
    onTitleBlur,
    desc,
    setDesc,
    endDate,
    setEndDate,
    statusValue,
    setStatusValue,
    empQuery,
    setEmpQuery,
    empLoading,
    empResults,
    assignees,
    addAssignee,
    removeAssignee,
  } = form;

  if (!open) return null;

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
            <CardTitle>New Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-2">
            <ProjectDetailsSection
              title={title}
              titleError={titleError}
              onTitleChange={onTitleChange}
              onTitleBlur={onTitleBlur}
              desc={desc}
              onDescChange={setDesc}
            />
            <ProjectScheduleSection
              endDate={endDate}
              onEndDateChange={setEndDate}
              statusValue={statusValue}
              onStatusChange={setStatusValue}
            />
            <AssigneeSection
              empQuery={empQuery}
              onEmpQueryChange={setEmpQuery}
              empLoading={empLoading}
              empResults={empResults}
              assignees={assignees}
              onAddAssignee={addAssignee}
              onRemoveAssignee={removeAssignee}
            />
            <CreateProjectActions onCancel={onCancel} onCreate={onCreate} />
          </CardContent>
        </Card>
      </div>
    </div>,
    document.body,
  );
}

type ProjectDetailsSectionProps = {
  title: string;
  titleError: boolean;
  onTitleChange: (next: string) => void;
  onTitleBlur: () => void;
  desc: string;
  onDescChange: (next: string) => void;
};

function ProjectDetailsSection({
  title,
  titleError,
  onTitleChange,
  onTitleBlur,
  desc,
  onDescChange,
}: ProjectDetailsSectionProps) {
  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <Input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          onBlur={onTitleBlur}
          className={
            titleError ? "border-red-500 focus-visible:ring-red-500" : ""
          }
          placeholder="Project title"
        />
        {titleError && (
          <p className="mt-1 text-xs font-medium text-red-600">Title is required</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          value={desc}
          onChange={(event) => onDescChange(event.target.value)}
          placeholder="Short description"
          className="min-h-[90px] w-full rounded-md border border-input bg-background p-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
    </>
  );
}

type ProjectScheduleSectionProps = {
  endDate: Date | null;
  onEndDateChange: (next: Date | undefined, ...args: unknown[]) => void;
  statusValue: Status;
  onStatusChange: (next: Status) => void;
};

function ProjectScheduleSection({
  endDate,
  onEndDateChange,
  statusValue,
  onStatusChange,
}: ProjectScheduleSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">End Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "dd MMM yyyy") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0">
            <Calendar
              mode={"single"}
              selected={endDate ?? undefined}
              onSelect={(next: Date | undefined, ...args: unknown[]) =>
                onEndDateChange(next as Date | undefined, ...args)
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Status</label>
        <Select value={statusValue} onValueChange={(value) => onStatusChange(value as Status)}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((statusOption) => (
              <SelectItem key={statusOption.value} value={statusOption.value}>
                {statusOption.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

type AssigneeSectionProps = {
  empQuery: string;
  onEmpQueryChange: (next: string) => void;
  empLoading: boolean;
  empResults: Employee[];
  assignees: Employee[];
  onAddAssignee: (employee: Employee) => void;
  onRemoveAssignee: (id: EntityId) => void;
};

function AssigneeSection({
  empQuery,
  onEmpQueryChange,
  empLoading,
  empResults,
  assignees,
  onAddAssignee,
  onRemoveAssignee,
}: AssigneeSectionProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        Assign
        <Input
          value={empQuery}
          onChange={(event) => onEmpQueryChange(event.target.value)}
          placeholder="Type a name..."
        />
      </label>
      {empQuery && (
        <div className="mt-2 max-h-56 w-full overflow-auto rounded-md border bg-background shadow">
          {empLoading && <div className="p-2 text-xs text-muted-foreground">Searching…</div>}
          {!empLoading &&
            (empResults.length === 0 ? (
              <div className="p-2 text-xs text-muted-foreground">No matches</div>
            ) : (
              empResults.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => onAddAssignee(employee)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span>
                    {`${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim()}
                  </span>
                </button>
              ))
            ))}
        </div>
      )}
      {assignees.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {assignees.map((assignee) => (
            <span
              key={assignee.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs"
            >
              {`${assignee.firstName ?? ""}`.charAt(0)}
              {`${assignee.lastName ?? ""}`.charAt(0)}
              <button
                type="button"
                onClick={() => onRemoveAssignee(assignee.id)}
                className="opacity-70 hover:opacity-100"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

type CreateProjectActionsProps = {
  onCancel: () => void;
  onCreate: () => void;
};

function CreateProjectActions({ onCancel, onCreate }: CreateProjectActionsProps) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="secondary" size="sm" onClick={onCancel}>
        Cancel
      </Button>
      <Button size="sm" onClick={onCreate}>
        Create
      </Button>
    </div>
  );
}
