import { QueryClient, type QueryFunction } from "@tanstack/react-query";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

export const getQueryFn: <T>(options?: { on401?: "returnNull" | "throw" }) => QueryFunction<T> =
  ({ on401 = "throw" } = {}) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/") as string;
    const fullUrl = path.startsWith("http") ? path : `${apiBaseUrl}/${path}`.replace(/\/\/+/, "/");
    const res = await fetch(fullUrl);
    if (on401 === "returnNull" && res.status === 401) return null as unknown ;
    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    return (await res.json()) ;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
});