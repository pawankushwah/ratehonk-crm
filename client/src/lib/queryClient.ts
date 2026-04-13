import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    console.error("🔍 API Request - Error response:", text);
    
    // Handle 401 unauthorized errors specifically
    if (res.status === 401) {
      // Check if it's an invalid/expired token error
      if (text.includes("Invalid or expired token")) {
        // Clear local storage and redirect to login
        localStorage.removeItem("auth_token");
        localStorage.removeItem("token");
        localStorage.removeItem("cached_auth_data");
        
        // Show user-friendly message
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
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {};
  
  console.log("🔍 API Request - Method:", method);
  console.log("🔍 API Request - URL:", url);
  console.log("🔍 API Request - Data:", data);
  console.log("🔍 API Request - Token:", token ? "Present" : "Missing");
  
  if (data && !(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Add safety check for url parameter
  if (!url || typeof url !== 'string') {
    console.error("🔍 API Request - Invalid URL:", url);
    throw new Error(`Invalid URL parameter: ${url}`);
  }
  
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  console.log("🔍 API Request - Full URL:", fullUrl);
  console.log("🔍 API Request - Headers:", headers);

  // GET and HEAD requests cannot have a body
  const isGetOrHead = method.toUpperCase() === 'GET' || method.toUpperCase() === 'HEAD';
  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
  };
  
  // Only add body for non-GET/HEAD requests and when data is provided
  if (!isGetOrHead && data) {
    fetchOptions.body = data instanceof FormData ? data : JSON.stringify(data);
  }

  const res = await fetch(fullUrl, fetchOptions);

  console.log("🔍 API Request - Response status:", res.status);
  console.log("🔍 API Request - Response headers:", Object.fromEntries(res.headers.entries()));

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
const API_BASE_URL = "";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("auth_token");
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
      credentials: "include",
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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
