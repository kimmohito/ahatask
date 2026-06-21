"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import useAuthStore from "@/lib/authStore";
import useUiStore from "@/lib/uiStore";
import {
    IconLayoutDashboard,
    IconFolder,
    IconFolderOpen,
    IconChevronDown,
    IconChevronRight,
    IconUsers,
    IconSun,
    IconMoon,
} from "@tabler/icons-react";

// ─── shared nav item ──────────────────────────────────────────────────────────
function NavItem({
    href,
    icon,
    label,
    active,
    onClick,
    children,
    open,
    onToggle,
}: {
    href?: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
    children?: React.ReactNode;
    open?: boolean;
    onToggle?: () => void;
}) {
    const base =
        "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 group";
    const activeClass =
        "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400";
    const idleClass =
        "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100";

    const inner = (
        <span className={`${base} ${active ? activeClass : idleClass}`}>
            <span className={`shrink-0 ${active ? "text-indigo-500 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`}>
                {icon}
            </span>
            <span className="flex-1 text-left truncate">{label}</span>
            {onToggle && (
                <span className="shrink-0 text-gray-400 transition-transform duration-150" style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>
                    <IconChevronDown size={15} />
                </span>
            )}
        </span>
    );

    if (onToggle) {
        return (
            <div>
                <button onClick={onToggle} className="w-full text-left">{inner}</button>
                {open && <div className="mt-1 ml-3 pl-3 border-l border-gray-200 dark:border-gray-700 space-y-0.5">{children}</div>}
            </div>
        );
    }

    if (href) {
        return <Link href={href} onClick={onClick}>{inner}</Link>;
    }

    return <button onClick={onClick} className="w-full text-left">{inner}</button>;
}

