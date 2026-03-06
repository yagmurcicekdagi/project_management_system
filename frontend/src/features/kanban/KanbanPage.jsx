import React from "react";
import { toast } from "sonner";
import KanbanToolbar from "./components/KanbanToolbar";
import CreateProjectModal from "./components/CreateProjectModal";
import KanbanBoard from "./components/KanbanBoard";
import useKanbanProjects from "./hooks/useKanbanProjects";
import useCreateProjectForm from "./hooks/useCreateProjectForm";

export default function KanbanPage() {
  const [showCreate, setShowCreate] = React.useState(false);

  const {
    statuses,
    columns,
    filteredColumns,
    activeCard,
    loading,
    error,
    query,
    setQuery,
    addProject,
    handleDragStart,
    handleDragEnd,
  } = useKanbanProjects();

  const createProjectForm = useCreateProjectForm();

  React.useEffect(() => {
    if (showCreate) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showCreate]);

  function handleCreate() {
    const project = createProjectForm.buildProject();
    if (!project) return;

    addProject(project);
    setShowCreate(false);
    createProjectForm.resetForm();
    toast.success("Project is added");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <KanbanToolbar
        query={query}
        onQueryChange={setQuery}
        onAddNew={() => setShowCreate(true)}
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          Loading projects...
        </div>
      ) : (
        <KanbanBoard
          statuses={statuses}
          columns={filteredColumns}
          totals={columns}
          activeCard={activeCard}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      )}

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        form={createProjectForm}
        onCancel={() => {
          setShowCreate(false);
          createProjectForm.resetForm();
        }}
        onCreate={handleCreate}
      />
    </div>
  );
}
