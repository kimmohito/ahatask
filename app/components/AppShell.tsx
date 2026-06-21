"use client";

import React from "react";
import Topbar from "../layout/Topbar";
import Sidebar from "./Sidebar";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
const LoginModal = dynamic(() => import("./LoginModal"), { ssr: false });
const CreateTaskModal = dynamic(() => import("./CreateTaskModal"), { ssr: false });

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide shell (Topbar/Sidebar) on exact /login route
  const hideShell = pathname === "/login" || pathname?.startsWith("/login/");

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <>
      <Topbar />
      <main style={{ flex: 1, padding: 16 }}>
        <div className="flex flex-1">
          <Sidebar />
          {children}
        </div>
        <LoginModal />
      </main>
      <CreateTaskModal />
    </>
  );
}
