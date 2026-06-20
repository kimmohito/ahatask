"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
    const [open, setOpen] = useState({ tasks: false });
    const [projects, setProjects] = useState<any[]>([]);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get("/api/projects");
                // accept res.data or res.data.data
                const list = res?.data?.data ?? res?.data ?? [];
                setProjects(list);
            } catch (e) {
                setProjects([]);
            }
        };

        load();
    }, []);

    const goAllTasks = () => {
        setOpen((s) => ({ ...s, tasks: true }));
        router.push("/tasks");
    };

    const slugify = (s: string) =>
        s
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-");

    const getOrgSlug = (p: any) => {
        // possible shapes: p.organization: { slug }, p.organization: 'org-slug', p.org_slug, p.organization_slug
        if (!p) return "unknown";
        if (p.organization) {
            if (typeof p.organization === "string") return p.organization;
            if (p.organization.slug) return p.organization.slug;
            if (p.organization.name) return slugify(p.organization.name);
        }

        if (p.org_slug) return p.org_slug;
        if (p.organization_slug) return p.organization_slug;
        if (p.org) return p.org;

        return "unknown";
    };

    const getOrgLabel = (p: any) => {
        if (!p) return "unknown";
        if (p.organization) {
            if (typeof p.organization === "string") return p.organization;
            if (p.organization.name) return p.organization.name;
            if (p.organization.slug) return p.organization.slug;
        }
        return p.org_name || p.organization_name || getOrgSlug(p);
    };

    // Since there is only one organization, present a flat project list
    const projectList = projects || [];
    const orgSlugDefault = projectList.length ? getOrgSlug(projectList[0]) : "";

    return (
        <nav>
            <div style={{ marginBottom: 12 }}>
                <Link href="/dashboard">Dashboard</Link>
            </div>

            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={goAllTasks}>Tasks</button>
                    <button onClick={() => setOpen((s) => ({ ...s, tasks: !s.tasks }))}>{open.tasks ? "−" : "+"}</button>
                </div>

                {open.tasks && (
                    <div style={{ marginTop: 8 }}>
                        {projectList.length === 0 && <div>No projects</div>}

                        <ul style={{ paddingLeft: 12 }}>
                            {projectList.map((p: any) => {
                                const slug = p.slug || p.project_slug || p.name?.toLowerCase().replace(/\s+/g, "-") || String(p.id);
                                let orgSlug = getOrgSlug(p);
                                if (!orgSlug || orgSlug === "unknown") orgSlug = orgSlugDefault;
                                return (
                                    <li key={p.id} style={{ marginBottom: 6 }}>
                                        <Link href={`/tasks/${orgSlug}/${slug}`}>
                                            {p.name || p.title || slug}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </nav>
    );
}
