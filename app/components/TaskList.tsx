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
    maxHeight: `${visible * 56 + 12}px`, // slightly larger item height for breathing room
    overflowY: tasks.length > visible ? "auto" : "hidden",
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-4 text-sm" style={{ color: "var(--muted)" }}>
        <div className="font-medium">No tasks</div>
        <div className="text-xs mt-1">You have no tasks assigned here.</div>
      </div>
    );
  }

  return (
    <div style={containerStyle} className="space-y-2">
      {tasks.slice(0, 10).map((t) => (
        <div key={t.id} className="flex items-start justify-between p-3 rounded hover:hue-rotate-30" style={{ alignItems: "center" }}>
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{t.title}</div>
            {t.subtitle ? <div className="text-xs" style={{ color: "var(--muted)" }}>{t.subtitle}</div> : null}
          </div>
          <div className="ml-3 text-xs" style={{ color: "var(--muted)" }}>{t.status}</div>
        </div>
      ))}
    </div>
  );
}
