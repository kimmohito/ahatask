"use client";

import api from "@/lib/api";
import { useState } from "react";
import useAuthStore from "@/lib/authStore";
import { useRouter } from "next/navigation";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const setToken = useAuthStore((s) => s.setToken);
    const router = useRouter();

    const login = async () => {
        const res = await api.post("/api/login", {
            email,
            password,
        });

        setToken(res.data.token);
        alert("Logged in!");
        router.push("/");
    };

    return (
        <div>
            <input onChange={(e) => setEmail(e.target.value)} placeholder="email" />
            <input onChange={(e) => setPassword(e.target.value)} placeholder="password" />
            <button onClick={login}>Login</button>
        </div>
    );
}