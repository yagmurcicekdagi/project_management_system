import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import { ProjectCardView } from "./KanbanCard";
import type { Project, ProjectColumns } from "../types/kanban";
import type { Status } from "../config/statusConfig";

type KanbanBoardProps = {
  statuses: Status[];
  columns: ProjectColumns;
  totals: ProjectColumns;
  activeCard: Project | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
};

export default function KanbanBoard({
  statuses,
  columns,
  totals,
  activeCard,
  onDragStart,
  onDragEnd,
}: KanbanBoardProps) {
  return (
    <DndContext
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
          />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? <ProjectCardView project={activeCard} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
