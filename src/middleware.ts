import { NextRequest, NextResponse } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Whitelist: allow login and logout endpoints without auth
  if (
    pathname === "/admin-login" ||
    pathname.startsWith("/api/admin/login") ||
    pathname.startsWith("/api/admin/logout") ||
    pathname.startsWith("/api/leads") ||
    pathname === "/" ||
    pathname === "/api/email/webhook" ||
    pathname === "/api/email/unsubscribe"
  ) {
    return NextResponse.next();
  }

  // Check if trying to access /admin or /api/admin
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const adminAuthCookie = request.cookies.get("admin_auth")?.value;

    // Verify the admin_auth cookie
    if (adminAuthCookie !== ADMIN_SECRET) {
      // For API routes, return 401
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // For page routes, redirect to login
      return NextResponse.redirect(new URL("/admin-login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
