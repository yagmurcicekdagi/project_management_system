import { clsx, type ClassValue } from "clsx";
import axios from "axios";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ApiError = {
  response?: {
    data?: { message?: string } | Record<string, string>;
  };
};

/** Parses a Spring Boot API error into a displayable string or string[]. */
export function parseApiError(
  err: unknown,
  fallback: string,
): string | string[] {
  if (axios.isAxiosError(err) && err.response?.data) {
    const data = err.response.data as { message?: string } & Record<string, string>;

    if (data?.message) return data.message;

    // Spring validation error: { field: "message", ... }
    const fieldErrors = Object.values(data as Record<string, string>).filter(
      (v): v is string => typeof v === "string",
    );
    if (fieldErrors.length) return fieldErrors;
  }

  if (err instanceof Error) return err.message;

  return fallback;
}
