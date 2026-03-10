import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { DndContext, DragOverlay, MouseSensor, TouchSensor, closestCorners, useSensor, useSensors } from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import { ProjectCard } from "./ProjectCard";
import type { Project, ProjectColumns } from "../types/kanban";
import type { Status } from "../config/statusConfig";

type KanbanBoardProps = {
  statuses: Status[];
  columns: ProjectColumns;
  totals: ProjectColumns;
  activeCard: Project | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onCardClick?: (project: Project) => void;
};

export default function KanbanBoard({
  statuses,
  columns,
  totals,
  activeCard,
  onDragStart,
  onDragEnd,
  onCardClick,
}: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {statuses.map((status) => (
          <KanbanColumn
            key={status}
            id={status}
            title={status}
            items={columns[status] || []}
            total={totals[status]?.length || 0}
            onCardClick={onCardClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? <ProjectCard project={activeCard} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
