import React, { useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { Home, Folder, UserRound, Bell, Settings } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import KanbanPage from "./features/kanban/KanbanPage";
import { Toaster } from "sonner";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);

  const items = [
    {
      label: "Dashboard",
      to: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
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
    <div className="min-h-screen">
      <Sidebar
        items={items}
        collapsed={collapsed}
        onCollapseChange={setCollapsed}
        logo={<div className="size-6 rounded bg-primary" />}
      />
      <div className={collapsed ? "pl-[72px]" : "pl-64"}>
        <header className="sticky top-0 z-10 h-14 border-b border-gray-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70 flex items-center gap-2 px-3">
          <Link to="/dashboard" className="font-semibold">
            PMS
          </Link>
          <nav className="ml-4 flex items-center gap-4 text-sm text-gray-700 dark:text-zinc-300">
            <Link to="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <Link to="/projects" className="hover:underline">
              Projects
            </Link>
            <Link to="/kanban" className="hover:underline">
              Kanban
            </Link>
          </nav>
        </header>
        <Toaster richColors position="top-right" />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
