import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── Response interceptor ──────────────────────────────────────────────────
// Normalises error shape from the backend's custom_exception_handler
// so every .catch() in the app receives { message, details, status }.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Backend sends { error, details, status_code }
    const message =
      data?.error ||
      data?.detail ||
      error.message ||
      "An unexpected error occurred.";

    const details = data?.details ?? null;

    // 5xx errors get a generic toast so individual components don't need to
    if (status >= 500) {
      toast.error("Server error. Please try again later.");
    }

    return Promise.reject({ message, details, status });
  }
);

export default apiClient;
