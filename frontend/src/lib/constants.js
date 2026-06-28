export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://void-822012759095.europe-west1.run.app/api'

export const API_ORIGIN = API_BASE.replace(/\/api$/, '');
