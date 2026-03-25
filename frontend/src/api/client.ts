import axios from "axios";
import { useAuthStore } from "../store/authStore";

// Shared Axios instance used by every API module (projects, employees, assignments).
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// ── Request interceptor ──────────────────────────────────────────────────────
// Reads the latest access token from Zustand on every request.
// Using getState() (not a hook) is safe here because interceptors run outside
// React's render cycle — this is the correct way to access Zustand outside components.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ─────────────────────────────────────────────────────
// Implements silent token refresh: when any request returns 401, this
// interceptor transparently refreshes the access token and retries the
// original request — no UI interaction needed.
//
// Flow:
//   1. Request fails with 401
//   2. POST /auth/refresh is called with the HttpOnly refresh token cookie
//   3a. Success → new token stored, all queued requests retried
//   3b. Failure → auth cleared, user redirected to /login

// Prevents multiple simultaneous refresh calls when several requests 401 at once.
let isRefreshing = false;

// Holds retry callbacks for requests that arrived while a refresh was already
// in flight. Each callback re-runs the original request once the new token arrives.
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Pass through non-401 errors and requests already retried once (_retry flag)
    // to avoid infinite retry loops if the server keeps returning 401.
    if (error.response?.status !== 401 || original._retry) {
      throw error;
    }

    // Auth endpoints (login, register, refresh) should never trigger a refresh —
    // a 401 here means bad credentials or an expired refresh token, so surface
    // the error directly to the UI.
    if (original.url?.includes("/auth/")) {
      throw error;
    }

    // A refresh is already in progress — queue this request until it completes
    // rather than firing a second parallel refresh call.
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token: string) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    // Mark the original request so it won't be retried again if it 401s a second time.
    original._retry = true;
    isRefreshing = true;

    try {
      // The refresh token is an HttpOnly cookie sent automatically via withCredentials.
      const { data } = await axios.post(
        "/api/v1/auth/refresh",
        {},
        { withCredentials: true },
      );
      const newToken: string = data.token;

      // Persist the new token so all future requests pick it up via the request interceptor.
      useAuthStore.getState().setAuth(newToken, data.email, data.role);

      // Unblock all requests that queued while the refresh was in flight.
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];

      // Retry the original request that triggered the 401.
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      // Refresh failed (expired or missing refresh token) — session is unrecoverable.
      // Clear all auth state and redirect. Any queued promises are abandoned here,
      // but the page navigation tears down the JS runtime so they are never observed.
      refreshQueue = [];
      useAuthStore.getState().clearAuth();
      globalThis.location.href = "/login";
      throw error;
    } finally {
      // Always reset the flag so future 401s can trigger a fresh refresh attempt.
      isRefreshing = false;
    }
  },
);

export default api;
