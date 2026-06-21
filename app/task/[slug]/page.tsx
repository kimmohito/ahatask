"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import AppShell from "@/app/components/AppShell";
import CreateTaskForm from "@/app/components/CreateTaskForm";
import useAuthStore from "@/lib/authStore";
import { IconClock, IconEdit, IconHistory } from "@tabler/icons-react";

type HistoryItem = {
  description?: string;
  action?: string;
  created_at?: string;
  user_name?: string;
  user?: string;
  actor_name?: string;
  changes?: Array<{ field: string; before: any; after: any }>;
  source?: string;
};

export default function TaskDetailPage() {
  const params = useParams() as { slug?: string };
  const { slug } = params;
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const username = useAuthStore((s) => s.username);

  const historyKey = useMemo(() => (slug ? `task-history:${slug}` : "task-history"), [slug]);

  const addLocalHistory = (entry: HistoryItem) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 50);
      try {
        localStorage.setItem(historyKey, JSON.stringify(next));
      } catch {
        // ignore storage issues
      }
      return next;
    });
  };

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        // try to fetch by id; include org/project if backend requires
        const res = await api.get(`/api/tasks/${slug}`);
        setTask(res?.data?.data ?? res?.data ?? res?.data?.task ?? null);
      } catch (e) {
        setTask(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!slug) return;
      setHistoryLoading(true);

      let remote: HistoryItem[] = [];
      try {
        const res = await fetch(`/api/tasks/${slug}/history`);
        const data = await res.json().catch(() => null);
        const list = data?.data ?? data ?? [];
        if (Array.isArray(list)) {
          remote = list;
        }
      } catch {
        remote = [];
      }

      let local: HistoryItem[] = [];
      try {
        const raw = localStorage.getItem(historyKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) local = parsed;
        }
      } catch {
        local = [];
      }

      const merged = [...local, ...remote].filter(Boolean).slice(0, 50);
      setHistory(merged);
      setHistoryLoading(false);
    };

    loadHistory();
  }, [slug, historyKey]);

  const handleTaskUpdated = (updatedTask: any, changes?: Array<{ field: string; before: any; after: any }>) => {
    setTask(updatedTask);

    const description = changes && changes.length > 0
      ? `Updated ${changes.map((change) => change.field).join(", ")}`
      : "Updated task";

    addLocalHistory({
      description,
      action: "updated",
      created_at: new Date().toISOString(),
      user_name: username || "You",
      actor_name: username || "You",
      changes,
      source: "local",
    });
  };

  if (loading) return <div>Loading task...</div>;
  if (!task) return <div>Task not found</div>;

  return (
    <AppShell>
      <div className="w-full min-w-0 px-3 md:px-5 py-3 space-y-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                <IconEdit size={14} />
                Edit Task
              </div>
              <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{task.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1">Status: {task.status || "-"}</span>
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1">Priority: {task.priority || "-"}</span>
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1">Assignee: {task.assignee_name || task.assignee?.name || "Unassigned"}</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <IconClock size={14} />
              <span>{task.updated_at || task.created_at || ""}</span>
            </div>
          </div>

          <CreateTaskForm mode="edit" task={task} onUpdated={handleTaskUpdated} />
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <IconHistory size={16} className="text-gray-500 dark:text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Task History</h2>
          </div>

          {historyLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No activity yet.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, index) => (
                <div key={`${entry.created_at || index}-${index}`} className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {entry.description || entry.action || "Activity"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.created_at || ""}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {entry.user_name || entry.actor_name || entry.user || "System"}
                  </div>
                  {Array.isArray(entry.changes) && entry.changes.length > 0 && (
                    <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                      {entry.changes.map((change) => (
                        <div key={change.field} className="rounded bg-gray-50 dark:bg-gray-800 px-2 py-1">
                          <span className="font-medium capitalize">{change.field}</span>
                          <span className="mx-1">:</span>
                          <span>{String(change.before ?? "-")}</span>
                          <span className="mx-1">→</span>
                          <span>{String(change.after ?? "-")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
