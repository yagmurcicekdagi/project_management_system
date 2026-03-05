import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Kanban from "./pages/Kanban";
import { Toaster } from "sonner";

export default function App() {
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="font-semibold">
              PMS
            </Link>
            <nav className="flex items-center gap-4 text-sm text-gray-700 dark:text-zinc-300">
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
          </div>
        </div>
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
  );
}

function Home() {
  return null;
}
