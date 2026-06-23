export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000/api'

export const API_ORIGIN = API_BASE.replace(/\/api$/, '');
