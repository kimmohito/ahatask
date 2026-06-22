"use client";

import React, { useState } from "react";

type Props = {
  totalOwned: number;
  totalAll: number;
  byStatus?: {
    todo?: number;
    in_progress?: number;
    completed?: number;
    other?: number;
  };
  onFilterChange?: (filter: string) => void;
};

export default function RadialChartWithTabs({ totalOwned, totalAll, byStatus, onFilterChange }: Props) {
  const [tab, setTab] = useState("all");
  const selectedValue =
    tab === "todo"
      ? byStatus?.todo ?? 0
      : tab === "in_progress"
      ? byStatus?.in_progress ?? 0
      : tab === "completed"
      ? byStatus?.completed ?? 0
      : totalOwned;
  const safeTotal = Math.max(0, totalAll);
  const rawPercent = safeTotal === 0 ? 0 : Math.round((selectedValue / safeTotal) * 100);
  const percent = Math.max(0, Math.min(100, rawPercent));

  const size = 120;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  function change(t: string) {
    setTab(t);
    onFilterChange?.(t);
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-500 dark:text-gray-300">Ownership</div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => change("all")} className={`px-2 py-1 rounded ${tab==="all"?"bg-gray-200 dark:bg-gray-700":""}`}>All</button>
          <button onClick={() => change("todo")} className={`px-2 py-1 rounded ${tab==="todo"?"bg-gray-200 dark:bg-gray-700":""}`}>Todo</button>
          <button onClick={() => change("in_progress")} className={`px-2 py-1 rounded ${tab==="in_progress"?"bg-gray-200 dark:bg-gray-700":""}`}>In Progress</button>
          <button onClick={() => change("completed")} className={`px-2 py-1 rounded ${tab==="completed"?"bg-gray-200 dark:bg-gray-700":""}`}>Completed</button>
        </div>
      </div>

      <div className="flex items-center">
        <svg width={size} height={size} className="mr-4">
          <g transform={`translate(${size / 2}, ${size / 2})`}>
            <circle r={radius} stroke="var(--accent-blue-100)" strokeWidth={stroke} fill="transparent" cx={0} cy={0} />
            <circle
              r={radius}
              stroke="var(--accent-blue)"
              strokeWidth={stroke}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90)`}
              fill="transparent"
            />
            <text x={0} y={4} textAnchor="middle" fontSize={20} fill="var(--foreground)">{percent}%</text>
          </g>
        </svg>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-300">
            {tab === "all" ? "You own" : `${tab.replace("_", " ")} tasks`}
          </div>
          <div className="text-lg font-semibold">{selectedValue} / {safeTotal}</div>
        </div>
      </div>
    </div>
  );
}
