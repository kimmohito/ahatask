"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import AppShell from "../components/AppShell";
import {
  IconArrowRight,
  IconChecklist,
  IconClock,
  IconFolder,
  IconSearch,
} from "@tabler/icons-react";

type ProjectMember = {
  id?: string | number;
  user_id?: string | number;
  member_id?: string | number;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  pivot?: { user_id?: string | number; role?: string };
};

type ProjectRecord = {
  id?: string | number;
  slug?: string;
  project_slug?: string;
  name?: string;
  title?: string;
  users?: ProjectMember[];
  members?: ProjectMember[];
  team?: ProjectMember[];
  project_users?: ProjectMember[];
  assignees?: ProjectMember[];
};

type Task = {
  id: string | number;
  slug?: string;
  task_slug?: string;
  title?: string;
  status?: string;
  priority?: string;
  project?: ({ name?: string; slug?: string } & Partial<ProjectRecord>) | string;
  project_slug?: string;
  organization?: { name?: string; slug?: string } | string;
  org_slug?: string;
  org?: string;
  assignee_name?: string;
  assignee?: { name?: string } | string;
  reporter_name?: string;
  reporter?: { name?: string } | string;
  created_by_name?: string;
  created_by?: { name?: string } | string;
  updated_at?: string;
  created_at?: string;
}

function getMemberName(member: ProjectMember | string | null | undefined) {
  if (!member) return "";
  if (typeof member === "string") return member;
  return member.name || member.username || member.email || "";
}

function extractProjectMembers(project: Partial<ProjectRecord> | string | undefined): string[] {
  if (!project || typeof project === "string") return [];

  const collections = [project.users, project.members, project.team, project.project_users, project.assignees];
  const names = collections
    .filter(Array.isArray)
    .flatMap((items) => (items || []).map((member) => getMemberName(member)).filter(Boolean));

  return Array.from(new Set(names));
}

function getProjectLookupKeys(project: Partial<ProjectRecord> | string | undefined, projectSlug?: string) {
  if (!project || typeof project === "string") {
    return projectSlug ? [String(projectSlug)] : [];
  }

  return Array.from(
    new Set(
      [project.slug, project.project_slug, project.name, project.title, projectSlug]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
    )
  );
};


function formatDate(value?: string) {
  if (!value) return "No recent update";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

function statusTone(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("done") || normalized.includes("closed")) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (normalized.includes("progress") || normalized.includes("doing")) {
    return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  }
  if (normalized.includes("open") || normalized.includes("todo")) {
    return "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
  }
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
}

