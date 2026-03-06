import React from "react";
import PropTypes from "prop-types";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";

export default function KanbanBoard({
  statuses,
  columns,
  totals,
  activeCard,
  onDragStart,
  onDragEnd,
}) {
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
        {activeCard ? <KanbanCard project={activeCard} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
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

KanbanBoard.propTypes = {
  statuses: PropTypes.arrayOf(PropTypes.string).isRequired,
  columns: PropTypes.objectOf(PropTypes.arrayOf(projectShape)).isRequired,
  totals: PropTypes.objectOf(PropTypes.array).isRequired,
  activeCard: projectShape,
  onDragStart: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
};
