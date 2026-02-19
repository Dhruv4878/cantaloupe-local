"use client";

import { Menu, LogOut, Bell, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function AdminHeader({ onMenuClick }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Format pathname for breadcrumb/title
  const getPageTitle = () => {
    const parts = pathname?.split('/').filter(Boolean) || [];
    const lastPart = parts[parts.length - 1];
    return lastPart ? lastPart.charAt(0).toUpperCase() + lastPart.slice(1) : 'Dashboard';
  };

  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      await fetch(`${apiUrl}/super-admin/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      router.push("/super-admin/auth/login");
    } catch (e) {
      console.error("Logout failed:", e);
      router.push("/super-admin/auth/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-gray-600 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-sm text-gray-500 hidden sm:block">
            Manage your application overview
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Bar (Hidden on small mobile) */}
        {/* <div className="hidden md:flex items-center px-3 py-2 bg-gray-100 rounded-lg border border-transparent focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="ml-2 bg-transparent text-sm w-48 outline-none text-gray-700 placeholder-gray-400"
          />
        </div> */}

        {/* Notifications */}
        {/* <button className="relative p-2 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button> */}

        {/* Separator */}
        {/* <div className="h-8 w-px bg-gray-200"></div> */}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all duration-200 bg-gray-900 rounded-lg hover:bg-gray-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
