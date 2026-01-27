"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  CheckCircle2,
  BarChart3,
  Layers,
  CreditCard,
  ArrowUpRight,
  FileText,
  AlertTriangle,
  Mail,
  ShieldAlert
} from "lucide-react";
import GradientButton from "../GradientButton";

// GlassCard with full height and flex column to push buttons to bottom if needed
const GlassCard = ({ children, className = "" }) => (
  <div
    className={`p-6 sm:p-8 rounded-3xl relative flex flex-col justify-between h-full transition-all duration-300 border border-white/5 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.04] hover:border-white/10 ${className}`}
    style={{
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
    }}
  >
    {children}
  </div>
);

// Progress Bar with Glow Effect
const ProgressBar = ({ current, max, color = "bg-blue-500" }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  return (
    <div className="relative w-full mt-4">
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-700 ease-out rounded-full relative`}
          style={{ width: `${percentage}%` }}
        >
          <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-2 h-full bg-white/50 blur-[2px]`} />
        </div>
      </div>
      <div 
        className={`absolute top-0 left-0 h-2 rounded-full opacity-40 blur-md transition-all duration-700 ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default function Billing() {
  const router = useRouter();
  const [planData, setPlanData] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpgradeNotice, setShowUpgradeNotice] = useState(false);

  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    []
  );

  const requireToken = () => {
    if (typeof window === "undefined") return null;
    const token = window.sessionStorage.getItem("authToken");
    return token && token !== "null" ? token : null;
  };

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const justUpgraded = sessionStorage.getItem("justUpgraded");
        if (justUpgraded === "true") {
          setShowUpgradeNotice(true);
          sessionStorage.removeItem("justUpgraded");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        setLoading(true);
        setError(null);
        const token = requireToken();

        if (!token) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        const response = await fetch(`${apiUrl}/subscription/current`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch subscription: ${response.statusText}`);
        }

        const data = await response.json();
        setPlanData(data.plan);
        setSubscriptionData(data.subscription);
        setUsageData(data.usage);
      } catch (error) {
        console.error("Error fetching plan details:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentPlan();
  }, [apiUrl]);

  // --- Loading State ---
  if (loading) {
    return (
      <div className="p-6 sm:p-8 max-w-[1400px] mx-auto min-h-screen">
        <div className="h-10 w-48 bg-white/5 rounded-lg mb-10 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[320px] bg-white/5 rounded-3xl animate-pulse border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="p-6 sm:p-8 max-w-[1400px] mx-auto min-h-screen">
        <div className="max-w-xl mx-auto p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 flex items-center gap-4">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-100">Unable to load billing</h3>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Initializing State ---
  if (!planData) {
    return (
      <div className="p-6 sm:p-8 max-w-[1400px] mx-auto text-center min-h-screen">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/70">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-medium">Initializing your dashboard...</span>
        </div>
      </div>
    );
  }

  // Check if subscription is suspended
  const isSubscriptionSuspended = subscriptionData?.is_active === false;
  const planName = planData.planName || "Free";
  const isPaidPlan = planName !== "Free";

  // --- Suspended View (Updated) ---
  if (isSubscriptionSuspended && isPaidPlan) {
    return (
      // Added min-h-screen to prevent cut-off and ensure full height
      <div className="p-4 sm:p-8 max-w-[1400px] mx-auto min-h-screen flex flex-col">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">Billing & Subscription</h1>
           <p className="text-white/60 text-sm sm:text-base">
            Manage your subscription plan, check your credit usage, and view limits.
          </p>
        </div>

        {/* Updated: removed 'max-w-2xl' and added 'w-full'. 
           This ensures the card stretches to align with the heading 
        */}
        <GlassCard className="w-full flex-1 border-red-500/30 bg-red-500/5 hover:bg-red-500/5 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center py-10 text-center max-w-2xl mx-auto">
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Subscription Suspended</h2>
            
            <p className="text-white/70 text-base sm:text-lg mb-8 leading-relaxed">
              Your <strong>{planName}</strong> plan has been temporarily suspended. This usually happens due to a payment failure or policy violation.
            </p>

            <a
              href="mailto:postgen@gmail.com?subject=Subscription Suspension Inquiry"
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 transition-all duration-300 shadow-lg hover:shadow-orange-500/20"
            >
              <Mail className="w-5 h-5" />
              <span>Contact Support</span>
            </a>
            
            <div className="mt-8 pt-6 border-t border-white/5 w-full">
               <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-1">Direct Support Email</p>
               <p className="text-white/80 font-mono">postgen@gmail.com</p>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // --- Stats Calculation ---
  const platformsAllowed = planData.platformsAllowed || 4;
  const monthlyPostLimit = planData.postsPerMonth || 10;
  const monthlyPostsUsed = planData.monthlyPostsUsed || 0;
  const creditsUsed = usageData?.creditsUsed || 0;
  const creditLimit = usageData?.creditLimit || 0;
  const usagePercentage = creditLimit > 0 ? Math.round((creditsUsed / creditLimit) * 100) : 0;

  return (
    // Added pb-20 and min-h-screen to prevent bottom cut-off
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto text-white pb-20 min-h-screen">
      
      {/* Success Banner */}
      {showUpgradeNotice && (
        <div className="mb-8 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-lg shadow-emerald-900/10">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-emerald-300 font-semibold text-sm">Payment Successful</h4>
            <p className="text-emerald-100/60 text-xs sm:text-sm mt-0.5">Your plan has been upgraded. Enjoy your new features!</p>
          </div>
          <button
            onClick={() => setShowUpgradeNotice(false)}
            className="text-white/40 hover:text-white transition-colors text-sm px-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60 tracking-tight mb-2">
            Billing & Usage
          </h1>
          <p className="text-white/50 text-sm sm:text-base max-w-md">
            Manage your subscription tier, track credit consumption, and view your billing cycles.
          </p>
        </div>
        
        {subscriptionData && subscriptionData.end_date && (
           <div className="text-right hidden sm:block">
              <span className="block text-white/30 text-xs font-medium uppercase tracking-wider mb-1">Next Renewal</span>
              <span className="text-white/80 font-mono text-sm">
                {new Date(subscriptionData.end_date).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric"
                })}
              </span>
           </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: CURRENT PLAN */}
        <GlassCard className="group">
          <div>
            {/* Updated alignment to items-center so icon and badge align perfectly */}
            <div className="flex justify-between items-center mb-8">
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/70">
                ACTIVE
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <h2 className="text-white/50 text-sm font-medium uppercase tracking-wide">Current Tier</h2>
              <div className="text-4xl font-bold text-white tracking-tight">{planName}</div>
            </div>

            {subscriptionData && (
               <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/5">
                 {subscriptionData.end_date && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/40">Renews</span>
                      <span className="text-white/90 font-medium">
                        {new Date(subscriptionData.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                 )}
                 {subscriptionData.payment_mode && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/40">Cycle</span>
                      <span className="text-white/90 font-medium capitalize">{subscriptionData.payment_mode}</span>
                    </div>
                 )}
               </div>
            )}
          </div>
          
          <div className="mt-8">
            {/* Reduced padding to py-3 to match the Top Up button size */}
            <GradientButton
              onClick={() => router.push("/pricing")}
              className="w-full justify-center py-3 shadow-lg hover:shadow-purple-500/20"
            >
              <span className="flex items-center gap-2">
                {planName === "Free" ? "Upgrade to Pro" : "Change Plan"} <ArrowUpRight className="w-4 h-4" />
              </span>
            </GradientButton>
          </div>
        </GlassCard>

        {/* CARD 2: CREDIT USAGE */}
        <GlassCard className="group">
          <div>
            <div className="flex justify-between items-start mb-8">
               <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
            </div>

            <h2 className="text-white/50 text-sm font-medium uppercase tracking-wide mb-1">Lifetime Credits</h2>
            
            {creditLimit === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center h-48">
                <span className="text-5xl text-white/10 font-black mb-2 select-none">0</span>
                <p className="text-white/40 text-sm">No active credit pack</p>
              </div>
            ) : (
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-4xl font-bold text-white tracking-tight">{creditsUsed}</span>
                  <span className="text-lg text-white/30 font-medium">/ {creditLimit}</span>
                </div>

                <ProgressBar
                  current={creditsUsed}
                  max={creditLimit}
                  color={usagePercentage > 90 ? "bg-red-500" : "bg-gradient-to-r from-blue-400 to-cyan-400"}
                />
                
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-white/40">Used: {usagePercentage}%</span>
                  <span className="text-white/40">Remaining: {creditLimit - creditsUsed}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <button 
              onClick={() => router.push('/credittopup')}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 active:scale-[0.98]"
            >
              Top Up Credits
            </button>
          </div>
        </GlassCard>

        {/* CARD 3: PLAN LIMITS */}
        <GlassCard className="bg-gradient-to-b from-white/[0.02] to-transparent">
          <div>
            <div className="mb-8">
               <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                 <CreditCard className="w-6 h-6 text-emerald-400" />
               </div>
            </div>

            <h2 className="text-white/50 text-sm font-medium uppercase tracking-wide mb-6">Plan Limits</h2>

            <div className="space-y-1">
              {/* Row 1 */}
              <div className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
                  <span className="text-white/70 text-sm font-medium">Monthly Posts</span>
                </div>
                <div className="font-mono text-white text-sm">
                  <span className={monthlyPostsUsed >= monthlyPostLimit ? "text-red-400" : "text-white"}>{monthlyPostsUsed}</span>
                  <span className="text-white/30">/{monthlyPostLimit}</span>
                </div>
              </div>

              {/* Row 2 */}
              <div className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
                  <span className="text-white/70 text-sm font-medium">Platforms</span>
                </div>
                <div className="font-mono text-white text-sm">{platformsAllowed}</div>
              </div>

              {/* Row 3 */}
              <div className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
                  <span className="text-white/70 text-sm font-medium">AI Generation</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                   <span className="text-emerald-400 text-sm font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 text-center border-t border-white/5">
            <p className="text-[10px] text-white/30 uppercase tracking-widest">
              Terms & Conditions Apply
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}