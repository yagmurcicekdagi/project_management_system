import { useCallback, useEffect, useState } from "react";
import api from "../../../api/client";
import { useEmployees } from "../../../hooks/useEmployees";
import { STATUSES, type Status } from "../config/statusConfig";
import type { Employee, EntityId, Project, ProjectFormState } from "../types/kanban";

const DEFAULT_STATUS: Status = STATUSES[0];

export default function useProjectForm(): ProjectFormState {
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [desc, setDesc] = useState("");
  const [assignees, setAssignees] = useState<Employee[]>([]);
  const [empQuery, setEmpQuery] = useState("");
  const [debouncedEmpQuery, setDebouncedEmpQuery] = useState("");
  const [endDate, setEndDateState] = useState<Date | null>(null);
  const [statusValue, setStatusValue] = useState<Status>(DEFAULT_STATUS);
  const [editingId, setEditingId] = useState<EntityId | null>(null);

  // Debounce employee search query 250ms
  useEffect(() => {
    const id = setTimeout(() => setDebouncedEmpQuery(empQuery.trim()), 250);
    return () => clearTimeout(id);
  }, [empQuery]);

  const { data: empData, isFetching: empLoading } = useEmployees(
    0,
    10,
    debouncedEmpQuery || undefined,
    { enabled: !!debouncedEmpQuery },
  );
  const empResults = (empData?.content ?? []) as unknown as Employee[];

  const onTitleChange = useCallback((next: string) => {
    setTitle(next);
    if (next.trim()) setTitleError(false);
  }, []);

  const onTitleBlur = useCallback(() => {
    if (!title.trim()) setTitleError(true);
  }, [title]);

  const addAssignee = useCallback((employee: Employee) => {
    setAssignees((prev) => {
      if (prev.some((a) => a.id === employee.id)) return prev;
      return [...prev, employee];
    });
  }, []);

  const removeAssignee = useCallback((id: Employee["id"]) => {
    setAssignees((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const setEndDate = useCallback((next: Date | undefined) => {
    setEndDateState(next ?? null);
  }, []);

  const resetForm = useCallback(() => {
    setTitle("");
    setTitleError(false);
    setDesc("");
    setAssignees([]);
    setEmpQuery("");
    setDebouncedEmpQuery("");
    setEndDateState(null);
    setStatusValue(DEFAULT_STATUS);
    setEditingId(null);
  }, []);

  const loadProject = useCallback((project: Project) => {
    setEditingId(project.id);
    setTitle(project.name ?? "");
    setTitleError(false);
    setDesc(project.description ?? "");
    setStatusValue((project.status as Status) ?? DEFAULT_STATUS);
    const dateStr = project.dueDate ?? project.endDate;
    setEndDateState(dateStr ? new Date(dateStr) : null);
    setEmpQuery("");
    setDebouncedEmpQuery("");

    api
      .get<Employee[]>(`/v1/projects/${project.id}/assignments`)
      .then(({ data }) => setAssignees(data ?? []))
      .catch(() => setAssignees([]));
  }, []);

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
    setEndDate,
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
