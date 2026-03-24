import { Filter, LayoutGrid, List, Plus, Search, Share2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type ViewMode = "board" | "list";

type KanbanToolbarProps = Readonly<{
  query: string;
  onQueryChange: (value: string) => void;
  onAddNew?: () => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}>;

export default function KanbanToolbar({
  query,
  onQueryChange,
  onAddNew,
  view,
  onViewChange,
}: KanbanToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1 rounded-lg border border-input bg-background p-0.5">
        <Button
          variant={view === "board" ? "secondary" : "ghost"}
          size="sm"
          className="gap-1.5 px-3"
          onClick={() => onViewChange("board")}
        >
          <LayoutGrid size={14} /> Board
        </Button>
        <Button
          variant={view === "list" ? "secondary" : "ghost"}
          size="sm"
          className="gap-1.5 px-3"
          onClick={() => onViewChange("list")}
        >
          <List size={14} /> List
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-input bg-background px-2.5 py-1">
          <Search size={14} className="text-muted-foreground" />
          <Input
            className="h-7 w-56 border-0 focus-visible:ring-0"
            placeholder="Search anything…"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        <Button variant="secondary" size="sm" className="gap-1.5 px-3">
          <Filter size={14} /> Filter
        </Button>
        <Button variant="secondary" size="sm" className="gap-1.5 px-3">
          <Share2 size={14} /> Share
        </Button>
        {onAddNew && (
          <Button size="sm" className="gap-1.5 px-3" onClick={onAddNew}>
            <Plus size={14} /> New
          </Button>
        )}
      </div>
    </div>
  );
}
