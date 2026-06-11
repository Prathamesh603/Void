import { API_BASE } from './constants';

const TOKEN_KEY = 'void_token';
const USER_KEY = 'void_user';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getCurrentUser() {
  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearAuth() {
  setAuthToken(null);
  setCurrentUser(null);
}

function authHeaders() {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...authHeaders(), ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try {
      const json = JSON.parse(text);
      detail = json.detail || text;
    } catch {
      /* keep text */
    }
    if (res.status === 401) {
      clearAuth();
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res;
}

export async function register(email, password) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.access_token);
  setCurrentUser({ user_id: data.user_id, email: data.email });
  return data;
}

export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.access_token);
  setCurrentUser({ user_id: data.user_id, email: data.email });
  return data;
}

export async function fetchCurrentUser() {
  const data = await request('/users/me');
  setCurrentUser({ user_id: data.user_id, email: data.email });
  return data;
}

export function logout() {
  clearAuth();
}

export async function fetchPdfBlob(pdfId) {
  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/pdf/view/${pdfId}`, { headers });
  if (!res.ok) throw new Error('Failed to load PDF');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function healthCheck() {
  return request('/health');
}

export function listSessions() {
  return request('/users/me/sessions');
}

export function createSession(sessionName) {
  return request('/sessions', {
    method: 'POST',
    body: JSON.stringify({ session_name: sessionName }),
  });
}

export function getSession(sessionId) {
  return request(`/sessions/${sessionId}`);
}

export function deleteSession(sessionId) {
  return request(`/sessions/${sessionId}`, { method: 'DELETE' });
}

export function getMessages(sessionId) {
  return request(`/sessions/${sessionId}/messages`);
}

export function sendChat(sessionId, message) {
  return request(`/sessions/${sessionId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, message }),
  });
}

export function getPapers(sessionId) {
  return request(`/papers/${sessionId}`);
}

export function getPaper(sessionId, arxivId) {
  return request(`/paper/${sessionId}/${arxivId}`);
}

export function downloadPdf(payload) {
  return request('/pdf/download', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listPdfs(sessionId) {
  return request(`/pdf/list/${sessionId}`);
}

export function deletePdf(pdfId) {
  return request(`/pdf/${pdfId}`, { method: 'DELETE' });
}

export function pdfViewUrl(pdfId) {
  return `${API_BASE}/pdf/view/${pdfId}`;
}

export function queryPdf(sessionId, query, pdfId = null) {
  return request('/pdf/query', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      query: `Use the RAG retrieval tool and answer strictly from the uploaded PDF context.\n\nUser Query: ${query}`,
      pdf_id: pdfId,
    }),
  });
}

export function getChatHistory(sessionId) {
  return request(`/chat/history/${sessionId}`);
}
