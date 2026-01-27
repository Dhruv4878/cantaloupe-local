"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function SuperAdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  // If the current route is an auth page (login, etc.), don't render the
  // super-admin shell (sidebar/topbar). Instead, render the page content
  // directly so auth pages can have their own layout.
  const isAuthRoute = pathname?.startsWith("/super-admin/auth");

  if (isAuthRoute) {
    // Auth pages should render standalone and use readable dark text
    return <div style={{ minHeight: "100vh", color: "#111" }}>{children}</div>;
  }

  const menuItems = [
    { label: "Dashboard", path: "/super-admin/dashboard" },
    { label: "Users", path: "/super-admin/users" },
    { label: "Plans", path: "/super-admin/plans" },
    { label: "Logs", path: "/super-admin/logs" },
  ];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/super-admin/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Logout failed:", e);
    }

    router.push("/super-admin/auth/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: "240px",
          background: "#0f1115",
          color: "#fff",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <h2
          style={{
            fontSize: "1.4rem",
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          Super Admin
        </h2>

        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              style={{
                padding: "12px",
                borderRadius: "6px",
                textDecoration: "none",
                color: isActive ? "#111" : "#fff",
                background: isActive ? "#fff" : "transparent",
                fontWeight: isActive ? "600" : "400",
                transition: "0.25s",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div
        style={{
          flexGrow: 1,
          background: "#f6f7f9",
          minHeight: "100vh",
          color: "#111",
        }}
      >
        {/* TOP BAR */}
        <header
          style={{
            background: "#ffffff",
            padding: "16px 22px",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              background: "#111",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              border: "none",
              fontWeight: "500",
            }}
          >
            Logout
          </button>
        </header>

        {/* PAGE CONTENT */}
        <main style={{ padding: "24px", color: "#111" }}>{children}</main>
      </div>
    </div>
  );
}
