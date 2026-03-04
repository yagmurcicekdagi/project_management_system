import React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, Filter, Share2, Plus, CalendarDays } from "lucide-react";
import api from "../api/client";
import { USE_MOCK } from "../mock/useMock";
import * as mock from "../mock/api";

const STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED"];

export default function Kanban() {
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
        for (const p of res.content ?? [])
          if (byStatus[p.status]) byStatus[p.status].push(p);
      } else {
        const { data } = await api.get("/v1/projects", {
          params: { page: 0, size: 200 },
        });
        for (const p of data.content ?? [])
          if (byStatus[p.status]) byStatus[p.status].push(p);
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

  function handleAddNew() {
    const now = new Date();
    const tmp = {
      id: Date.now(),
      name: "New Task",
      description: "Describe this task…",
      status: "TODO",
      dueDate: now.toISOString(),
    };
    setColumns((prev) => ({ ...prev, TODO: [tmp, ...prev.TODO] }));
  }

  function findContainer(id) {
    if (STATUSES.includes(id)) return id;
    return STATUSES.find((c) => columns[c].some((x) => x.id === id));
  }

  function handleDragStart(event) {
    const { active } = event;
    const container = findContainer(active.id);
    if (!container) return;
    const card = columns[container].find((c) => c.id === active.id);
    setActiveCard(card || null);
  }

  async function handleDragEnd(event) {
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
  }

  return (
    <div className="mx-auto max-w-7xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Kanban</h1>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            Board
          </Button>
          <Button variant="ghost" size="sm">
            To-do
          </Button>
          <Button variant="ghost" size="sm">
            Table
          </Button>
          <Button variant="ghost" size="sm">
            List
          </Button>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-input bg-background px-2.5 py-1">
            <Search size={14} className="text-muted-foreground" />
            <Input
              className="h-7 w-56 border-0 focus-visible:ring-0"
              placeholder="Search anything…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="secondary" size="sm" className="gap-1.5 px-3">
            <Filter size={14} /> Filter
          </Button>
          <Button variant="secondary" size="sm" className="gap-1.5 px-3">
            <Share2 size={14} /> Share
          </Button>
          <Button size="sm" className="gap-1.5 px-3" onClick={handleAddNew}>
            <Plus size={14} /> Add New
          </Button>
        </div>
      </div>

      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STATUSES.map((col) => {
            const filtered = (columns[col] || []).filter((p) => {
              if (!query) return true;
              const q = query.toLowerCase();
              return (
                (p.name || "").toLowerCase().includes(q) ||
                (p.description || "").toLowerCase().includes(q)
              );
            });
            return (
              <Column
                key={col}
                id={col}
                title={col}
                items={filtered}
                total={columns[col]?.length || 0}
              />
            );
          })}
        </div>
        <DragOverlay>
          {activeCard ? <KanbanCard project={activeCard} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ id, title, items, total = 0 }) {
  // Make the entire column a droppable area
  const { setNodeRef } = useDroppable({ id });
  return (
    <Card className="bg-muted/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold tracking-wide">
          {title.replace("_", " ")}
        </CardTitle>
        <span
          className={
            "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-semibold " +
            (title === "COMPLETED"
              ? "bg-green-600/10 text-green-700 dark:text-green-300"
              : title === "IN_PROGRESS"
                ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
                : "bg-gray-500/10 text-gray-700 dark:text-gray-300")
          }
        >
          {total}
        </span>
      </CardHeader>
      <CardContent ref={setNodeRef}>
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={rectSortingStrategy}
        >
          <div className="flex min-h-[240px] flex-col gap-3">
            {items.map((p) => (
              <KanbanCard key={p.id} project={p} />
            ))}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}

function KanbanCard({ project, overlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !overlay ? 0.5 : 1,
  };
  const date = pickDate(project);
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-grab active:cursor-grabbing shadow-sm">
        <CardContent className="p-3">
          <div className="font-semibold leading-snug">{project.name}</div>
          <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {project.description || "—"}
          </div>
          <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-1">
              <CalendarDays size={14} /> {formatDate(date)}
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-700 dark:bg-zinc-800 dark:text-zinc-300">
                0%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function pickDate(p) {
  return (
    p.dueDate ||
    p.endDate ||
    p.startDate ||
    p.createdAt ||
    new Date(Date.now() - (p.id % 28) * 24 * 60 * 60 * 1000).toISOString()
  );
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  } catch {
    return "—";
  }
}
