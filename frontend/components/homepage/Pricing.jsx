// Pricing.jsx
"use client";
import React, { useState } from "react";
import GradientButton from "../GradientButton";

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

  // Helper function to calculate annual price (17% off is approximately 0.83 multiplier)
  const calculatePrice = (monthlyPrice) => {
    return isAnnual ? Math.round(monthlyPrice * 0.83) : monthlyPrice;
  };

  return (
    <section className="w-full bg-[#070616] py-20 sm:py-24  lg:py-32">
      <div className="mx-auto w-[calc(100vw-40px)] max-w-7xl">
        {/* Heading + Subline */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-[0.5em] text-white/60">
            Pricing
          </p>
          <h2
            className="mt-3 text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl"
            style={{ fontFamily: '"Monument Extended", sans-serif' }}
          >
            Plans that <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-400">scale</span> with every campaign.
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-base text-white/75 sm:text-lg">
            Start free, then choose a plan when you’re ready to scale your
            content pipeline. Switch tiers or cancel anytime—no lock‑ins.
          </p>

          {/* Billing Toggle */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <span
              className={`text-sm ${
                !isAnnual ? "text-white font-semibold" : "text-white/50"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FCAC00]"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm ${
                isAnnual ? "text-white font-semibold" : "text-white/50"
              }`}
            >
              Annual{" "}
              <span className="text-[#FFC56E] font-medium">(Save 17%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid - Using flex or grid to ensure the Professional card is visually distinct */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 items-end">
          
          {/* Free Card */}
          <div className="flex flex-col rounded-[28px] border border-white/12 bg-[#0F0E24] p-8 shadow-[0px_20px_100px_rgba(0,0,0,0.45)] transition duration-300 hover:scale-[1.02] hover:border-white/20">
            <div className="mb-8 text-left">
              <h3 className="text-2xl font-semibold text-white">Free</h3>
              <p className="mt-1 text-base text-white/65">
                For solo creators testing AI workflows.
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">₹0</span>
                <span className="text-sm text-white/60 uppercase tracking-[0.2em]">
                  Forever
                </span>
              </div>
            </div>
            <ul className="mb-8 space-y-3 text-base text-white/75">
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#FFC56E]" />
                4 AI‑generated posts / month
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#FFC56E]" />
                1 connected social profile
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#FFC56E]" />
                Basic scheduling
              </li>
            </ul>
            {/* Button Styling */}
            <button className="mt-auto w-full inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-3 text-base font-semibold text-white hover:bg-white/20 transition duration-300">
              Get started free
            </button>
          </div>

          {/* Starter Card */}
          <div className="flex flex-col rounded-[28px] border border-white/16 bg-[#141333] p-8 shadow-[0px_24px_110px_rgba(0,0,0,0.55)] transition duration-300 hover:scale-[1.02] hover:border-white/20">
            <div className="mb-8 text-left">
              <p className="mb-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#FFC56E]">
                Best for solo brands
              </p>
              <h3 className="text-2xl font-semibold text-white">Starter</h3>
              <p className="mt-1 text-base text-white/70">
                Schedule and ship content consistently on 3 platforms.
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">
                  ₹{calculatePrice(49)}
                </span>
                <span className="text-sm text-white/60">/month</span>
              </div>
            </div>
            <ul className="mb-8 space-y-3 text-base text-white/80">
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#FFC56E]" />
                30 AI‑generated posts / month
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#FFC56E]" />
                3 social profiles
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#FFC56E]" />
                Advanced scheduling automation
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#FFC56E]" />
                Basic analytics & email support
              </li>
            </ul>
            {/* Button Styling */}
            <button className="mt-auto w-full inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#FCAC00] to-[#FF6E00] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-orange-500/40 hover:shadow-orange-400/60 hover:brightness-110 transition duration-300 transform active:scale-[0.98]">
              Choose Starter
            </button>
          </div>

          {/* Professional Card - Enlarged and Highlighted */}
          <div className="relative flex flex-col rounded-[28px] border border-[#FCAC00]/70 bg-[#201E4B] p-8 shadow-[0px_30px_130px_rgba(0,0,0,0.8)] ring-2 ring-[#FCAC00]/50 lg:scale-[1.08] transition duration-300 hover:scale-[1.1] hover:ring-[#FFC56E]/80">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FCAC00] px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-black shadow-lg shadow-[#FCAC00]/50">
              Most popular
            </div>
            <div className="mb-8 text-left pt-4">
              <h3 className="text-2xl font-bold text-white">Professional</h3>
              <p className="mt-1 text-base text-white/70">
                For teams running always‑on, multi‑channel campaigns.
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">
                  ₹{calculatePrice(149)}
                </span>
                <span className="text-sm text-white/60">/month</span>
              </div>
            </div>
            <ul className="mb-8 space-y-3 text-base text-white/85">
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#FFC56E]" />
                200 AI‑generated posts / month
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#FFC56E]" />
                5 social profiles + calendar view
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#FFC56E]" />
                Advanced automation & performance insights
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#FFC56E]" />
                Priority support + 10 teammates
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <CheckCircleIcon className="w-5 h-5 text-purple-400" />
                Dedicated content templates
              </li>
            </ul>
            {/* Button Styling - High Contrast */}
            <button className="mt-auto w-full inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-bold text-[#201E4B] shadow-lg shadow-white/40 hover:bg-[#FFEFD0] transition duration-300 transform active:scale-[0.98]">
              Start Professional
            </button>
          </div>

          {/* Enterprise Card */}
          <div className="flex flex-col rounded-[28px] border border-white/16 bg-[#0F0E24] p-8 shadow-[0px_20px_100px_rgba(0,0,0,0.45)] transition duration-300 hover:scale-[1.02] hover:border-white/20">
            <div className="mb-8 text-left">
              <h3 className="text-2xl font-semibold text-white">Enterprise</h3>
              <p className="mt-1 text-base text-white/70">
                Custom workflows and support for large teams.
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">
                  ₹{calculatePrice(499)}
                </span>
                <span className="text-sm text-white/60">/month</span>
              </div>
            </div>
            <ul className="mb-8 space-y-3 text-base text-white/80">
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#FFC56E]" />
                Unlimited posts & social profiles
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#FFC56E]" />
                White‑label options & custom integrations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#FFC56E]" />
                24/7 support + account manager
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#FFC56E]" />
                Custom reporting & advanced security
              </li>
            </ul>
            {/* Button Styling */}
            <button className="mt-auto w-full inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-3 text-base font-semibold text-white hover:bg-white/20 transition duration-300">
              Start Enterprise
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}