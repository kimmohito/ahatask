"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

export default function TaskDetailPage() {
  const params = useParams() as { org?: string; project?: string; taskId?: string };
  const { org, project, taskId } = params;
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!taskId) return;
      setLoading(true);
      try {
        // try to fetch by id; include org/project if backend requires
        const res = await api.get(`/api/tasks/${taskId}`, { params: { org, project } });
        setTask(res?.data?.data ?? res?.data ?? res?.data?.task ?? null);
      } catch (e) {
        setTask(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [taskId, org, project]);

  if (loading) return <div>Loading task...</div>;
  if (!task) return <div>Task not found</div>;

  return (
    <div>
      <h1>{task.title}</h1>
      <div>Status: {task.status}</div>
      <div>Project: {project}</div>
      <div style={{ marginTop: 12 }}>{task.description}</div>
    </div>
  );
}
