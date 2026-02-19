import { NextResponse } from "next/server";

export async function middleware(req) {
  // Temporarily disable all middleware logic to debug Turbopack issue
  return NextResponse.next();
}

export const config = {
  matcher: ["/super-admin/:path*"],
};