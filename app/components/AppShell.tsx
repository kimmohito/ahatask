"use client";

import React from "react";
import Topbar from "../layout/Topbar";
import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide shell (Topbar/Sidebar) on exact /login route
  const hideShell = pathname === "/login" || pathname?.startsWith("/login/");

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <div>
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        {children}
      </div>
    </div>
  );
}
