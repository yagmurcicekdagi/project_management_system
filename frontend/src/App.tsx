import { useState } from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { Folder, UserRound, Settings } from 'lucide-react'
import KanbanPage from './features/kanban/KanbanPage'
import { Toaster } from 'sonner'
import Sidebar from './components/Sidebar'
import { UserRoleProvider, useUserRole } from './context/UserRoleContext'

function RoleSwitcher() {
  const { role, setRole } = useUserRole()
  return (
    <button
      type="button"
      onClick={() => setRole(role === 'manager' ? 'employee' : 'manager')}
      className="ml-auto text-xs px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-medium"
    >
      Role: {role}
    </button>
  )
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false)

  const items = [
    { label: 'Projects', to: '/projects', icon: <Folder className="h-5 w-5" /> },
    { label: 'Team', to: '/team', icon: <UserRound className="h-5 w-5" /> },
    { label: 'Settings', to: '/settings', icon: <Settings className="h-5 w-5" /> },
  ]

  return (
    <UserRoleProvider>
      <div className="min-h-screen bg-[#f0f2f7]">
        <Sidebar
          items={items}
          collapsed={collapsed}
          onCollapseChange={setCollapsed}
          logo={
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="28" height="28" rx="7" fill="#6366f1"/>
              <rect x="7" y="7" width="5" height="5" rx="1.5" fill="white"/>
              <rect x="16" y="7" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.6"/>
              <rect x="7" y="16" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.6"/>
              <rect x="16" y="16" width="5" height="5" rx="1.5" fill="white"/>
            </svg>
          }
        />
        <div className={`transition-[padding-left] duration-200 ease-in-out ${collapsed ? 'pl-[72px]' : 'pl-64'}`}>
          <header className="sticky top-0 z-10 h-14 border-b border-slate-200/80 bg-white/80 backdrop-blur flex items-center gap-2 px-3">
            <Link to="/projects" className="font-semibold">PMS</Link>
            <RoleSwitcher />
          </header>
          <Toaster richColors position="top-right" />
          <main>
            <Routes>
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<KanbanPage />} />
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </UserRoleProvider>
  )
}
