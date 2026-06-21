import { NextRequest, NextResponse } from "next/server";

// Routes that do NOT require authentication
const PUBLIC_PATHS = ["/login", "/api/auth", "/api/login", "/_next", "/favicon.ico"];

function isPublic(pathname: string): boolean {
    return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));
}

function isTokenValid(token: string): boolean {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return false;
        const payload = JSON.parse(
            Buffer.from(
                parts[1].replace(/-/g, "+").replace(/_/g, "/"),
                "base64"
            ).toString("utf-8")
        );
        if (!payload?.exp) return false;
        return payload.exp > Date.now() / 1000;
    } catch {
        return false;
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const raw = request.cookies.get("token")?.value;
    const token = raw ? decodeURIComponent(raw) : null;
    const authenticated = !!token && isTokenValid(token);

    // Authenticated user trying to access /login → send to dashboard
    if (pathname === "/login" && authenticated) {
        const dashUrl = request.nextUrl.clone();
        dashUrl.pathname = "/dashboard";
        dashUrl.search = "";
        return NextResponse.redirect(dashUrl);
    }

    // Allow public paths through (unauthenticated is fine)
    if (isPublic(pathname)) {
        return NextResponse.next();
    }

    // Redirect root to dashboard (authenticated) or login (not)
    if (pathname === "/") {
        const target = request.nextUrl.clone();
        target.pathname = authenticated ? "/dashboard" : "/login";
        target.search = "";
        return NextResponse.redirect(target);
    }

    // Protected route — must be authenticated
    if (!authenticated) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.search = "";
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all paths except Next.js internals and static files
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
