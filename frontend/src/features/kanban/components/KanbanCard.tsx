import type { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import type { Project } from "../types/kanban";

type ProjectCardViewProps = {
  project: Project;
  dragging?: boolean;
};

type KanbanCardProps = {
  project: Project;
};

export function ProjectCardView({
  project,
  dragging = false,
}: ProjectCardViewProps) {
  const date = pickDate(project);
  const progress = Number(project.progress ?? project.completion ?? 0);

  return (
    <Card
      className={
        "shadow-sm " +
        (dragging ? "cursor-grabbing" : "cursor-grab active:cursor-grabbing")
      }
    >
      <CardContent className="p-3">
        <div className="font-semibold leading-snug">{project.name || "Untitled"}</div>
        <div className="mb-2 line-clamp-2 text-xs text-muted-foreground">
          {project.description || "—"}
        </div>
        <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
          <div className="inline-flex items-center gap-1">
            <CalendarDays size={14} /> {formatDate(date)}
          </div>
          {progress > 0 && (
            <div className="inline-flex items-center gap-2">
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-700 dark:bg-zinc-800 dark:text-zinc-300">
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function KanbanCard({ project }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProjectCardView project={project} />
    </div>
  );
}

function pickDate(project: Project) {
  return (
    project.dueDate ||
    project.endDate ||
    project.startDate ||
    project.createdAt ||
    new Date().toISOString()
  );
}

function formatDate(iso: string) {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  } catch {
    return "—";
  }
}
