import axios from "axios";

export const fileUrl = (relative) => {
  if (!relative) return "";
  if (relative.startsWith("http")) return relative;
  const base = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const clean = relative.replace(/^\/+/, "");
  return `${base}/${clean}`;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);
 
export default api;
