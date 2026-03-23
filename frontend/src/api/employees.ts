import api from './client'
import type { EmployeeResponse, Page } from '../types'

export interface CreateEmployeePayload {
  firstName: string
  lastName: string
  email: string
}

export interface UpdateEmployeePayload {
  firstName?: string
  lastName?: string
}

export async function getEmployees(
  page = 0,
  size = 20,
  search?: string,
): Promise<Page<EmployeeResponse>> {
  const params: Record<string, unknown> = { page, size }
  if (search) params.search = search
  const { data } = await api.get<Page<EmployeeResponse>>('/v1/employees', { params })
  return data
}

export async function getEmployee(id: number): Promise<EmployeeResponse> {
  const { data } = await api.get<EmployeeResponse>(`/v1/employees/${id}`)
  return data
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<EmployeeResponse> {
  const { data } = await api.post<EmployeeResponse>('/v1/employees', payload)
  return data
}

export async function updateEmployee(
  id: number,
  payload: UpdateEmployeePayload,
): Promise<EmployeeResponse> {
  const { data } = await api.patch<EmployeeResponse>(`/v1/employees/${id}`, payload)
  return data
}

export async function deleteEmployee(id: number): Promise<void> {
  await api.delete(`/v1/employees/${id}`)
}
