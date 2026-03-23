import api from './client'
import type { ProjectResponse, ProjectStatus, Page } from '../types'

export interface CreateProjectPayload {
  name: string
  description?: string
  status?: ProjectStatus
  startDate?: string
  endDate?: string
}

export interface UpdateProjectPayload {
  name?: string
  description?: string
  status?: ProjectStatus
  startDate?: string
  endDate?: string
}

export async function getProjects(
  page = 0,
  size = 20,
  status?: ProjectStatus,
): Promise<Page<ProjectResponse>> {
  const params: Record<string, unknown> = { page, size }
  if (status) params.status = status
  const { data } = await api.get<Page<ProjectResponse>>('/v1/projects', { params })
  return data
}

export async function getProject(id: number): Promise<ProjectResponse> {
  const { data } = await api.get<ProjectResponse>(`/v1/projects/${id}`)
  return data
}

export async function createProject(payload: CreateProjectPayload): Promise<ProjectResponse> {
  const { data } = await api.post<ProjectResponse>('/v1/projects', payload)
  return data
}

export async function updateProject(
  id: number,
  payload: UpdateProjectPayload,
): Promise<ProjectResponse> {
  const { data } = await api.patch<ProjectResponse>(`/v1/projects/${id}`, payload)
  return data
}

export async function deleteProject(id: number): Promise<void> {
  await api.delete(`/v1/projects/${id}`)
}