export default function GlobalTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [projectMembers, setProjectMembers] = useState<Record<string, string[]>>({});

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/tasks");
      setTasks(res?.data?.data ?? res?.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      const res = await api.get("/api/projects", { params: { with_members: true } });
      const list = res?.data?.data ?? res?.data ?? [];
      if (!Array.isArray(list)) {
        setProjectMembers({});
        return;
      }

      const next: Record<string, string[]> = {};
      list.forEach((project: ProjectRecord) => {
        const names = extractProjectMembers(project);
        if (names.length === 0) return;

        getProjectLookupKeys(project).forEach((key) => {
          next[key] = names;
        });
      });

      setProjectMembers(next);
    } catch {
      setProjectMembers({});
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProjectMembers();
  }, []);

  const filteredTasks = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return tasks;

    return tasks.filter((task) => {
      const projectName = typeof task.project === "string" ? task.project : task.project?.name || "";
      const organizationName = typeof task.organization === "string" ? task.organization : task.organization?.name || "";
      const assigneeName =
        task.assignee_name ||
        (typeof task.assignee === "string" ? task.assignee : task.assignee?.name) ||
        "";
      const reporterName =
        task.reporter_name ||
        (typeof task.reporter === "string" ? task.reporter : task.reporter?.name) ||
        task.created_by_name ||
        (typeof task.created_by === "string" ? task.created_by : task.created_by?.name) ||
        "";

      return [task.title, task.status, task.priority, projectName, organizationName, assigneeName, reporterName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [tasks, query]);

  const totalTasks = tasks.length;
  const openTasks = tasks.filter((task) => {
    const status = String(task.status || "").toLowerCase();
    return status.includes("open") || status.includes("todo") || status.includes("progress");
  }).length;
  const doneTasks = tasks.filter((task) => {
    const status = String(task.status || "").toLowerCase();
    return status.includes("done") || status.includes("closed");
  }).length;
  const projectCount = new Set(
    tasks.map((task) => {
      const projectName = typeof task.project === "string" ? task.project : task.project?.name;
      return projectName || task.project_slug || "unknown-project";
    })
  ).size;

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-linear-to-br from-white via-white to-sky-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                <IconChecklist size={14} />
                Global task browser
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">All Tasks</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Browse every visible task across projects with a cleaner overview.
                </p>
              </div>
            </div>

            <div className="relative w-full lg:w-80">
              <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, project, assignee, status..."
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900 pl-10 pr-3 py-2.5 text-sm outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="surface-muted rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total</div>
                  <div className="mt-1 text-2xl font-semibold">{totalTasks}</div>
                </div>
                <div className="icon-circle icon-blue">
                  <IconChecklist size={18} />
                </div>
              </div>
            </div>

            <div className="surface-muted rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Active</div>
                  <div className="mt-1 text-2xl font-semibold">{openTasks}</div>
                </div>
                <div className="icon-circle icon-yellow">
                  <IconClock size={18} />
                </div>
              </div>
            </div>

            <div className="surface-muted rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Completed</div>
                  <div className="mt-1 text-2xl font-semibold">{doneTasks}</div>
                </div>
                <div className="icon-circle icon-green">
                  <IconChecklist size={18} />
                </div>
              </div>
            </div>

            <div className="surface-muted rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Projects</div>
                  <div className="mt-1 text-2xl font-semibold">{projectCount}</div>
                </div>
                <div className="icon-circle icon-indigo">
                  <IconFolder size={18} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-muted rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Task Directory</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredTasks.length} result{filteredTasks.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                <IconSearch size={20} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">No tasks found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try a different search term or refresh when more tasks are available.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
              {filteredTasks.map((t) => {
                const orgSlug = t.organization && typeof t.organization !== "string" ? t.organization.slug : t.org_slug || t.org || "";
                const projectSlug = t.project && typeof t.project !== "string" ? t.project.slug : t.project_slug || t.project || "";
                const taskSlug = t.slug || t.task_slug || t.id;
                const projectName = typeof t.project === "string" ? t.project : t.project?.name || "Project";
                const assigneeName = t.assignee_name || (typeof t.assignee === "string" ? t.assignee : t.assignee?.name) || "Unassigned";
                const reporterName =
                  t.reporter_name ||
                  (typeof t.reporter === "string" ? t.reporter : t.reporter?.name) ||
                  t.created_by_name ||
                  (typeof t.created_by === "string" ? t.created_by : t.created_by?.name) ||
                  "Unknown";
                const inlineMembers = extractProjectMembers(t.project);
                const lookupKeys = getProjectLookupKeys(t.project, projectSlug);
                const mappedMembers = lookupKeys.flatMap((key) => projectMembers[key] || []);
                const teamMembers = Array.from(new Set([...inlineMembers, ...mappedMembers]));

                return (
                  <Link
                    key={String(t.id)}
                    href={`/task/${taskSlug}`}
                    className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1">{orgSlug || "org"}</span>
                          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1">{projectName}</span>
                        </div>
                        <h3 className="mt-3 truncate text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-sky-600 dark:group-hover:text-sky-300">
                          {t.title || "Untitled task"}
                        </h3>
                      </div>

                      <div className="rounded-full bg-sky-50 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300">
                        <IconArrowRight size={16} />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full px-2.5 py-1 font-medium ${statusTone(t.status)}`}>
                        {t.status || "Unknown status"}
                      </span>
                      <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-gray-600 dark:text-gray-300">
                        Priority: {t.priority || "-"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-500 dark:text-gray-400 md:grid-cols-2">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Assignee:</span> {assigneeName}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Reporter:</span> {reporterName}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Project slug:</span> {projectSlug || "-"}
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Updated:</span> {formatDate(t.updated_at || t.created_at)}
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Team members:</span>{" "}
                        {teamMembers.length > 0 ? teamMembers.join(", ") : "No team data yet"}
                      </div>
                    </div>

                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-600 dark:text-sky-300">
                      <span>Open task</span>
                      <IconArrowRight size={14} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
