const API = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

export const api = {
  health: () => request('/api/v1/health'),
  getCheckins: () => request('/api/v1/mood'),
  createCheckin: (body) =>
    request('/api/v1/mood', { method: 'POST', body: JSON.stringify(body) }),
  getInsights: () => request('/api/v1/insights'),
  getChat: () => request('/api/v1/chat/history'),
  sendChat: (message) =>
    request('/api/v1/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  clearChat: () => request('/api/v1/chat/history', { method: 'DELETE' }),
};
