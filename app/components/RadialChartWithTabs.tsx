"use client";

import React, { useState } from "react";

type Props = {
  totalOwned: number;
  totalAll: number;
  onFilterChange?: (filter: string) => void;
};

export default function RadialChartWithTabs({ totalOwned, totalAll, onFilterChange }: Props) {
  const [tab, setTab] = useState("all");
  const percent = totalAll === 0 ? 0 : Math.round((totalOwned / totalAll) * 100);

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
        <div className="space-x-2">
          <button onClick={() => change("all")} className={`px-2 py-1 rounded ${tab==="all"?"bg-gray-200 dark:bg-gray-700":""}`}>All</button>
          <button onClick={() => change("todo")} className={`px-2 py-1 rounded ${tab==="todo"?"bg-gray-200 dark:bg-gray-700":""}`}>Todo</button>
          <button onClick={() => change("inprogress")} className={`px-2 py-1 rounded ${tab==="inprogress"?"bg-gray-200 dark:bg-gray-700":""}`}>In Progress</button>
        </div>
      </div>

      <div className="flex items-center">
        <svg width={size} height={size} className="mr-4">
          <g transform={`translate(${size / 2}, ${size / 2})`}>
            <circle r={radius} stroke="#e5e7eb" strokeWidth={stroke} fill="transparent" cx={0} cy={0} />
            <circle
              r={radius}
              stroke="#2563eb"
              strokeWidth={stroke}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90)`}
              fill="transparent"
            />
            <text x={0} y={4} textAnchor="middle" fontSize={20} fill="#111">{percent}%</text>
          </g>
        </svg>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-300">You own</div>
          <div className="text-lg font-semibold">{totalOwned} / {totalAll}</div>
        </div>
      </div>
    </div>
  );
}
