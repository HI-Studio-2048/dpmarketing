import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (not /admin-login or /api)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin-login")) {
    const auth = request.cookies.get("admin_auth");
    if (!auth || auth.value !== "authenticated") {
      return NextResponse.redirect(new URL("/admin-login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
