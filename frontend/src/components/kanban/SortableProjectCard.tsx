import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import type { Project } from "../../types/kanban";
import { ProjectCard } from "../project/ProjectCard";

type SortableProjectCardProps = Readonly<{
  project: Project;
  onCardClick?: (project: Project) => void;
}>;

export default function SortableProjectCard({ project, onCardClick }: SortableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProjectCard
        project={project}
        onClick={onCardClick ? () => onCardClick(project) : undefined}
      />
    </div>
  );
}
