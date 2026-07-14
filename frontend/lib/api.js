const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

function getApiUrl(path) {
  if (API_URL.startsWith("http")) {
    return `${API_URL}${path}`;
  }

  if (typeof window !== "undefined") {
    return `${API_URL}${path}`;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  return `${siteUrl}${API_URL}${path}`;
}




function getAuthHeaders(extraHeaders = {}) {
  const headers = { ...extraHeaders };

  if (typeof window !== "undefined") {
const token =
  localStorage.getItem("ieee_anu_session_token") ||
  localStorage.getItem("token");  
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

export async function apiGet(path) {
  const response = await fetch(getApiUrl(path), {
    cache: "no-store",
    next: { revalidate: 0 },
    credentials: "include",
    headers: getAuthHeaders()
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.message || "فشل الاتصال بالخادم");
  return data;
}

export async function apiPost(path, payload) {
  const response = await fetch(getApiUrl(path), {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    }),
    credentials: "include",
    body: JSON.stringify(payload || {})
  });

  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.message || "حدث خطأ غير متوقع");
  return data;
}

export async function apiPatch(path, payload) {
  const response = await fetch(getApiUrl(path), {
    method: "PATCH",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    }),
    credentials: "include",
    body: JSON.stringify(payload || {})
  });

  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.message || "حدث خطأ غير متوقع");
  return data;
}

export async function apiDelete(path) {
  const response = await fetch(getApiUrl(path), {
    method: "DELETE",
    headers: getAuthHeaders({
      "X-Requested-With": "XMLHttpRequest"
    }),
    credentials: "include"
  });

  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.message || "حدث خطأ غير متوقع");
  return data;
}