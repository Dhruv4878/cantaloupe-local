"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/ui/admin/AdminSidebar";
import AdminHeader from "@/components/ui/admin/AdminHeader";

export default function SuperAdminLayout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // If the current route is an auth page (login, etc.), don't render the
  // super-admin shell (sidebar/topbar). Instead, render the page content
  // directly.
  const isAuthRoute = pathname?.startsWith("/super-admin/auth");

  if (isAuthRoute) {
    return <div className="min-h-screen text-gray-900 bg-gray-50">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar with mobile toggle state */}
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
