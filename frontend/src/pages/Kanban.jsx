import React from "react";
import { toast } from "sonner";
import KanbanToolbar from "../components/kanban/KanbanToolbar";
import CreateProjectModal from "../components/kanban/CreateProjectModal";
import KanbanBoard from "../components/kanban/KanbanBoard";
import useKanbanProjects from "../hooks/kanban/useKanbanProjects";
import useCreateProjectForm from "../hooks/kanban/useCreateProjectForm";

export default function Kanban() {
  const [showCreate, setShowCreate] = React.useState(false);

  const {
    statuses,
    columns,
    filteredColumns,
    activeCard,
    query,
    setQuery,
    addProject,
    handleDragStart,
    handleDragEnd,
  } = useKanbanProjects();

  const {
    title,
    titleError,
    desc,
    assignees,
    empQuery,
    empResults,
    empLoading,
    endDate,
    statusValue,
    setDesc,
    setEmpQuery,
    setEndDate,
    setStatusValue,
    onTitleChange,
    onTitleBlur,
    addAssignee,
    removeAssignee,
    resetForm,
    buildProject,
  } = useCreateProjectForm();

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
    const project = buildProject();
    if (!project) return;

    addProject(project);
    setShowCreate(false);
    resetForm();
    toast.success("Project is added");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <KanbanToolbar
        query={query}
        onQueryChange={setQuery}
        onAddNew={() => setShowCreate(true)}
      />

      <KanbanBoard
        statuses={statuses}
        columns={filteredColumns}
        totals={columns}
        activeCard={activeCard}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={title}
        onTitleChange={onTitleChange}
        titleError={titleError}
        onTitleBlur={onTitleBlur}
        desc={desc}
        onDescChange={setDesc}
        endDate={endDate}
        onEndDateChange={setEndDate}
        statusValue={statusValue}
        onStatusChange={setStatusValue}
        empQuery={empQuery}
        onEmpQueryChange={setEmpQuery}
        empLoading={empLoading}
        empResults={empResults}
        assignees={assignees}
        onAddAssignee={addAssignee}
        onRemoveAssignee={removeAssignee}
        onCancel={() => {
          setShowCreate(false);
          resetForm();
        }}
        onCreate={handleCreate}
      />
    </div>
  );
}
