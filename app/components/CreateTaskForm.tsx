"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import useAuthStore from "@/lib/authStore";
import { useRouter } from "next/navigation";

type User = { id: number; name?: string; email?: string; username?: string };

export default function CreateTaskForm({ onStored, hideSubmit, onRegisterSubmit }: { onStored?: (task: any) => void, hideSubmit?: boolean, onRegisterSubmit?: (fn: () => Promise<void>) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState<string | number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
    const loadUsers = async () => {
      try {
        const res = await api.get('/api/users');
        setUsers(res?.data?.data ?? res?.data ?? []);
      } catch (e) {
        setUsers([]);
      }
    };
    loadUsers();

    // load draft from localStorage
    try {
      const raw = localStorage.getItem('createTaskDraft');
      if (raw) {
        const d = JSON.parse(raw);
        if (d.title) setTitle(d.title);
        if (d.description) setDescription(d.description);
        if (d.assignee) setAssignee(d.assignee);
        if (d.status) setStatus(d.status);
        if (d.priority) setPriority(d.priority);
      }
    } catch (e) {}
  }, []);

  const assignToMe = () => {
    setAssignee(reporterId ?? reporter ?? "");
  };

  // persist draft to localStorage on changes (debounced simple)
  useEffect(() => {
    try {
      const draft = { title, description, assignee, status, priority };
      localStorage.setItem('createTaskDraft', JSON.stringify(draft));
    } catch (e) {}
  }, [title, description, assignee, status, priority]);

  const submit = async () => {
    // "Store" action: persist to DB but keep modal open and return saved task
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload: any = { title, description, status, priority };
      if (assignee) payload.assignee = assignee;
      if (reporterId) payload.reporter_id = reporterId;
      const res = await api.post('/api/tasks', payload);
      const task = res?.data?.data ?? res?.data ?? null;
      // do not navigate; notify parent modal to show saved task view
      if (onStored) onStored(task);
      // keep draft in localStorage until user clears or navigates
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  // expose submit to parent so modal footer can trigger it (register once)
  useEffect(() => {
    if (!onRegisterSubmit) return;
    try {
      onRegisterSubmit(submit);
    } catch (e) {}
    // only run when onRegisterSubmit identity changes
  }, [onRegisterSubmit]);

  return (
    <div>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      <label className="text-sm text-[color:var(--muted)]">Title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded mt-1 mb-3" />

      <label className="text-sm text-[color:var(--muted)]">Description</label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded mt-1 mb-3" />

      <div className="flex items-baseline-last gap-2 mb-3">
        <div className="flex-1">
          <label className="text-sm text-[color:var(--muted)]">Assignee</label>
          <select value={String(assignee ?? "")} onChange={(e) => setAssignee(e.target.value || null)} className="w-full px-2 py-2 border rounded mt-1">
            <option value="">-- unassigned --</option>
            {users.map(u => (
              <option key={String(u.id)} value={u.id}>{u.name || u.username || u.email}</option>
            ))}
          </select>
        </div>
        <div>
          <button onClick={assignToMe} className="px-3 py-2 bg-gray-100 rounded">Assign to me</button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <label className="text-sm text-[color:var(--muted)]">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-2 py-2 border rounded mt-1">
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-sm text-[color:var(--muted)]">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-2 py-2 border rounded mt-1">
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {!hideSubmit && (
        <div className="flex justify-end">
          <button onClick={submit} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      )}
    </div>
  );
}
