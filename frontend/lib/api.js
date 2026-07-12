const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

export async function apiGet(path) {
  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    credentials: "include"
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.message || "فشل الاتصال بالخادم");
  return data;
}

export async function apiPost(path, payload) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload || {})
  });

  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.message || "حدث خطأ غير متوقع");
  return data;
}

export async function apiPatch(path, payload) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload || {})
  });

  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.message || "حدث خطأ غير متوقع");
  return data;
}

export async function apiDelete(path) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    credentials: "include"
  });

  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.message || "حدث خطأ غير متوقع");
  return data;
}
