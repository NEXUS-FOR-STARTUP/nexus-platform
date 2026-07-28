import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : "http://localhost:8000/api",
  withCredentials: true,
});

// Idempotency-Key interceptor — adds random UUID for POST/PATCH requests
apiClient.interceptors.request.use(
  (config) => {
    if (config.method === 'post' || config.method === 'patch') {
      config.headers.set('Idempotency-Key', crypto.randomUUID());
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);
