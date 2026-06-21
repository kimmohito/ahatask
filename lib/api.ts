import axios from "axios";
import useAuthStore from "./authStore";

const baseURL = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_BASE || "") : "";

function isJwtExpired(token: string): boolean {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return false;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (!payload?.exp) return false;
        return Number(payload.exp) <= Date.now() / 1000;
    } catch {
        return false;
    }
}

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

// On 401, clear auth only when the local JWT is already expired.
// This avoids logging users out because of endpoint-level permission mismatches.
api.interceptors.response.use(
    (res) => res,
    (error) => {
        try {
            if (typeof window !== "undefined" && error?.response?.status === 401) {
                const token = localStorage.getItem("token");
                if (token && isJwtExpired(token)) {
                    useAuthStore.getState().logout();
                }
            }
        } catch (e) {}

        return Promise.reject(error);
    }
);

export default api;