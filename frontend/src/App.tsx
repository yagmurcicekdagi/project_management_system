import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { refresh } from "./api/auth";
import { useAuthStore } from "./store/authStore";
import AppRouter from "./router";

export default function App() {
  const [hydrating, setHydrating] = useState(true);

  // Silent refresh on mount — restores session from HttpOnly cookie.
  useEffect(() => {
    const { setAuth } = useAuthStore.getState();
    refresh()
      .then((data) => setAuth(data.token, data.email, data.role))
      .catch(() => {
        /* no valid session — render public routes */
      })
      .finally(() => setHydrating(false));
  }, []);

  if (hydrating) {
    return (
      <div className="min-h-screen bg-[#f0f2f7] flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      <AppRouter />
    </>
  );
}
