"use client";

import React, { useEffect, useState, useRef } from "react";
import useUiStore from "@/lib/uiStore";
import useAuthStore from "@/lib/authStore";
import Link from "next/link";
import { IconMenu2, IconSearch } from "@tabler/icons-react"

const Topbar = () => {
    const pinned = useUiStore((s) => s.pinned);
    const setPinned = useUiStore((s) => s.setPinned);
    const setCollapsed = useUiStore((s) => s.setCollapsed);
    const setShowLoginModal = useUiStore((s) => s.setShowLoginModal);
    const getToken = useAuthStore((s) => s.getToken);
    const logout = useAuthStore((s) => s.logout);
    const [query, setQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [recent] = useState(() => [
        "fix login issue",
        "dashboard styling",
        "add user management",
        "API timeout bug",
        "improve search"
    ]);
    const demoData = [
        { slug: "task-1", name: "Fix login issue", assignee: "Alice", reporter: "Bob" },
        { slug: "dashboard-styles", name: "Dashboard styling", assignee: "Carol", reporter: "Alice" },
        { slug: "user-mgmt", name: "Add user management", assignee: "Bob", reporter: "Carol" },
        { slug: "api-timeout", name: "API timeout bug", assignee: "Eve", reporter: "Mallory" },
        { slug: "search-improve", name: "Improve search", assignee: "Alice", reporter: "Bob" },
        { slug: "other-1", name: "Other task 1", assignee: "Zed", reporter: "Yana" },
        { slug: "other-2", name: "Other task 2", assignee: "Zed", reporter: "Yana" },
    ];

    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setSearchOpen(false);
        };
        document.addEventListener("click", onDoc);
        return () => document.removeEventListener("click", onDoc);
    }, []);

    const token = typeof window !== "undefined" ? getToken() : null;
    let userName = "";
    try {
        if (token) {
            const parts = token.split('.');
            if (parts.length > 1) {
                const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                userName = payload?.name || payload?.username || "User";
            }
        }
    } catch (e) { }

    const results = demoData.filter(d => {
        if (!query) return true;
        const q = query.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.slug.toLowerCase().includes(q) || d.assignee.toLowerCase().includes(q) || d.reporter.toLowerCase().includes(q);
    });

    return (
        <div className="w-full h-16 flex items-center justify-between px-4 border-b border-gray-300">
            <div className="flex items-center gap-3">
                <button
                    aria-label="Toggle sidebar"
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => { setPinned(!pinned); setCollapsed(false); }}
                >
                    <IconMenu2 size={18} />
                </button>
                <div className="font-semibold">AHA Task Manager</div>
            </div>

            <div className="flex-1 max-w-2xl mx-4" ref={ref}>
                <div className="relative">
                    <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
                        <IconSearch size={16} className="text-gray-400" />
                        <input
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                            onFocus={() => setSearchOpen(true)}
                            placeholder="Search tasks, slug, assignee, reporter"
                            className="bg-transparent flex-1 ml-2 outline-none text-sm"
                        />
                    </div>

                    {searchOpen && (
                        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow max-h-56 overflow-auto z-50">
                            <div className="p-2 text-xs text-gray-500">Recent</div>
                            {recent.slice(0,5).map((r, i) => (
                                <div key={i} className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm">{r}</div>
                            ))}
                            <div className="p-2 text-xs text-gray-500">Results</div>
                            {results.map((r, i) => (
                                <Link key={r.slug} href={`/tasks/${r.slug}`} className="block px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <div className="text-sm font-medium">{r.name}</div>
                                    <div className="text-xs text-gray-500">{r.assignee} • {r.reporter}</div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div>
                {token ? (
                    <div className="relative inline-block">
                        <button onClick={() => setProfileOpen((s) => !s)} className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">{userName ? userName[0].toUpperCase() : "U"}</div>
                        </button>
                        {profileOpen && (
                            <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow z-50">
                                <button onClick={() => { logout(); setProfileOpen(false); }} className="block px-4 py-2 text-sm">Logout</button>
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