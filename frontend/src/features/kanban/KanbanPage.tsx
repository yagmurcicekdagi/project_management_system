import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  RefreshCcw,
  ArrowRight,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import { assignEmployee } from "../../api/assignments";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { STATUS_CONFIG, STATUSES, type Status } from "./config/statusConfig";
import KanbanToolbar from "./components/KanbanToolbar";
import ProjectModal from "./components/ProjectModal";
import ProjectDrawer from "./components/ProjectDrawer";
import KanbanBoard from "./components/KanbanBoard";
import useKanbanProjects from "./hooks/useKanbanProjects";
import useProjectForm from "./hooks/useProjectForm";
import type { Project } from "./types/kanban";
import {
  AVATAR_COLORS,
  formatRelativeDate,
  getInitials,
} from "./utils/projectUtils";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

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
  const [employeeCount, setEmployeeCount] = useState(0);

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
    load,
    handleDragStart,
    handleDragEnd,
  } = useKanbanProjects();

  const form = useProjectForm();

  // Fetch employee count for KPI
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/v1/employees", {
          params: { page: 0, size: 1 },
        });
        setEmployeeCount(data?.page?.totalElements ?? 0);
      } catch {
        /* ignore */
      }
    })();
  }, []);

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
      void queryClient.invalidateQueries({ queryKey: ["assignments", newProjectId] });
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
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* ── Greeting + inline stats ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{getGreeting()}</h1>
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
              icon={<CheckCircle2 size={14} />}
              label="Completed"
              value={statusCounts.COMPLETED}
              color="text-emerald-600 dark:text-emerald-400"
            />
            <StatPill
              icon={<Clock size={14} />}
              label="In Progress"
              value={statusCounts.IN_PROGRESS}
              color="text-amber-600 dark:text-amber-400"
            />
            <StatPill
              icon={<Users size={14} />}
              label="Team"
              value={employeeCount}
              color="text-purple-600 dark:text-purple-400"
            />
          </div>
          <Button
            onClick={() => load()}
            disabled={loading}
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Refresh projects"
          >
            <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
          </Button>
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

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatPill({ icon, label, value, color }: StatPillProps) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2.5">
      <span className={color}>{icon}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
      <span className="text-xs text-gray-400 dark:text-zinc-500">{label}</span>
    </div>
  );
}

interface ProjectListViewProps {
  projects: Project[];
  onCardClick: (project: Project) => void;
}

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
      {/* Column headers */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
        <span className="w-24 shrink-0 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
          Status
        </span>
        <span className="flex-1 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
          Name
        </span>
        <span className="hidden sm:block w-32 shrink-0 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
          Progress
        </span>
        <span className="hidden md:block w-16 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
          Team
        </span>
        <span className="w-16 text-right text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide shrink-0">
          Due
        </span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
        {projects.map((p) => {
          const dueStr = p.dueDate ?? p.endDate;
          const rel = formatRelativeDate(dueStr);
          const isOverdue = rel === "Overdue";
          const assignees = p.assignees ?? [];
          const STATUS_PROGRESS: Record<string, number> = { NEW: 0, IN_PROGRESS: 50, COMPLETED: 100 }
          const progress = p.status ? (STATUS_PROGRESS[p.status] ?? null) : null;
          const status = p.status as Status | undefined;
          const cfg = status ? STATUS_CONFIG[status] : null;

          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onCardClick(p)}
              className="flex w-full items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
            >
              {/* Status badge */}
              <div className="w-24 shrink-0">
                {cfg && (
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.pillToneClass}`}
                  >
                    {cfg.label}
                  </span>
                )}
              </div>

              {/* Name + description */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">
                  {p.description || "\u2014"}
                </p>
              </div>

              {/* Progress bar */}
              <div className="hidden sm:flex items-center gap-2 w-32 shrink-0">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${cfg?.dotToneClass ?? "bg-emerald-500"}`}
                    style={{ width: `${progress ?? 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-zinc-400 w-8 text-right">
                  {progress != null ? `${progress}%` : "\u2014"}
                </span>
              </div>

              {/* Avatars */}
              <div className="hidden md:flex -space-x-2 shrink-0">
                {assignees.slice(0, 3).map((a, i) => (
                  <span
                    key={a.id}
                    title={a.name}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-white text-[10px] font-semibold ring-2 ring-white dark:ring-zinc-900 ${AVATAR_COLORS[Number(a.id) % AVATAR_COLORS.length]}`}
                    style={{ zIndex: 3 - i }}
                  >
                    {getInitials(a.name)}
                  </span>
                ))}
                {assignees.length > 3 && (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-700 text-[10px] font-semibold ring-2 ring-white dark:ring-zinc-900">
                    +{assignees.length - 3}
                  </span>
                )}
              </div>

              {/* Due date */}
              <span
                className={`text-xs font-medium w-16 text-right shrink-0 ${isOverdue ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-zinc-500"}`}
              >
                {rel}
              </span>

              {/* Open detail */}
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 dark:text-zinc-500" />
            </button>
          );
        })}
      </div>
    </Card>
  );
}
