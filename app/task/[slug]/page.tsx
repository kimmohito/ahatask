"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import AppShell from "@/app/components/AppShell";

export default function TaskDetailPage() {
  const params = useParams() as { slug?: string };
  const { slug } = params;
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

  if (loading) return <div>Loading task...</div>;
  if (!task) return <div>Task not found</div>;

  return (
    <AppShell>
      <div>
        <h1>{task.title}</h1>
        <div>Status: {task.status}</div>
        <div style={{ marginTop: 12 }}>{task.description}</div>
      </div>
    </AppShell>
  );
}
