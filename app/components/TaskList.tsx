"use client";

import React from "react";

type Task = {
  id: string | number;
  title: string;
  subtitle?: string;
  status?: string;
};

type Props = {
  tasks?: Task[];
  maxVisible?: number; // how many visible before scroll
};

export default function TaskList({ tasks = [], maxVisible = 3 }: Props) {
  const visible = Math.max(3, maxVisible);
  const containerStyle: React.CSSProperties = {
    maxHeight: `${visible * 48 + 8}px`, // approx item height
    overflowY: tasks.length > visible ? "auto" : "hidden",
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 p-4">No tasks</div>
    );
  }

  return (
    <div style={containerStyle} className="space-y-2">
      {tasks.slice(0, 10).map((t) => (
        <div key={t.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
          <div>
            <div className="text-sm font-medium">{t.title}</div>
            {t.subtitle ? <div className="text-xs text-gray-500 dark:text-gray-400">{t.subtitle}</div> : null}
          </div>
          <div className="text-xs text-gray-400">{t.status}</div>
        </div>
      ))}
    </div>
  );
}
