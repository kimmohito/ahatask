"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import useAuthStore from "@/lib/authStore";
import { useParams } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import Link from "next/link";
import {
    IconLayoutKanban,
    IconList,
    IconTable,
    IconArrowsSort,
    IconSortAscending,
    IconSortDescending,
} from "@tabler/icons-react";

type Task = {
    id: string | number;
    slug?: string;
    task_slug?: string;
    title: string;
    status?: string;
    priority?: string;
};

export default function TasksProjectPageAlias() {
    const params = useParams() as { org?: string; project?: string };
    const org = params?.org;
    const project = params?.project;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<"board" | "table" | "list">("table");
    const [perPage, setPerPage] = useState(10);
    const [sortBy, setSortBy] = useState<"title" | "status" | "priority">("title");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [localSequence, setLocalSequence] = useState<string[] | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        status: "",
        priority: "",
        assignee_id: "",
        from: "",
        to: "",
    });

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const [statuses, setStatuses] = useState<string[]>([]);

    useEffect(() => {
        // initialise auth from localStorage on mount
        useAuthStore.getState().syncFromStorage();
    }, []);

    const toTaskKey = (task: Task): string => String(task.slug || task.task_slug || task.id);

    const orderedTasks = useMemo(() => {
        if (!localSequence || localSequence.length === 0) return tasks;

        const map = new Map(tasks.map((task) => [toTaskKey(task), task]));
        const ordered: Task[] = [];

        localSequence.forEach((key) => {
            const found = map.get(key);
            if (found) {
                ordered.push(found);
                map.delete(key);
            }
        });

        map.forEach((task) => ordered.push(task));
        return ordered;
    }, [tasks, localSequence]);

    const fetchTasks = async () => {
        if (!org || !project) return;
        setLoading(true);

        try {
            const res = await api.get("/api/tasks", {
                params: {
                    org,
                    project,
                    ...filters,
                    per_page: perPage,
                    sort_by: sortBy,
                    sort_dir: sortDir,
                    order_by: sortBy,
                    order_dir: sortDir,
                    direction: sortDir,
                },
            });

            setTasks(res?.data?.data ?? []);
            setLocalSequence(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(!isAuthenticated){
            setTasks([]);
            return;
        } else {
            const timer = setTimeout(async () => {
                await fetchTasks();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, filters, perPage, sortBy, sortDir, org, project]);

    // load statuses from API if available, else derive from tasks or fallback defaults
    useEffect(() => {
        const loadStatuses = async () => {
            let list: string[] = [];
            try {
                const res = await api.get("/api/statuses", { params: { org, project } });
                if (res?.data) {
                    if (Array.isArray(res.data)) {
                        list = res.data.map((s: any) => (typeof s === "string" ? s : s.name));
                    }
                }
            } catch (e) {
                // ignore
            }

            if (list.length === 0) {
                const derived = Array.from(new Set(tasks.map((t: Task) => t.status))).filter(Boolean) as string[];
                if (derived.length) list = derived;
            }

            if (list.length === 0) {
                list = ["todo", "grooming", "in progress", "done"];
            }

            setStatuses(list);
        };

        loadStatuses();
    }, [tasks, org, project]);

    const moveItemTemporarily = (targetId: string) => {
        if (!draggingId || draggingId === targetId) return;

        const current = orderedTasks.map((task) => toTaskKey(task));
        const fromIndex = current.indexOf(draggingId);
        const toIndex = current.indexOf(targetId);
        if (fromIndex === -1 || toIndex === -1) return;

        const next = [...current];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        setLocalSequence(next);
    };

    const toggleSort = (field: "title" | "status" | "priority") => {
        setLocalSequence(null);
        if (sortBy === field) {
            setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setSortDir("asc");
        }
    };

    const sortIcon = (field: "title" | "status" | "priority") => {
        if (sortBy !== field) return <IconArrowsSort size={14} className="text-gray-400" />;
        if (sortDir === "asc") return <IconSortAscending size={14} className="text-indigo-500" />;
        return <IconSortDescending size={14} className="text-indigo-500" />;
    };

    if (!org || !project) return <div>Please select a project URL: /{`{org}`}/{`{project}`}/tasks</div>;
    if (loading) return <div>Loading tasks...</div>;

    return (
        <AppShell>
            <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 md:p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 dark:text-gray-400">Items per page</label>
                            <select
                                onChange={(e) => setPerPage(Number(e.target.value))}
                                value={perPage}
                                className="h-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm"
                            >
                                {[5, 10, 20, 50, 100].map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                            {localSequence && (
                                <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-1 text-xs">
                                    Manual sequence active
                                </span>
                            )}
                        </div>

                        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden self-start md:self-auto">
                            <button
                                onClick={() => setView("board")}
                                className={`h-9 px-3 text-sm flex items-center gap-1.5 ${view === "board" ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"}`}
                            >
                                <IconLayoutKanban size={16} /> Board
                            </button>
                            <button
                                onClick={() => setView("table")}
                                className={`h-9 px-3 text-sm flex items-center gap-1.5 border-l border-gray-300 dark:border-gray-700 ${view === "table" ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"}`}
                            >
                                <IconTable size={16} /> Table
                            </button>
                            <button
                                onClick={() => setView("list")}
                                className={`h-9 px-3 text-sm flex items-center gap-1.5 border-l border-gray-300 dark:border-gray-700 ${view === "list" ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"}`}
                            >
                                <IconList size={16} /> List
                            </button>
                        </div>
                    </div>
                </div>

                {view === "board" && (
                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(statuses.length, 1)}, minmax(220px, 1fr))` }}>
                        {statuses.length === 0 && <div>No status columns available</div>}
                        {statuses.map((status) => (
                            <div key={status} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 p-3">
                                <h3 className="font-semibold capitalize text-sm text-gray-700 dark:text-gray-300">{status}</h3>
                                <div className="mt-2 space-y-2">
                                    {(orderedTasks.filter((t) => t.status === status) || []).map((task) => {
                                        const taskSlug = task.slug || task.task_slug || task.id;
                                        const taskId = toTaskKey(task);
                                        return (
                                            <div
                                                key={task.id}
                                                draggable
                                                onDragStart={() => setDraggingId(taskId)}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={() => moveItemTemporarily(taskId)}
                                                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm cursor-grab"
                                            >
                                                <Link href={`/task/${taskSlug}`} className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:underline">
                                                    {task.title}
                                                </Link>
                                                <div className="text-xs text-gray-500 mt-1">{task.priority || "-"}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {view === "table" && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/70">
                                <tr>
                                    <th className="text-left px-4 py-3">
                                        <button onClick={() => toggleSort("title")} className="inline-flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
                                            Title {sortIcon("title")}
                                        </button>
                                    </th>
                                    <th className="text-left px-4 py-3">
                                        <button onClick={() => toggleSort("status")} className="inline-flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
                                            Status {sortIcon("status")}
                                        </button>
                                    </th>
                                    <th className="text-left px-4 py-3">
                                        <button onClick={() => toggleSort("priority")} className="inline-flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
                                            Priority {sortIcon("priority")}
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderedTasks.map((task) => {
                                    const taskSlug = task.slug || task.task_slug || task.id;
                                    const taskId = toTaskKey(task);
                                    return (
                                        <tr
                                            key={task.id}
                                            draggable
                                            onDragStart={() => setDraggingId(taskId)}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={() => moveItemTemporarily(taskId)}
                                            className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-grab"
                                        >
                                            <td className="px-4 py-3">
                                                <Link href={`/task/${taskSlug}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">
                                                    {task.title}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{task.status || "-"}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{task.priority || "-"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {view === "list" && (
                    <ul className="space-y-2">
                        {orderedTasks.map((task) => {
                            const taskSlug = task.slug || task.task_slug || task.id;
                            const taskId = toTaskKey(task);
                            return (
                                <li
                                    key={task.id}
                                    draggable
                                    onDragStart={() => setDraggingId(taskId)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => moveItemTemporarily(taskId)}
                                    className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between gap-3 cursor-grab"
                                >
                                    <Link href={`/task/${taskSlug}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">
                                        {task.title}
                                    </Link>
                                    <div className="text-xs text-gray-500">{task.status || "-"}</div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </AppShell>
    )
}
