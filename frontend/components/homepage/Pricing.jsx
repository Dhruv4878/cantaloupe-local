"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react"; // Added icons for the new section

// ... [Keep CheckCircleIcon exactly as is] ...
const CheckCircleIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [plans, setPlans] = useState([]);
  const router = useRouter();

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/public/plans`,
        );
        const data = await res.json();
        setPlans(data);
      } catch (e) {
        console.error("Failed to fetch plans", e);
      }
    })();
  }, []);

  const maxDiscount = useMemo(() => {
    if (!plans.length) return 0;
    if (plans[0]?.globalDiscount !== undefined && plans[0].globalDiscount > 0) {
      return plans[0].globalDiscount;
    }
    const discounts = plans.map((p) => {
      const monthlyTotal = p.price_monthly * 12;
      const yearlyPrice = p.price_yearly || monthlyTotal;
      if (monthlyTotal <= 0) return 0;
      return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
    });
    return Math.max(...discounts, 0);
  }, [plans]);

  const handleChoosePlan = (plan) => {
    const token = sessionStorage.getItem("authToken");
    const isFree = plan.name.toLowerCase().includes("free");

    // If no token, redirect to signup
    if (!token) {
      router.push("/signup");
      return;
    }

    // If token exists and it's a free plan, go to dashboard
    if (isFree) {
      router.push("/dashboard");
      return;
    }

    // If token exists and it's a paid plan, go to checkout with plan data
    const price = isAnnual ? plan.price_yearly : plan.price_monthly;
    const planQuery = new URLSearchParams({
      plan: plan.name,
      billing: isAnnual ? "annual" : "monthly",
      price: price.toString(),
      planId: plan._id,
      features: JSON.stringify(plan.features || {}),
    }).toString();

    router.push(`/checkout?${planQuery}`);
  };

  return (
    <section className="w-full bg-[#070616] py-20 sm:py-24 lg:py-32">
      <div className="mx-auto w-[calc(100vw-40px)] max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-[0.5em] text-white/60">
            Pricing
          </p>
          <h2
            className="mt-3 text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl"
            style={{ fontFamily: '"Monument Extended", sans-serif' }}
          >
            Plans that{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-400">
              scale
            </span>{" "}
            with every campaign.
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-base text-white/75 sm:text-lg">
            Start free, then choose a plan when you’re ready to scale your
            content pipeline. Switch tiers or cancel anytime—no lock‑ins.
          </p>

          {/* Toggle */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <span
              className={`text-sm ${!isAnnual ? "text-white font-semibold" : "text-white/50"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FCAC00]"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnnual ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
            <span
              className={`text-sm ${isAnnual ? "text-white font-semibold" : "text-white/50"}`}
            >
              Annual{" "}
              {maxDiscount > 0 && (
                <span className="text-[#FFC56E] font-medium">
                  (Save {maxDiscount}%)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* --- CARDS GRID --- */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => {
            const monthly = p.price_monthly;
            const yearly = p.price_yearly || monthly * 12;
            const price = isAnnual ? yearly : monthly;

            const originalAnnualPrice = monthly * 12;
            const showDiscount = isAnnual && yearly < originalAnnualPrice;

            // Features Logic
            const features = [];
            const f = p.features || {};
            if (f.ai_post_generation) features.push("AI post generation");
            if (f.caption_generator) features.push("Caption generator");
            if (f.hashtag_generator) features.push("Hashtag generator");
            if (f.content_calendar) features.push("Content calendar");
            if (f.smart_scheduling) features.push("Smart scheduling");
            if (f.priority_support) features.push("Priority support");
            features.push(`${f.platforms_allowed || "1"} platform(s)`);
            features.push(`${f.posts_per_month || "unlimited"} posts / month`);

            // Styling variables based on recommendation
            const isRec = p.recommended;
            const borderColor = isRec
              ? "border-[#FFC56E]/40"
              : "border-white/10";
            const shadowClass = isRec
              ? "shadow-[0_0_30px_-5px_rgba(255,197,110,0.15)]"
              : "shadow-xl";
            const bgGradient = "bg-gradient-to-b from-[#16152D] to-[#0F0E24]";

            return (
              <div
                key={p._id}
                className={`group relative flex flex-col rounded-3xl border ${borderColor} ${bgGradient} p-6 ${shadowClass} transition-all duration-300 hover:-translate-y-1 hover:border-white/20`}
              >
                {/* Recommended Badge */}
                {isRec && (
                  <div className="absolute -top-3 left-0 right-0 mx-auto flex justify-center">
                    <span className="rounded-full bg-gradient-to-r from-orange-500 to-purple-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                      Recommended
                    </span>
                  </div>
                )}

                {/* Card Header */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white">{p.name}</h3>
                  <p className="mt-2 text-sm text-white/50 h-10 line-clamp-2">
                    {p.description ||
                      "Perfect for scaling your social presence."}
                  </p>
                </div>

                {/* Price Section */}
                <div className="mb-6">
                  {/* Strikethrough - Cleanly positioned above */}
                  {showDiscount && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white/40 line-through">
                        ₹{originalAnnualPrice}
                      </span>
                      <span className="rounded-md bg-green-500/10 px-1.5 py-0.5 text-[10px] font-bold text-green-400">
                        SAVE{" "}
                        {Math.round(
                          ((originalAnnualPrice - yearly) /
                            originalAnnualPrice) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                  )}

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-white">
                      ₹{price}
                    </span>
                    <span className="text-sm font-medium text-white/50">
                      /{isAnnual ? "year" : "month"}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="mb-6 h-px w-full bg-white/5"></div>

                {/* Features List */}
                <ul className="mb-8 space-y-4 flex-1">
                  {features.map((t, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-white/80"
                    >
                      <CheckCircleIcon className="shrink-0 w-5 h-5 text-[#FFC56E]" />
                      <span className="leading-tight">{t}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleChoosePlan(p)}
                  className={`mt-auto w-full rounded-xl py-3 text-sm font-bold transition-all duration-200 
                  ${
                    isRec
                      ? "bg-gradient-to-r from-orange-400 to-purple-500 text-white hover:opacity-90 hover:shadow-lg"
                      : "bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  Choose {p.name}
                </button>
              </div>
            );
          })}
        </div>

        {/* --- CREDIT TOP-UP SECTION (NEW) --- */}
        <div className="mt-16 sm:mt-24">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0B0A1F] p-8 lg:p-12 shadow-2xl">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-[#FFC56E]/10 blur-[80px]" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-purple-600/10 blur-[80px]" />

            <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
              <div className="flex-1 text-center md:text-left">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFC56E]/30 bg-[#FFC56E]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FFC56E]">
                  <Sparkles className="h-3 w-3" />
                  <span>Pay As You Go</span>
                </div>
                <h3 className="text-2xl font-bold text-white sm:text-3xl">
                  Not ready for a subscription?
                </h3>
                <p className="mt-3 max-w-xl text-lg text-white/60">
                  Top up your account with credits and pay only for what you
                  generate. Credits never expire and work with all premium
                  features.
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => router.push("/credittopup")} // Assumes your credit page is at /credits
                  className="group relative flex items-center gap-3 rounded-xl bg-white px-8 py-4 font-bold text-[#070616] shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-all hover:scale-105 hover:bg-[#FFC56E] hover:shadow-[0_0_30px_-5px_rgba(255,197,110,0.5)] active:scale-95"
                >
                  <span>Buy One-Time Credits</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}