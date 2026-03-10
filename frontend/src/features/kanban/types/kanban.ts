import type { Dispatch, SetStateAction } from "react";
import type { Status } from "../config/statusConfig";

export type EntityId = string | number;

export interface Employee {
  id: EntityId;
  firstName?: string;
  lastName?: string;
}

export interface ProjectAssignee {
  id: EntityId;
  name: string;
}

export interface Project {
  id: EntityId;
  name?: string;
  description?: string;
  status?: Status;
  dueDate?: string;
  endDate?: string;
  startDate?: string;
  createdAt?: string;
  progress?: string | number;
  completion?: string | number;
  assignees?: ProjectAssignee[];
}

export type ProjectColumns = Record<Status, Project[]>;

export type SetState<T> = Dispatch<SetStateAction<T>>;

/** @deprecated Use ProjectFormState */
export type CreateProjectForm = ProjectFormState;

export interface ProjectFormState {
  title: string;
  titleError: boolean;
  desc: string;
  assignees: Employee[];
  empQuery: string;
  empResults: Employee[];
  empLoading: boolean;
  endDate: Date | null;
  statusValue: Status;
  setDesc: (next: string) => void;
  setEmpQuery: (next: string) => void;
  setEndDate: (next: Date | undefined) => void;
  setStatusValue: (next: Status) => void;
  onTitleChange: (next: string) => void;
  onTitleBlur: () => void;
  addAssignee: (employee: Employee) => void;
  removeAssignee: (id: EntityId) => void;
  resetForm: () => void;
  loadProject: (project: Project) => void;
  buildProject: () => Project | null;
}
