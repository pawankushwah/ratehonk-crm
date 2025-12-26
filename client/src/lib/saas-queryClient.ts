import { saasAuth } from "./saas-auth";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    console.error("🔍 SaaS API Request - Error response:", text);
    
    // Handle 401 unauthorized errors specifically
    if (res.status === 401) {
      // Clear SaaS auth and redirect to SaaS login
      saasAuth.logout();
      throw new Error("Your SaaS session has expired. Please log in again.");
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function saasApiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = saasAuth.getToken();
  const headers: Record<string, string> = {};
  
  console.log("🔍 SaaS API Request - Method:", method);
  console.log("🔍 SaaS API Request - URL:", url);
  console.log("🔍 SaaS API Request - Token:", token ? "Present" : "Missing");
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const isGetOrHead = method.toUpperCase() === 'GET' || method.toUpperCase() === 'HEAD';
  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
  };
  
  if (!isGetOrHead && data) {
    fetchOptions.body = JSON.stringify(data);
  }

  const res = await fetch(fullUrl, fetchOptions);
  await throwIfResNotOk(res);
  return res;
}

const API_BASE_URL = "";

