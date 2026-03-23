import axios from 'axios'
import api from './client'
import type { AuthResponse } from '../types'

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/v1/auth/login', { email, password })
  return data
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/v1/auth/register', { email, password })
  return data
}

// Uses raw axios (not the intercepted client) to avoid the 401 interceptor
// triggering another refresh attempt when no session exists yet.
// The refresh endpoint returns only { token, tokenType } — decode the JWT
// to recover email and role so the auth store stays fully populated.
export async function refresh(): Promise<AuthResponse> {
  const { data } = await axios.post<{ token: string; tokenType: string }>(
    '/api/v1/auth/refresh',
    null,
    { withCredentials: true },
  )
  const payload = JSON.parse(atob(data.token.split('.')[1]))
  return {
    token: data.token,
    tokenType: data.tokenType,
    email: payload.sub,
    role: payload.role,
  }
}

export async function logout(): Promise<void> {
  await api.post('/v1/auth/logout')
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.post('/v1/auth/change-password', { currentPassword, newPassword })
}
