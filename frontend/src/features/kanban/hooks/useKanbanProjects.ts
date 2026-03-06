import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEndEvent, DragStartEvent, UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import api from "../../../api/client";
import { USE_MOCK } from "../../../mock/useMock";
import * as mock from "../../../mock/api";
import {
  STATUSES,
  createEmptyColumns,
  isKnownStatus,
  type Status,
} from "../config/statusConfig";
import type { EntityId, Project, ProjectColumns } from "../types/kanban";

const DEFAULT_STATUS: Status = STATUSES[0];

type PaginatedResponse<T> = {
  content?: T[];
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

function projectMatchesQuery(project: Project, query: string) {
  return (
    (project.name || "").toLowerCase().includes(query) ||
    (project.description || "").toLowerCase().includes(query)
  );
}

function findContainerForId(
  id: UniqueIdentifier,
  columns: ProjectColumns,
): Status | undefined {
  if (isKnownStatus(id)) return id;
  return STATUSES.find((status) => columns[status]?.some((item) => item.id === id));
}

export default function useKanbanProjects() {
  const [columns, setColumns] = useState<ProjectColumns>(() =>
    createEmptyColumns<Project>(),
  );
  const [activeCard, setActiveCard] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const columnsRef = useRef(columns);

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const byStatus = createEmptyColumns<Project>();
      if (USE_MOCK) {
        const res = (await mock.getProjects({
          page: 0,
          size: 200,
        })) as PaginatedResponse<Project>;
        for (const project of res.content ?? []) {
          if (isKnownStatus(project.status)) byStatus[project.status].push(project);
        }
      } else {
        const { data } = await api.get<PaginatedResponse<Project>>("/v1/projects", {
          params: { page: 0, size: 200 },
        });
        for (const project of data.content ?? []) {
          if (isKnownStatus(project.status)) byStatus[project.status].push(project);
        }
      }
      setColumns(byStatus);
    } catch (errorValue) {
      const message =
        (errorValue as ApiError).response?.data?.message ||
        "Failed to load projects";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredColumns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return columns;

    return STATUSES.reduce((next, status) => {
      next[status] = (columns[status] || []).filter((project) =>
        projectMatchesQuery(project, normalizedQuery),
      );
      return next;
    }, createEmptyColumns<Project>());
  }, [columns, query]);

  const addProject = useCallback((project: Project) => {
    const status = isKnownStatus(project?.status) ? project.status : DEFAULT_STATUS;
    setColumns((prev) => ({
      ...prev,
      [status]: [project, ...(prev[status] || [])],
    }));
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const snapshot = columnsRef.current;
    const container = findContainerForId(active.id, snapshot);
    if (!container) {
      setActiveCard(null);
      return;
    }
    const card = snapshot[container].find((item) => item.id === active.id);
    setActiveCard(card || null);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) return;

    let previousColumns: ProjectColumns | null = null;
    let movedProjectId: EntityId | null = null;
    let moveToStatus: Status | null = null;
    let movedAcrossColumns = false;

    setColumns((prev) => {
      const fromCol = findContainerForId(active.id, prev);
      const toCol = findContainerForId(over.id, prev);
      if (!fromCol || !toCol) return prev;

      const fromIndex = prev[fromCol].findIndex((item) => item.id === active.id);
      if (fromIndex < 0) return prev;

      const overIndex = prev[toCol].findIndex((item) => item.id === over.id);
      const toIndex = overIndex >= 0 ? overIndex : prev[toCol].length;

      previousColumns = prev;

      if (fromCol === toCol) {
        return {
          ...prev,
          [fromCol]: arrayMove(prev[fromCol], fromIndex, toIndex),
        };
      }

      movedAcrossColumns = true;
      const moving = prev[fromCol][fromIndex];
      movedProjectId = moving.id;
      moveToStatus = toCol;

      const fromList = [...prev[fromCol]];
      fromList.splice(fromIndex, 1);
      const toList = [...prev[toCol]];
      toList.splice(toIndex, 0, moving);

      return { ...prev, [fromCol]: fromList, [toCol]: toList };
    });

    if (!movedAcrossColumns || !movedProjectId || !moveToStatus) {
      return;
    }

    if (USE_MOCK) {
      try {
        await mock.patchProjectStatus(movedProjectId, moveToStatus);
      } catch {
        if (previousColumns) setColumns(previousColumns);
      }
    } else {
      try {
        await api.patch(`/v1/projects/${movedProjectId}`, {
          status: moveToStatus,
        });
      } catch {
        if (previousColumns) setColumns(previousColumns);
      }
    }
  }, []);

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
