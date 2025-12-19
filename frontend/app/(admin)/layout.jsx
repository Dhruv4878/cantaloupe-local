"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  Bell,
  MessageSquare,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Contentgenerate/Sidebar";

const DARK_BG = "#070616";

/* ----------------------------- Glass Card ----------------------------- */
const GlassCard = ({ children, className = "" }) => (
  <div
    className={`p-6 rounded-2xl relative text-white ${className}`}
    style={{
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
    }}
  >
    {children}
  </div>
);

/* ----------------------------- Header ----------------------------- */
const Header = ({ toggleSidebar }) => {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "dashboard";

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userData, setUserData] = useState({
    email: "",
    businessLogo: "",
  });

  /* ----------------------------- FETCH PROFILE ----------------------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? sessionStorage.getItem("authToken")
            : null;

        if (!token) return;

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

        const res = await fetch(`${apiUrl}/profile/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        const profile = await res.json();

        setUserData({
          email: profile.user.email || "",
          businessLogo: profile.businessLogo || "",
        });
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ----------------------------- SIGN OUT ----------------------------- */
  const handleSignOut = () => {
    sessionStorage.clear();
    router.push("/login"); // adjust if needed
  };

  /* ----------------------------- PAGE TITLES ----------------------------- */
  const titleMap = {
    dashboard: "Dashboard",
    generate: "Generate Post",
    calender: "Calendar",
    connectplatform: "Linked Accounts",
    setting: "Settings",
  };

  const title =
    titleMap[last] ??
    last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <GlassCard className="mb-6 flex items-center justify-between p-4 lg:p-5 sticky top-4 z-20 !overflow-visible">
      {/* Left */}
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="lg:hidden mr-4">
          <Menu size={24} />
        </button>
        <h2 className="text-xl lg:text-2xl font-bold">{title}</h2>
      </div>

      {/* Right */}
      <div className="flex items-center space-x-4">
        <Bell className="text-gray-400 hover:text-orange-400 cursor-pointer" />
        <MessageSquare className="text-gray-400 hover:text-orange-400 cursor-pointer" />

        {/* Profile */}
        <div className="relative">
          <div
            onClick={() => setIsProfileOpen((v) => !v)}
            className="flex items-center cursor-pointer p-1 rounded-full hover:bg-white/5"
          >
            <div className="h-9 w-9 rounded-full overflow-hidden border border-orange-500/50 bg-gray-800 flex items-center justify-center">
              {!loading && userData.businessLogo ? (
                <img
                  src={userData.businessLogo}
                  alt="Business Logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-orange-500">
                  {userData.email?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>

            <ChevronDown
              size={16}
              className={`ml-2 transition-transform ${
                isProfileOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Dropdown */}
          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsProfileOpen(false)}
              />

              <div
                className="absolute right-0 mt-3 w-64 rounded-xl z-40 overflow-hidden"
                style={{
                  background: "#0f0e24",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                }}
              >
                <div className="p-4 border-b border-white/10 bg-white/5">
                  <p className="text-xs text-gray-400">Signed in as</p>
                  <p className="truncate font-medium">
                    {loading ? "Loading..." : userData.email}
                  </p>
                </div>

                <div className="p-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

/* ----------------------------- Layout ----------------------------- */
export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex text-white"
      style={{ backgroundColor: DARK_BG, fontFamily: "Poppins, sans-serif" }}
    >
      {/* Glow */}
      <div
        aria-hidden
        className="fixed top-0 left-1/4 w-96 h-96 rounded-full blur-[150px] opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,140,0,0.7), transparent 70%)",
        }}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen((v) => !v)}
      />

      <div className="flex-1 flex flex-col z-10">
        <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 py-4 flex-1 flex flex-col">
          <Header toggleSidebar={() => setIsSidebarOpen((v) => !v)} />
          <main className="flex-1 pb-8">{children}</main>

          <footer className="text-center text-gray-500 text-sm py-6">
            © 2025 Generation Next.AI Social Manager. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
}
