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
    assignee_id?: string | number;
    assignee_name?: string;
    assignee?: { id?: string | number; name?: string } | string;
};

type BoardGroupBy = "status" | "priority" | "assignee";

type UserOption = {
    id: string | number;
    name: string;
};

type BoardColumn = {
    key: string;
    label: string;
};

type PaginationMeta = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
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
    const [boardGroupBy, setBoardGroupBy] = useState<BoardGroupBy>("status");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationMeta>({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
    });
    const [localSequence, setLocalSequence] = useState<string[] | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [localBoardUpdates, setLocalBoardUpdates] = useState<Record<string, Partial<Task>>>({});

    const [filters, setFilters] = useState({
        status: "",
        priority: "",
        assignee_id: "",
        from: "",
        to: "",
    });

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const [statuses, setStatuses] = useState<string[]>([]);
    const [priorities, setPriorities] = useState<string[]>([]);
    const [assignees, setAssignees] = useState<UserOption[]>([]);

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

    const getAssigneeLabel = (task: Task): string => {
        if (task.assignee_name) return task.assignee_name;
        if (typeof task.assignee === "string" && task.assignee) return task.assignee;
        if (typeof task.assignee === "object" && task.assignee?.name) return task.assignee.name;
        return "unassigned";
    };

    const boardTasks = useMemo(() => {
        return orderedTasks.map((task) => {
            const key = toTaskKey(task);
            const local = localBoardUpdates[key] || {};
            return { ...task, ...local };
        });
    }, [orderedTasks, localBoardUpdates]);

    const taskByKey = useMemo(() => {
        return new Map(boardTasks.map((task) => [toTaskKey(task), task]));
    }, [boardTasks]);

    const boardColumns = useMemo<BoardColumn[]>(() => {
        if (boardGroupBy === "status") {
            const cols = statuses.length > 0 ? statuses : ["todo", "grooming", "in progress", "done"];
            return cols.map((s) => ({ key: s, label: s }));
        }

        if (boardGroupBy === "priority") {
            const vals = priorities.length > 0
                ? priorities
                : Array.from(new Set(boardTasks.map((t) => (t.priority || "").trim()).filter(Boolean)));
            const cols = vals.length > 0 ? vals : ["low", "normal", "high", "urgent"];
            return cols.map((p) => ({ key: p, label: p }));
        }

        const cols = assignees.map((u) => ({ key: String(u.id), label: u.name }));
        return [{ key: "unassigned", label: "Unassigned" }, ...cols];
    }, [boardGroupBy, boardTasks, statuses, priorities, assignees]);

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
                    page: currentPage,
                    current_page: currentPage,
                    sort_by: sortBy,
                    sort_dir: sortDir,
                    order_by: sortBy,
                    order_dir: sortDir,
                    direction: sortDir,
                },
            });

            setTasks(res?.data?.data ?? []);
            const meta = res?.data?.meta || res?.data?.pagination || {};
            const totalPagesFromMeta = Number(meta?.last_page || meta?.total_pages || 1);
            const currentFromMeta = Number(meta?.current_page || currentPage || 1);
            const totalFromMeta = Number(meta?.total || res?.data?.total || 0);
            setPagination({
                currentPage: Number.isFinite(currentFromMeta) ? currentFromMeta : currentPage,
                totalPages: Number.isFinite(totalPagesFromMeta) ? Math.max(totalPagesFromMeta, 1) : 1,
                totalItems: Number.isFinite(totalFromMeta) ? totalFromMeta : 0,
            });
            setLocalSequence(null);
            setLocalBoardUpdates({});
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
    }, [isAuthenticated, filters, perPage, currentPage, sortBy, sortDir, org, project]);

    useEffect(() => {
        setCurrentPage(1);
    }, [perPage, filters.status, filters.priority, filters.assignee_id, filters.from, filters.to, org, project]);

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

    useEffect(() => {
        const loadPriorities = async () => {
            try {
                const res = await api.get("/api/priorities", { params: { org, project } });
                const src = res?.data?.data ?? res?.data ?? [];
                if (Array.isArray(src) && src.length > 0) {
                    const list = src
                        .map((p: any) => (typeof p === "string" ? p : p?.name || p?.value || p?.key))
                        .filter(Boolean);
                    if (list.length > 0) {
                        setPriorities(list);
                        return;
                    }
                }
            } catch (e) {
                // ignore, fallback below
            }

            const derived = Array.from(new Set(tasks.map((t: Task) => t.priority).filter(Boolean))) as string[];
            setPriorities(derived.length > 0 ? derived : ["low", "normal", "high", "urgent"]);
        };

        loadPriorities();
    }, [tasks, org, project]);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const res = await api.get("/api/users", { params: { org, project } });
                const src = res?.data?.data ?? res?.data ?? [];
                if (!Array.isArray(src)) {
                    setAssignees([]);
                    return;
                }
                const list = src
                    .map((u: any) => ({
                        id: u?.id,
                        name: u?.name || u?.username || u?.email || String(u?.id || "User"),
                    }))
                    .filter((u: UserOption) => u.id !== undefined && u.id !== null);
                setAssignees(list);
            } catch (e) {
                setAssignees([]);
            }
        };

        loadUsers();
    }, [org, project]);

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

    const getTaskGroupValue = (task: Task): string => {
        if (boardGroupBy === "status") return task.status || "unassigned";
        if (boardGroupBy === "priority") return task.priority || "unassigned";
        if (task.assignee_id !== undefined && task.assignee_id !== null && String(task.assignee_id).length > 0) {
            return String(task.assignee_id);
        }
        if (typeof task.assignee === "object" && task.assignee?.id !== undefined && task.assignee?.id !== null) {
            return String(task.assignee.id);
        }
        return "unassigned";
    };

    const persistTaskUpdate = async (task: Task, patch: Record<string, any>) => {
        const taskId = task.id;
        const taskSlug = task.slug || task.task_slug;
        const candidates: Array<() => Promise<any>> = [];

        if (taskId !== undefined && taskId !== null) {
            candidates.push(() => api.patch(`/api/tasks/${taskId}`, patch));
            candidates.push(() => api.put(`/api/tasks/${taskId}`, patch));
        }

        if (taskSlug) {
            candidates.push(() => api.patch(`/api/tasks/${taskSlug}`, patch));
            candidates.push(() => api.put(`/api/tasks/${taskSlug}`, patch));
        }

        let lastError: unknown = null;
        for (const call of candidates) {
            try {
                await call();
                return;
            } catch (err) {
                lastError = err;
            }
        }

        throw lastError || new Error("Unable to update task");
    };

    const moveTaskAcrossBoardGroup = async (taskKey: string, targetColumn: string) => {
        const task = taskByKey.get(taskKey);
        if (!task) return;

        const prevLocal = localBoardUpdates[taskKey] || {};

        let localPatch: Partial<Task> = {};
        let apiPatch: Record<string, any> = {};

        if (boardGroupBy === "status") {
            localPatch = { status: targetColumn };
            apiPatch = { status: targetColumn };
        } else if (boardGroupBy === "priority") {
            localPatch = { priority: targetColumn };
            apiPatch = { priority: targetColumn };
        } else {
            if (targetColumn === "unassigned") {
                localPatch = { assignee_id: "", assignee_name: "Unassigned" };
                apiPatch = { assignee: null, assignee_id: null };
            } else {
                const targetUser = assignees.find((u) => String(u.id) === String(targetColumn));
                localPatch = {
                    assignee_id: targetColumn,
                    assignee_name: targetUser?.name || "User",
                };
                apiPatch = { assignee: targetColumn, assignee_id: targetColumn };
            }
        }

        setLocalBoardUpdates((prev) => ({
            ...prev,
            [taskKey]: { ...(prev[taskKey] || {}), ...localPatch },
        }));

        try {
            await persistTaskUpdate(task, apiPatch);
        } catch (e) {
            setLocalBoardUpdates((prev) => ({
                ...prev,
                [taskKey]: prevLocal,
            }));
            await fetchTasks();
        }
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
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
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
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
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
                    <div className="space-y-3">
                        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
                            <button
                                onClick={() => setBoardGroupBy("status")}
                                className={`h-9 px-3 text-sm ${boardGroupBy === "status" ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"}`}
                            >
                                Status
                            </button>
                            <button
                                onClick={() => setBoardGroupBy("priority")}
                                className={`h-9 px-3 text-sm border-l border-gray-300 dark:border-gray-700 ${boardGroupBy === "priority" ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"}`}
                            >
                                Priority
                            </button>
                            <button
                                onClick={() => setBoardGroupBy("assignee")}
                                className={`h-9 px-3 text-sm border-l border-gray-300 dark:border-gray-700 ${boardGroupBy === "assignee" ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"}`}
                            >
                                Assignee
                            </button>
                        </div>

                        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(boardColumns.length, 1)}, minmax(220px, 1fr))` }}>
                            {boardColumns.length === 0 && <div>No columns available</div>}
                            {boardColumns.map((column) => (
                            <div
                                key={column.key}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={async () => {
                                    if (!draggingId) return;
                                    await moveTaskAcrossBoardGroup(draggingId, column.key);
                                }}
                                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 p-3 min-h-40"
                            >
                                <h3 className="font-semibold capitalize text-sm text-gray-700 dark:text-gray-300">{column.label}</h3>
                                <div className="mt-2 space-y-2">
                                    {(boardTasks.filter((t) => getTaskGroupValue(t) === column.key) || []).map((task) => {
                                        const taskSlug = task.slug || task.task_slug || task.id;
                                        const taskId = toTaskKey(task);
                                        return (
                                            <div
                                                key={task.id}
                                                draggable
                                                onDragStart={() => setDraggingId(taskId)}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={() => moveItemTemporarily(taskId)}
                                                onDragEnd={() => setDraggingId(null)}
                                                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm cursor-grab"
                                            >
                                                <Link href={`/task/${taskSlug}`} className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:underline">
                                                    {task.title}
                                                </Link>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {boardGroupBy === "status" ? (task.priority || "-") : (task.status || "-")}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        </div>
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

                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {pagination.totalItems > 0
                            ? `Showing page ${pagination.currentPage} / ${pagination.totalPages} (${pagination.totalItems} total items)`
                            : `Showing page ${pagination.currentPage} / ${pagination.totalPages}`}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1 || loading}
                            className="h-9 px-3 rounded-md border border-gray-300 dark:border-gray-700 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm min-w-20 text-center text-gray-700 dark:text-gray-300">{currentPage}</span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                            disabled={currentPage >= pagination.totalPages || loading}
                            className="h-9 px-3 rounded-md border border-gray-300 dark:border-gray-700 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </AppShell>
    )
}
