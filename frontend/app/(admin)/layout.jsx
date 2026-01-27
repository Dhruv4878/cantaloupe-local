"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Menu,
  Bell,
  MessageSquare,
  ChevronDown,
  LogOut,
  Send,
  CreditCard,
  Zap,
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

/* ----------------------------- Billing Dropdown ----------------------------- */
const BillingDropdown = ({ profile, subscriptionData, loading, usedPosts, creditLimit, isLimitReached }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [countType, setCountType] = useState("credit");
  const router = useRouter();

  // Get count type from session storage on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCountType = sessionStorage.getItem("postCountType") || "credit";
      setCountType(storedCountType);
    }
  }, []);

  // Get subscription info from subscriptionData
  const planName = subscriptionData?.plan?.planName || "Free Plan";
  
  // Check if subscription is active (from subscription object)
  const subscriptionIsActive = subscriptionData?.subscription?.is_active ?? false;
  
  // Check if user account is active (not suspended)
  const userIsActive = profile?.user?.active !== false;
  
  // Plan is "Active" only if both subscription and user are active
  const planActive = subscriptionIsActive && userIsActive;
  
  // Check if user has a monthly plan (regardless of active status)
  const hasMonthlyPlan = subscriptionData?.plan?.postsPerMonth > 0 || 
                        subscriptionData?.plan?.posts_per_month > 0;
  
  const isMonthlyPlan = countType === "monthly" && hasMonthlyPlan;
  
  // Get monthly plan limits from subscription data
  const monthlyPostLimit = subscriptionData?.plan?.postsPerMonth || 
                          subscriptionData?.plan?.posts_per_month || 0;
  
  // Always use monthlyPostsUsed from plan data when there's a monthly plan
  // Otherwise use usedPosts (for credit-only users)
  const monthlyPostsUsed = hasMonthlyPlan 
    ? (subscriptionData?.plan?.monthlyPostsUsed || 0)
    : 0;
  
  // Get credit info
  const totalCredits = profile?.user?.creditLimit ?? 0;
  const creditsUsed = subscriptionData?.usage?.creditsUsed ?? 0;
  
  // Available credits = total credits - actual credits used (regardless of plan type)
  const availableCredits = Math.max(0, totalCredits - creditsUsed);
  
  // Only log debug info in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Dropdown Debug:', {
      countType,
      isMonthlyPlan,
      hasMonthlyPlan,
      usedPosts,
      totalCredits,
      creditsUsed,
      availableCredits,
      monthlyPostsUsed,
      monthlyPostLimit,
      subscriptionIsActive,
      userIsActive,
      planActive
    });
  }

  const handleNavigateToBilling = () => {
    setIsOpen(false);
    router.push("/billing");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.billing-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative billing-dropdown">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer
          border backdrop-blur-md transition-all duration-200
          ${
            isLimitReached
              ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            background: isLimitReached
              ? "rgba(239,68,68,0.2)"
              : "rgba(255,140,0,0.2)",
            color: isLimitReached ? "#EF4444" : "#FF8C00",
          }}
        >
          <CreditCard size={12} />
        </div>

        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-300 font-medium">
            {planName}
          </span>
          <span className={`text-xs font-semibold ${
            isLimitReached ? "text-red-400" : "text-orange-400"
          }`}>
            {hasMonthlyPlan 
              ? `Monthly: ${monthlyPostsUsed}/${monthlyPostLimit} | Credits: ${availableCredits}`
              : `Credits: ${availableCredits} | Posts: ${usedPosts}/${creditLimit}`
            }
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-72 rounded-xl z-40 overflow-hidden"
          style={{
            background: "#0f0e24",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={16} className="text-orange-400" />
              <span className="text-sm font-semibold text-white">Billing & Subscription</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Current Plan */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div>
                <p className="text-xs text-gray-400">Current Plan</p>
                <p className="text-sm font-medium text-white">{planName}</p>
                <p className="text-xs text-gray-400">
                  {planActive ? "Active" : "Inactive"}
                </p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                planActive 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-gray-500/20 text-gray-400"
              }`}>
                {planActive ? "Active" : "Inactive"}
              </div>
            </div>

            {/* Available Credits */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div>
                <p className="text-xs text-gray-400">Available Credits</p>
                <p className="text-sm font-medium text-white">{availableCredits} Credits</p>
                <p className="text-xs text-gray-400">Total: {totalCredits}</p>
              </div>
              <Zap size={16} className="text-orange-400" />
            </div>

            {/* Monthly Posts / Total Posts */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div>
                <p className="text-xs text-gray-400">
                  {hasMonthlyPlan ? "Monthly Posts" : "Total Posts Used"}
                </p>
                <p className="text-sm font-medium text-white">
                  {hasMonthlyPlan 
                    ? `${monthlyPostsUsed} / ${monthlyPostLimit}` 
                    : `${usedPosts} / ${creditLimit}`}
                </p>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                  <div 
                    className={`h-1.5 rounded-full ${
                      (hasMonthlyPlan 
                        ? monthlyPostsUsed >= monthlyPostLimit 
                        : usedPosts >= creditLimit) 
                        ? "bg-red-400" 
                        : "bg-orange-400"
                    }`}
                    style={{ 
                      width: `${Math.min(
                        hasMonthlyPlan 
                          ? (monthlyPostsUsed / Math.max(monthlyPostLimit, 1)) * 100
                          : (usedPosts / Math.max(creditLimit, 1)) * 100, 
                        100
                      )}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleNavigateToBilling}
              className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-orange-400 to-purple-600 
                       text-white text-sm font-medium rounded-lg hover:shadow-lg 
                       hover:shadow-orange-500/20 transition-all duration-200"
            >
              Manage Billing & Plans
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ----------------------------- Header ----------------------------- */
const Header = ({ toggleSidebar, usedPosts = 0 }) => {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "dashboard";

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [subscriptionData, setSubscriptionData] = useState(null);

  const limitFromProfile = profile?.user?.creditLimit ?? 0;
  // Keep UI in sync with server limit by saving to sessionStorage (used by other components)
  useEffect(() => {
    try {
      sessionStorage.setItem("creditLimit", String(limitFromProfile));
    } catch (_) {}
  }, [limitFromProfile]);

  const safeUsed = Math.min(usedPosts, limitFromProfile);
  const isLimitReached = safeUsed >= limitFromProfile;

  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    []
  );

  const requireToken = () => {
    if (typeof window === "undefined") return null;
    const token = window.sessionStorage.getItem("authToken");
    return token && token !== "null" ? token : null;
  };

  // Get user email from sessionStorage on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const email = sessionStorage.getItem("userEmail") || "";
      setUserEmail(email);
    }
  }, []);

  useEffect(() => {
    const fetchProfileAndSubscription = async () => {
      try {
        setLoading(true);
        const token = requireToken();

        if (!token) {
          setLoading(false);
          return;
        }

        // Fetch profile data
        const profileResponse = await fetch(`${apiUrl}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile(profileData);

          // Update userEmail from profile if available
          if (profileData?.user?.email) {
            setUserEmail(profileData.user.email);
          }
        }

        // Fetch subscription data
        const subscriptionResponse = await fetch(`${apiUrl}/subscription/current`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          setSubscriptionData(subscriptionData);
        }

      } catch (error) {
        console.error("Error fetching profile and subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndSubscription();
  }, [apiUrl]);

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
        {/* Billing & Subscription Dropdown */}
        <BillingDropdown 
          profile={profile}
          subscriptionData={subscriptionData}
          loading={loading}
          usedPosts={safeUsed}
          creditLimit={limitFromProfile}
          isLimitReached={isLimitReached}
        />

        <Bell className="text-gray-400 hover:text-orange-400 cursor-pointer" />
        <MessageSquare className="text-gray-400 hover:text-orange-400 cursor-pointer" />

        {/* Profile */}
        <div className="relative">
          <div
            onClick={() => setIsProfileOpen((v) => !v)}
            className="flex items-center cursor-pointer p-1 rounded-full hover:bg-white/5"
          >
            <div className="h-9 w-9 rounded-full overflow-hidden border border-orange-500/50 bg-gray-800 flex items-center justify-center">
              <span className="text-xs font-bold text-orange-500">
                {(profile?.user?.email ||
                  userEmail ||
                  "U")[0]?.toUpperCase() || "U"}
              </span>
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
                    {loading
                      ? "Loading..."
                      : profile?.user?.email || userEmail || ""}
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
  const [usedPosts, setUsedPosts] = useState(0);

  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    []
  );

  const requireToken = () => {
    if (typeof window === "undefined") return null;
    const token = window.sessionStorage.getItem("authToken");
    return token && token !== "null" ? token : null;
  };

  // Fetch initial post count on mount
  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      window.location.replace("/login");
      return;
    }

    // Fetch initial post count
    const fetchInitialPostCount = async () => {
      try {
        const token = requireToken();
        if (!token) {
          setUsedPosts(0);
          return;
        }

        const res = await fetch(`${apiUrl}/posts/count`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          console.log('Post count response:', data);
          
          // The new API returns count, limit, and countType
          setUsedPosts(data.count ?? 0);
          
          // Store additional info for debugging
          if (typeof window !== "undefined") {
            sessionStorage.setItem("postCountType", data.countType || "credit");
            sessionStorage.setItem("postLimit", String(data.limit || 0));
          }
        } else {
          setUsedPosts(0);
        }
      } catch (err) {
        console.error("Error fetching initial post count:", err);
        setUsedPosts(0);
      }
    };

    fetchInitialPostCount();
  }, [apiUrl]);

  // Sync usedPosts to sessionStorage (for backward compatibility if needed)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("usedPosts", String(usedPosts || 0));
      }
    } catch (_) {}
  }, [usedPosts]);

  return (
    <div
      className="min-h-screen flex text-white"
      style={{ backgroundColor: DARK_BG, fontFamily: "Poppins, sans-serif" }}
    >
      {/* Glow */}
      <div
        aria-hidden
        className="fixed top-0 left-1/4 w-96 h-96  blur-[150px] opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,140,0,0.7), transparent 70%)",
        }}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen((v) => !v)}
        usedPosts={usedPosts}
      />

      <div className="flex-1 flex flex-col z-10">
        <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 py-4 flex-1 flex flex-col">
          <Header
            toggleSidebar={() => setIsSidebarOpen((v) => !v)}
            usedPosts={usedPosts}
          />
          <main className="flex-1 pb-8">
            {React.cloneElement(children, {
              onPostCountUpdate: setUsedPosts,
            })}
          </main>

          <footer className="text-center text-gray-500 text-sm py-6">
            © 2025 Generation Next.AI Social Manager. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
}
