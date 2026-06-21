"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import useAuthStore from "@/lib/authStore";
import { useRouter } from "next/navigation";

type User = { id: number; name?: string; email?: string; username?: string };

export default function CreateTaskForm({ onCreated }: { onCreated?: (task: any) => void }) {
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
  }, []);

  const assignToMe = () => {
    setAssignee(reporterId ?? reporter ?? "");
  };

  const submit = async () => {
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
      if (onCreated) onCreated(task);
      if (task && task.slug) router.push(`/tasks/${task.slug}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      <label className="text-sm text-[color:var(--muted)]">Title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded mt-1 mb-3" />

      <label className="text-sm text-[color:var(--muted)]">Description</label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded mt-1 mb-3" />

      <div className="flex items-center gap-2 mb-3">
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

      <div className="flex justify-end">
        <button onClick={submit} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </div>
  );
}
