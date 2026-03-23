export type ProjectStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED'

export interface ProjectResponse {
  id: number
  name: string
  description: string | null
  status: ProjectStatus
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export interface EmployeeResponse {
  id: number
  firstName: string
  lastName: string
  email: string
  userId: number | null
}


export interface AuthResponse {
  token: string
  tokenType: string
  email: string
  role: string
}

export interface ErrorResponse {
  status: number
  error: string
  message: string
  path: string
}

export interface Page<T> {
  content: T[]
  page: {
    totalPages: number
    totalElements: number
    number: number
    size: number
  }
}
