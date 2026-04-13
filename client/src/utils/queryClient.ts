import { QueryClient, type QueryFunction } from "@tanstack/react-query";

const API_BASE_URL = ""; // Assuming relative paths or handled by proxy

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    console.error("🔍 API Request - Error response:", text);
    
    if (res.status === 401) {
      if (text.includes("Invalid or expired token")) {
        localStorage.removeItem("token");
        throw new Error("Your session has expired. Please log in again.");
      }
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!url || typeof url !== 'string') {
    throw new Error(`Invalid URL parameter: ${url}`);
  }
  
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  const isGetOrHead = method.toUpperCase() === 'GET' || method.toUpperCase() === 'HEAD';
  const fetchOptions: RequestInit = {
    method,
    headers,
  };
  
  if (!isGetOrHead && data) {
    fetchOptions.body = JSON.stringify(data);
  }

  const res = await fetch(fullUrl, fetchOptions);
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const urlPath = queryKey[0] as string;
    if (!urlPath || typeof urlPath !== 'string') {
      throw new Error('Query key must be a valid string URL');
    }
    
    const url = urlPath.startsWith('http') 
      ? urlPath 
      : `${API_BASE_URL}${urlPath}`;

    const res = await fetch(url, {
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
