import axios from "axios";

function normalizeApiBaseUrl(value) {
  const baseUrl = String(value || "http://localhost:3000").replace(/\/+$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL),
});

const PUBLIC_AUTH_ROUTES = [
  "/auth/login",
  "/auth/registrar",
  "/auth/demo",
  "/auth/demo/reset",
];

function clearStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
    } else if (config.headers) {
      delete config.headers["Content-Type"];
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";
    const isPublicAuthRequest = PUBLIC_AUTH_ROUTES.some((route) => url.includes(route));
    const isRefreshRequest = url.includes("/auth/refresh");

    if (
      error.response?.status === 401
      && !isPublicAuthRequest
      && !isRefreshRequest
      && !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Token ausente");
        }

        const { data } = await api.post(
          "/auth/refresh",
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const newToken = data.access_token || data.token;
        if (!newToken) {
          throw new Error("Refresh sem token");
        }

        localStorage.setItem("token", newToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        clearStoredSession();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
