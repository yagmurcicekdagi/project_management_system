import React from "react";
import PropTypes from "prop-types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "../ui/card";

export default function KanbanCard({ project, overlay = false }) {
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
  const progress = Number(project.progress ?? project.completion ?? 0);

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

const projectShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string,
  description: PropTypes.string,
  dueDate: PropTypes.string,
  endDate: PropTypes.string,
  startDate: PropTypes.string,
  createdAt: PropTypes.string,
  progress: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  completion: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});

KanbanCard.propTypes = {
  project: projectShape.isRequired,
  overlay: PropTypes.bool,
};
