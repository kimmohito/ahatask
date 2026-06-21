import { create } from "zustand";

type AuthState = {
    isAuthenticated: boolean;
    token: string | null;
    setToken: (token: string) => void;
    username: string;
    getUsername: () => void;
    logout: () => void;
    checkToken: () => boolean;
    syncFromStorage: () => void;
    getToken: () => string | null;
};

function decodePayload(token: string) {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    try {
        const json = atob(payload);
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

const useAuthStore = create<AuthState>((set, get) => ({
    isAuthenticated: false,
    token: null,
    setToken: (token: string) => {
        try {
            localStorage.setItem("token", token);
        } catch (e) { }
        set({ token, isAuthenticated: true });
    },
    username: "",
    getUsername: () => {
        const token = get().token;
        if (!token) return null;
        const payload = decodePayload(token);
        set({ username: payload?.name || payload?.username || "User" });
    },
    logout: () => {
        try {
            localStorage.removeItem("token");
        } catch (e) { }

        set({ token: null, isAuthenticated: false });
    },
    checkToken: () => {
        const token = get().token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
        if (!token) {
            get().logout();
            return false;
        }

        const payload = decodePayload(token);
        if (!payload || !payload.exp) {
            get().logout();
            return false;
        }

        const valid = payload.exp > Date.now() / 1000;
        if (!valid) {
            get().logout();
        } else {
            set({ token, isAuthenticated: true });
        }

        return valid;
    },
    syncFromStorage: () => {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("token");
        if (!token) return get().logout();
        set({ token });
        get().checkToken();
    },
    getToken: () => get().token || (typeof window !== "undefined" ? localStorage.getItem("token") : null),
}));

export default useAuthStore;
