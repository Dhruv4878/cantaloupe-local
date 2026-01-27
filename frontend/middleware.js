import { NextResponse } from "next/server";

export async function middleware(req) {
  const url = req.nextUrl;
  const path = url.pathname;

  const isLoginPage = path.startsWith("/super-admin/auth/login");
  const isSuperAdminRoute = path.startsWith("/super-admin");

  // Not a super-admin route → allow
  if (!isSuperAdminRoute) return NextResponse.next();

  // Allow login page
  if (isLoginPage) return NextResponse.next();

  // Correct way to read the cookie
  const token = req.cookies.get("super_admin_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/super-admin/auth/login", req.url));
  }

  // Optional validation
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${apiUrl}/super-admin/me`, {
      method: "GET",
      headers: {
        Cookie: `super_admin_token=${token}`,
      },
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL("/super-admin/auth/login", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Middleware Error:", err);
    return NextResponse.redirect(new URL("/super-admin/auth/login", req.url));
  }
}

export const config = {
  matcher: ["/super-admin/:path*"],
};
