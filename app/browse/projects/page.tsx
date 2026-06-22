"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import api from "@/lib/api";
import { IconFolder, IconExternalLink } from "@tabler/icons-react";

type ProjectRecord = {
  id?: string | number;
  slug?: string;
  project_slug?: string;
  name?: string;
  title?: string;
  organization?: { id?: string | number; name?: string; slug?: string } | string;
  org_slug?: string;
  organization_slug?: string;
  org?: string;
  users?: Array<{ id?: string | number; user_id?: string | number; name?: string }>;
  members?: Array<{ id?: string | number; user_id?: string | number; name?: string }>;
  project_users?: Array<{ id?: string | number; user_id?: string | number; name?: string }>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getOrgSlug(project: ProjectRecord): string {
  if (project.organization && typeof project.organization !== "string") {
    if (project.organization.slug) return project.organization.slug;
    if (project.organization.name) return slugify(project.organization.name);
  }
  if (typeof project.organization === "string") return project.organization;
  return project.org_slug || project.organization_slug || project.org || "unknown";
}

function getProjectSlug(project: ProjectRecord): string {
  return project.slug || project.project_slug || (project.name ? slugify(project.name) : String(project.id || "unknown"));
}

function getMemberCount(project: ProjectRecord): number {
  const collections = [project.users, project.members, project.project_users].filter(Array.isArray) as Array<Array<unknown>>;
  if (collections.length === 0) return 0;
  const raw = collections.flat();
  return raw.length;
}

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/projects", { params: { with_members: true } });
        const list = res?.data?.data ?? res?.data ?? [];
        setProjects(Array.isArray(list) ? list : []);
      } catch {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const totalMembers = useMemo(() => projects.reduce((sum, p) => sum + getMemberCount(p), 0), [projects]);

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Projects list</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                View accessible projects and open each project board.
              </p>
            </div>
            <div className="text-right text-sm text-gray-500 dark:text-gray-400">
              <div>Total projects: {projects.length}</div>
              <div>Known members: {totalMembers}</div>
            </div>
          </div>
        </section>

        <section className="surface-muted rounded-2xl p-4 md:p-5">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No projects available.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {projects.map((project) => {
                const orgSlug = getOrgSlug(project);
                const projectSlug = getProjectSlug(project);
                const href = `/browse/${orgSlug}/${projectSlug}`;
                const projectName = project.name || project.title || projectSlug;
                const orgName =
                  typeof project.organization === "string"
                    ? project.organization
                    : project.organization?.name || orgSlug;

                return (
                  <div key={String(project.id || projectSlug)} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{projectName}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Organisation: {orgName}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Members: {getMemberCount(project)}</div>
                      </div>
                      <div className="icon-circle icon-blue">
                        <IconFolder size={16} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Link href={href} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800">
                        Open board
                        <IconExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
