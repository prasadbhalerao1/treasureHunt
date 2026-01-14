import axios from "axios";

// Ensure this matches Backend Port
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (import.meta.env.MODE === "development") {
      console.log(
        `[API REQUEST] ${config.method.toUpperCase()} ${config.url}`,
        config.data || ""
      );
    }
    return config;
  },
  (error) => {
    console.error("[API REQUEST ERROR]", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.MODE === "development") {
      console.log(
        `[API RESPONSE] ${response.status} ${response.config.url}`,
        response.data
      );
    }
    return response;
  },
  (error) => {
    console.error(
      "[API RESPONSE ERROR]",
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export default api;
