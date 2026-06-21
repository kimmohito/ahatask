"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import useAuthStore from "@/lib/authStore";
import useUiStore from "@/lib/uiStore";

export default function Sidebar() {
    const { theme, setTheme } = useTheme();
    const isAuthenticated = useAuthStore((s) => !!s.isAuthenticated);
    const [mounted, setMounted] = useState(false);
    const getToken = useAuthStore((s) => s.getToken);
    const [open, setOpen] = useState({ tasks: false });
    const [projects, setProjects] = useState<any[]>([]);
    const pathname = usePathname();
    const router = useRouter();
    const collapsed = useUiStore((s) => s.collapsed);
    const pinned = useUiStore((s) => s.pinned);
    const setPinned = useUiStore((s) => s.setPinned);
    const setCollapsed = useUiStore((s) => s.setCollapsed);
    const [peek, setPeek] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if(!isAuthenticated){
            setProjects([]);
        } else {
            const load = async () => {
                try {
                    const res = await api.get("/api/projects");
                    // accept res.data or res.data.data
                    const list = res?.data?.data ?? res?.data ?? [];
                    setProjects(list);
                } catch (e) {
                    console.log("Failed to load projects", e);
                }
            };
            load();
        }
    }, [isAuthenticated]);
    
    const goAllTasks = () => {
        setOpen((s) => ({ ...s, tasks: true }));
        if(pathname?.startsWith("/browse")) return;
        router.push("/browse");
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
    
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const onResize = () => {
            if (typeof window !== "undefined") setIsMobile(window.innerWidth < 768);
        };
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Since there is only one organization, present a flat project list
    const projectList = projects || [];
    const orgSlugDefault = projectList.length ? getOrgSlug(projectList[0]) : "";
    
    // mobile: render a full-width slide-in sidebar under the topbar
    if (isMobile) {
        const visible = !collapsed;
        return (
            <div
                style={{
                    position: "fixed",
                    top: 64,
                    left: 0,
                    width: "100vw",
                    height: "calc(100vh - 64px)",
                    zIndex: 50,
                    transition: "transform 200ms ease",
                    transform: visible ? "translateX(0)" : "translateX(-100%)",
                    overflow: "hidden",
                    boxSizing: "border-box",
                    background: "transparent",
                }}
            >
                <aside style={{ width: "100%", padding: 12, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 96px)", boxSizing: 'border-box', borderRight: "1px solid #ddd", background: "white"   }}
                
                
                    className="border-r border-gray-200 dark:border-gray-800 bg-red-400"
                >
                    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
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
                                                        <Link href={`/browse/${orgSlug}/${slug}`} className="flex items-center">
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

                        <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>Theme</div>
                                <div>
                                    {mounted ? (
                                        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "Switch to light" : "Switch to dark"}</button>
                                    ) : (
                                        <button aria-hidden className="opacity-0 pointer-events-none">Loading...</button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 16, paddingTop: 12 }}>
                            <nav>
                                <ul style={{ paddingLeft: 0 }}>
                                    {mounted && (() => {
                                        const token = getToken();
                                        if (!token) return null;
                                        try {
                                            const parts = token.split('.');
                                            if (parts.length < 2) return null;
                                            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                                            const isAdmin = payload?.is_admin || payload?.role === 'admin' || (Array.isArray(payload?.roles) && payload.roles.includes('admin'));
                                            if (!isAdmin) return null;
                                            return (
                                                <li style={{ marginBottom: 8 }}>
                                                    <Link href="/admin/users" className="flex items-center">
                                                        Users
                                                    </Link>
                                                </li>
                                            );
                                        } catch (e) {
                                            return null;
                                        }
                                    })()}
                                </ul>
                            </nav>
                        </div>
                    </div>
                </aside>
            </div>
        );
    }

    // when collapsed & not pinned: show a narrow edge that can be hovered to peek
    if (collapsed && !pinned) {
        return (
            <>
                <div
                    onMouseEnter={() => setPeek(true)}
                    onMouseLeave={() => setPeek(false)}
                    className="fixed left-0 top-0 h-full z-40 flex items-start"
                    style={{ width: 44, background: "transparent" }}
                >
                    <div className="ml-2 mt-4 p-2 rounded bg-transparent">☰</div>
                </div>

                    {peek ? (
                    <div
                        onMouseEnter={() => setPeek(true)}
                        onMouseLeave={() => setPeek(false)}
                        className="fixed left-0 top-0 h-full z-50 shadow-lg bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
                        style={{ width: 280, transform: "translateX(12px)", transition: "transform 200ms ease" }}
                    >
                        <div style={{ padding: 12, maxHeight: '100vh', overflowY: 'auto', boxSizing: 'border-box' }}>
                            {/* reuse normal sidebar content */}
                            <nav>
                                <div style={{ marginBottom: 12 }}>
                                    <Link href="/dashboard">Dashboard</Link>
                                </div>

                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <button onClick={() => { setPinned(true); setCollapsed(false); }}>Tasks</button>
                                        <button onClick={() => setOpen((s) => ({ ...s, tasks: !s.tasks }))}>{open.tasks ? "−" : "+"}</button>
                                    </div>

                                    {open.tasks && (
                                        <div style={{ marginTop: 8 }}>
                                            {projects.length === 0 && <div>No projects</div>}

                                            <ul style={{ paddingLeft: 12 }}>
                                                {projects.map((p: any) => {
                                                    const slug = p.slug || p.project_slug || p.name?.toLowerCase().replace(/\s+/g, "-") || String(p.id);
                                                    let orgSlug = getOrgSlug(p);
                                                    if (!orgSlug || orgSlug === "unknown") orgSlug = orgSlugDefault;
                                                    return (
                                                        <li key={p.id} style={{ marginBottom: 6 }}>
                                                            <Link href={`/browse/${orgSlug}/${slug}`} className="flex items-center">
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
                            <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>Theme</div>
                                    <div>
                                        {mounted ? (
                                            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "Switch to light" : "Switch to dark"}</button>
                                        ) : (
                                            <button aria-hidden className="opacity-0 pointer-events-none">Loading...</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </>
        );
    }

    return (
        <aside style={{ width: 280, padding: 12, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 96px)', boxSizing: 'border-box' }}>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                <nav>
                    <div style={{ marginBottom: 12 }}>
                        <Link href="/dashboard">Dashboard</Link>
                    </div>

                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <button onClick={goAllTasks}>Projects</button>
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
                                                <Link href={`/browse/${orgSlug}/${slug}`} className="flex items-center">
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

                <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>Theme</div>
                        <div>
                            {mounted ? (
                                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                                    {theme === "dark" ? "Switch to light" : "Switch to dark"}
                                </button>
                            ) : (
                                <button aria-hidden className="opacity-0 pointer-events-none">Loading...</button>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 16, paddingTop: 12 }}>
                    <nav>
                        <ul style={{ paddingLeft: 0 }}>
                            {mounted && (() => {
                                const token = getToken();
                                if (!token) return null;
                                try {
                                    const parts = token.split('.');
                                    if (parts.length < 2) return null;
                                    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                                    const isAdmin = payload?.is_admin || payload?.role === 'admin' || (Array.isArray(payload?.roles) && payload.roles.includes('admin'));
                                    if (!isAdmin) return null;
                                    return (
                                        <li style={{ marginBottom: 8 }}>
                                            <Link href="/admin/users" className="flex items-center">
                                                Users
                                            </Link>
                                        </li>
                                    );
                                } catch (e) {
                                    return null;
                                }
                            })()}
                        </ul>
                    </nav>
                </div>
            </div>
        </aside>
    );
}
