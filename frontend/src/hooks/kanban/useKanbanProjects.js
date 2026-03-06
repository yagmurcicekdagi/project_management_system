import React from "react";
import { arrayMove } from "@dnd-kit/sortable";
import api from "../../api/client";
import { USE_MOCK } from "../../mock/useMock";
import * as mock from "../../mock/api";

export const STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED"];

export default function useKanbanProjects() {
  const [columns, setColumns] = React.useState({
    TODO: [],
    IN_PROGRESS: [],
    COMPLETED: [],
  });
  const [activeCard, setActiveCard] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const byStatus = { TODO: [], IN_PROGRESS: [], COMPLETED: [] };
      if (USE_MOCK) {
        const res = await mock.getProjects({ page: 0, size: 200 });
        for (const p of res.content ?? []) {
          if (byStatus[p.status]) byStatus[p.status].push(p);
        }
      } else {
        const { data } = await api.get("/v1/projects", {
          params: { page: 0, size: 200 },
        });
        for (const p of data.content ?? []) {
          if (byStatus[p.status]) byStatus[p.status].push(p);
        }
      }
      // save the state
      setColumns(byStatus);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filteredColumns = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return columns;

    return {
      TODO: (columns.TODO || []).filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q),
      ),
      IN_PROGRESS: (columns.IN_PROGRESS || []).filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q),
      ),
      COMPLETED: (columns.COMPLETED || []).filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q),
      ),
    };
  }, [columns, query]);

  const addProject = React.useCallback((project) => {
    const status = project?.status || "TODO";
    setColumns((prev) => ({
      ...prev,
      [status]: [project, ...(prev[status] || [])],
    }));
  }, []);

  const findContainer = React.useCallback(
    (id) => {
      if (STATUSES.includes(id)) return id;
      return STATUSES.find((status) =>
        columns[status].some((x) => x.id === id),
      );
    },
    [columns],
  );

  const handleDragStart = React.useCallback(
    (event) => {
      const { active } = event;
      const container = findContainer(active.id);
      if (!container) return;

      const card = columns[container].find((c) => c.id === active.id);
      setActiveCard(card || null);
    },
    [columns, findContainer],
  );

  const handleDragEnd = React.useCallback(
    async (event) => {
      const { active, over } = event;
      setActiveCard(null);
      if (!over) return;

      const fromCol = findContainer(active.id);
      const toCol = findContainer(over.id);
      if (!fromCol || !toCol) return;

      const fromIndex = columns[fromCol].findIndex((c) => c.id === active.id);
      const overIndex = columns[toCol].findIndex((c) => c.id === over.id);
      const toIndex = overIndex >= 0 ? overIndex : columns[toCol].length;

      if (fromCol === toCol) {
        const next = {
          ...columns,
          [fromCol]: arrayMove(columns[fromCol], fromIndex, toIndex),
        };
        setColumns(next);
        return;
      }

      const moving = columns[fromCol][fromIndex];
      const fromList = [...columns[fromCol]];
      fromList.splice(fromIndex, 1);
      const toList = [...columns[toCol]];
      toList.splice(toIndex, 0, moving);
      const prev = columns;
      const next = { ...columns, [fromCol]: fromList, [toCol]: toList };
      setColumns(next);

      if (USE_MOCK) {
        try {
          await mock.patchProjectStatus(moving.id, toCol);
        } catch {
          setColumns(prev);
        }
      } else {
        try {
          await api.patch(`/v1/projects/${moving.id}`, { status: toCol });
        } catch {
          setColumns(prev);
        }
      }
    },
    [columns, findContainer],
  );

  return {
    statuses: STATUSES,
    columns,
    filteredColumns,
    activeCard,
    loading,
    error,
    query,
    setQuery,
    addProject,
    load,
    handleDragStart,
    handleDragEnd,
  };
}
