import React, { useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Kanban from "./pages/Kanban";
import { Toaster } from "sonner";
import Sidebar from "./components/Sidebar";
import SidebarTrigger from "./components/SidebarTrigger";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);

  const items = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Projects", to: "/projects" },
    { label: "Kanban", to: "/kanban" },
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
          {/* Removed header hamburger; toggle lives in the rail */}
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
            <Route path="/kanban" element={<Kanban />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function Home() {
  return null;
}
