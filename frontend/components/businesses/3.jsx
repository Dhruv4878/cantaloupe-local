"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUpTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

const DefineBrandForm = () => {
  const router = useRouter();

  // 🔥 Updated progress 5 → 3 steps
  const steps = ["Name & Website", "Branding", "Setup"];
  const currentStep = 3;
  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;
  

  const [brandTone, setBrandTone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryBrandColor, setPrimaryBrandColor] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("onboardingStep3") || "{}"
      );
      if (saved.brandTone) setBrandTone(saved.brandTone);
      if (saved.logoUrl || saved.businessLogo) {
        setLogoUrl(saved.logoUrl || saved.businessLogo);
      }
      if (saved.primaryBrandColor) {
        setPrimaryBrandColor(saved.primaryBrandColor);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    const existing = JSON.parse(
      sessionStorage.getItem("onboardingStep3") || "{}"
    );
    sessionStorage.setItem(
      "onboardingStep3",
      JSON.stringify({ ...existing, brandTone, primaryBrandColor })
    );
  }, [brandTone, primaryBrandColor]);

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    );

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Image upload failed.");

      const data = await response.json();
      const finalUrl = data.secure_url;

      setLogoUrl(finalUrl);

      const existing = JSON.parse(
        sessionStorage.getItem("onboardingStep3") || "{}"
      );
      sessionStorage.setItem(
        "onboardingStep3",
        JSON.stringify({
          ...existing,
          businessLogo: finalUrl,
          logoUrl: finalUrl,
        })
      );
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    setFormError(null);
    
    // Collect all onboarding data from sessionStorage
    let step1Data = {};
    let step2Data = {};
    let step3Data = {};
    
    try {
      step1Data = JSON.parse(sessionStorage.getItem("onboardingStep1") || "{}");
      step2Data = JSON.parse(sessionStorage.getItem("onboardingStep2") || "{}");
      step3Data = JSON.parse(sessionStorage.getItem("onboardingStep3") || "{}");
    } catch (err) {
      console.error("Error parsing sessionStorage data:", err);
    }

    const finalLogo =
      step3Data.businessLogo || step3Data.logoUrl || logoUrl || "";

    if (!finalLogo) {
      setFormError("Please upload a brand logo before continuing.");
      setIsSubmitting(false);
      return;
    }

    // Prepare profile data to send to backend
    const profileData = {
      businessName: step1Data.businessName || "",
      website: step1Data.website || "",
      businessDescription: step2Data.businessDescription || "",
      industry: step2Data.industry || "",
      companySize: step2Data.companySize || "",
      businessLogo: finalLogo,
      primaryBrandColor: step3Data.primaryBrandColor || primaryBrandColor || "",
    };

    // Get auth token
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      alert("Your session has expired. Please log in again.");
      router.push("/login");
      setIsSubmitting(false);
      return;
    }

    // Save profile to backend
    try {
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

      // Profile saved successfully, set hasProfile to true
      sessionStorage.setItem("hasProfile", "true");
      
      // Clear onboarding data from sessionStorage
      try {
        sessionStorage.removeItem("onboardingStep1");
        sessionStorage.removeItem("onboardingStep2");
        sessionStorage.removeItem("onboardingStep3");
      } catch (_) {}

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert(error.message || "Failed to save profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-brand-dark text-white font-poppins overflow-hidden">
      {/* Background — unchanged */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[url('/Glass.png')] bg-[length:60%] bg-center bg-repeat"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-32 w-[260px] h-[260px] rounded-full bg-gradient-to-br from-brand-yellow/30 via-brand-orange/20 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-120px] right-[-80px] w-[320px] h-[320px] rounded-full bg-gradient-to-tl from-brand-orange/35 via-brand-yellow/20 to-transparent blur-3xl"
      />

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-28 pb-10 lg:pb-14">
        {/* HEADER — unchanged */}
        <div className="mb-8 text-center">
          <p className="text-[11px] tracking-[0.35em] uppercase text-brand-gray/80 mb-2">
            Onboarding
          </p>
          <h1 className="font-monument text-[26px] sm:text-[32px] leading-snug">
            Define your brand
          </h1>
          <p className="text-sm sm:text-base text-brand-gray mt-2 max-w-xl mx-auto">
            Upload your logo and fine-tune your brand tone to keep everything on
            brand.
          </p>
        </div>

        {/* CARD — unchanged */}
        <div className="rounded-3xl border border-white/12 bg-white/5 backdrop-blur-2xl shadow-[0_26px_60px_rgba(0,0,0,0.8)] px-4 sm:px-6 md:px-10 py-6 sm:py-8 space-y-8">
          
          {/* 🔥 PROGRESS (same UI, 3 steps now) */}
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


          {/* FORM — unchanged */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo upload */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-100 mb-2">
                Brand Logo
              </label>
              <div className="rounded-2xl border-2 border-dashed border-white/20 bg-black/40 p-5">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-48 h-28 rounded-xl border border-white/10 bg-black/40 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo preview"
                          className="max-h-24 object-contain"
                        />
                      ) : isUploading ? (
                        <span className="text-sm text-slate-300 animate-pulse">
                          Uploading...
                        </span>
                      ) : (
                        <ArrowUpTrayIcon className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <label
                        htmlFor="file-upload"
                        className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/20 text-xs sm:text-sm font-medium text-slate-100 hover:bg-white/10 cursor-pointer"
                      >
                        Choose file
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleLogoUpload}
                        />
                      </label>
                      <div className="text-xs sm:text-sm text-slate-400">
                        or drag and drop
                      </div>
                    </div>
                    {uploadError && (
                      <p className="text-[11px] text-red-400 mt-2">
                        {uploadError}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-2">
                      PNG, JPG, SVG recommended.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Brand Color */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-100 mb-1.5">
                Primary Brand Color
              </label>
              <ColorSelect
                id="primaryBrandColor"
                value={primaryBrandColor}
                onChange={(v) => setPrimaryBrandColor(v)}
                options={[
                  { value: "#FF6700", label: "Orange", hex: "#FF6700" },
                  { value: "#FDEC01", label: "Yellow", hex: "#FDEC01" },
                  { value: "#3B82F6", label: "Blue", hex: "#3B82F6" },
                  { value: "#10B981", label: "Green", hex: "#10B981" },
                  { value: "#8B5CF6", label: "Purple", hex: "#8B5CF6" },
                  { value: "#EF4444", label: "Red", hex: "#EF4444" },
                  { value: "#F59E0B", label: "Amber", hex: "#F59E0B" },
                  { value: "#06B6D4", label: "Cyan", hex: "#06B6D4" },
                  { value: "#EC4899", label: "Pink", hex: "#EC4899" },
                  { value: "#6366F1", label: "Indigo", hex: "#6366F1" },
                  { value: "#14B8A6", label: "Teal", hex: "#14B8A6" },
                  { value: "#F97316", label: "Orange Red", hex: "#F97316" },
                  { value: "#000000", label: "Black", hex: "#000000" },
                  { value: "#FFFFFF", label: "White", hex: "#FFFFFF" },
                ]}
                placeholder="Select your primary brand color"
              />
              <p className="text-[11px] text-brand-gray mt-1.5">
                Choose a primary color that represents your brand identity.
              </p>
            </div>

            {/* Brand tone */}
      

            {/* ACTIONS — unchanged */}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              {formError && (
                <div className="text-xs text-red-300 bg-red-950/50 border border-red-500/40 rounded-xl px-3 py-2">
                  {formError}
                </div>
              )}
              <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push("/businesses/create/2")}
                className="inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium border border-white/20 text-slate-200 bg-black/40 hover:bg-white/5 transition"
              >
                <ChevronLeftIcon className="h-4 w-4 text-slate-300" />
                Back
              </button>
              <button
                type="submit"
                disabled={isUploading || isSubmitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-full px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-brand-dark bg-gradient-to-r from-brand-yellow to-brand-orange shadow-[0_0_18px_rgba(255,168,0,0.8)] hover:shadow-[0_0_24px_rgba(255,168,0,1)] disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? "Saving..." : "Continue"}
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

/* ----------------- ColorSelect Component ----------------- */

function ColorSelect({ id, value, onChange, options = [], placeholder = "" }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!btnRef.current) return;
      if (btnRef.current.contains(e.target)) return;
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (open && panelRef.current) {
      const node = panelRef.current.children[highlighted];
      if (node) node.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted, open]);

  function toggle() {
    setOpen((v) => !v);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[highlighted];
      if (opt) {
        onChange(opt.value);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative">
      <button
        id={id}
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className="appearance-none w-full text-left rounded-xl border border-white/18 px-3.5 py-2.5 pr-9 bg-black/50 text-sm sm:text-[15px] text-white shadow-sm hover:border-brand-orange/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/80 transition"
      >
        <span className="flex items-center gap-2">
          {selectedOption && (
            <div
              className="w-4 h-4 rounded border border-white/20 flex-shrink-0"
              style={{ backgroundColor: selectedOption.hex }}
            />
          )}
          <span className={value ? "text-white" : "text-slate-500 truncate"}>
            {selectedOption ? `${selectedOption.label} (${selectedOption.hex})` : placeholder}
          </span>
        </span>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <svg
            className={
              "w-4 h-4 transition-transform " + (open ? "rotate-180" : "")
            }
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8l4 4 4-4" />
          </svg>
        </div>
      </button>

      {open && (
        <ul
          role="listbox"
          ref={panelRef}
          tabIndex={-1}
          className="absolute z-40 mt-2 w-full bg-[#05040F] border border-white/15 rounded-xl shadow-xl max-h-44 overflow-auto"
          onKeyDown={onKeyDown}
        >
          {options.map((opt, i) => (
            <li
              key={opt.value + i}
              role="option"
              aria-selected={value === opt.value}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={
                "px-3.5 py-2 text-sm cursor-pointer flex items-center gap-2 " +
                (highlighted === i
                  ? "bg-white/10 text-white"
                  : "text-slate-200") +
                (value === opt.value ? " font-semibold" : "")
              }
            >
              <div
                className="w-4 h-4 rounded border border-white/20 flex-shrink-0"
                style={{ backgroundColor: opt.hex }}
              />
              <span>
                {opt.label} ({opt.hex})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DefineBrandForm;
