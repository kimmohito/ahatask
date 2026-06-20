import axios from "axios";
import useAuthStore from "./authStore";

const baseURL = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_BASE || "") : "";

const api = axios.create({
    baseURL,
    timeout: 10000, // fail fast if backend is unreachable
});

api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers = config.headers || {};
                (config.headers as any).Authorization = `Bearer ${token}`;
            }
        } catch (e) {
            // ignore storage errors
        }
    }

    return config;
});

// if we get a 401 on the client, assume token expired / invalid -> clear auth
api.interceptors.response.use(
    (res) => res,
    (error) => {
        try {
            if (typeof window !== "undefined" && error?.response?.status === 401) {
                useAuthStore.getState().logout();
            }
        } catch (e) {}

        return Promise.reject(error);
    }
);

export default api;