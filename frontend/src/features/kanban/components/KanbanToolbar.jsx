import React from "react";
import PropTypes from "prop-types";
import { Search, Filter, Share2, Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export default function KanbanToolbar({ query, onQueryChange, onAddNew }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My Projects</h1>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            Board
          </Button>
          <Button variant="ghost" size="sm">
            To-do
          </Button>
          <Button variant="ghost" size="sm">
            Table
          </Button>
          <Button variant="ghost" size="sm">
            List
          </Button>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-input bg-background px-2.5 py-1">
            <Search size={14} className="text-muted-foreground" />
            <Input
              className="h-7 w-56 border-0 focus-visible:ring-0"
              placeholder="Search anything…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
          </div>
          <Button variant="secondary" size="sm" className="gap-1.5 px-3">
            <Filter size={14} /> Filter
          </Button>
          <Button variant="secondary" size="sm" className="gap-1.5 px-3">
            <Share2 size={14} /> Share
          </Button>
          <Button size="sm" className="gap-1.5 px-3" onClick={onAddNew}>
            <Plus size={14} /> Add New
          </Button>
        </div>
      </div>
    </>
  );
}

KanbanToolbar.propTypes = {
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  onAddNew: PropTypes.func.isRequired,
};
