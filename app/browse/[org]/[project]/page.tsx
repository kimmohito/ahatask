"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import useAuthStore from "@/lib/authStore";
import { useParams } from "next/navigation";
import AppShell from "@/app/components/AppShell";

export default function TasksProjectPageAlias() {
    const params = useParams() as { org?: string; project?: string };
    const org = params?.org;
    const project = params?.project;

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState("table");
    const [perPage, setPerPage] = useState(10);

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
                },
            });

            setTasks(res.data.data);
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
    }, [isAuthenticated, filters, perPage, org, project]);

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
                const derived = Array.from(new Set(tasks.map((t: any) => t.status))).filter(Boolean);
                if (derived.length) list = derived;
            }

            if (list.length === 0) {
                list = ["todo", "grooming", "in progress", "done"];
            }

            setStatuses(list);
        };

        loadStatuses();
    }, [tasks, org, project]);

    if (!org || !project) return <div>Please select a project URL: /{`{org}`}/{`{project}`}/tasks</div>;
    if (loading) return <div>Loading tasks...</div>;

    return (
        <AppShell>
            <div>
                <div>
                    <div>
                        <button onClick={() => setView("board")}>Board</button>
                        <button onClick={() => setView("table")}>Table</button>
                        <button onClick={() => setView("list")}>List</button>
                    </div>

                    <select onChange={(e) => setPerPage(Number(e.target.value))} value={perPage}>
                        {[5, 10, 20, 50, 100, 1000].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>

                {view === "board" && (
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(statuses.length, 1)}, 1fr)`, gap: 12 }}>
                        {statuses.length === 0 && <div>No status columns available</div>}

                        {statuses.map((status) => (
                            <div key={status} style={{ border: "1px solid #ddd", padding: 8, borderRadius: 6 }}>
                                <h3 style={{ textTransform: "capitalize" }}>{status}</h3>

                                <div style={{ marginTop: 8 }}>
                                    {(tasks.filter((t: any) => t.status === status) || []).map((task: any) => {
                                        const taskSlug = task.slug || task.task_slug || task.id;
                                        return (
                                            <div key={task.id} style={{ padding: 8, marginBottom: 8, background: "#fafafa", borderRadius: 4 }}>
                                                <a href={`/browse/${org}/${project}/${taskSlug}`} style={{ fontWeight: 700 }}>{task.title}</a>
                                                <div style={{ fontSize: 12, color: "#666" }}>{task.status}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {view === "table" && (
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Priority</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((task: any) => {
                                const taskSlug = task.slug || task.task_slug || task.id;
                                return (
                                    <tr key={task.id}>
                                        <td><a href={`/browse/${org}/${project}/${taskSlug}`} style={{ fontWeight: 700 }}>{task.title}</a></td>
                                        <td>{task.status}</td>
                                        <td>{task.priority}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {view === "list" && (
                    <ul>
                        {tasks.map((task: any) => {
                            const taskSlug = task.slug || task.task_slug || task.id;
                            return (
                                <li key={task.id}>
                                    <a href={`/browse/${org}/${project}/${taskSlug}`}>{task.title}</a> - {task.status}
                                </li>
                            );
                        })}
                    </ul>
                )}

            </div>
        </AppShell>
    )
}
