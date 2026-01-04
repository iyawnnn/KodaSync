import axios from "axios";
import Cookies from "js-cookie";

// 1. Dynamic Configuration
// If deployed, use the Env Var. If local, use localhost.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
});

// 2. Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor (Auto-Refresh Logic)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get("refresh_token");
        if (!refreshToken) throw new Error("No refresh token available");

        // FIX: Use the dynamic API_URL here too!
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        Cookies.set("token", response.data.access_token, { expires: 1/96 });
        Cookies.set("refresh_token", response.data.refresh_token, { expires: 7 });

        originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
        
        // Retry with the new token
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error("Session expired. Logging out...");
        Cookies.remove("token");
        Cookies.remove("refresh_token");
        window.location.href = "/auth?mode=login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;