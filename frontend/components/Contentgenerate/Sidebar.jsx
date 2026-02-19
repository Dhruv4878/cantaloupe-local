"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  Calendar,
  Globe,
  Settings,
  LogOut,
  X,
  History,
  Lock,
  CreditCard,
} from "lucide-react";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";
import UpgradeModal from "../UpgradeModal";

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`relative overflow-hidden text-white ${className}`}
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

const NAV_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Generate Post", icon: Zap, href: "/generatepost" },
  { name: "Recent Post", icon: History, href: "/recentpost" },
  { name: "Linked Accounts", icon: Globe, href: "/connectplatform" },
  { name: "Calendar", icon: Calendar, href: "/calender" },
  { name: "Billing & Subscription", icon: CreditCard, href: "/billing" },
  { name: "Settings", icon: Settings, href: "/setting" },
];

const Sidebar = ({ isOpen, toggleSidebar, usedPosts = 0 }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isFeatureAvailable, getPlanName, loading } = useFeatureAccess();
  
  // State for upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState({ name: '', description: '' });

  const isActive = (href) =>
    pathname === href || pathname.startsWith(href + "/");

  const handleSignOut = () => {
    sessionStorage.clear();
    // You might also want to clear localStorage or cookies if used
    // localStorage.clear();
    router.push("/login");
  };

  // Read creditLimit safely on client to avoid SSR errors
  const [creditLimit, setCreditLimit] = useState(10);
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const v = Number(sessionStorage.getItem("creditLimit") || "0");
        setCreditLimit(Number.isFinite(v) ? v : 10);
      }
    } catch (_) {}
  }, []);

  const safeUsed = Math.min(usedPosts, creditLimit);
  const isLimitReached = safeUsed >= creditLimit;

  const NavItem = ({ item }) => {
    const active = isActive(item.href);

    if (item.locked) {
      return (
        <div className="block cursor-not-allowed">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-1.5 text-gray-500 bg-transparent">
            <div className="flex items-center">
              <item.icon size={20} className="mr-3 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80 px-2 py-0.5 rounded-md border border-white/5">
              Soon
            </span>
          </div>
        </div>
      );
    }

    // Check for Calendar feature access
    if (item.href === "/calender") {
      const hasCalendarAccess = !loading && isFeatureAvailable('content_calendar');
      
      if (!hasCalendarAccess && !loading) {
        return (
          <div 
            className="block cursor-pointer"
            onClick={() => {
              setUpgradeFeature({
                name: 'Content Calendar',
                description: 'Plan and schedule your content with our advanced calendar view.'
              });
              setShowUpgradeModal(true);
            }}
          >
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-1.5 text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-200">
              <div className="flex items-center">
                <item.icon size={20} className="mr-3 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              <Lock size={14} className="text-orange-400" />
            </div>
          </div>
        );
      }
    }

    // Always allow navigation to /generatepost - credit check happens on generate button click
    if (item.href === "/generatepost") {
      return (
        <Link href={item.href} className="block" onClick={toggleSidebar}>
          <div
            className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer mb-1.5
              ${
                active
                  ? "text-white font-bold bg-white/10 border border-white/5 shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }
            `}
          >
            <item.icon
              size={20}
              className={`mr-3 flex-shrink-0 ${
                active ? "text-orange-400" : ""
              }`}
            />
            <span className="truncate">{item.name}</span>
          </div>
        </Link>
      );
    }

    return (
      <Link href={item.href} className="block" onClick={toggleSidebar}>
        <div
          className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer mb-1.5
            ${
              active
                ? "text-white font-bold bg-white/10 border border-white/5 shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }
          `}
        >
          <item.icon
            size={20}
            className={`mr-3 flex-shrink-0 ${active ? "text-orange-400" : ""}`}
          />
          <span className="truncate">{item.name}</span>
        </div>
      </Link>
    );
  };

  const DefaultLogo = () => (
    <div className="flex items-center pl-3">
      <h1 className="text-xl font-extrabold text-white truncate">
        PostGenerator.AI
      </h1>
    </div>
  );

  return (
    <>
      {/* MOBILE BACKDROP */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* SIDEBAR WRAPPER */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          w-72 max-w-[85vw]
          transform transition-transform duration-300 will-change-transform
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:sticky lg:top-0 lg:h-screen 
          lg:inset-auto lg:translate-x-0
          lg:w-72 lg:flex-shrink-0
          flex flex-col
        `}
      >
        <GlassCard
          className={`
            h-full flex flex-col
            rounded-none 
            px-5 py-6 sm:px-6 sm:py-8
            border-y-0 border-l-0
          `}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between mb-8 sm:mb-10 flex-shrink-0 min-h-[40px]">
            <DefaultLogo />

            <button
              onClick={toggleSidebar}
              className="lg:hidden text-white/70 hover:text-white"
              aria-label="Close sidebar"
            >
              <X size={24} />
            </button>
          </div>

          {/* NAV LIST */}
          <nav className="flex-grow overflow-y-auto pr-1 space-y-0.5 custom-scrollbar">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </nav>

          {/* FOOTER */}
          <div className="mt-6 pt-4 border-t border-white/10 flex-shrink-0">
            <button
              onClick={handleSignOut}
              className="flex w-full rounded-xl items-center text-gray-400 px-3 py-2.5 cursor-pointer hover:bg-white/5 hover:text-white transition group"
            >
              <LogOut
                size={20}
                className="mr-3 group-hover:text-orange-400 transition-colors"
              />
              <span>Sign Out</span>
            </button>
          </div>
        </GlassCard>
      </aside>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={upgradeFeature.name}
        description={upgradeFeature.description}
        currentPlan={getPlanName()}
      />
    </>
  );
};

export default Sidebar;
