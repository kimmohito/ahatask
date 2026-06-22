"use client";

import React from "react";
import { IconChevronRight } from "@tabler/icons-react";

type Task = {
  id: string | number;
  slug?: string;
  title: string;
  subtitle?: string;
  status?: string;
  assignee?: string;
};

type Props = {
  tasks?: Task[];
  maxVisible?: number; // how many visible before scroll
  onTaskClick?: (task: Task) => void;
};

function statusColor(status?: string) {
  const s = (status || "").toLowerCase();
  if (s.includes("done") || s.includes("completed")) return "bg-emerald-400";
  if (s.includes("progress") || s.includes("in-progress")) return "bg-amber-400";
  if (s.includes("blocked") || s.includes("stalled")) return "bg-rose-400";
  return "bg-slate-300";
}

export default function TaskList({ tasks = [], maxVisible = 3, onTaskClick }: Props) {
  const sortedTasks = React.useMemo(() => {
    if (typeof window === "undefined") return tasks;

    let pins: string[] = [];
    try {
      const raw = localStorage.getItem("task-pins");
      const parsed = raw ? JSON.parse(raw) : [];
      pins = Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
    } catch {
      pins = [];
    }

    if (pins.length === 0) return tasks;

    return [...tasks].sort((a, b) => {
      const aPinned = pins.includes(String(a.id));
      const bPinned = pins.includes(String(b.id));
      if (aPinned === bPinned) return 0;
      return aPinned ? -1 : 1;
    });
  }, [tasks]);

  const visible = Math.max(3, maxVisible);
  const containerStyle: React.CSSProperties = {
    maxHeight: `${visible * 72 + 16}px`, // larger card height for nicer spacing
    overflowY: sortedTasks.length > visible ? "auto" : "hidden",
  };

  if (!sortedTasks || sortedTasks.length === 0) {
    return (
      <div className="p-4 text-sm text-(--muted)">
        <div className="font-medium">No tasks</div>
        <div className="text-xs mt-1">You have no tasks assigned here.</div>
      </div>
    );
  }

  return (
    <div style={containerStyle} className="space-y-3">
      {sortedTasks.slice(0, 10).map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onTaskClick?.(t)}
          className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-transform transform hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
        >
          <div className={`w-1 h-12 rounded ${statusColor(t.status)}`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-semibold truncate">{t.title}</div>
                {t.subtitle ? <div className="text-xs text-(--muted) truncate">{t.subtitle}</div> : null}
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs text-(--muted)">{t.status}</div>
                <div className="flex -space-x-1 items-center">
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-linear-to-br from-indigo-500 to-pink-500 text-white text-xs">{(t.assignee || "?").slice(0,1).toUpperCase()}</div>
                </div>
                <IconChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
