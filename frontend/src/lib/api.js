import { API_BASE } from './constants';

// Fetch PDF as blob for inline iframe display (avoids cross-origin download)
export async function fetchPdfBlob(pdfId) {
  const res = await fetch(`${API_BASE}/pdf/view/${pdfId}`);
  if (!res.ok) throw new Error('Failed to load PDF');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function getCurrentUser() {
  const stored = localStorage.getItem('void_user');
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
    localStorage.setItem('void_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('void_user');
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
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
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res;
}

export async function ensureUser() {
  const user = getCurrentUser();
  if (!user) return;
  try {
    await request(`/users/${user.user_id}`, {
      method: 'POST',
      body: JSON.stringify({ user_id: user.user_id, email: user.email }),
    });
  } catch {
    /* user may already exist */
  }
}

export async function createUser(userId, email) {
  return request(`/users/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, email }),
  });
}

export async function listUsers() {
  return request('/users');
}

export async function healthCheck() {
  return request('/health');
}

export function listSessions() {
  const user = getCurrentUser();
  const uid = user ? user.user_id : 'void_user';
  return request(`/sessions/${uid}`);
}

export function createSession(sessionName) {
  const user = getCurrentUser();
  const uid = user ? user.user_id : 'void_user';
  return request('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      user_id: uid,
      session_name: sessionName,
    }),
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
