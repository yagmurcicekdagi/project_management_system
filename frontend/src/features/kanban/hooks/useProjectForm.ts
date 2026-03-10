import { useCallback, useEffect, useState } from "react";
import api from "../../../api/client";
import { USE_MOCK } from "../../../mock/useMock";
import * as mock from "../../../mock/api";
import { STATUSES, type Status } from "../config/statusConfig";
import type { Employee, EntityId, Project, ProjectFormState } from "../types/kanban";

const DEFAULT_STATUS: Status = STATUSES[0];

type PaginatedResponse<T> = {
  content?: T[];
};

export default function useProjectForm(): ProjectFormState {
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [desc, setDesc] = useState("");
  const [assignees, setAssignees] = useState<Employee[]>([]);
  const [empQuery, setEmpQuery] = useState("");
  const [empResults, setEmpResults] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [endDate, setEndDateState] = useState<Date | null>(null);
  const [statusValue, setStatusValue] = useState<Status>(DEFAULT_STATUS);
  const [editingId, setEditingId] = useState<EntityId | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    async function run() {
      const q = empQuery.trim();
      if (!q) {
        setEmpResults([]);
        return;
      }
      setEmpLoading(true);
      try {
        if (USE_MOCK) {
          const res = (await mock.getEmployees({ page: 0, size: 100 })) as PaginatedResponse<Employee>;
          const list = (res.content ?? []).filter((e) =>
            `${e.firstName ?? ""} ${e.lastName ?? ""}`.toLowerCase().includes(q.toLowerCase()),
          );
          setEmpResults(list);
        } else {
          const { data } = await api.get<PaginatedResponse<Employee>>("/v1/employees", {
            params: { page: 0, size: 10, search: q },
          });
          setEmpResults(data?.content ?? []);
        }
      } finally {
        setEmpLoading(false);
      }
    }

    timeoutId = setTimeout(run, 250);
    return () => clearTimeout(timeoutId);
  }, [empQuery]);

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
    setEmpResults([]);
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
    setAssignees(
      (project.assignees ?? []).map((a) => {
        const [firstName = "", ...rest] = a.name.split(" ");
        return { id: a.id, firstName, lastName: rest.join(" ") };
      }),
    );
    setEmpQuery("");
    setEmpResults([]);
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
