"use client";

import React from "react";

type UserSeries = {
  name: string;
  color: string;
  values: number[]; // per day
};

type Props = {
  users: UserSeries[];
  labels: string[]; // days
  width?: number;
  height?: number;
 };

export default function StackedBarChart({ users, labels, width = 600, height = 240 }: Props) {
  // users should be ordered so largest totals are first (bottom)
  const totals = users.map((u) => u.values.reduce((a, b) => a + b, 0));
  const order = users
    .map((u, i) => ({ i, total: totals[i] }))
    .sort((a, b) => b.total - a.total)
    .map((x) => x.i);

  const days = labels.length;
  const maxPerDay = Math.max(
    0,
    ...labels.map((_, day) => users.reduce((s, u) => s + (u.values[day] || 0), 0))
  );

  const barWidth = width / Math.max(1, days) - 8;
  const gap = 8;
  const chartHeight = height - 40;
  const hasData = users.length > 0 && maxPerDay > 0;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="block">
      {labels.map((lab, day) => {
        let y = height; // start from bottom
        // for stacking draw in order so big totals are at bottom
        return (
          <g key={day} transform={`translate(${day * (barWidth + gap) + gap / 2},0)`}> 
            {order.map((userIndex) => {
              const u = users[userIndex];
              const val = u.values[day] || 0;
              const h = maxPerDay === 0 ? 0 : (val / maxPerDay) * chartHeight;
              const rect = (
                <rect
                  key={u.name + day}
                  x={0}
                  y={y - h}
                  width={barWidth}
                  height={h}
                  fill={u.color}
                />
              );
              y = y - h;
              return rect;
            })}
            <text x={barWidth / 2} y={height - 6} fontSize={10} textAnchor="middle" fill="#666">{lab}</text>
          </g>
        );
      })}
      {!hasData ? (
        <text x={width / 2} y={height / 2 - 8} fontSize={13} textAnchor="middle" fill="var(--muted)">
          No activity data
        </text>
      ) : null}
    </svg>
  );
}
