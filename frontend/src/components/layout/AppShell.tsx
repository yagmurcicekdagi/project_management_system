import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Folder, Users } from 'lucide-react'
import Sidebar from '../Sidebar'
import Header from './Header'
import { useAuthStore } from '../../store/authStore'

const LOGO = (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="7" fill="#6366f1"/>
    <rect x="7" y="7" width="5" height="5" rx="1.5" fill="white"/>
    <rect x="16" y="7" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.6"/>
    <rect x="7" y="16" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.6"/>
    <rect x="16" y="16" width="5" height="5" rx="1.5" fill="white"/>
  </svg>
)

const MANAGER_ITEMS = [
  { label: 'Projects',  to: '/app/projects',  icon: <Folder className="h-5 w-5" /> },
  { label: 'Employees', to: '/app/employees', icon: <Users className="h-5 w-5" /> },
]

const USER_ITEMS = [
  { label: 'Projects', to: '/app/projects', icon: <Folder className="h-5 w-5" /> },
]

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const { role } = useAuthStore()

  const items = role === 'MANAGER' ? MANAGER_ITEMS : USER_ITEMS

  return (
    <div className="min-h-screen bg-[#f0f2f7]">
      <Sidebar
        items={items}
        collapsed={collapsed}
        onCollapseChange={setCollapsed}
        logo={LOGO}
      />
      <div className={`transition-[padding-left] duration-200 ease-in-out ${collapsed ? 'pl-[72px]' : 'pl-64'}`}>
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
