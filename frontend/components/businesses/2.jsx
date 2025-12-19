"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReviewDetails() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Restore saved values on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("onboardingStep2") || "{}"
      );
      if (saved.businessDescription) setDescription(saved.businessDescription);
      if (saved.industry) setIndustry(saved.industry);
      if (saved.companySize) setCompanySize(saved.companySize);
    } catch (_) {}
  }, []);

  // Auto-save whenever fields change
  useEffect(() => {
    const payload = {
      businessDescription: description,
      industry,
      companySize,
    };
    sessionStorage.setItem("onboardingStep2", JSON.stringify(payload));
  }, [description, industry, companySize]);

  // 🔥 3-step progress config
  const steps = ["Name & Website", "Branding", "Setup"];
  const currentStep = 2;
  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;
  

  function handleBack() {
    router.push("/businesses/create");
  }

  function handleNext() {
    if (!description.trim() || !industry || !companySize) {
      setErrorMessage("Please complete all required fields marked with *.");
      return;
    }
    sessionStorage.setItem(
      "onboardingStep2",
      JSON.stringify({
        businessDescription: description,
        industry,
        companySize,
      })
    );
    router.push("/businesses/create/3");
  }

  return (
    <div className="relative min-h-screen bg-brand-dark text-white font-poppins overflow-hidden">
      {/* Background */}
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
        {/* HEADER */}
        <div className="mb-8 text-center">
          <p className="text-[11px] tracking-[0.35em] uppercase text-brand-gray/80 mb-2">
            Onboarding
          </p>
          <h1 className="font-monument text-[26px] sm:text-[32px] leading-snug">
            Review your details
          </h1>
          <p className="text-sm sm:text-base text-brand-gray mt-2 max-w-xl mx-auto">
            We&apos;ve analyzed your website. Review and adjust the details
            below.
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="rounded-3xl border border-white/12 bg-white/5 backdrop-blur-2xl shadow-[0_26px_60px_rgba(0,0,0,0.8)] px-4 sm:px-6 md:px-10 py-6 sm:py-8 space-y-8">
          {/* PROGRESS (3 steps, same UI) */}
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


          {/* FORM */}
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
          >
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-100 mb-1.5">
                Business Description*
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your business"
                className="w-full rounded-2xl bg-black/45 border border-white/15 px-3.5 py-3 text-sm sm:text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-orange/80 focus:border-brand-orange/80 transition resize-none"
              />
              <p className="text-[11px] text-brand-gray mt-1.5">
                A short description that helps team members understand your
                business.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-100 mb-1.5">
                  Industry*
                </label>
                <CustomSelect
                  id="industry"
                  value={industry}
                  onChange={(v) => setIndustry(v)}
                  options={[
                    "---------",
                    "Technology",
                    "Retail",
                    "Healthcare",
                    "Education",
                  ]}
                  placeholder="---------"
                />
                <p className="text-[11px] text-brand-gray mt-1.5">
                  Select the industry that best describes your business.
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-100 mb-1.5">
                  Company Size*
                </label>
                <CustomSelect
                  id="companySize"
                  value={companySize}
                  onChange={(v) => setCompanySize(v)}
                  options={["---------", "1-10", "11-50", "51-200", "200+"]}
                  placeholder="---------"
                />
                <p className="text-[11px] text-brand-gray mt-1.5">
                  Approximate number of employees in your organization.
                </p>
              </div>
            </div>

            {errorMessage && (
              <p className="text-xs sm:text-sm text-red-300 bg-red-950/50 border border-red-500/40 rounded-xl px-3 py-2">
                {errorMessage}
              </p>
            )}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium border border-white/20 text-slate-200 bg-black/40 hover:bg-white/5 transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-brand-dark bg-gradient-to-r from-brand-yellow to-brand-orange shadow-[0_0_18px_rgba(255,168,0,0.8)] hover:shadow-[0_0_24px_rgba(255,168,0,1)] transition"
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

/* ----------------- CustomSelect (same file) ----------------- */

function CustomSelect({ id, value, onChange, options = [], placeholder = "" }) {
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
      const val = options[highlighted] || placeholder;
      onChange(val === placeholder ? "" : val);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

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
        <span
          className={
            "truncate " + (value ? "text-white" : "text-slate-500")
          }
        >
          {value || placeholder}
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
              key={opt + i}
              role="option"
              aria-selected={value === opt}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => {
                onChange(opt === placeholder ? "" : opt);
                setOpen(false);
              }}
              className={
                "px-3.5 py-2 text-sm cursor-pointer " +
                (highlighted === i
                  ? "bg-white/10 text-white"
                  : "text-slate-200") +
                (value === opt ? " font-semibold" : "")
              }
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
