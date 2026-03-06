import React from "react";
import { createPortal } from "react-dom";
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
import { Search, Filter, Share2, Plus, CalendarDays, X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "../components/ui/popover.jsx";
import { Calendar } from "../components/ui/calendar.jsx";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../components/ui/select.jsx";
import { format } from "date-fns";
import api from "../api/client";
import { toast } from "sonner";
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
  const [showCreate, setShowCreate] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [assignees, setAssignees] = React.useState([]);
  const [empQuery, setEmpQuery] = React.useState("");
  const [empResults, setEmpResults] = React.useState([]);
  const [empLoading, setEmpLoading] = React.useState(false);
  const [endDate, setEndDate] = React.useState(null);
  const [statusValue, setStatusValue] = React.useState("TODO");

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

  // Lock body scroll when modal open
  React.useEffect(() => {
    if (showCreate) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev };
    }
  }, [showCreate]);

  function handleAddNew() {
    setShowCreate(true);
  }

  // Debounced employee search for Assign field
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
            (`${e.firstName} ${e.lastName}`).toLowerCase().includes(q.toLowerCase())
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

  function addAssignee(e) {
    const id = e.id;
    if (!assignees.some((a) => a.id === id)) setAssignees((s) => [...s, e]);
  }

  function removeAssignee(id) {
    setAssignees((s) => s.filter((a) => a.id !== id));
  }

  function resetForm() {
    setTitle("");
    setDesc("");
    setAssignees([]);
    setEmpQuery("");
    setEmpResults([]);
    setEndDate(null);
    setStatusValue("TODO");
  }

  function handleCreate() {
    if (!title.trim()) return;
    const project = {
      id: Date.now(),
      name: title.trim(),
      description: desc.trim(),
      status: statusValue,
      dueDate: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignees: assignees.map((e) => ({
        id: e.id,
        name: `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim(),
      })),
    };
    setColumns((prev) => ({ ...prev, [statusValue]: [project, ...(prev[statusValue] || [])] }));
    setShowCreate(false);
    resetForm();
    toast.success("Project is added");
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
        {showCreate &&
          createPortal(
            <div
              className="fixed inset-0 z-[1200] flex items-center justify-center bg-neutral-950/60 p-4"
              onClick={() => {
                setShowCreate(false);
              }}
            >
              <div
                className="w-full max-w-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>New Project</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Title</label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Project title"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Description</label>
                      <textarea
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="Short description"
                        className="min-h-[90px] w-full rounded-md border border-input bg-background p-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium">End Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarDays className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "dd MMM yyyy") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="p-0">
                            <Calendar mode="single" selected={endDate || undefined} onSelect={(d) => setEndDate(d)} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">Status</label>
                        <Select value={statusValue} onValueChange={setStatusValue}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TODO">TODO</SelectItem>
                            <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                            <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="relative">
                      <label className="mb-1 block text-sm font-medium">Assign</label>
                      <Input
                        value={empQuery}
                        onChange={(e) => setEmpQuery(e.target.value)}
                        placeholder="Type a name..."
                      />
                      {empQuery && (
                        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-background shadow">
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
                                  onClick={() => addAssignee(e)}
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
                                onClick={() => removeAssignee(a.id)}
                                className="opacity-70 hover:opacity-100"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setShowCreate(false);
                          resetForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleCreate} disabled={!title.trim()}>
                        Create
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>,
            document.body,
          )}
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
  let badgeToneClass = "bg-gray-500/10 text-gray-700 dark:text-gray-300";
  if (title === "COMPLETED") {
    badgeToneClass = "bg-green-600/10 text-green-700 dark:text-green-300";
  } else if (title === "IN_PROGRESS") {
    badgeToneClass = "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
  }

  return (
    <Card className="bg-muted/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold tracking-wide">
          {title.replace("_", " ")}
        </CardTitle>
        <span
          className={
            "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-semibold " +
            badgeToneClass
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
