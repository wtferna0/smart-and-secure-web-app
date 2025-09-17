export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function request(path, { method = "GET", body, headers } = {}) {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (_) {}

    if (!res.ok) {
      const msg = data?.detail || data?.message || `${res.status} ${res.statusText}`;
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    console.error("API error:", method, url, err);
    throw err;
  }
}

export const api = {
  startPuzzle:    (payload) => request("/puzzle/start/",    { method: "POST", body: payload }),
  completePuzzle: (payload) => request("/puzzle/complete/", { method: "POST", body: payload }),
  getSession:     (id)      => request(`/puzzle/sessions/${id}/`),
};
