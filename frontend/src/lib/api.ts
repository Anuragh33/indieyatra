export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";

// Injected by ClerkAuthSync — takes priority over localStorage
let _clerkTokenGetter: (() => Promise<string | null>) | null = null;

export function setClerkTokenGetter(fn: (() => Promise<string | null>) | null) {
  _clerkTokenGetter = fn;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("indieyatra_token");
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("indieyatra_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("indieyatra_token");
}

export async function api<T = unknown>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  let token: string | null = null;
  if (_clerkTokenGetter) {
    token = await _clerkTokenGetter();
  } else {
    token = getToken();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  return res.text() as unknown as T;
}

export const apiGet = <T,>(p: string) => api<T>(p);
export const apiPost = <T,>(p: string, body: unknown) =>
  api<T>(p, { method: "POST", body: JSON.stringify(body) });
export const apiPut = <T,>(p: string, body: unknown) =>
  api<T>(p, { method: "PUT", body: JSON.stringify(body) });
export const apiDelete = <T,>(p: string) => api<T>(p, { method: "DELETE" });
