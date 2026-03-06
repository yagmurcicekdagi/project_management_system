import React from "react";
import { arrayMove } from "@dnd-kit/sortable";
import api from "../../../api/client";
import { USE_MOCK } from "../../../mock/useMock";
import * as mock from "../../../mock/api";
import {
  STATUSES,
  createEmptyColumns,
  isKnownStatus,
} from "../config/statusConfig";

const DEFAULT_STATUS = STATUSES[0];

function projectMatchesQuery(project, query) {
  return (
    (project.name || "").toLowerCase().includes(query) ||
    (project.description || "").toLowerCase().includes(query)
  );
}

function findContainerForId(id, columns) {
  if (isKnownStatus(id)) return id;
  return STATUSES.find((status) => columns[status]?.some((x) => x.id === id));
}

export default function useKanbanProjects() {
  const [columns, setColumns] = React.useState(() => createEmptyColumns());
  const [activeCard, setActiveCard] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");
  const columnsRef = React.useRef(columns);

  React.useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const byStatus = createEmptyColumns();
      if (USE_MOCK) {
        const res = await mock.getProjects({ page: 0, size: 200 });
        for (const p of res.content ?? []) {
          if (isKnownStatus(p.status)) byStatus[p.status].push(p);
        }
      } else {
        const { data } = await api.get("/v1/projects", {
          params: { page: 0, size: 200 },
        });
        for (const p of data.content ?? []) {
          if (isKnownStatus(p.status)) byStatus[p.status].push(p);
        }
      }
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

    return STATUSES.reduce((next, status) => {
      next[status] = (columns[status] || []).filter((p) =>
        projectMatchesQuery(p, q),
      );
      return next;
    }, {});
  }, [columns, query]);

  const addProject = React.useCallback((project) => {
    const status = isKnownStatus(project?.status) ? project.status : DEFAULT_STATUS;
    setColumns((prev) => ({
      ...prev,
      [status]: [project, ...(prev[status] || [])],
    }));
  }, []);

  const handleDragStart = React.useCallback(
    (event) => {
      const { active } = event;
      const snapshot = columnsRef.current;
      const container = findContainerForId(active.id, snapshot);
      if (!container) {
        setActiveCard(null);
        return;
      }
      const card = snapshot[container].find((c) => c.id === active.id);
      setActiveCard(card || null);
    },
    [],
  );

  const handleDragEnd = React.useCallback(
    async (event) => {
      const { active, over } = event;
      setActiveCard(null);
      if (!over) return;

      let previousColumns = null;
      let movedProject = null;
      let moveToStatus = null;
      let movedAcrossColumns = false;

      setColumns((prev) => {
        const fromCol = findContainerForId(active.id, prev);
        const toCol = findContainerForId(over.id, prev);
        if (!fromCol || !toCol) return prev;

        const fromIndex = prev[fromCol].findIndex((c) => c.id === active.id);
        if (fromIndex < 0) return prev;

        const overIndex = prev[toCol].findIndex((c) => c.id === over.id);
        const toIndex = overIndex >= 0 ? overIndex : prev[toCol].length;

        previousColumns = prev;

        if (fromCol === toCol) {
          return {
            ...prev,
            [fromCol]: arrayMove(prev[fromCol], fromIndex, toIndex),
          };
        }

        movedAcrossColumns = true;
        movedProject = prev[fromCol][fromIndex];
        moveToStatus = toCol;

        const fromList = [...prev[fromCol]];
        fromList.splice(fromIndex, 1);
        const toList = [...prev[toCol]];
        toList.splice(toIndex, 0, movedProject);

        return { ...prev, [fromCol]: fromList, [toCol]: toList };
      });

      if (!movedAcrossColumns || !movedProject || !moveToStatus) {
        return;
      }

      if (USE_MOCK) {
        try {
          await mock.patchProjectStatus(movedProject.id, moveToStatus);
        } catch {
          if (previousColumns) setColumns(previousColumns);
        }
      } else {
        try {
          await api.patch(`/v1/projects/${movedProject.id}`, {
            status: moveToStatus,
          });
        } catch {
          if (previousColumns) setColumns(previousColumns);
        }
      }
    },
    [],
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
