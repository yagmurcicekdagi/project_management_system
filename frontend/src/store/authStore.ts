import { create } from 'zustand'

interface AuthState {
  accessToken: string | null
  email: string | null
  role: 'MANAGER' | 'USER' | null
  setAuth: (token: string, email: string, role: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  email: null,
  role: null,
  setAuth: (token, email, role) =>
    set({ accessToken: token, email, role: role as 'MANAGER' | 'USER' }),
  clearAuth: () => set({ accessToken: null, email: null, role: null }),
}))
