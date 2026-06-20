"use client";

import DashboardCard from "../components/DashboardCard";
import StackedBarChart from "../components/StackedBarChart";
import RadialChartWithTabs from "../components/RadialChartWithTabs";
import TaskList from "../components/TaskList";
import { IconChecklist, IconClock, IconPlayerPlay, IconCheck, IconFlag, IconCalendar, IconUserCheck } from "@tabler/icons-react";

const mockUsers = [
  { name: "Alice", color: "#ef4444", values: [5, 3, 4, 2, 6, 3, 4] },
  { name: "Bob", color: "#f59e0b", values: [2, 4, 1, 3, 2, 4, 1] },
  { name: "Carol", color: "#10b981", values: [1, 2, 3, 2, 1, 1, 2] },
];

export default function DashboardPage() {
  const totals = mockUsers.reduce((acc, u) => acc + u.values.reduce((a, b) => a + b, 0), 0);

  // mock tasks
  const priorityTasks = Array.from({ length: 6 }).map((_, i) => ({ id: i + 1, title: `Priority task ${i + 1}`, subtitle: "High priority", status: "urgent" }));
  const dueTasks = Array.from({ length: 4 }).map((_, i) => ({ id: i + 10, title: `Due task ${i + 1}`, subtitle: "Due soon", status: "due" }));
  const yourTasks = Array.from({ length: 0 }).map((_, i) => ({ id: i + 20, title: `Your task ${i + 1}`, subtitle: "Assigned to you", status: "todo" }));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview and widgets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard title="Total tasks" value={totals} icon={<IconChecklist size={56} />} iconBg="bg-gray-100 text-gray-700" iconColor="text-gray-700" />
        <DashboardCard title="Todo" value={12} icon={<IconClock size={56} />} iconBg="bg-yellow-100 text-yellow-600" iconColor="text-yellow-600" />
        <DashboardCard title="In progress" value={8} icon={<IconPlayerPlay size={56} />} iconBg="bg-indigo-100 text-indigo-600" iconColor="text-indigo-600" />
        <DashboardCard title="Completed" value={34} icon={<IconCheck size={56} />} iconBg="bg-green-100 text-green-600" iconColor="text-green-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <DashboardCard title="Priority tasks" value={priorityTasks.length} icon={<IconFlag size={56} />} iconBg="bg-red-100 text-red-600" iconColor="text-red-600" />
          <div className="mt-3">
            <TaskList tasks={priorityTasks} maxVisible={3} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <DashboardCard title="Due tasks" value={dueTasks.length} icon={<IconCalendar size={56} />} iconBg="bg-yellow-100 text-yellow-600" iconColor="text-yellow-600" />
          <div className="mt-3">
            <TaskList tasks={dueTasks} maxVisible={3} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <DashboardCard title="Your tasks" value={yourTasks.length} icon={<IconUserCheck size={56} />} iconBg="bg-blue-100 text-blue-600" iconColor="text-blue-600" />
          <div className="mt-3">
            <TaskList tasks={yourTasks} maxVisible={3} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-64">
          <h3 className="text-sm text-gray-500 mb-2">Completed per day (stacked by user)</h3>
          <div className="h-[200px]">
            <StackedBarChart users={mockUsers} labels={["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]} width={560} height={200} />
          </div>
        </div>

        <div className="h-64">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-full">
            <RadialChartWithTabs totalOwned={11} totalAll={totals} />
          </div>
        </div>
      </div>
    </div>
  );
}
