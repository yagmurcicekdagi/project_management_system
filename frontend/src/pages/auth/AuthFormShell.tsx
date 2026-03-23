import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import AuthHero from "./AuthHero";

type AuthFormShellProps = Readonly<{
  title: string;
  subtitle: string;
  activeTab: "signin" | "signup";
  children: ReactNode;
}>

export default function AuthFormShell({ title, subtitle, activeTab, children }: AuthFormShellProps) {
  const tabBase = "flex-1 py-3 text-center text-sm font-semibold transition-colors";
  const tabActive = "bg-gray-100 text-gray-800";
  const tabInactive = "text-gray-500 hover:bg-gray-50";

  return (
    <div className="min-h-screen flex">
      <AuthHero />

      <div className="flex-1 bg-white flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold tracking-tight mb-1 animate-fade-up [animation-delay:0ms]">{title}</h2>
          <p className="text-gray-500 mb-8 animate-fade-up [animation-delay:80ms]">{subtitle}</p>

          {/* Tabs */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-8 animate-fade-up [animation-delay:160ms]">
            {activeTab === "signin" ? (
              <>
                <div className={`${tabBase} ${tabActive}`}>Sign In</div>
                <Link to="/register" className={`${tabBase} ${tabInactive}`}>Sign Up</Link>
              </>
            ) : (
              <>
                <Link to="/login" className={`${tabBase} ${tabInactive}`}>Sign In</Link>
                <div className={`${tabBase} ${tabActive}`}>Sign Up</div>
              </>
            )}
          </div>

          <div className="animate-fade-up [animation-delay:240ms]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
