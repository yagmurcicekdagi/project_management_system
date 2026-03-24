import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import KanbanCard from "./KanbanCard";
import { STATUS_CONFIG, type Status } from "../../config/statusConfig";
import type { Project } from "../../types/kanban";

type KanbanColumnProps = Readonly<{
  id: Status;
  title: Status;
  items: Project[];
  total?: number;
  onCardClick?: (project: Project) => void;
}>;

export default function KanbanColumn({
  id,
  title,
  items,
  total = 0,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const statusMeta = STATUS_CONFIG[title] || STATUS_CONFIG.NEW;

  return (
    <Card className="bg-muted/30">
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
          <span
            className={"text-sm font-semibold " + statusMeta.countToneClass}
          >
            {total}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <SortableContext items={itemIds} strategy={rectSortingStrategy}>
          <div ref={setNodeRef} className="flex min-h-[240px] flex-col gap-3">
            {items.map((project) => (
              <KanbanCard
                key={project.id}
                project={project}
                onCardClick={onCardClick}
              />
            ))}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}
