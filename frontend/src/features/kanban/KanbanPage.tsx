import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../api/client";
import { USE_MOCK } from "../../mock/useMock";
import * as mock from "../../mock/api";
import { useUserRole } from "../../context/UserRoleContext";
import KanbanToolbar from "./components/KanbanToolbar";
import ProjectModal from "./components/ProjectModal";
import KanbanBoard from "./components/KanbanBoard";
import useKanbanProjects from "./hooks/useKanbanProjects";
import useProjectForm from "./hooks/useProjectForm";
import type { EntityId, Project } from "./types/kanban";

export default function KanbanPage() {
  const { role } = useUserRole();
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);

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
    updateProject,
    deleteProject,
    handleDragStart,
    handleDragEnd,
  } = useKanbanProjects();

  const form = useProjectForm();

  useEffect(() => {
    if (showModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
    return undefined;
  }, [showModal]);

  function openCreate() {
    form.resetForm();
    setSelectedProject(undefined);
    setShowModal(true);
  }

  function openEdit(project: Project) {
    form.loadProject(project);
    setSelectedProject(project);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedProject(undefined);
    form.resetForm();
  }

  function handleSave() {
    const project = form.buildProject();
    if (!project) return;

    if (selectedProject) {
      updateProject(project);
      if (USE_MOCK) {
        mock.updateProject(project.id, project).catch(() => {});
      } else {
        api.put(`/v1/projects/${project.id}`, project).catch(() => {});
      }
      toast.success("Project updated");
    } else {
      addProject(project);
      toast.success("Project created");
    }
    closeModal();
  }

  function handleDelete(id: EntityId) {
    deleteProject(id);
    if (USE_MOCK) {
      mock.deleteProject(id).catch(() => {});
    } else {
      api.delete(`/v1/projects/${id}`).catch(() => {});
    }
    toast.success("Project deleted");
    closeModal();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <KanbanToolbar
        query={query}
        onQueryChange={setQuery}
        onAddNew={openCreate}
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
          onCardClick={openEdit}
        />
      )}

      <ProjectModal
        open={showModal}
        onClose={closeModal}
        project={selectedProject}
        form={form}
        onCancel={closeModal}
        onSave={handleSave}
        onDelete={role === "manager" ? handleDelete : undefined}
        readonly={role === "employee" && !!selectedProject}
      />
    </div>
  );
}
