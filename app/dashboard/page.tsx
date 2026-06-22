"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import DashboardCard from "../components/DashboardCard";
const StackedBarChart = dynamic(() => import("../components/StackedBarChart"), { ssr: false });
const RadialChartWithTabs = dynamic(() => import("../components/RadialChartWithTabs"), { ssr: false });
import TaskList from "../components/TaskList";
import { IconChecklist, IconClock, IconPlayerPlay, IconCheck, IconFlag, IconCalendar, IconUserCheck } from "@tabler/icons-react";
import AppShell from "../components/AppShell";
import api from "../../lib/api";

type DashboardTask = {
  id: string | number;
  slug: string;
  title: string;
  subtitle?: string;
  status: string;
  priority?: string;
  project?: {
    id: string | number;
    name: string;
    slug: string;
  };
};

type DashboardResponse = {
  data: {
    summary?: {
      total_tasks?: number;
      todo?: number;
      in_progress?: number;
      completed?: number;
    };
    task_groups?: {
      top_priority_tasks?: DashboardTask[];
      due_tasks?: DashboardTask[];
      your_tasks?: DashboardTask[];
    };
    activity?: {
      labels?: string[];
      users?: Array<{
        user_id: string | number;
        name: string;
        values: number[];
      }>;
      total_completed_this_week?: number;
    };
    overview?: {
      total_owned?: number;
      total_all?: number;
      by_status?: {
        todo?: number;
        in_progress?: number;
        completed?: number;
        other?: number;
      };
    };
  };
};

const ACTIVITY_COLORS = [
  "var(--accent-red)",
  "var(--accent-yellow)",
  "var(--accent-green)",
  "var(--accent-blue)",
  "var(--accent-indigo)",
  "#64748b",
  "#f97316",
];

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);

      try {
        const response = await api.get<DashboardResponse>("/api/dashboard", {
          params: {
            priority_limit: 6,
            due_limit: 4,
            your_limit: 10,
          },
        });

        if (!mounted) return;
        setDashboard(response.data?.data ?? null);
      } catch {
        if (!mounted) return;
        setDashboard(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = dashboard?.summary;
  const overview = dashboard?.overview;
  const activity = dashboard?.activity;
  const groups = dashboard?.task_groups;

  const totals = summary?.total_tasks ?? 0;
  const todoCount = summary?.todo ?? 0;
  const inProgressCount = summary?.in_progress ?? 0;
  const completedCount = summary?.completed ?? 0;

  const priorityTasks = groups?.top_priority_tasks ?? [];
  const dueTasks = groups?.due_tasks ?? [];
  const yourTasks = groups?.your_tasks ?? [];

  const chartLabels = activity?.labels?.length ? activity.labels : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const activityUsers = Array.isArray(activity?.users) ? activity.users : [];
  const chartUsers = useMemo(
    () =>
      activityUsers.map((u, index) => ({
        name: u.name,
        color: ACTIVITY_COLORS[index % ACTIVITY_COLORS.length],
        values: Array.isArray(u.values) ? u.values.map((v) => Number(v) || 0) : [],
      })),
    [activityUsers]
  );

  function toTaskListItems(tasks: DashboardTask[]) {
    return tasks.map((t) => ({
      ...t,
      subtitle: t.subtitle || t.project?.name || (t.priority ? `Priority: ${t.priority}` : "Task"),
    }));
  }

  function handleTaskClick(task: { slug?: string; id: string | number }) {
    const destination = task.slug ? `/task/${task.slug}` : `/task/${task.id}`;
    router.push(destination);
  }

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-500">{loading ? "Loading dashboard data..." : "Overview and widgets"}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DashboardCard title="Total tasks" value={totals} icon={<IconChecklist />} iconBg="icon-blue" iconColor="var(--accent-blue)" />
          <DashboardCard title="Todo" value={todoCount} icon={<IconClock />} iconBg="icon-yellow" iconColor="var(--accent-yellow)" />
          <DashboardCard title="In progress" value={inProgressCount} icon={<IconPlayerPlay />} iconBg="icon-indigo" iconColor="var(--accent-indigo)" />
          <DashboardCard title="Completed" value={completedCount} icon={<IconCheck />} iconBg="icon-green" iconColor="var(--accent-green)" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="surface-muted p-4 rounded-lg">
            <DashboardCard title="Top priority tasks" value={priorityTasks.length} icon={<IconFlag />} iconBg="icon-red" iconColor="var(--accent-red)" />
            <div className="mt-3">
              <TaskList tasks={toTaskListItems(priorityTasks)} maxVisible={3} onTaskClick={handleTaskClick} />
            </div>
          </div>
          <div className="surface-muted p-4 rounded-lg">
            <DashboardCard title="Due" value={dueTasks.length} icon={<IconCalendar />} iconBg="icon-yellow" iconColor="var(--accent-yellow)" />
            <div className="mt-3">
              <TaskList tasks={toTaskListItems(dueTasks)} maxVisible={3} onTaskClick={handleTaskClick} />
            </div>
          </div>
          <div className="surface-muted p-4 rounded-lg">
            <DashboardCard title="Your Task" value={yourTasks.length} icon={<IconUserCheck />} iconBg="icon-blue" iconColor="var(--accent-blue)" />
            <div className="mt-3">
              <TaskList tasks={toTaskListItems(yourTasks)} maxVisible={3} onTaskClick={handleTaskClick} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 surface-muted rounded-lg p-4 h-72">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>Activity</div>
                <div className="text-lg font-semibold">Completed per day</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  Total this week: {activity?.total_completed_this_week ?? 0}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap justify-end">
                {chartUsers.map((u) => (
                  <div key={u.name} className="flex items-center gap-2 text-sm" style={{ color: u.color }}>
                    <span style={{ width: 12, height: 8, background: u.color, display: 'inline-block', borderRadius: 3 }} />
                    <span style={{ color: 'var(--muted)' }}>{u.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-55">
              <StackedBarChart users={chartUsers} labels={chartLabels} height={220} />
            </div>
          </div>

          <div className="h-72">
            <div className="surface-muted rounded-lg p-4 h-full">
              <div className="text-sm" style={{ color: "var(--muted)" }}>Overview</div>
              <div className="text-lg font-semibold mb-2">Status distribution</div>
              <div className="h-50">
                <RadialChartWithTabs
                  totalOwned={overview?.total_owned ?? 0}
                  totalAll={overview?.total_all ?? totals}
                  byStatus={overview?.by_status}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
