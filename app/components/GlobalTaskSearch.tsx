"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconSearch } from "@tabler/icons-react";
import api from "@/lib/api";

type TaskSearchItem = {
    id?: number | string;
    slug?: string;
    task_slug?: string;
    title?: string;
    name?: string;
    assignee_name?: string;
    reporter_name?: string;
    project_name?: string;
    project_slug?: string;
    assignee?: { name?: string };
    reporter?: { name?: string };
    project?: { name?: string; slug?: string };
};

type GlobalTaskSearchProps = {
    isAuthenticated: boolean;
    userKey: string;
    onCreateTask: () => void;
};

const GlobalTaskSearch = ({ isAuthenticated, userKey, onCreateTask }: GlobalTaskSearchProps) => {
    const [query, setQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<TaskSearchItem[]>([]);
    const [recentByUser, setRecentByUser] = useState<Record<string, string[]>>({});
    const ref = useRef<HTMLDivElement | null>(null);
    const currentUserKey = (userKey || "anonymous").trim().toLowerCase();
    const recentSearches = recentByUser[currentUserKey] || [];

    const addRecentSearch = (value: string) => {
        const term = value.trim();
        if (!term || !currentUserKey) return;

        setRecentByUser((prev) => {
            const existing = prev[currentUserKey] || [];
            const deduped = [term, ...existing.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, 5);
            return { ...prev, [currentUserKey]: deduped };
        });
    };

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener("click", onDoc);
        return () => document.removeEventListener("click", onDoc);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            setSearchResults([]);
            return;
        }

        const q = query.trim();
        if (!q) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const params = {
                    q,
                    query: q,
                    search: q,
                    keyword: q,
                    per_page: 20,
                    sort_by: "updated_at",
                    sort_dir: "desc",
                    search_in: "title,slug,assignee_name,reporter_name,project_name,project_slug,description,priority,status",
                    search_fields: [
                        "title",
                        "slug",
                        "assignee_name",
                        "reporter_name",
                        "project_name",
                        "project_slug",
                        "description",
                        "priority",
                        "status",
                    ],
                };

                let res;
                try {
                    res = await api.get("/api/search", { params });
                } catch {
                    res = await api.get("/api/tasks", { params });
                }

                const list = res?.data?.data ?? res?.data ?? [];
                setSearchResults(Array.isArray(list) ? list : []);
                addRecentSearch(q);
            } catch {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, isAuthenticated]);

    return (
        <div className="flex-1 max-w-2xl mx-4" ref={ref}>
            <div className="relative">
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
                    <IconSearch size={16} className="text-gray-400" />
                    <input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSearchOpen(true);
                        }}
                        onFocus={() => setSearchOpen(true)}
                        placeholder="Search tasks, slug, assignee, reporter"
                        className="bg-transparent flex-1 ml-2 outline-none text-sm"
                    />
                    <button
                        onClick={onCreateTask}
                        aria-label="Create task"
                        className="ml-2 px-2 py-1 rounded bg-indigo-600 text-white text-sm"
                    >
                        + Task
                    </button>
                </div>

                {searchOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow max-h-56 overflow-auto z-50">
                        {recentSearches.length > 0 && (
                            <>
                                <div className="px-3 py-2 text-xs text-gray-500">Recent searches</div>
                                {recentSearches.map((term) => (
                                    <button
                                        key={term}
                                        type="button"
                                        onClick={() => {
                                            setQuery(term);
                                            setSearchOpen(true);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </>
                        )}

                        {searchLoading && <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>}
                        {!searchLoading && query.trim() && searchResults.length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">No results</div>
                        )}
                        {!searchLoading && searchResults.map((r) => {
                            const taskSlug = r.slug || r.task_slug || r.id;
                            const taskTitle = r.title || r.name || taskSlug;
                            const assigneeName = r.assignee_name || r.assignee?.name || "Unassigned";
                            const reporterName = r.reporter_name || r.reporter?.name || "";
                            const projectName = r.project?.name || r.project_name || "";
                            const projectSlug = r.project?.slug || r.project_slug || "";

                            return (
                                <Link
                                    key={String(r.id ?? taskSlug)}
                                    href={`/task/${taskSlug}`}
                                    className="block px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <div className="text-sm font-medium">{taskTitle}</div>
                                    <div className="text-xs text-gray-500">
                                        {assigneeName}
                                        {reporterName ? ` • ${reporterName}` : ""}
                                        {projectName || projectSlug ? ` • ${projectName || projectSlug}` : ""}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalTaskSearch;