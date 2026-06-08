const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'eh_token';

let token = localStorage.getItem(TOKEN_KEY);

export function setToken(value) {
  token = value;
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}
export function getToken() {
  return token;
}

async function req(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {

    if (res.status === 401 && auth && token) {
      setToken(null);
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    const detail = Array.isArray(data.detail)
      ? data.detail.map((d) => d.msg).filter(Boolean).join(', ')
      : data.detail;
    const err = new Error(detail || 'Ошибка запроса');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (b) => req('/auth/register', { method: 'POST', body: b, auth: false }),
  login: (b) => req('/auth/login', { method: 'POST', body: b, auth: false }),
  me: () => req('/auth/me'),

  updateProfile: (b) => req('/users/me', { method: 'PATCH', body: b }),
  changeEmail: (b) => req('/users/me/email', { method: 'POST', body: b }),
  changePassword: (b) => req('/users/me/password', { method: 'POST', body: b }),
  searchUsers: (q) => req(`/users/search?q=${encodeURIComponent(q)}`),

  events: () => req('/events'),
  createEvent: (b) => req('/events', { method: 'POST', body: b }),
  updateEvent: (id, b) => req(`/events/${id}`, { method: 'PATCH', body: b }),
  deleteEvent: (id) => req(`/events/${id}`, { method: 'DELETE' }),
  leaveEvent: (id) => req(`/events/${id}/leave`, { method: 'DELETE' }),
  invite: (id, identifier) =>
    req(`/events/${id}/invite`, { method: 'POST', body: { identifier } }),
  participants: (id) => req(`/events/${id}/participants`),
  respond: (id, accept) =>
    req(`/events/${id}/respond`, { method: 'POST', body: { accept } }),
  eventMessages: (id) => req(`/events/${id}/messages`),
  sendEventMessage: (id, text) =>
    req(`/events/${id}/messages`, { method: 'POST', body: { text } }),

  notifications: () => req('/notifications'),
  unreadCount: () => req('/notifications/unread-count'),
  readNotification: (id) => req(`/notifications/${id}/read`, { method: 'POST' }),
  replyNotification: (id, text) => req(`/notifications/${id}/reply`, { method: 'POST', body: { text } }),
  readAll: () => req('/notifications/read-all', { method: 'POST' }),

  adminUsers: () => req('/admin/users'),
  broadcast: (b) => req('/admin/broadcast', { method: 'POST', body: b }),

  chat: (messages) => req('/chat', { method: 'POST', body: { messages } }),
};
