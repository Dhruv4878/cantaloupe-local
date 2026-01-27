// PAGE 1 — Cantaloupe UI with progress 3 steps
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateBusiness() {
  const router = useRouter();
  const [accountType, setAccountType] = useState(""); // "personal" or "business"
  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [noWebsite, setNoWebsite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Restore saved values
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("onboardingStep1") || "{}");
      if (saved.accountType) setAccountType(saved.accountType);
      if (saved.businessName) setBusinessName(saved.businessName);
      if (saved.website) setWebsiteUrl(saved.website);
      if (saved.noWebsite !== undefined) setNoWebsite(saved.noWebsite);
    } catch (_) {}
  }, []);

  // Auto save
  useEffect(() => {
    const payload = { 
      accountType, 
      businessName, 
      website: websiteUrl,
      noWebsite 
    };
    sessionStorage.setItem("onboardingStep1", JSON.stringify(payload));
  }, [accountType, businessName, websiteUrl, noWebsite]);

  // 2-step progress config
  const steps = ["Name & Website", "Branding"];
  const currentStep = 1;
  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;
  
  // all UI below stays same

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    // Validate account type
    if (!accountType) {
      setErrorMessage("Please select whether this is for personal or business use.");
      setIsSubmitting(false);
      return;
    }

    // Validate name
    const nameOk = businessName.trim().length > 0;
    if (!nameOk) {
      setErrorMessage("Name is required.");
      setIsSubmitting(false);
      return;
    }

    // Validate website URL only for business accounts
    if (accountType === "business" && !noWebsite) {
      let urlOk = false;
      try {
        const u = new URL(websiteUrl);
        urlOk = Boolean(u.protocol && u.host);
      } catch {}

      if (!urlOk) {
        setErrorMessage("Enter a valid website URL (e.g., https://example.com).");
        setIsSubmitting(false);
        return;
      }
    }

    // If personal account, submit directly to backend and navigate to dashboard
    if (accountType === "personal") {
      try {
        // Get auth token
        const token = sessionStorage.getItem("authToken");
        if (!token) {
          alert("Your session has expired. Please log in again.");
          router.push("/login");
          setIsSubmitting(false);
          return;
        }

        // Prepare profile data for personal account
        const profileData = {
          accountType: "personal",
          businessName: businessName.trim(),
          website: "",
          noWebsite: false,
          businessDescription: "",
          businessType: "",
          targetAudience: "",
          brandPersonality: "",
        };

        // Save profile to backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${apiUrl}/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to save profile");
        }

        // Profile saved successfully
        sessionStorage.setItem("hasProfile", "true");
        
        // Clear onboarding data from sessionStorage
        try {
          sessionStorage.removeItem("onboardingStep1");
          sessionStorage.removeItem("onboardingStep2");
        } catch (_) {}

        // Navigate to dashboard
        router.push("/dashboard");
      } catch (error) {
        console.error("Error saving profile:", error);
        setErrorMessage(error.message || "Failed to save profile. Please try again.");
        setIsSubmitting(false);
      }
      return;
    }

    // For business accounts, continue to step 2
    try {
      sessionStorage.setItem(
        "onboardingStep1",
        JSON.stringify({ 
          accountType,
          businessName, 
          website: accountType === "business" && !noWebsite ? websiteUrl : "",
          noWebsite: accountType === "business" ? noWebsite : false
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 600));
      setIsSubmitted(true);
      router.push("/businesses/create/2");
    } catch {
      setErrorMessage("Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-brand-dark text-white overflow-hidden font-poppins">
      {/* Background + glow keeps SAME */}      
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[url('/Glass.png')] bg-[length:60%] bg-center bg-repeat" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 -left-32 w-[260px] h-[260px] bg-gradient-to-br from-brand-yellow/30 via-brand-orange/20 to-transparent rounded-full blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[-120px] right-[-80px] w-[320px] h-[320px] bg-gradient-to-tl from-brand-orange/35 via-brand-yellow/20 to-transparent rounded-full blur-3xl" />

      <main className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 pt-24 sm:pt-24 lg:pt-28 pb-14">
        <div className="text-center mb-8">
          <p className="text-[11px] tracking-[0.35em] uppercase text-brand-gray/80 mb-1">Onboarding</p>
          <h1 className="font-monument text-[26px] sm:text-[32px]">Let's get started</h1>
          <p className="text-brand-gray text-sm sm:text-base max-w-xl mx-auto mt-2">
            Tell us about yourself or your business.
          </p>
        </div>

        <div className="rounded-3xl border border-white/12 bg-white/5 backdrop-blur-2xl shadow-[0_26px_60px_rgba(0,0,0,0.85)] px-4 sm:px-6 md:px-10 py-7 space-y-8">
          
        {/* PROGRESS BAR — SAME FOR ALL 3 PAGES */}
<div className="space-y-3">
  <div className="flex items-center justify-between select-none">
    {steps.map((label, idx) => (
      <div key={label} className="flex flex-col items-center w-1/3">
        <div
          className={
            "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border border-white/10 transition " +
            (idx < currentStep
              ? "bg-gradient-to-br from-brand-yellow to-brand-orange text-brand-dark shadow-[0_0_12px_rgba(255,168,0,0.7)]"
              : "bg-white/5 text-slate-400")
          }
        >
          {idx + 1}
        </div>
      </div>
    ))}
  </div>

  <div className="relative mt-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
    <div
      className="absolute inset-y-0 left-0 rounded-full transition-all"
      style={{
        width: `${progressPercent}%`,
        backgroundImage: "linear-gradient(90deg, #FDEC01 0%, #FF6700 100%)",
        boxShadow: "0 0 12px rgba(255,168,0,0.7)",
      }}
    />
  </div>

  <div className="flex justify-between text-[10px] sm:text-xs text-brand-gray mt-2">
    {steps.map((label) => (
      <div key={label} className="w-1/3 text-center">
        {label}
      </div>
    ))}
  </div>
</div>


          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Type Radio Buttons */}
            <div>
              <label className="text-sm font-medium text-slate-200 mb-3 block">Account Type*</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Personal Radio Card */}
                <label
                  className={`
                    relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                    ${accountType === "personal"
                      ? "border-brand-orange/60 bg-gradient-to-br from-brand-orange/10 to-brand-yellow/5 shadow-[0_0_20px_rgba(255,103,0,0.3)]"
                      : "border-white/20 bg-black/30 hover:border-white/30 hover:bg-black/40"
                    }
                  `}
                >
                  <div className="relative flex-shrink-0">
                    <input
                      type="radio"
                      name="accountType"
                      value="personal"
                      checked={accountType === "personal"}
                      onChange={(e) => {
                        setAccountType(e.target.value);
                        setNoWebsite(false);
                        setWebsiteUrl("");
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                        ${accountType === "personal"
                          ? "border-brand-orange bg-brand-orange/20"
                          : "border-white/40 bg-black/40"
                        }
                      `}
                    >
                      {accountType === "personal" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-brand-yellow to-brand-orange shadow-[0_0_8px_rgba(255,168,0,0.8)]" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <span
                      className={`
                        text-sm font-medium block transition-colors
                        ${accountType === "personal" ? "text-white" : "text-slate-200"}
                      `}
                    >
                      Personal
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      For individual use
                    </span>
                  </div>
                  {accountType === "personal" && (
                    <div className="absolute top-2 right-2">
                      <svg
                        className="w-4 h-4 text-brand-orange"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </label>

                {/* Business Radio Card */}
                <label
                  className={`
                    relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                    ${accountType === "business"
                      ? "border-brand-orange/60 bg-gradient-to-br from-brand-orange/10 to-brand-yellow/5 shadow-[0_0_20px_rgba(255,103,0,0.3)]"
                      : "border-white/20 bg-black/30 hover:border-white/30 hover:bg-black/40"
                    }
                  `}
                >
                  <div className="relative flex-shrink-0">
                    <input
                      type="radio"
                      name="accountType"
                      value="business"
                      checked={accountType === "business"}
                      onChange={(e) => setAccountType(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                        ${accountType === "business"
                          ? "border-brand-orange bg-brand-orange/20"
                          : "border-white/40 bg-black/40"
                        }
                      `}
                    >
                      {accountType === "business" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-brand-yellow to-brand-orange shadow-[0_0_8px_rgba(255,168,0,0.8)]" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <span
                      className={`
                        text-sm font-medium block transition-colors
                        ${accountType === "business" ? "text-white" : "text-slate-200"}
                      `}
                    >
                      Business
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      For companies & organizations
                    </span>
                  </div>
                  {accountType === "business" && (
                    <div className="absolute top-2 right-2">
                      <svg
                        className="w-4 h-4 text-brand-orange"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="text-sm font-medium text-slate-200 mb-2 block">
                {accountType === "business" ? "Business Name*" : "Name*"}
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-black/40 text-white rounded-xl border border-white/20 px-4 py-3 focus:ring-2 focus:ring-brand-orange/70 focus:outline-none"
                placeholder={accountType === "business" ? "Your business name" : "Your name"}
              />
            </div>

            {/* Website Field - Only for Business */}
            {accountType === "business" && (
              <div className="space-y-4">
                {!noWebsite && (
                  <div>
                    <label className="text-sm font-medium text-slate-200 mb-2 block">Website*</label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full bg-black/40 text-white rounded-xl border border-white/20 px-4 py-3 focus:ring-2 focus:ring-brand-orange/70 focus:outline-none transition"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                )}
                {/* Custom Checkbox */}
                <label
                  className={`
                    flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 group
                    ${noWebsite
                      ? "border-brand-orange/60 bg-gradient-to-br from-brand-orange/10 to-brand-yellow/5 shadow-[0_0_15px_rgba(255,103,0,0.2)]"
                      : "border-white/20 bg-black/30 hover:border-white/30 hover:bg-black/40"
                    }
                  `}
                >
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={noWebsite}
                      onChange={(e) => {
                        setNoWebsite(e.target.checked);
                        if (e.target.checked) {
                          setWebsiteUrl("");
                        }
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
                        ${noWebsite
                          ? "border-brand-orange bg-brand-orange/20"
                          : "border-white/40 bg-black/40 group-hover:border-white/60"
                        }
                      `}
                    >
                      {noWebsite && (
                        <svg
                          className="w-3.5 h-3.5 text-brand-orange"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <span
                      className={`
                        text-sm font-medium block transition-colors
                        ${noWebsite ? "text-white" : "text-slate-200 group-hover:text-white"}
                      `}
                    >
                      I don't have a website
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Skip website validation if you don't have one yet
                    </span>
                  </div>
                </label>
              </div>
            )}

            {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-brand-dark bg-gradient-to-r from-brand-yellow to-brand-orange shadow-[0_0_18px_rgba(255,168,0,0.8)] hover:shadow-[0_0_24px_rgba(255,168,0,1)] disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? "Please wait..." : "Continue"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
