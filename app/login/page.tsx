"use client";

import api from "@/lib/api";
import { useState } from "react";
import useAuthStore from "@/lib/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconX } from "@tabler/icons-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const setToken = useAuthStore((s) => s.setToken);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = async () => {
        setError(null);
        setLoading(true);
        try {
            const res = await api.post("/api/login", { email, password });
            setToken(res.data.token);
            router.push("/dashboard");
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) router.push('/'); }}>
            <div className="relative w-[800px] h-[300px] shadow-2xl rounded-lg overflow-hidden bg-transparent flex" onClick={(e) => e.stopPropagation()}>
                {/* Left: image / branding */}
                <div className="w-1/2 h-full bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white p-6">
                    <div className="space-y-3 text-center">
                        <h2 className="text-2xl font-bold">AHA Task Manager</h2>
                        <p className="text-sm opacity-90">Manage tasks, teams and sprints — fast and focused.</p>
                    </div>
                </div>

                {/* Right: form */}
                <div className="w-1/2 h-full dashboard-card p-6 flex flex-col justify-center">
                    <div className="absolute right-3 top-3">
                        <button onClick={() => router.push('/')} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><IconX /></button>
                    </div>
                    <div className="max-w-[360px] w-full">
                        <h3 className="text-lg font-semibold mb-2">Sign in to your account</h3>
                        {error ? <div className="text-sm text-red-600 mb-2">{error}</div> : null}

                        <label className="block text-sm text-[color:var(--muted)]">Email</label>
                        <input aria-label="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded mt-1 mb-3" />

                        <label className="block text-sm text-[color:var(--muted)]">Password</label>
                        <input aria-label="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded mt-1 mb-3" />

                        <div className="flex items-center justify-between mb-4">
                            <button onClick={login} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">
                                {loading ? "Signing in..." : "Sign in"}
                            </button>
                            <div className="text-sm">
                                <Link href="/register" className="text-indigo-600">Register</Link>
                                <span className="mx-2">|</span>
                                <Link href="/forgot" className="text-gray-500">Forgot?</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}