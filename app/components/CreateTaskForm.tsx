"use client";

import React, { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import useAuthStore from "@/lib/authStore";
import { usePathname } from "next/navigation";

type User = { id: number; name?: string; email?: string; username?: string };
type ProjectOption = { id: number | string; name?: string; slug?: string; project_slug?: string };

type TaskFormMode = "create" | "edit";

type TaskFormProps = {
  mode?: TaskFormMode;
  task?: any;
  onStored?: (task: any) => void;
  onUpdated?: (task: any, changes?: Array<{ field: string; before: any; after: any }>) => void;
  hideSubmit?: boolean;
  onRegisterSubmit?: (fn: () => Promise<void>) => void;
};

export default function CreateTaskForm({ mode = "create", task, onStored, onUpdated, hideSubmit, onRegisterSubmit }: TaskFormProps) {
  const pathname = usePathname();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState<string | number | null>(null);
  const [projectId, setProjectId] = useState<string | number | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getToken = useAuthStore((s) => s.getToken);
  const token = typeof window !== "undefined" ? getToken() : null;
  let reporter = "";
  let reporterId: string | number | null = null;
  try {
    if (token) {
      const parts = token.split('.');
      if (parts.length > 1) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        reporter = payload?.name || payload?.username || payload?.email || "You";
        reporterId = payload?.id ?? payload?.user_id ?? null;
      }
    }
  } catch (e) {}

  useEffect(() => {
    if (mode === "edit" && task) {
      setTitle(task.title ?? "");
      setDescription(task.description ?? "");
      setAssignee(task.assignee_id ?? task.assignee?.id ?? task.assignee ?? null);
      setProjectId(task.project_id ?? task.project?.id ?? null);
      setStatus(task.status ?? "todo");
      setPriority(task.priority ?? "normal");
      return;
    }

    if (mode === "create") {
      try {
        const raw = localStorage.getItem('createTaskDraft');
        if (raw) {
          const d = JSON.parse(raw);
          if (d.title) setTitle(d.title);
          if (d.description) setDescription(d.description);
          if (d.assignee) setAssignee(d.assignee);
          if (d.projectId) setProjectId(d.projectId);
          if (d.status) setStatus(d.status);
          if (d.priority) setPriority(d.priority);
        }
      } catch (e) {}
    }
  }, [mode, task]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await api.get('/api/projects', { params: { with_members: true } });
        const list = res?.data?.data ?? res?.data ?? [];
        const normalized = Array.isArray(list) ? list : [];
        setProjects(normalized);

        if (mode !== "create" || projectId) return;

        const parts = (pathname || "").split("/").filter(Boolean);
        const browseIndex = parts.findIndex((p) => p === "browse");
        const projectSlug = browseIndex >= 0 && parts.length > browseIndex + 2 ? parts[browseIndex + 2] : null;
        if (!projectSlug) return;

        const matched = normalized.find((p: ProjectOption) => {
          const slug = p.slug || p.project_slug || "";
          return String(slug).toLowerCase() === String(projectSlug).toLowerCase();
        });
        if (matched?.id !== undefined && matched?.id !== null) {
          setProjectId(matched.id);
        }
      } catch (e) {
        setProjects([]);
      }
    };

    loadProjects();

    const loadUsers = async () => {
      try {
        const res = await api.get('/api/users');
        setUsers(res?.data?.data ?? res?.data ?? []);
      } catch (e) {
        setUsers([]);
      }
    };
    loadUsers();

    if (mode !== "create") return;
  }, [mode, pathname, projectId]);

  const assignToMe = () => {
    setAssignee(reporterId ?? reporter ?? "");
  };

  // persist draft to localStorage on changes (debounced simple)
  useEffect(() => {
    try {
      const draft = { title, description, assignee, projectId, status, priority };
      localStorage.setItem('createTaskDraft', JSON.stringify(draft));
    } catch (e) {}
  }, [title, description, assignee, projectId, status, priority]);

  const submit = useCallback(async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (mode === "create" && !projectId) {
      setError('Project is required');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload: any = { title, description, status, priority };
      if (projectId) payload.project_id = projectId;
      if (assignee) {
        payload.assignee = assignee;
        payload.assignee_id = assignee;
      }
      if (reporterId) payload.reporter_id = reporterId;

      const previous = task || {};
      const changedFields = ["title", "description", "status", "priority", "assignee_id"].reduce<Array<{ field: string; before: any; after: any }>>((acc, field) => {
        const nextValue = field === "assignee_id" ? payload.assignee_id ?? null : payload[field];
        const prevValue = field === "assignee_id" ? previous?.assignee_id ?? previous?.assignee?.id ?? previous?.assignee ?? null : previous?.[field];
        if (String(prevValue ?? "") !== String(nextValue ?? "")) {
          acc.push({ field, before: prevValue, after: nextValue });
        }
        return acc;
      }, []);

      let res;
      if (mode === "edit") {
        const taskId = previous?.id ?? previous?.slug ?? previous?.task_slug;
        if (!taskId) throw new Error('Task id is required for editing');
        try {
          res = await api.put(`/api/tasks/${taskId}`, payload);
        } catch {
          res = await api.patch(`/api/tasks/${taskId}`, payload);
        }
      } else {
        res = await api.post('/api/tasks', payload);
      }

      const savedTask = res?.data?.data ?? res?.data ?? null;
      if (mode === "edit") {
        if (onUpdated) onUpdated(savedTask, changedFields);
      } else if (onStored) {
        onStored(savedTask);
      }

      if (mode === "create") {
        // keep draft in localStorage until user clears or navigates
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || (mode === "edit" ? 'Failed to update task' : 'Failed to create task'));
    } finally {
      setLoading(false);
    }
  }, [
    assignee,
    description,
    mode,
    onStored,
    onUpdated,
    priority,
    projectId,
    reporterId,
    status,
    task,
    title,
  ]);

  // expose submit to parent so modal footer can trigger it (register once)
  useEffect(() => {
    if (!onRegisterSubmit) return;
    try {
      onRegisterSubmit(submit);
    } catch (e) {}
  }, [onRegisterSubmit, submit]);

  return (
    <div>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      <label className="text-sm text-(--muted)">Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 py-2 border rounded mt-1 mb-3 bg-(--surface) text-foreground border-(--border-color) placeholder:text-(--muted)"
        placeholder="Task title"
      />

      <label className="text-sm text-(--muted)">Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-3 py-2 border rounded mt-1 mb-3 bg-(--surface) text-foreground border-(--border-color) placeholder:text-(--muted)"
        placeholder="Add context for this task"
      />

      <div className="flex items-baseline-last gap-2 mb-3">
        <div className="flex-1">
          <label className="text-sm text-(--muted)">Project</label>
          <select
            value={String(projectId ?? "")}
            onChange={(e) => setProjectId(e.target.value || null)}
            className="w-full px-2 py-2 border rounded mt-1 bg-(--surface) text-foreground border-(--border-color)"
            disabled={mode === "edit"}
          >
            <option value="">-- select project --</option>
            {projects.map((p) => (
              <option key={String(p.id)} value={p.id}>{p.name || p.slug || p.project_slug || `Project ${p.id}`}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-baseline-last gap-2 mb-3">
        <div className="flex-1">
          <label className="text-sm text-(--muted)">Assignee</label>
          <select
            value={String(assignee ?? "")}
            onChange={(e) => setAssignee(e.target.value || null)}
            className="w-full px-2 py-2 border rounded mt-1 bg-(--surface) text-foreground border-(--border-color)"
          >
            <option value="">-- unassigned --</option>
            {users.map(u => (
              <option key={String(u.id)} value={u.id}>{u.name || u.username || u.email}</option>
            ))}
          </select>
        </div>
        <div>
          <button
            onClick={assignToMe}
            className="px-3 py-2 rounded border border-(--border-color) bg-(--surface) text-foreground hover:brightness-95 dark:hover:brightness-110"
          >
            Assign to me
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <label className="text-sm text-(--muted)">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-2 py-2 border rounded mt-1 bg-(--surface) text-foreground border-(--border-color)"
          >
            <option value="todo">Todo</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
            <option value="open">Open (legacy)</option>
            <option value="in_progress">In Progress (legacy)</option>
            <option value="closed">Closed (legacy)</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-sm text-(--muted)">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-2 py-2 border rounded mt-1 bg-(--surface) text-foreground border-(--border-color)"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {!hideSubmit && (
        <div className="flex justify-end">
          <button onClick={submit} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? (mode === "edit" ? 'Saving...' : 'Creating...') : (mode === "edit" ? 'Save Changes' : 'Create Task')}
          </button>
        </div>
      )}
    </div>
  );
}
