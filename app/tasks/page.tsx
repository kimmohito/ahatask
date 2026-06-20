"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function GlobalTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/tasks");
      setTasks(res?.data?.data ?? res?.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div>
      <h2>All Tasks</h2>
      <ul>
        {tasks.map((t) => {
          const orgSlug = t.organization?.slug || t.org_slug || t.org || "";
          const projectSlug = t.project?.slug || t.project_slug || t.project || "";
          const taskSlug = t.slug || t.task_slug || t.id;
          return (
            <li key={t.id}>
              <Link href={`/tasks/${orgSlug}/${projectSlug}/${taskSlug}`}>
                {t.title} — {t.project?.name || t.project || "project"}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
