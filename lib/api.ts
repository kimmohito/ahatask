import axios from "axios";
import useAuthStore from "./authStore";

const api = axios.create({
    baseURL: "https://ahatask-api.test",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// if we get a 401, assume token expired / invalid -> clear auth
api.interceptors.response.use(
    (res) => res,
    (error) => {
        try {
            if (error?.response?.status === 401) {
                useAuthStore.getState().logout();
            }
        } catch (e) {}

        return Promise.reject(error);
    }
);

export default api;