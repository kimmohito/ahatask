"use client";

import React, { useState } from "react";
import useUiStore from "@/lib/uiStore";
import useAuthStore from "@/lib/authStore";
import { useRouter } from "next/navigation";
import { IconMenu2 } from "@tabler/icons-react";
import GlobalTaskSearch from "@/app/components/GlobalTaskSearch";

const Topbar = () => {
    const router = useRouter();
    const { isAuthenticated, username, token } = useAuthStore();
    const collapsed = useUiStore((s) => s.collapsed);
    const setCollapsed = useUiStore((s) => s.setCollapsed);
    const setShowLoginModal = useUiStore((s) => s.setShowLoginModal);
    const logout = useAuthStore((s) => s.logout);
    const [profileOpen, setProfileOpen] = useState(false);
    const setShowCreateTaskModal = useUiStore((s) => s.setShowCreateTaskModal);

    return (
        <div className="sticky top-0 z-50 w-full h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-background">
            <div className="flex items-center gap-3">
                <button
                    aria-label="Toggle sidebar"
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => { setCollapsed(!collapsed); }}
                >
                    <IconMenu2 size={18} />
                </button>
                <div className="font-semibold">AHA Task Manager</div>
            </div>

            <GlobalTaskSearch
                isAuthenticated={isAuthenticated}
                userKey={username || token || "user"}
                onCreateTask={() => setShowCreateTaskModal(true)}
            />

            <div>
                {isAuthenticated ? (
                    <div className="relative inline-block">
                        <button onClick={() => setProfileOpen((s) => !s)} className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">{username ? username[0].toUpperCase() : "U"}</div>
                        </button>
                        {profileOpen && (
                            <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow z-50">
                                <button
                                    onClick={() => {
                                        logout();
                                        setProfileOpen(false);
                                        router.replace("/login");
                                    }}
                                    className="block px-4 py-2 text-sm"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button onClick={() => setShowLoginModal(true)} className="px-3 py-1 rounded bg-blue-600 text-white">Login</button>
                )}
            </div>
        </div>
    );
}

export default Topbar;