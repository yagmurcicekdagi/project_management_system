import React from 'react'

export type UserRole = 'manager' | 'employee'

interface UserRoleContextValue {
  role: UserRole
  setRole: (role: UserRole) => void
}

const UserRoleContext = React.createContext<UserRoleContextValue>({
  role: 'manager',
  setRole: () => {},
})

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = React.useState<UserRole>('manager')
  return (
    <UserRoleContext.Provider value={{ role, setRole }}>
      {children}
    </UserRoleContext.Provider>
  )
}

export function useUserRole() {
  return React.useContext(UserRoleContext)
}
