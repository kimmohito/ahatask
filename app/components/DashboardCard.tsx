"use client";

import React from "react";

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
};

export default function DashboardCard({ title, value, subtitle, accent, icon, iconBg, iconColor }: Props) {
  const valueClass = `text-2xl font-semibold mt-1 ${""}`;
  // apply iconColor as a tailwind text class (e.g., 'text-red-600') or as inline color
  const valueClassWithColor = (iconColor?: string) =>
    iconColor && iconColor.startsWith("text-") ? `${valueClass} ${iconColor}` : valueClass;

  const valueStyle = (iconColor?: string) =>
    iconColor && !iconColor.startsWith("text-") ? { color: iconColor } : undefined;

  // ensure icon scales to the full height of the card's content
  const iconElement = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement, { style: { height: "100%", width: "auto", color: "inherit" } })
    : icon;

  return (
    <div className="dashboard-card">
      <div className="flex items-stretch justify-between">
        <div className="flex flex-col justify-center">
          <div className="text-sm text-gray-500 dark:text-gray-300">{title}</div>
          <div className={valueClassWithColor(iconColor ?? undefined)} style={valueStyle(iconColor ?? undefined)}>
            {value}
          </div>
        </div>

        <div className="flex items-center h-full">
          {accent ? (
            <div className={`px-2 py-1 rounded text-sm font-medium ${accent} mr-3`}>{subtitle}</div>
          ) : null}

          {icon ? (
            <div className={`${iconBg ?? "bg-gray-100 dark:bg-gray-700"} rounded-full flex items-center justify-center h-full`}>
              <div className="h-full flex items-center justify-center" style={{ padding: 6 }}>
                {iconElement}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
