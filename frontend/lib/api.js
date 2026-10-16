import { createSessionCache } from "./session-cache.mjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const sessionCache = createSessionCache();

function getApiUrl(path) {
  if (API_URL.startsWith("http")) {
    return `${API_URL}${path}`;
  }

  if (typeof window !== "undefined") {
    return `${API_URL}${path}`;
  }

  // Server rendering can reach the API directly instead of travelling through
  // this deployment's public /api rewrite and another frontend request.
  const internalApiUrl = process.env.API_INTERNAL_URL ||
    (process.env.VERCEL ? "https://ieee-anu.onrender.com/api" : "");
  if (internalApiUrl) return `${internalApiUrl.replace(/\/$/, "")}${path}`;

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

async function requestGet(path, fetchOptions = {}) {
  const requestOptions = {
    credentials: "include",
    headers: getAuthHeaders(),
    ...fetchOptions
  };
  if (!("cache" in fetchOptions) && !fetchOptions.next?.revalidate) {
    requestOptions.cache = "no-store";
  }

  const response = await fetch(getApiUrl(path), requestOptions);
  const data = await parseJson(response);
  if (!response.ok) {
    const error = new Error(data.message || "فشل الاتصال بالخادم");
    error.status = response.status;
    throw error;
  }
  return data;
}

export function apiGet(path, fetchOptions = {}) {
  if (typeof window !== "undefined" && path === "/auth/me" && Object.keys(fetchOptions).length === 0) {
    return sessionCache.read(() => requestGet(path)).then((data) => {
      if (!data?.user) {
        const error = new Error("يجب تسجيل الدخول أولا");
        error.status = 401;
        throw error;
      }
      return data;
    });
  }
  return requestGet(path, fetchOptions);
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
  if (typeof window !== "undefined") {
    if (["/auth/login", "/auth/register"].includes(path) && data.user && data.token) {
      sessionCache.write({ user: data.user });
      window.dispatchEvent(new Event("ieee:session-change"));
    } else if (path === "/auth/logout") {
      sessionCache.write({ user: null });
      window.dispatchEvent(new Event("ieee:session-change"));
    }
  }
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
