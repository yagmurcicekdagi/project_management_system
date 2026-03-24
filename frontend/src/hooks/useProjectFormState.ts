import { useCallback, useEffect, useState } from "react";
import { useEmployees } from "./query/useEmployees";
import { useProjectAssignments } from "./query/useAssignments";
import { STATUSES, type Status } from "../config/statusConfig";
import type {
  Employee,
  EntityId,
  Project,
  ProjectFormState,
} from "../types/kanban";

const DEFAULT_STATUS: Status = STATUSES[0];

export default function useProjectFormState(): ProjectFormState {
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [desc, setDesc] = useState("");
  const [assignees, setAssignees] = useState<Employee[]>([]);
  const [empQuery, setEmpQuery] = useState("");
  const [debouncedEmpQuery, setDebouncedEmpQuery] = useState("");
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusValue, setStatusValue] = useState<Status>(DEFAULT_STATUS);
  const [editingId, setEditingId] = useState<EntityId | null>(null);

  // Fetch assignments for the project being edited. Disabled when editingId is null (0).
  // Uses the TanStack Query cache — data is likely already available from ProjectCard/ProjectListRow.
  const { data: projectAssignments } = useProjectAssignments(Number(editingId ?? 0));

  // Sync cached assignments into local state whenever the editing target changes.
  useEffect(() => {
    if (editingId && projectAssignments) {
      setAssignees(projectAssignments as unknown as Employee[]);
    }
  }, [editingId, projectAssignments]);

  // Debounce employee search query 250ms to avoid firing on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedEmpQuery(empQuery.trim()), 250);
    return () => clearTimeout(id);
  }, [empQuery]);

  // Only fetch when the user has typed something — prevents 403s for USER role.
  const { data: empData, isFetching: empLoading } = useEmployees(
    0,
    10,
    debouncedEmpQuery || undefined,
    { enabled: !!debouncedEmpQuery },
  );
  const empResults = (empData?.content ?? []) as unknown as Employee[];

  // Clear validation error as soon as the user starts typing a valid title.
  const onTitleChange = useCallback((next: string) => {
    setTitle(next);
    if (next.trim()) setTitleError(false);
  }, []);

  // Validate on blur so the error only appears after the user leaves the field.
  const onTitleBlur = useCallback(() => {
    if (!title.trim()) setTitleError(true);
  }, [title]);

  // Guard against duplicate assignees by id.
  const addAssignee = useCallback((employee: Employee) => {
    setAssignees((prev) => {
      if (prev.some((a) => a.id === employee.id)) return prev;
      return [...prev, employee];
    });
  }, []);

  const removeAssignee = useCallback((id: Employee["id"]) => {
    setAssignees((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Normalise Date | undefined to Date | null for internal state.
  const handleEndDate = useCallback((next: Date | undefined) => {
    setEndDate(next ?? null);
  }, [setEndDate]);

  const resetForm = useCallback(() => {
    setTitle("");
    setTitleError(false);
    setDesc("");
    setAssignees([]);
    setEmpQuery("");
    setDebouncedEmpQuery("");
    setEndDate(null);
    setStatusValue(DEFAULT_STATUS);
    setEditingId(null);
  }, []);

  // Populate form fields from an existing project. Setting editingId triggers
  // useProjectAssignments which syncs assignees via the effect above.
  const loadProject = useCallback((project: Project) => {
    setEditingId(project.id);
    setTitle(project.name ?? "");
    setTitleError(false);
    setDesc(project.description ?? "");
    setStatusValue(project.status ?? DEFAULT_STATUS);
    const dateStr = project.dueDate ?? project.endDate;
    setEndDate(dateStr ? new Date(dateStr) : null);
    setEmpQuery("");
    setDebouncedEmpQuery("");
  }, []);

  // Validate and assemble a Project value from current form state.
  // Returns null if validation fails (title empty).
  // Defaults dueDate to 7 days from now if not set.
  const buildProject = useCallback((): Project | null => {
    if (!title.trim()) {
      setTitleError(true);
      return null;
    }
    setTitleError(false);
    return {
      id: editingId ?? Date.now(),
      name: title.trim(),
      description: desc.trim(),
      status: statusValue,
      dueDate: endDate
        ? new Date(endDate).toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignees: assignees.map((e) => ({
        id: e.id,
        name: `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim(),
      })),
    };
  }, [title, desc, statusValue, endDate, assignees, editingId]);

  return {
    title,
    titleError,
    desc,
    assignees,
    empQuery,
    empResults,
    empLoading,
    endDate,
    statusValue,
    setDesc,
    setEmpQuery,
    setEndDate: handleEndDate,
    setStatusValue,
    onTitleChange,
    onTitleBlur,
    addAssignee,
    removeAssignee,
    resetForm,
    loadProject,
    buildProject,
  };
}
