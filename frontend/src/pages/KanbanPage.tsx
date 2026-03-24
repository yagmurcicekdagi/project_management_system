import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock,
  FolderKanban,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { assignEmployee, getAssignments } from "../api/assignments";
import api from "../api/client";
import { STATUS_CONFIG, STATUSES, type Status } from "../config/statusConfig";
import { useProjectAssignments } from "../hooks/query/useAssignments";
import useKanbanProjects from "../hooks/useKanbanProjects";
import useProjectForm from "../hooks/useProjectForm";
import type { Project } from "../types/kanban";
import {
  AVATAR_COLORS,
  formatRelativeDate,
  getInitials,
} from "../lib/projectUtils";
import { useAuthStore } from "../store/authStore";
import { Card } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import KanbanToolbar from "../components/kanban/KanbanToolbar";
import ProjectDrawer from "../components/project/ProjectDrawer";
import ProjectModal from "../components/project/ProjectModal";
import KanbanBoard from "../components/kanban/KanbanBoard";

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── page ────────────────────────────────────────────────────────────────────

type ViewMode = "board" | "list";

export default function KanbanPage() {
  const { role } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const view: ViewMode = searchParams.get("view") === "list" ? "list" : "board";
  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );

  const queryClient = useQueryClient();
  const {
    statuses,
    columns,
    filteredColumns,
    activeCard,
    loading,
    error,
    query,
    setQuery,
    addProject,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useKanbanProjects();

  const form = useProjectForm();

  // Derive employee count from cached assignment queries — no extra API request
  const allProjectIds = useMemo(
    () => STATUSES.flatMap((s) => columns[s] ?? []).map((p) => Number(p.id)),
    [columns],
  );
  const assignmentQueries = useQueries({
    queries: allProjectIds.map((id) => ({
      queryKey: ["assignments", id],
      queryFn: () => getAssignments(id),
    })),
  });
  const employeeCount = useMemo(() => {
    const ids = new Set<number>();
    assignmentQueries.forEach((q) => q.data?.forEach((e) => ids.add(e.id)));
    return ids.size;
  }, [assignmentQueries]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [showModal]);

  // ── KPI counts ──
  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = {
      NEW: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
    };
    for (const status of STATUSES) {
      counts[status] = columns[status]?.length ?? 0;
    }
    return counts;
  }, [columns]);

  const total = useMemo(
    () => STATUSES.reduce((sum, s) => sum + (columns[s]?.length ?? 0), 0),
    [columns],
  );

  // ── Flat project list for list view ──
  const allProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = q ? filteredColumns : columns;
    return STATUSES.flatMap((s) => source[s] ?? []);
  }, [columns, filteredColumns, query]);

  // ── Modal handlers ──
  function openCreate() {
    form.resetForm();
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    form.resetForm();
  }

  async function handleSave() {
    const project = form.buildProject();
    if (!project) return;

    try {
      const { data } = await api.post("/v1/projects", {
        name: project.name,
        description: project.description,
        status: project.status,
        endDate: project.dueDate,
      });
      const newProjectId = (data as { id: number }).id;
      await Promise.all(
        form.assignees.map((a) => assignEmployee(newProjectId, Number(a.id))),
      );
      addProject(data as unknown as Project);
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({
        queryKey: ["assignments", newProjectId],
      });
      toast.success("Project created");
      closeModal();
    } catch {
      toast.error("Failed to create project.");
    }
  }

  function openDetail(project: Project) {
    setSelectedProjectId(Number(project.id));
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 animate-fade-in">
      {/* ── Greeting + inline stats ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">My Projects</h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-zinc-500">
            {formatDate()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center divide-x divide-gray-200 dark:divide-zinc-700 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
            <StatPill
              icon={<FolderKanban size={14} />}
              label="Projects"
              value={total}
              color="text-blue-600 dark:text-blue-400"
            />
            <StatPill
              icon={<CircleDot size={14} />}
              label="New"
              value={statusCounts.NEW}
              color="text-sky-600 dark:text-sky-400"
            />
            <StatPill
              icon={<Clock size={14} />}
              label="In Progress"
              value={statusCounts.IN_PROGRESS}
              color="text-amber-600 dark:text-amber-400"
            />
            <StatPill
              icon={<CheckCircle2 size={14} />}
              label="Completed"
              value={statusCounts.COMPLETED}
              color="text-emerald-600 dark:text-emerald-400"
            />
            <StatPill
              icon={<Users size={14} />}
              label="Team"
              value={employeeCount}
              color="text-purple-600 dark:text-purple-400"
            />
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <KanbanToolbar
        query={query}
        onQueryChange={setQuery}
        onAddNew={role === "MANAGER" ? openCreate : undefined}
        view={view}
        onViewChange={(v) => setSearchParams({ view: v }, { replace: true })}
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Content ── */}
      {loading && (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          Loading projects...
        </div>
      )}
      {!loading && view === "board" && (
        <KanbanBoard
          statuses={statuses}
          columns={filteredColumns}
          totals={columns}
          activeCard={activeCard}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onCardClick={openDetail}
        />
      )}
      {!loading && view === "list" && (
        <ProjectListView projects={allProjects} onCardClick={openDetail} />
      )}

      <ProjectDrawer
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />

      <ProjectModal
        open={showModal}
        onClose={closeModal}
        project={undefined}
        form={form}
        onCancel={closeModal}
        onSave={handleSave}
        onDelete={undefined}
        readonly={false}
      />
    </div>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

type StatPillProps = Readonly<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}>;

