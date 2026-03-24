import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { login } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import AuthFormShell from "../components/layout/AuthFormShell";

const schema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setApiError("");
    try {
      const data = await login(values.email, values.password);
      setAuth(data.token, data.email, data.role);
      navigate("/app/projects", { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = axiosErr.response?.status;
      if (!axiosErr.response || (status && status >= 500)) {
        setApiError(
          "Unable to reach the server. Please check your connection and try again.",
        );
      } else {
        const msg = axiosErr.response?.data?.message;
        setApiError(msg ?? "Invalid credentials.");
      }
    }
  }

  return (
    <AuthFormShell
      title="Welcome back"
      subtitle="Sign in to your account to continue"
      activeTab="signin"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {apiError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {apiError}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="bg-gray-50 border-gray-200 rounded-xl h-12"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-semibold">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className="bg-gray-50 border-gray-200 rounded-xl h-12"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-xl bg-[#1a1c2e] hover:bg-[#252842] text-white font-semibold text-sm"
        >
          {isSubmitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>
    </AuthFormShell>
  );
}
