import React, { useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { Folder, UserRound, Bell, Settings } from "lucide-react";
import KanbanPage from "./features/kanban/KanbanPage";
import { Toaster } from "sonner";
import Sidebar from "./components/Sidebar";
import { UserRoleProvider, useUserRole } from "./context/UserRoleContext";

function RoleSwitcher() {
  const { role, setRole } = useUserRole();
  return (
    <button
      type="button"
      onClick={() => setRole(role === 'manager' ? 'employee' : 'manager')}
      className="ml-auto text-xs px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-medium"
    >
      Role: {role}
    </button>
  );
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false);

  const items = [
    {
      label: "Projects",
      to: "/projects",
      icon: <Folder className="h-5 w-5" />,
    },
    {
      label: "Team",
      to: "/team",
      icon: <UserRound className="h-5 w-5" />,
    },
    {
      label: "Notifications",
      to: "/notifications",
      icon: <Bell className="h-5 w-5" />,
    },
    {
      label: "Settings",
      to: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <UserRoleProvider>
    <div className="min-h-screen bg-[#f0f2f7]">
      <Sidebar
        items={items}
        collapsed={collapsed}
        onCollapseChange={setCollapsed}
        logo={<div className="size-6 rounded bg-primary" />}
      />
      <div className={collapsed ? "pl-[72px]" : "pl-64"}>
        <header className="sticky top-0 z-10 h-14 border-b border-slate-200/80 bg-white/80 backdrop-blur flex items-center gap-2 px-3">
          <Link to="/projects" className="font-semibold">
            PMS
          </Link>
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
  );
}
