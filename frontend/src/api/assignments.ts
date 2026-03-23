import api from './client'
import type { AssignmentResponse } from '../types'

export async function getAssignments(projectId: number): Promise<AssignmentResponse[]> {
  const { data } = await api.get<AssignmentResponse[]>(`/v1/projects/${projectId}/assignments`)
  return data
}

export async function assignEmployee(projectId: number, employeeId: number): Promise<void> {
  await api.post(`/v1/projects/${projectId}/assignments`, { employeeId })
}

export async function unassignEmployee(projectId: number, employeeId: number): Promise<void> {
  await api.delete(`/v1/projects/${projectId}/assignments/${employeeId}`)
}

export async function unassignAll(projectId: number): Promise<void> {
  await api.delete(`/v1/projects/${projectId}/assignments`)
}
