const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(buildUrl(path), options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return null;
}

export async function fetchJson(path) {
  return apiRequest(path);
}

export async function postJson(path, body) {
  return apiRequest(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function postRequest(path) {
  return apiRequest(path, {
    method: "POST",
  });
}

export async function deleteRequest(path) {
  return apiRequest(path, {
    method: "DELETE",
  });
}