function SubItem({ href, label, active }: { href: string; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`block px-3 py-1.5 rounded-md text-sm transition-colors duration-150 truncate ${
                active
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
        >
            {label}
        </Link>
    );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar() {
    const { theme, setTheme } = useTheme();
    const isAuthenticated = useAuthStore((s) => !!s.isAuthenticated);
    const [mounted, setMounted] = useState(false);
    const getToken = useAuthStore((s) => s.getToken);
    const [open, setOpen] = useState({ projects: false });
    const [projects, setProjects] = useState<any[]>([]);
    const pathname = usePathname();
    const router = useRouter();
    const collapsed = useUiStore((s) => s.collapsed);
    const pinned = useUiStore((s) => s.pinned);
    const setPinned = useUiStore((s) => s.setPinned);
    const setCollapsed = useUiStore((s) => s.setCollapsed);
    const [peek, setPeek] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const getAuthPayload = () => {
        const token = getToken();
        if (!token) return null;
        try {
            const parts = token.split(".");
            if (parts.length < 2) return null;
            return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        } catch {
            return null;
        }
    };

    const getCurrentUserId = () => {
        const payload = getAuthPayload();
        const uid = payload?.id ?? payload?.user_id ?? payload?.sub ?? null;
        return uid !== null && uid !== undefined ? String(uid) : null;
    };

    const isPayloadAdmin = (payload: any): boolean => {
        if (!payload) return false;
        const role = String(payload?.role || "").toLowerCase();
        const roles = Array.isArray(payload?.roles)
            ? payload.roles
                  .map((r: any) => (typeof r === "string" ? r : r?.name || r?.slug || r?.role || ""))
                  .map((r: string) => r.toLowerCase())
            : [];
        const adminRoles = new Set(["admin", "super admin", "super_admin", "superadmin"]);
        return !!payload?.is_admin || adminRoles.has(role) || roles.some((r: string) => adminRoles.has(r));
    };

    const projectHasUser = (project: any, userId: string | null): boolean => {
        if (!project || !userId) return false;
        const uid = String(userId);

        const directKeys = ["owner_id", "created_by", "created_by_id", "user_id", "assignee_id"];
        for (const key of directKeys) {
            if (project[key] !== undefined && project[key] !== null && String(project[key]) === uid) return true;
        }

        const collectionKeys = ["users", "members", "assignees", "team", "project_users"];
        for (const key of collectionKeys) {
            const list = project[key];
            if (!Array.isArray(list)) continue;
            const found = list.some((u: any) => {
                const id = u?.id ?? u?.user_id ?? u?.member_id ?? u?.pivot?.user_id;
                return id !== undefined && id !== null && String(id) === uid;
            });
            if (found) return true;
        }

        return false;
    };

    const hasMembershipHints = (project: any): boolean => {
        if (!project) return false;
        if (project.owner_id || project.created_by || project.created_by_id || project.user_id || project.assignee_id) {
            return true;
        }
        const collectionKeys = ["users", "members", "assignees", "team", "project_users"];
        return collectionKeys.some((key) => Array.isArray(project[key]) && project[key].length > 0);
    };

    useEffect(() => {
        if (!isAuthenticated) {
            setProjects([]);
        } else {
            const load = async () => {
                try {
                    const payload = getAuthPayload();
                    const userId = getCurrentUserId();
                    const admin = isPayloadAdmin(payload);

                    const res = await api.get("/api/projects", {
                        params: admin
                            ? undefined
                            : {
                                  mine: true,
                                  member_only: true,
                                  user_id: userId,
                                  with_members: true,
                              },
                    });
                    const list = res?.data?.data ?? res?.data ?? [];
                    if (admin) {
                        setProjects(Array.isArray(list) ? list : []);
                    } else {
                        const arr = Array.isArray(list) ? list : [];
                        const includesMembershipData = arr.some((p: any) => hasMembershipHints(p));
                        if (includesMembershipData) {
                            const scoped = arr.filter((p: any) => projectHasUser(p, userId));
                            setProjects(scoped);
                        } else {
                            // Backend already scoped results (e.g., via project_user join) but didn't include member arrays.
                            setProjects(arr);
                        }
                    }
                } catch (e) {
                    console.log("Failed to load projects", e);
                    setProjects([]);
                }
            };
            load();
        }
    }, [isAuthenticated, getToken]);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768);
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const slugify = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");

    const getOrgSlug = (p: any): string => {
        if (!p) return "unknown";
        if (p.organization) {
            if (typeof p.organization === "string") return p.organization;
            if (p.organization.slug) return p.organization.slug;
            if (p.organization.name) return slugify(p.organization.name);
        }
        return p.org_slug || p.organization_slug || p.org || "unknown";
    };

    const projectList = projects || [];
    const orgSlugDefault = projectList.length ? getOrgSlug(projectList[0]) : "";

    const isAdmin = mounted && (() => {
        const token = getToken();
        if (!token) return false;
        try {
            const parts = token.split(".");
            if (parts.length < 2) return false;
            const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
            return isPayloadAdmin(payload);
        } catch { return false; }
    })();

    // ── shared nav content ──────────────────────────────────────────────────
    const navContent = (
        <div className="flex flex-col justify-start h-full">
            <nav className="pace-y-0.5 p-2">
                <NavItem
                    href="/dashboard"
                    icon={<IconLayoutDashboard size={18} />}
                    label="Dashboard"
                    active={pathname === "/dashboard"}
                />

                <NavItem
                    icon={open.projects ? <IconFolderOpen size={18} /> : <IconFolder size={18} />}
                    label="Projects"
                    active={pathname?.startsWith("/browse")}
                    open={open.projects}
                    onToggle={() => setOpen((s) => ({ ...s, projects: !s.projects }))}
                >
                    {projectList.length === 0 ? (
                        <p className="px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500">No projects</p>
                    ) : (
                        projectList.map((p: any) => {
                            const slug = p.slug || p.project_slug || p.name?.toLowerCase().replace(/\s+/g, "-") || String(p.id);
                            let orgSlug = getOrgSlug(p);
                            if (!orgSlug || orgSlug === "unknown") orgSlug = orgSlugDefault;
                            const href = `/browse/${orgSlug}/${slug}`;
                            return (
                                <SubItem
                                    key={p.id}
                                    href={href}
                                    label={p.name || p.title || slug}
                                    active={pathname === href || pathname?.startsWith(href + "/")}
                                />
                            );
                        })
                    )}
                </NavItem>

                {isAdmin && (
                    <NavItem
                        href="/admin/users"
                        icon={<IconUsers size={18} />}
                        label="Users"
                        active={pathname?.startsWith("/admin/users")}
                    />
                )}
            </nav>

            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                {mounted ? (
                    <NavItem
                        icon={theme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
                        label={theme === "dark" ? "Light mode" : "Dark mode"}
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    />
                ) : (
                    <div className="h-10" />
                )}
            </div>
        </div>
    );

    // ── mobile: full-width slide-in under topbar ─────────────────────────────
    if (isMobile) {
        return (
            <div
                className="fixed left-0 z-50 w-screen overflow-hidden bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
                style={{
                    top: 64,
                    height: "calc(100vh - 64px)",
                    transition: "transform 200ms ease",
                    transform: collapsed ? "translateX(-100%)" : "translateX(0)",
                }}
            >
                {navContent}
            </div>
        );
    }

    // ── desktop collapsed: peek on hover ────────────────────────────────────
    if (collapsed) {
        return (
            <>
                <div
                    onMouseEnter={() => setPeek(true)}
                    onMouseLeave={() => setPeek(false)}
                    className="fixed left-0 top-0 h-full z-40 flex items-start pt-16"
                    style={{ width: 44 }}
                >
                    <div className="ml-2 p-1.5 rounded card-dashboard text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <IconFolder size={18} />
                    </div>
                </div>

                {peek && (
                    <div
                        onMouseEnter={() => setPeek(true)}
                        onMouseLeave={() => setPeek(false)}
                        className="fixed top-0 h-full z-50 shadow-xl bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
                        style={{ width: 260, left: 0, transform: "translateX(12px)", transition: "transform 200ms ease" }}
                    >
                        {navContent}
                    </div>
                )}
            </>
        );
    }

    // ── desktop pinned/open ──────────────────────────────────────────────────
    return (
        <aside className="card-dashboard border-r border-gray-200 dark:border-gray-700" style={{ width: 260, minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
            {navContent}
        </aside>
    );
}
