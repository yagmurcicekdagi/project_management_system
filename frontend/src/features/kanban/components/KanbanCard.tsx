import type { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "../types/kanban";

type KanbanCardProps = Readonly<{
  project: Project;
  onCardClick?: (project: Project) => void;
}>;

export default function KanbanCard({ project, onCardClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProjectCard project={project} onClick={onCardClick ? () => onCardClick(project) : undefined} />
    </div>
  );
}
