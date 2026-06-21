"use client";

import React, { useEffect } from "react";
import Topbar from "../layout/Topbar";
import Sidebar from "./Sidebar";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import useAuthStore from "@/lib/authStore";
const LoginModal = dynamic(() => import("./LoginModal"), { ssr: false });
const CreateTaskModal = dynamic(() => import("./CreateTaskModal"), { ssr: false });

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const syncFromStorage = useAuthStore((s) => s.syncFromStorage);
  const getUsername = useAuthStore((s) => s.getUsername);

  useEffect(() => {
    syncFromStorage();
    getUsername();
  }, [syncFromStorage, getUsername]);

  // Hide shell (Topbar/Sidebar) on exact /login route
  const hideShell = pathname === "/login" || pathname?.startsWith("/login/");

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <>
      <Topbar />
      <main className="flex flex-1">
          <Sidebar />
          <div className="flex-1 w-full min-w-0">
            {children}
          </div>
      </main>
      <LoginModal />
      <CreateTaskModal />
    </>
  );
}
