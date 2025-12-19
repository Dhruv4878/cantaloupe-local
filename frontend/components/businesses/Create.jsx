// PAGE 1 — Cantaloupe UI with progress 3 steps
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateBusiness() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Restore saved values
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("onboardingStep1") || "{}");
      if (saved.businessName) setBusinessName(saved.businessName);
      if (saved.website) setWebsiteUrl(saved.website);
    } catch (_) {}
  }, []);

  // Auto save
  useEffect(() => {
    const payload = { businessName, website: websiteUrl };
    sessionStorage.setItem("onboardingStep1", JSON.stringify(payload));
  }, [businessName, websiteUrl]);

  // 🔥 CHANGED ONLY HERE — from 5 → 3 steps
  const steps = ["Name & Website", "Branding", "Setup"];
  const currentStep = 1;
  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;
  
  // all UI below stays same

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const nameOk = businessName.trim().length > 0;
    let urlOk = false;
    try {
      const u = new URL(websiteUrl);
      urlOk = Boolean(u.protocol && u.host);
    } catch {}

    if (!nameOk || !urlOk) {
      setErrorMessage(
        !nameOk && !urlOk
          ? "Business name and a valid website are required."
          : !nameOk
          ? "Business name is required."
          : "Enter a valid website URL (e.g., https://example.com)."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      sessionStorage.setItem(
        "onboardingStep1",
        JSON.stringify({ businessName, website: websiteUrl })
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
          <h1 className="font-monument text-[26px] sm:text-[32px]">Let's create your business</h1>
          <p className="text-brand-gray text-sm sm:text-base max-w-xl mx-auto mt-2">
            Enter your business name & website — we’ll analyze it for you.
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
            <div>
              <label className="text-sm font-medium text-slate-200 mb-2 block">Business Name*</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-black/40 text-white rounded-xl border border-white/20 px-4 py-3 focus:ring-2 focus:ring-brand-orange/70 focus:outline-none"
                placeholder="Your business name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200 mb-2 block">Website*</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full bg-black/40 text-white rounded-xl border border-white/20 px-4 py-3 focus:ring-2 focus:ring-brand-orange/70 focus:outline-none"
                placeholder="https://yourwebsite.com"
              />
            </div>

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
