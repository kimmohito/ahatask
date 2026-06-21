"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;
  const [task, setTask] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      try {
        const tRes = await fetch(`/api/tasks/${slug}`).then(r => r.json()).catch(() => null);
        setTask(tRes?.data ?? tRes ?? null);
        const cRes = await fetch(`/api/tasks/${slug}/comments`).then(r => r.json()).catch(() => null);
        setComments(cRes?.data ?? cRes ?? []);
        const hRes = await fetch(`/api/tasks/${slug}/history`).then(r => r.json()).catch(() => null);
        setHistory(hRes?.data ?? hRes ?? []);
      } catch (e) {
        setTask(null);
        setComments([]);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (!slug) return <div className="p-6">No task specified.</div>;
  if (loading) return <div className="p-6">Loading...</div>;
  if (!task) return <div className="p-6">Task not found.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">{task.title}</h1>
          <div className="text-sm text-[color:var(--muted)]">{task.slug} • Reporter: {task.reporter_name || task.reporter || 'Unknown'}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.back()} className="px-3 py-1 rounded border">Back</button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-medium text-[color:var(--muted)]">Description</h2>
        <div className="mt-2">{task.description || <span className="text-[color:var(--muted)]">No description</span>}</div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-1">
          <h3 className="text-sm text-[color:var(--muted)]">Status</h3>
          <div className="mt-1">{task.status}</div>
        </div>
        <div className="col-span-1">
          <h3 className="text-sm text-[color:var(--muted)]">Priority</h3>
          <div className="mt-1">{task.priority}</div>
        </div>
        <div className="col-span-1">
          <h3 className="text-sm text-[color:var(--muted)]">Assignee</h3>
          <div className="mt-1">{task.assignee_name || task.assignee || 'Unassigned'}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Comments</h3>
          {comments.length === 0 ? (
            <div className="text-[color:var(--muted)]">No comments yet.</div>
          ) : (
            comments.map((c, i) => (
              <div key={i} className="mb-3 border-b pb-2">
                <div className="text-sm font-medium">{c.user_name || c.user || 'Unknown'}</div>
                <div className="text-sm text-[color:var(--muted)]">{c.body}</div>
              </div>
            ))
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Activity</h3>
          {history.length === 0 ? (
            <div className="text-[color:var(--muted)]">No activity yet.</div>
          ) : (
            history.map((h, i) => (
              <div key={i} className="mb-3 border-b pb-2">
                <div className="text-sm font-medium">{h.description || h.action}</div>
                <div className="text-sm text-[color:var(--muted)]">{h.created_at}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
