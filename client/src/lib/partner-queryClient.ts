import { partnerAuth } from "./partner-auth";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    if (res.status === 401) {
      partnerAuth.logout();
      throw new Error("Your partner session has expired. Please log in again.");
    }
    throw new Error(`${res.status}: ${text}`);
  }
}

const API_BASE_URL = "";

export async function partnerApiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const token = partnerAuth.getToken();
  const headers: Record<string, string> = {};
  if (data) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  const isGetOrHead = method.toUpperCase() === "GET" || method.toUpperCase() === "HEAD";
  const fetchOptions: RequestInit = { method, headers, credentials: "include" };
  if (!isGetOrHead && data) fetchOptions.body = JSON.stringify(data);

  const res = await fetch(fullUrl, fetchOptions);
  await throwIfResNotOk(res);
  return res;
}