function StatPill({ icon, label, value, color }: StatPillProps) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2.5">
      <span className={color}>{icon}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
      <span className="text-xs text-gray-400 dark:text-zinc-500">{label}</span>
    </div>
  );
}

type ProjectListRowProps = Readonly<{
  project: Project;
  onCardClick: (p: Project) => void;
}>;

function ProjectListRow({ project: p, onCardClick }: ProjectListRowProps) {
  const { data: assignees = [] } = useProjectAssignments(Number(p.id));
  const dueStr = p.dueDate ?? p.endDate;
  const rel = formatRelativeDate(dueStr);
  const isOverdue = rel === "Overdue";
  const STATUS_PROGRESS: Record<string, number> = {
    NEW: 0,
    IN_PROGRESS: 50,
    COMPLETED: 100,
  };
  const progress = p.status ? (STATUS_PROGRESS[p.status] ?? null) : null;
  const cfg = p.status ? STATUS_CONFIG[p.status] : null;

  return (
    <TableRow
      onClick={() => onCardClick(p)}
      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50"
    >
      {/* Status */}
      <TableCell className="w-32">
        {cfg && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.pillToneClass}`}
          >
            {cfg.label}
          </span>
        )}
      </TableCell>

      {/* Name + description */}
      <TableCell>
        <p className="font-medium text-sm truncate">{p.name}</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">
          {p.description || "\u2014"}
        </p>
      </TableCell>

      {/* Progress bar */}
      <TableCell className="hidden sm:table-cell w-36">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${cfg?.dotToneClass ?? "bg-emerald-500"}`}
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-zinc-400 w-8 text-right">
            {progress == null ? "\u2014" : `${progress}%`}
          </span>
        </div>
      </TableCell>

      {/* Avatars */}
      <TableCell className="hidden md:table-cell">
        <div className="flex -space-x-2">
          {assignees.slice(0, 3).map((a, i) => (
            <span
              key={a.id}
              title={`${a.firstName} ${a.lastName}`}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-white text-[10px] font-semibold ring-2 ring-white dark:ring-zinc-900 ${AVATAR_COLORS[a.id % AVATAR_COLORS.length]}`}
              style={{ zIndex: 3 - i }}
            >
              {getInitials(`${a.firstName} ${a.lastName}`)}
            </span>
          ))}
          {assignees.length > 3 && (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-700 text-[10px] font-semibold ring-2 ring-white dark:ring-zinc-900">
              +{assignees.length - 3}
            </span>
          )}
        </div>
      </TableCell>

      {/* Due date */}
      <TableCell className="text-right w-20">
        <span
          className={`text-xs font-medium ${isOverdue ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-zinc-500"}`}
        >
          {rel}
        </span>
      </TableCell>

      <TableCell className="w-8">
        <ArrowRight className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
      </TableCell>
    </TableRow>
  );
}

type ProjectListViewProps = Readonly<{
  projects: Project[];
  onCardClick: (project: Project) => void;
}>;

function ProjectListView({ projects, onCardClick }: ProjectListViewProps) {
  if (projects.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-zinc-400 py-8 text-center">
        No projects found
      </p>
    );
  }

  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
            <TableHead className="w-32 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
              Status
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
              Name
            </TableHead>
            <TableHead className="hidden sm:table-cell w-36 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
              Progress
            </TableHead>
            <TableHead className="hidden md:table-cell text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
              Team
            </TableHead>
            <TableHead className="w-20 text-right text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
              Due
            </TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((p) => (
            <ProjectListRow key={p.id} project={p} onCardClick={onCardClick} />
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
