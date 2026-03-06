import React from "react";
import PropTypes from "prop-types";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import KanbanCard from "./KanbanCard";

export default function KanbanColumn({ id, title, items, total = 0 }) {
  const { setNodeRef } = useDroppable({ id });

  let statusLabel = "New";
  let columnToneClass = "bg-muted/30";
  let pillToneClass =
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  let dotToneClass = "bg-slate-400";
  let countToneClass = "text-slate-700 dark:text-slate-300";

  if (title === "COMPLETED") {
    statusLabel = "Completed";
    pillToneClass =
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    dotToneClass = "bg-emerald-500";
    countToneClass = "text-emerald-600 dark:text-emerald-300";
  } else if (title === "IN_PROGRESS") {
    statusLabel = "In progress";
    pillToneClass =
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    dotToneClass = "bg-blue-500";
    countToneClass = "text-blue-600 dark:text-blue-300";
  }

  return (
    <div ref={setNodeRef}>
      <Card className={columnToneClass}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <CardTitle
              className={
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold " +
                pillToneClass
              }
            >
              <span className={"h-2.5 w-2.5 rounded-full " + dotToneClass} />
              {statusLabel}
            </CardTitle>
            <span className={"text-sm font-semibold " + countToneClass}>{total}</span>
          </div>
        </CardHeader>
        <CardContent>
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={rectSortingStrategy}
          >
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

const projectShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string,
  description: PropTypes.string,
});

KanbanColumn.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(projectShape).isRequired,
  total: PropTypes.number,
};
