// Toggle mock mode: defaults to true for local dev without backend
// Set VITE_USE_MOCK=false in an .env file to disable
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true'

