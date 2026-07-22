import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ Important for cookies / token headers
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.log("API Request:", config.method?.toUpperCase(), config.baseURL + config.url);
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error?.config?.method?.toUpperCase(), error?.config?.baseURL + error?.config?.url);
    console.error("Error Status:", error?.response?.status);
    console.error("Error Data:", error?.response?.data);
    return Promise.reject(error);
  }
);

export default api;
