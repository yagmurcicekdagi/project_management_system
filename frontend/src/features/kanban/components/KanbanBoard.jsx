import React from "react";
import PropTypes from "prop-types";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import { ProjectCardView } from "./KanbanCard";
import { projectShape } from "../types/projectPropTypes";
import { STATUSES } from "../config/statusConfig";

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
        {activeCard ? <ProjectCardView project={activeCard} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

KanbanBoard.propTypes = {
  statuses: PropTypes.arrayOf(PropTypes.oneOf(STATUSES)).isRequired,
  columns: PropTypes.objectOf(PropTypes.arrayOf(projectShape)).isRequired,
  totals: PropTypes.objectOf(PropTypes.arrayOf(projectShape)).isRequired,
  activeCard: projectShape,
  onDragStart: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
};
