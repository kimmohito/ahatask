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
    IconSearch,
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

type UserOption = {
    id: string | number;
    name: string;
    role?: string;
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
    const [projectSearchInput, setProjectSearchInput] = useState("");
    const [projectSearchQuery, setProjectSearchQuery] = useState("");
    const [perPage, setPerPage] = useState(10);
    const [sortBy, setSortBy] = useState<"title" | "status" | "priority">("title");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
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
    const getToken = useAuthStore((s) => s.getToken);
    const [statuses, setStatuses] = useState<string[]>([]);
    const [priorities, setPriorities] = useState<string[]>([]);
    const [assignees, setAssignees] = useState<UserOption[]>([]);
    const [usersLoaded, setUsersLoaded] = useState(false);
    const [orgName, setOrgName] = useState("");

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
        const roleLike = new Set(["super admin", "admin", "member user", "member"]);

        // Prefer resolved user list by assignee_id to ensure we show actual user name.
        if (task.assignee_id !== undefined && task.assignee_id !== null) {
            const found = assignees.find((u) => String(u.id) === String(task.assignee_id));
            if (found?.name) return found.name;
        }

        if (typeof task.assignee === "object" && task.assignee?.name) {
            const candidate = String(task.assignee.name).trim();
            if (candidate && !roleLike.has(candidate.toLowerCase())) return candidate;
        }

        if (typeof task.assignee === "string" && task.assignee) {
            const candidate = String(task.assignee).trim();
            if (candidate && !roleLike.has(candidate.toLowerCase())) return candidate;
        }

        if (task.assignee_name) {
            const candidate = String(task.assignee_name).trim();
            if (candidate && !roleLike.has(candidate.toLowerCase())) return candidate;
        }

        return "Unassigned";
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

    const currentAuth = useMemo(() => {
        const token = getToken();
        if (!token) return { userId: null as string | null, isAdmin: false };
        try {
            const parts = token.split(".");
            if (parts.length < 2) return { userId: null as string | null, isAdmin: false };
            const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
            const userId = payload?.id ?? payload?.user_id ?? payload?.sub ?? null;
            const isAdmin =
                !!payload?.is_admin ||
                payload?.role === "admin" ||
                (Array.isArray(payload?.roles) && payload.roles.includes("admin"));
            return { userId: userId !== null && userId !== undefined ? String(userId) : null, isAdmin };
        } catch {
            return { userId: null as string | null, isAdmin: false };
        }
    }, [getToken, isAuthenticated]);

    const currentUserInProject = useMemo(() => {
        if (currentAuth.isAdmin) return true;
        if (!currentAuth.userId) return false;
        return assignees.some((u) => String(u.id) === currentAuth.userId);
    }, [assignees, currentAuth]);

    const assignableUserIds = useMemo(() => {
        return new Set(assignees.map((u) => String(u.id)));
    }, [assignees]);

    const boardColumns = useMemo<BoardColumn[]>(() => {
        const cols = statuses.length > 0 ? statuses : ["todo", "grooming", "in progress", "done"];
        return cols.map((s) => ({ key: s, label: s }));
    }, [statuses]);

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
                    q: projectSearchQuery,
                    query: projectSearchQuery,
                    search: projectSearchQuery,
                    keyword: projectSearchQuery,
                    scope: "project",
                    search_scope: "project",
                    include_all_projects: false,
                    priority_in: selectedPriorities.length ? selectedPriorities.join(",") : undefined,
                    assignee_in: selectedAssignees.length ? selectedAssignees.join(",") : undefined,
                    priorities: selectedPriorities.length ? selectedPriorities : undefined,
                    assignees: selectedAssignees.length ? selectedAssignees : undefined,
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
    }, [isAuthenticated, filters, perPage, currentPage, projectSearchQuery, selectedPriorities, selectedAssignees, sortBy, sortDir, org, project]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setProjectSearchQuery(projectSearchInput.trim());
        }, 300);
        return () => clearTimeout(timer);
    }, [projectSearchInput]);

    useEffect(() => {
        setCurrentPage(1);
    }, [perPage, projectSearchQuery, selectedPriorities, selectedAssignees, filters.status, filters.priority, filters.assignee_id, filters.from, filters.to, org, project]);

    // load statuses from API if available, else derive from tasks or fallback defaults
    useEffect(() => {
        const loadStatuses = async () => {
            let list: string[] = [];
            try {
                const res = await api.get("/api/statuses", { params: { org, project } });
                const src = res?.data?.data ?? res?.data ?? [];
                if (Array.isArray(src)) {
                    list = src
                        .map((s: any) => (typeof s === "string" ? s : s?.name || s?.value || s?.key))
                        .filter(Boolean);
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
            setUsersLoaded(false);
            try {
                const res = await api.get("/api/users", {
                    params: {
                        org,
                        project,
                        scope: "project",
                        search_scope: "project",
                        only_assignable: true,
                    },
                });
                const src = res?.data?.data ?? res?.data ?? [];
                if (!Array.isArray(src)) {
                    setAssignees([]);
                    return;
                }
                const roleLike = new Set(["super admin", "admin", "member user", "member"]);
                const list = src
                    .map((u: any) => ({
                        id: u?.id,
                        name: u?.name || u?.username || u?.email || String(u?.id || "User"),
                        role:
                            u?.role ||
                            (Array.isArray(u?.roles) ? u.roles[0] : undefined) ||
                            u?.membership_role ||
                            u?.pivot?.role ||
                            "member",
                    }))
                    .filter((u: UserOption) => u.id !== undefined && u.id !== null)
                    .filter((u: UserOption) => !roleLike.has(String(u.name || "").trim().toLowerCase()));
                setAssignees(list);
            } catch (e) {
                setAssignees([]);
            } finally {
                setUsersLoaded(true);
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

    const persistTaskUpdate = async (task: Task, patch: Record<string, any>) => {
        const targetAssignee = patch?.assignee_id ?? patch?.assignee;
        if (targetAssignee !== undefined && targetAssignee !== null && String(targetAssignee) !== "") {
            if (!assignableUserIds.has(String(targetAssignee))) {
                throw new Error("Selected assignee is not assignable in this project");
            }
        }

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

        localPatch = { status: targetColumn };
        apiPatch = { status: targetColumn };

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

    const currentViewIcon =
        view === "board" ? <IconLayoutKanban size={16} /> : view === "table" ? <IconTable size={16} /> : <IconList size={16} />;

    const projectTitle = String(project || "project")
        .split("-")
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join(" ");
    const orgSlug = String(org || "org");
    const projectSlug = String(project || "project");
    const orgTitleFallback = orgSlug
        .split("-")
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join(" ");
    const orgTitle = orgName || orgTitleFallback;

    useEffect(() => {
        const loadOrgName = async () => {
            if (!org) {
                setOrgName("");
                return;
            }

            try {
                const res = await api.get(`/api/organizations/${org}`);
                const data = res?.data?.data ?? res?.data ?? null;
                const name = data?.name || data?.title || data?.organization_name || "";
                if (name) {
                    setOrgName(String(name));
                    return;
                }
            } catch (e) {
                // fallback to projects endpoint
            }

            try {
                const res = await api.get("/api/projects", { params: { org, project, per_page: 1 } });
                const list = res?.data?.data ?? res?.data ?? [];
                const first = Array.isArray(list) ? list[0] : null;
                const name =
                    first?.organization?.name ||
                    first?.org_name ||
                    first?.organization_name ||
                    "";
                if (name) {
                    setOrgName(String(name));
                    return;
                }
            } catch (e) {
                // ignore and keep fallback
            }

            setOrgName("");
        };

        loadOrgName();
    }, [org, project]);

    if (!org || !project) return <div>Please select a project URL: /{`{org}`}/{`{project}`}/tasks</div>;
    if (loading) return <div>Loading tasks...</div>;

    if (usersLoaded && isAuthenticated && !currentAuth.isAdmin && !currentUserInProject) {
        return (
            <AppShell>
                <div className="w-full min-w-0 px-3 md:px-5 py-3">
                    <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">
                        You are not a member of this project. Only project members can view this project.
                    </div>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="space-y-4 w-full min-w-0 px-3 md:px-5 py-3">
                <div className="space-y-1">
                    <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">{orgTitle} {">"} {projectTitle}</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Browse / {orgSlug} / {projectSlug}</p>
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 md:p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                            <details className="relative">
                                <summary className="list-none cursor-pointer h-9 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm flex items-center">
                                    Priority {selectedPriorities.length > 0 ? `(${selectedPriorities.length})` : "(All)"}
                                </summary>
                                <div className="absolute z-20 mt-1 w-56 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 shadow-lg">
                                    <div className="max-h-56 overflow-auto space-y-1">
                                        {priorities.map((p) => (
                                            <label key={p} className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPriorities.includes(p)}
                                                    onChange={(e) => {
                                                        setSelectedPriorities((prev) =>
                                                            e.target.checked ? [...prev, p] : prev.filter((v) => v !== p)
                                                        );
                                                    }}
                                                />
                                                <span className="capitalize">{p}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                                        <button className="text-xs text-indigo-600" onClick={() => setSelectedPriorities([])} type="button">Clear</button>
                                    </div>
                                </div>
                            </details>

                            <details className="relative">
                                <summary className="list-none cursor-pointer h-9 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm flex items-center">
                                    Assignee {selectedAssignees.length > 0 ? `(${selectedAssignees.length})` : "(All)"}
                                </summary>
                                <div className="absolute z-20 mt-1 w-64 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 shadow-lg">
                                    <div className="max-h-56 overflow-auto space-y-1">
                                        {assignees.map((u) => {
                                            const id = String(u.id);
                                            return (
                                                <label key={id} className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAssignees.includes(id)}
                                                        onChange={(e) => {
                                                            setSelectedAssignees((prev) =>
                                                                e.target.checked ? [...prev, id] : prev.filter((v) => v !== id)
                                                            );
                                                        }}
                                                    />
                                                    <span>{u.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                                        <button className="text-xs text-indigo-600" onClick={() => setSelectedAssignees([])} type="button">Clear</button>
                                    </div>
                                </div>
                            </details>

                            {localSequence && (
                                <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-1 text-xs">
                                    Manual sequence active
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto md:justify-end">
                            <div className="h-9 min-w-40 px-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 inline-flex items-center gap-2">
                                <span className="text-gray-500 dark:text-gray-400 shrink-0">
                                    {currentViewIcon}
                                </span>
                                <select
                                    value={view}
                                    onChange={(e) => setView(e.target.value as "board" | "table" | "list")}
                                    className="h-full w-full bg-transparent text-sm capitalize outline-none"
                                    aria-label="View mode"
                                >
                                    <option value="board">Board</option>
                                    <option value="table">Table</option>
                                    <option value="list">List</option>
                                </select>
                            </div>

                            <div className="relative flex-1 md:flex-none md:w-80">
                                <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={projectSearchInput}
                                    onChange={(e) => setProjectSearchInput(e.target.value)}
                                    placeholder={`Search tasks in ${project || "project"}...`}
                                    className="w-full h-9 pl-9 pr-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-4 items-start">
                    <div className="space-y-4 min-w-0">
                        {view === "board" && (
                            <div className="space-y-3">
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
                                            {(boardTasks.filter((t) => (t.status || "unassigned") === column.key) || []).map((task) => {
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
                                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                            <span className="capitalize">{task.priority || "-"}</span>
                                                            <span>•</span>
                                                            <span>{getAssigneeLabel(task)}</span>
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
                                            <th className="text-left px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
                                                    Assignee
                                                </span>
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
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{getAssigneeLabel(task)}</td>
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
                                            <div className="flex flex-col min-w-0">
                                                <Link href={`/task/${taskSlug}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:underline truncate">
                                                    {task.title}
                                                </Link>
                                                <div className="text-xs text-gray-500">{getAssigneeLabel(task)}</div>
                                            </div>
                                            <div className="text-xs text-gray-500">{task.status || "-"}</div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
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
                                </div>
                                <div>
                                    {pagination.totalItems > 0
                                        ? `Showing page ${pagination.currentPage} / ${pagination.totalPages} (${pagination.totalItems} total items)`
                                        : `Showing page ${pagination.currentPage} / ${pagination.totalPages}`}
                                </div>
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

                    <aside className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 sticky top-20">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Project Members</h3>
                        {assignees.length === 0 ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400">No members found for this project.</p>
                        ) : (
                            <ul className="space-y-1.5 max-h-[60vh] overflow-auto">
                                {assignees.map((u) => (
                                    <li key={String(u.id)} className="flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-800 px-2 py-1.5">
                                        <span className="text-sm text-gray-800 dark:text-gray-200 truncate pr-2">{u.name}</span>
                                        <span className="text-[11px] rounded-full px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 capitalize">
                                            {u.role || "member"}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </aside>
                </div>
            </div>
        </AppShell>
    )
}
