"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import useAuthStore from "@/lib/authStore";
import { useRouter } from "next/navigation";
import useUiStore from "@/lib/uiStore";

export default function LoginForm({ compact }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setToken = useAuthStore((s) => s.setToken);
  const router = useRouter();
  const setShowLoginModal = useUiStore((s) => s.setShowLoginModal);

  const login = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/api/login", { email, password });
      setToken(res.data.token);
      setShowLoginModal(false);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? "" : "w-full"}>
      {error ? <div className="text-sm text-red-600 mb-2">{error}</div> : null}

      <label className="block text-sm text-[color:var(--muted)]">Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded mt-1 mb-3" />

      <label className="block text-sm text-[color:var(--muted)]">Password</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded mt-1 mb-3" />

      <div className="flex items-center justify-between">
        <button onClick={login} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </div>
  );
}
