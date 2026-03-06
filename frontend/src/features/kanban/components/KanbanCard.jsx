import React from "react";
import PropTypes from "prop-types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { projectShape } from "../types/projectPropTypes";

export function ProjectCardView({ project, dragging = false }) {
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

export default function KanbanCard({ project }) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProjectCardView project={project} />
    </div>
  );
}

function pickDate(p) {
  return p.dueDate || p.endDate || p.startDate || p.createdAt || new Date().toISOString();
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  } catch {
    return "—";
  }
}

ProjectCardView.propTypes = {
  project: projectShape.isRequired,
  dragging: PropTypes.bool,
};

KanbanCard.propTypes = {
  project: projectShape.isRequired,
};
