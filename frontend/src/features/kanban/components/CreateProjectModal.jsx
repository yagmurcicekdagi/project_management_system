import React from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "../../../components/ui/popover";
import { Calendar } from "../../../components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../../components/ui/select";
import { STATUS_OPTIONS } from "../config/statusConfig";

export default function CreateProjectModal({
  open,
  onClose,
  form,
  onCancel,
  onCreate,
}) {
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

function ProjectDetailsSection({
  title,
  titleError,
  onTitleChange,
  onTitleBlur,
  desc,
  onDescChange,
}) {
  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
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
          placeholder="Short description"
          className="min-h-[90px] w-full rounded-md border border-input bg-background p-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
    </>
  );
}

function ProjectScheduleSection({
  endDate,
  onEndDateChange,
  statusValue,
  onStatusChange,
}) {
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
              mode="single"
              selected={endDate || undefined}
              onSelect={(d) => onEndDateChange(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Status</label>
        <Select value={statusValue} onValueChange={onStatusChange}>
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

function AssigneeSection({
  empQuery,
  onEmpQueryChange,
  empLoading,
  empResults,
  assignees,
  onAddAssignee,
  onRemoveAssignee,
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        Assign
        <Input
          value={empQuery}
          onChange={(e) => onEmpQueryChange(e.target.value)}
          placeholder="Type a name..."
        />
      </label>
      {empQuery && (
        <div className="mt-2 max-h-56 w-full overflow-auto rounded-md border bg-background shadow">
          {empLoading && (
            <div className="p-2 text-xs text-muted-foreground">Searching…</div>
          )}
          {!empLoading &&
            (empResults.length === 0 ? (
              <div className="p-2 text-xs text-muted-foreground">No matches</div>
            ) : (
              empResults.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onAddAssignee(e)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span>{`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim()}</span>
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
              <button
                type="button"
                onClick={() => onRemoveAssignee(a.id)}
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

function CreateProjectActions({ onCancel, onCreate }) {
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

const employeeShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  firstName: PropTypes.string,
  lastName: PropTypes.string,
});

CreateProjectModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  form: PropTypes.shape({
    title: PropTypes.string.isRequired,
    onTitleChange: PropTypes.func.isRequired,
    titleError: PropTypes.bool.isRequired,
    onTitleBlur: PropTypes.func.isRequired,
    desc: PropTypes.string.isRequired,
    setDesc: PropTypes.func.isRequired,
    endDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    setEndDate: PropTypes.func.isRequired,
    statusValue: PropTypes.string.isRequired,
    setStatusValue: PropTypes.func.isRequired,
    empQuery: PropTypes.string.isRequired,
    setEmpQuery: PropTypes.func.isRequired,
    empLoading: PropTypes.bool.isRequired,
    empResults: PropTypes.arrayOf(employeeShape).isRequired,
    assignees: PropTypes.arrayOf(employeeShape).isRequired,
    addAssignee: PropTypes.func.isRequired,
    removeAssignee: PropTypes.func.isRequired,
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};
