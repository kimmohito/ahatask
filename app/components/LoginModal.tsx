"use client";

import React from "react";
import useUiStore from "@/lib/uiStore";
import LoginForm from "./LoginForm";
import { IconX } from "@tabler/icons-react";

export default function LoginModal() {
  const show = useUiStore((s) => s.showLoginModal);
  const setShow = useUiStore((s) => s.setShowLoginModal);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center" onClick={() => setShow(false)}>
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative w-[800px] h-[300px] shadow-2xl rounded-lg overflow-hidden bg-transparent flex" onClick={(e) => e.stopPropagation()}>
        <div className="w-1/2 h-full bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white p-6">
          <div className="space-y-3 text-center">
            <h2 className="text-2xl font-bold">AHA Task Manager</h2>
            <p className="text-sm opacity-90">Manage tasks, teams and sprints — fast and focused.</p>
          </div>
        </div>

        <div className="w-1/2 h-full dashboard-card p-6 flex flex-col justify-center">
          <div className="absolute right-3 top-3">
            <button onClick={() => setShow(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><IconX /></button>
          </div>
          <div className="max-w-[360px] w-full">
            <h3 className="text-lg font-semibold mb-2">Sign in to your account</h3>
            <LoginForm />
            <div className="mt-3 text-sm">
              <a href="/register" className="text-indigo-600 mr-2">Register</a>
              <a href="/forgot" className="text-gray-500">Forgot?</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
