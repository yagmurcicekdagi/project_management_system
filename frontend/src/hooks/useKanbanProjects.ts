import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { useProjects } from "./query/useProjects";
import {
  STATUSES,
  createEmptyColumns,
  isKnownStatus,
  type Status,
} from "../config/statusConfig";
import type { EntityId, Project, ProjectColumns } from "../types/kanban";

const DEFAULT_STATUS: Status = STATUSES[0];

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
  return STATUSES.find((status) =>
    columns[status]?.some((item) => item.id === id),
  );
}

export default function useKanbanProjects() {
  const [columns, setColumns] = useState<ProjectColumns>(() =>
    createEmptyColumns<Project>(),
  );
  const [activeCard, setActiveCard] = useState<Project | null>(null);
  const [query, setQuery] = useState("");
  const columnsRef = useRef(columns);
  const dragStartSnapshotRef = useRef<ProjectColumns | null>(null);
  const dragFromColRef = useRef<Status | null>(null);
  const queryClient = useQueryClient();

  const {
    data: projectsData,
    isLoading,
    error: queryError,
    refetch,
  } = useProjects(0, 200);

  // Sync TanStack Query data into local column state
  useEffect(() => {
    if (!projectsData) return;
    const byStatus = createEmptyColumns<Project>();
    for (const project of projectsData.content ?? []) {
      if (isKnownStatus(project.status))
        byStatus[project.status as Status].push(project as unknown as Project);
    }
    setColumns(byStatus);
  }, [projectsData]);

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const loading = isLoading;
  const error = queryError
    ? ((queryError as ApiError).response?.data?.message ??
      "Failed to load projects")
    : "";

  const load = useCallback(() => {
    void refetch();
  }, [refetch]);

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
    const status = isKnownStatus(project?.status)
      ? project.status
      : DEFAULT_STATUS;
    setColumns((prev) => ({
      ...prev,
      [status]: [project, ...(prev[status] || [])],
    }));
  }, []);

  const updateProject = useCallback((updated: Project) => {
    setColumns((prev) => {
      const next = { ...prev };
      for (const status of STATUSES) {
        const idx = next[status].findIndex((p) => p.id === updated.id);
        if (idx >= 0) {
          const newStatus = isKnownStatus(updated.status)
            ? updated.status
            : status;
          if (newStatus !== status) {
            const fromList = [...next[status]];
            fromList.splice(idx, 1);
            next[status] = fromList;
            next[newStatus] = [updated, ...next[newStatus]];
          } else {
            const list = [...next[status]];
            list[idx] = { ...list[idx], ...updated };
            next[status] = list;
          }
          return next;
        }
      }
      return prev;
    });
  }, []);

  const deleteProject = useCallback((id: EntityId) => {
    setColumns((prev) => {
      const next = { ...prev };
      for (const status of STATUSES) {
        const idx = next[status].findIndex((p) => p.id === id);
        if (idx >= 0) {
          const list = [...next[status]];
          list.splice(idx, 1);
          next[status] = list;
          return next;
        }
      }
      return prev;
    });
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const snapshot = columnsRef.current;
    const container = findContainerForId(active.id, snapshot);
    if (!container) {
      setActiveCard(null);
      return;
    }
    // Capture where the drag started for rollback in handleDragEnd
    dragStartSnapshotRef.current = snapshot;
    dragFromColRef.current = container;
    const card = snapshot[container].find((item) => item.id === active.id);
    setActiveCard(card || null);
  }, []);

  // Live cross-column update during drag — keeps each SortableContext in sync so
  // dnd-kit can calculate CSS transforms correctly and avoids the flicker on drop.
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const fromCol = findContainerForId(active.id, columnsRef.current);
    const toCol = findContainerForId(over.id, columnsRef.current);
    if (!fromCol || !toCol || fromCol === toCol) return;

    setColumns((prev) => {
      const fromIndex = prev[fromCol].findIndex(
        (item) => item.id === active.id,
      );
      if (fromIndex < 0) return prev;

      const overIndex = prev[toCol].findIndex((item) => item.id === over.id);
      const toIndex = overIndex >= 0 ? overIndex : prev[toCol].length;

      const moving = prev[fromCol][fromIndex];
      const fromList = [...prev[fromCol]];
      fromList.splice(fromIndex, 1);
      const toList = [...prev[toCol]];
      toList.splice(toIndex, 0, moving);
      return { ...prev, [fromCol]: fromList, [toCol]: toList };
    });
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveCard(null);

      const startSnapshot = dragStartSnapshotRef.current;
      const originalFromCol = dragFromColRef.current;
      dragStartSnapshotRef.current = null;
      dragFromColRef.current = null;

      if (!over || !startSnapshot || !originalFromCol) return;

      // By the time dragEnd fires, handleDragOver has already moved the card
      // into the target column — find where it landed now.
      const finalCol = findContainerForId(active.id, columnsRef.current);
      if (!finalCol) return;

      if (finalCol === originalFromCol) {
        // Same-column reorder (handleDragOver ignores same-column moves)
        const snapshot = columnsRef.current;
        const fromIndex = snapshot[finalCol].findIndex(
          (item) => item.id === active.id,
        );
        const overIndex = snapshot[finalCol].findIndex(
          (item) => item.id === over.id,
        );
        const toIndex = overIndex >= 0 ? overIndex : snapshot[finalCol].length;
        if (fromIndex >= 0 && fromIndex !== toIndex) {
          setColumns((prev) => ({
            ...prev,
            [finalCol]: arrayMove(prev[finalCol], fromIndex, toIndex),
          }));
        }
        return;
      }

      // Cross-column: columns already updated by handleDragOver — just persist
      const moving = startSnapshot[originalFromCol].find(
        (item) => item.id === active.id,
      );
      if (!moving) return;

      try {
        await api.patch(`/v1/projects/${moving.id}`, { status: finalCol });
        void queryClient.invalidateQueries({ queryKey: ["projects"] });
      } catch {
        setColumns(startSnapshot);
      }
    },
    [queryClient],
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
    updateProject,
    deleteProject,
    load,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
