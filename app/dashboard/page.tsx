"use client";

import dynamic from "next/dynamic";
import DashboardCard from "../components/DashboardCard";
const StackedBarChart = dynamic(() => import("../components/StackedBarChart"), { ssr: false });
const RadialChartWithTabs = dynamic(() => import("../components/RadialChartWithTabs"), { ssr: false });
import TaskList from "../components/TaskList";
import { IconChecklist, IconClock, IconPlayerPlay, IconCheck, IconFlag, IconCalendar, IconUserCheck } from "@tabler/icons-react";
import AppShell from "../components/AppShell";

const mockUsers = [
  { name: "Alice", color: "var(--accent-red)", values: [5, 3, 4, 2, 6, 3, 4] },
  { name: "Bob", color: "var(--accent-yellow)", values: [2, 4, 1, 3, 2, 4, 1] },
  { name: "Carol", color: "var(--accent-green)", values: [1, 2, 3, 2, 1, 1, 2] },
];

export default function DashboardPage() {
  const totals = mockUsers.reduce((acc, u) => acc + u.values.reduce((a, b) => a + b, 0), 0);

  // mock tasks
  const priorityTasks = Array.from({ length: 6 }).map((_, i) => ({ id: i + 1, title: `Priority task ${i + 1}`, subtitle: "High priority", status: "urgent" }));
  const dueTasks = Array.from({ length: 4 }).map((_, i) => ({ id: i + 10, title: `Due task ${i + 1}`, subtitle: "Due soon", status: "due" }));
  const yourTasks = Array.from({ length: 0 }).map((_, i) => ({ id: i + 20, title: `Your task ${i + 1}`, subtitle: "Assigned to you", status: "todo" }));

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview and widgets</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DashboardCard title="Total tasks" value={totals} icon={<IconChecklist />} iconBg="icon-blue" iconColor="var(--accent-blue)" />
          <DashboardCard title="Todo" value={12} icon={<IconClock />} iconBg="icon-yellow" iconColor="var(--accent-yellow)" />
          <DashboardCard title="In progress" value={8} icon={<IconPlayerPlay />} iconBg="icon-indigo" iconColor="var(--accent-indigo)" />
          <DashboardCard title="Completed" value={34} icon={<IconCheck />} iconBg="icon-green" iconColor="var(--accent-green)" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="surface-muted p-4 rounded-lg">
            <DashboardCard title="Top priority tasks" value={priorityTasks.length} icon={<IconFlag />} iconBg="icon-red" iconColor="var(--accent-red)" />
            <div className="mt-3">
              <TaskList tasks={priorityTasks} maxVisible={3} />
            </div>
          </div>
          <div className="surface-muted p-4 rounded-lg">
            <DashboardCard title="Due" value={dueTasks.length} icon={<IconCalendar />} iconBg="icon-yellow" iconColor="var(--accent-yellow)" />
            <div className="mt-3">
              <TaskList tasks={dueTasks} maxVisible={3} />
            </div>
          </div>
          <div className="surface-muted p-4 rounded-lg">
            <DashboardCard title="Your Task" value={yourTasks.length} icon={<IconUserCheck />} iconBg="icon-blue" iconColor="var(--accent-blue)" />
            <div className="mt-3">
              <TaskList tasks={yourTasks} maxVisible={3} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 surface-muted rounded-lg p-4 h-72">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>Activity</div>
                <div className="text-lg font-semibold">Completed per day</div>
              </div>
              <div className="flex items-center gap-3">
                {mockUsers.map((u) => (
                  <div key={u.name} className="flex items-center gap-2 text-sm" style={{ color: u.color }}>
                    <span style={{ width: 12, height: 8, background: u.color, display: 'inline-block', borderRadius: 3 }} />
                    <span style={{ color: 'var(--muted)' }}>{u.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-[220px]">
              <StackedBarChart users={mockUsers} labels={["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]} width={560} height={220} />
            </div>
          </div>

          <div className="h-72">
            <div className="surface-muted rounded-lg p-4 h-full">
              <div className="text-sm" style={{ color: "var(--muted)" }}>Overview</div>
              <div className="text-lg font-semibold mb-2">Status distribution</div>
              <div className="h-[200px]"><RadialChartWithTabs totalOwned={11} totalAll={totals} /></div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
