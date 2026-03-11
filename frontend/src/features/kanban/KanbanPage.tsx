import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  RefreshCcw,
} from "lucide-react";
import api from "../../api/client";
import { USE_MOCK } from "../../mock/useMock";
import * as mock from "../../mock/api";
import { useUserRole } from "../../context/UserRoleContext";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { STATUS_CONFIG, STATUSES, type Status } from "./config/statusConfig";
import KanbanToolbar from "./components/KanbanToolbar";
import ProjectModal from "./components/ProjectModal";
import KanbanBoard from "./components/KanbanBoard";
import useKanbanProjects from "./hooks/useKanbanProjects";
import useProjectForm from "./hooks/useProjectForm";
import type { EntityId, Project } from "./types/kanban";
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
  const { role } = useUserRole();
  const [view, setView] = useState<ViewMode>("board");
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(
    undefined,
  );
  const [employeeCount, setEmployeeCount] = useState(0);

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
    updateProject,
    deleteProject,
    load,
    handleDragStart,
    handleDragEnd,
  } = useKanbanProjects();

  const form = useProjectForm();

  // Fetch employee count for KPI
  useEffect(() => {
    (async () => {
      try {
        if (USE_MOCK) {
          const res = await mock.getEmployees({ page: 0, size: 1 });
          setEmployeeCount(res.totalElements);
        } else {
          const { data } = await api.get("/v1/employees", {
            params: { page: 0, size: 1 },
          });
          setEmployeeCount(data?.totalElements ?? 0);
        }
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
    const counts: Record<Status, number> = { TODO: 0, IN_PROGRESS: 0, COMPLETED: 0 };
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
    setSelectedProject(undefined);
    setShowModal(true);
  }

  function openEdit(project: Project) {
    form.loadProject(project);
    setSelectedProject(project);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedProject(undefined);
    form.resetForm();
  }

  function handleSave() {
    const project = form.buildProject();
    if (!project) return;

    if (selectedProject) {
      updateProject(project);
      if (USE_MOCK) {
        mock.updateProject(project.id, project).catch(() => {});
      } else {
        api.put(`/v1/projects/${project.id}`, project).catch(() => {});
      }
      toast.success("Project updated");
    } else {
      addProject(project);
      toast.success("Project created");
    }
    closeModal();
  }

  function handleDelete(id: EntityId) {
    deleteProject(id);
    if (USE_MOCK) {
      mock.deleteProject(id).catch(() => {});
    } else {
      api.delete(`/v1/projects/${id}`).catch(() => {});
    }
    toast.success("Project deleted");
    closeModal();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      {/* ── Greeting header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{getGreeting()}</h1>
          <p className="text-base text-gray-500 dark:text-zinc-400">
            {formatDate()}
          </p>
        </div>
        <Button
          onClick={() => load()}
          disabled={loading}
          variant="secondary"
          size="icon"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<FolderKanban size={20} />}
          iconBg="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
          label="Total Projects"
          value={total}
        />
        <KpiCard
          icon={<Users size={20} />}
          iconBg="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300"
          label="Team Members"
          value={employeeCount}
        />
        <KpiCard
          icon={<CheckCircle2 size={20} />}
          iconBg="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"
          label="Completed"
          value={statusCounts.COMPLETED}
        />
        <KpiCard
          icon={<Clock size={20} />}
          iconBg="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300"
          label="In Progress"
          value={statusCounts.IN_PROGRESS}
        />
      </div>

      {/* ── Toolbar ── */}
      <KanbanToolbar
        query={query}
        onQueryChange={setQuery}
        onAddNew={openCreate}
        view={view}
        onViewChange={setView}
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          Loading projects...
        </div>
      ) : view === "board" ? (
        <KanbanBoard
          statuses={statuses}
          columns={filteredColumns}
          totals={columns}
          activeCard={activeCard}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onCardClick={openEdit}
        />
      ) : (
        <ProjectListView projects={allProjects} onCardClick={openEdit} />
      )}

      <ProjectModal
        open={showModal}
        onClose={closeModal}
        project={selectedProject}
        form={form}
        onCancel={closeModal}
        onSave={handleSave}
        onDelete={role === "manager" ? handleDelete : undefined}
        readonly={role === "employee" && !!selectedProject}
      />
    </div>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
}

function KpiCard({ icon, iconBg, label, value }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5 flex items-center gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
        >
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
            {label}
          </div>
        </div>
      </CardContent>
    </Card>
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
        <span className="w-24 shrink-0 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Status</span>
        <span className="flex-1 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Name</span>
        <span className="hidden sm:block w-32 shrink-0 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Progress</span>
        <span className="hidden md:block w-16 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Team</span>
        <span className="w-16 text-right text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide shrink-0">Due</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
        {projects.map((p) => {
          const dueStr = p.dueDate ?? p.endDate;
          const rel = formatRelativeDate(dueStr);
          const isOverdue = rel === "Overdue";
          const assignees = p.assignees ?? [];
          const progress =
            p.progress != null ? Math.min(100, Number(p.progress)) : null;
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
            </button>
          );
        })}
      </div>
    </Card>
  );
}
