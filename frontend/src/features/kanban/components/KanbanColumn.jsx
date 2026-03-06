import React from "react";
import PropTypes from "prop-types";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import KanbanCard from "./KanbanCard";
import { STATUS_CONFIG, STATUSES } from "../config/statusConfig";
import { projectShape } from "../types/projectPropTypes";

export default function KanbanColumn({ id, title, items, total = 0 }) {
  const { setNodeRef } = useDroppable({ id });
  const itemIds = React.useMemo(() => items.map((item) => item.id), [items]);
  const statusMeta = STATUS_CONFIG[title] || STATUS_CONFIG.TODO;
  const columnToneClass = "bg-muted/30";

  return (
    <div ref={setNodeRef}>
      <Card className={columnToneClass}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <CardTitle
              className={
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold " +
                statusMeta.pillToneClass
              }
            >
              <span
                className={"h-2.5 w-2.5 rounded-full " + statusMeta.dotToneClass}
              />
              {statusMeta.label}
            </CardTitle>
            <span className={"text-sm font-semibold " + statusMeta.countToneClass}>
              {total}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <SortableContext items={itemIds} strategy={rectSortingStrategy}>
            <div className="flex min-h-[240px] flex-col gap-3">
              {items.map((project) => (
                <KanbanCard key={project.id} project={project} />
              ))}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}

KanbanColumn.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.oneOf(STATUSES).isRequired,
  items: PropTypes.arrayOf(projectShape).isRequired,
  total: PropTypes.number,
};
