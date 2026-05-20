import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth disabled — all routes are public
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}
