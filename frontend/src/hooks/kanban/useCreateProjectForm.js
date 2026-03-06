import React from "react";
import api from "../../api/client";
import { USE_MOCK } from "../../mock/useMock";
import * as mock from "../../mock/api";

export default function useCreateProjectForm() {
  const [title, setTitle] = React.useState("");
  const [titleError, setTitleError] = React.useState(false);
  const [desc, setDesc] = React.useState("");
  const [assignees, setAssignees] = React.useState([]);
  const [empQuery, setEmpQuery] = React.useState("");
  const [empResults, setEmpResults] = React.useState([]);
  const [empLoading, setEmpLoading] = React.useState(false);
  const [endDate, setEndDate] = React.useState(null);
  const [statusValue, setStatusValue] = React.useState("TODO");

  React.useEffect(() => {
    let t;

    async function run() {
      const q = empQuery.trim();
      if (!q) {
        setEmpResults([]);
        return;
      }

      setEmpLoading(true);
      try {
        if (USE_MOCK) {
          const res = await mock.getEmployees({ page: 0, size: 100 });
          const list = (res.content ?? []).filter((e) =>
            `${e.firstName} ${e.lastName}`
              .toLowerCase()
              .includes(q.toLowerCase()),
          );
          setEmpResults(list);
        } else {
          const { data } = await api.get("/v1/employees", {
            params: { page: 0, size: 10, search: q },
          });
          setEmpResults(data?.content ?? []);
        }
      } finally {
        setEmpLoading(false);
      }
    }

    t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [empQuery]);

  const onTitleChange = React.useCallback((next) => {
    setTitle(next);
    if (next.trim()) setTitleError(false);
  }, []);

  const onTitleBlur = React.useCallback(() => {
    if (!title.trim()) setTitleError(true);
  }, [title]);

  const addAssignee = React.useCallback((employee) => {
    const id = employee.id;
    setAssignees((prev) => {
      if (prev.some((a) => a.id === id)) return prev;
      return [...prev, employee];
    });
  }, []);

  const removeAssignee = React.useCallback((id) => {
    setAssignees((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const resetForm = React.useCallback(() => {
    setTitle("");
    setTitleError(false);
    setDesc("");
    setAssignees([]);
    setEmpQuery("");
    setEmpResults([]);
    setEndDate(null);
    setStatusValue("TODO");
  }, []);

  const buildProject = React.useCallback(() => {
    if (!title.trim()) {
      setTitleError(true);
      return null;
    }

    setTitleError(false);
    return {
      id: Date.now(),
      name: title.trim(),
      description: desc.trim(),
      status: statusValue,
      dueDate: endDate
        ? new Date(endDate).toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignees: assignees.map((employee) => ({
        id: employee.id,
        name: `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim(),
      })),
    };
  }, [title, desc, statusValue, endDate, assignees]);

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
    buildProject,
  };
}
