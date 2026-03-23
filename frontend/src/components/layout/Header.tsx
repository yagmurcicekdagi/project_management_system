import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { logout } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";

export default function Header() {
  const navigate = useNavigate();
  const { email, role, clearAuth } = useAuthStore();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // proceed regardless
    } finally {
      clearAuth();
      navigate("/login", { replace: true });
    }
  }

  return (
    <header className="sticky top-0 z-10 h-14 border-b border-slate-200/80 bg-white/80 backdrop-blur flex items-center gap-2 px-3">
      <div className="ml-auto flex items-center gap-3">
        {email && (
          <span className="text-xs text-slate-500 hidden sm:block">
            {email}
            <span className="ml-2 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
              {role}
            </span>
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-xs text-slate-500 hover:text-slate-800 gap-1.5"
        >
          <LogOut size={13} />
          Sign out
        </Button>
      </div>
    </header>
  );
}
