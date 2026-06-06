export const USER_ID = 'void_user';
export const USER_EMAIL = 'user@void.local';

export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://void-wdpq.onrender.com/api';

export const API_ORIGIN = API_BASE.replace(/\/api$/, '');
