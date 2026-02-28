// components/HeroSection.jsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import GradientButton from "../GradientButton";

const HeroSection = () => {
  return (
    <section className="relative w-full text-white min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] md:mt-8 lg:mt-10">
      {/* 1. Background Grid Image Layer */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 opacity-30 sm:opacity-40 lg:opacity-70"
        style={{
          backgroundImage: 'url("/Glass.png")',
          backgroundSize: "75%",
          backgroundPosition: "center",
          backgroundRepeat: "repeat",
        }}
      />

      {/* 2. Orange Gradient Image Layer (hero side) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] pointer-events-none opacity-30 sm:opacity-45 lg:opacity-70"
        style={{
          backgroundImage: 'url("/hero-gradient.png")',
          backgroundSize: "80%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center right",
        }}
      />

      {/* 4. Black fade at bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 sm:h-40 z-[3]
                   bg-gradient-to-b from-transparent to-[#070616]"
      />

      {/* 5. CONTENT WRAPPER – exactly matching navbar structure */}
      <div
        className="
          relative z-10 mx-auto
          w-full
          max-w-[calc(100vw-24px)]
          sm:max-w-[calc(100vw-64px)]
          lg:max-w-[calc(100vw-200px)]
          pt-28 pb-16 sm:pt-36 sm:pb-16 md:pt-16 lg:pt-20 lg:pb-20
        "
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 sm:gap-12 md:gap-6 lg:gap-12">
          {/* LEFT: HERO TEXT BLOCK */}
          <div className="w-full md:w-[58%] lg:w-[60%] xl:w-[55%] flex flex-col items-center md:items-start text-center md:text-left gap-6 sm:gap-7 md:gap-8 lg:gap-5 xl:gap-10 animate-fade-in-up">
            {/* Top line with badge style */}
            <div className="inline-flex items-center justify-center md:justify-start w-full mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#111]/80 backdrop-blur-sm border border-white/10 text-[11px] sm:text-sm text-gray-300 max-w-full text-left sm:text-center shadow-[0_0_15px_rgba(255,255,255,0.03)] hover:border-white/20 transition-colors cursor-default">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                <p className="truncate sm:whitespace-normal font-medium tracking-wide">
                  What If Your Next Post Could Be Ready Instantly?
                </p>
              </div>
            </div>

            {/* Main heading with better sizing */}
            <h1
              className="
                hero-heading
                text-[1.625rem] sm:text-[2.25rem] md:text-[2.5rem] lg:text-[2.75rem] xl:text-[3.25rem]
                leading-[1.15] sm:leading-[1.1] md:leading-[120%] lg:leading-[130%] xl:leading-[120%]
                tracking-tight
                font-extrabold
              "
            >
              The Fastest Way To <br />
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Create &amp; Post Socials
              </span>
            </h1>

            {/* Subtext */}
            <p
              className="
                hero-subtext
                text-[0.9375rem] sm:text-base md:text-lg lg:text-[1.25rem] xl:text-[1.375rem]
                leading-relaxed md:leading-[150%] xl:leading-[140%]
                max-w-[90%] sm:max-w-2xl md:max-w-xl mx-auto md:mx-0
                text-gray-400
              "
            >
              From prompt to multi-platform publishing in seconds — no designers,
              no writers, no hassle.
            </p>

            {/* Buttons Row */}
            <div
              className="
                flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-5 mt-2 md:mt-4 lg:mt-6
              "
            >
              {/* Start For Free Button */}
              <Link href="/signup">
                <button className="px-5 py-2.5 md:px-6 md:py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[0.875rem] font-semibold hover:from-orange-400 hover:to-orange-500 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                  Start For Free
                </button>
              </Link>

              {/* Explore Features Button */}
              <Link
                href="/pricing"
                className="px-5 py-2.5 md:px-5 md:py-2.5 rounded-full bg-[#0a0a0a] border border-orange-500/30 text-white text-[0.875rem] font-semibold hover:bg-[#111] hover:border-orange-500/60 transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(249,115,22,0.1)] flex items-center justify-center gap-2 group"
              >
                Explore plans
                <svg className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path></svg>
              </Link>
            </div>
          </div>

          {/* RIGHT: ROBOT IMAGE – hidden below md */}
          <div className="hidden md:flex w-[42%] lg:w-[40%] xl:w-[45%] justify-end items-end animate-fade-in-right">
            <div className="relative w-full flex justify-end items-end">
              {/* Natural multi-layered glow effect behind robot */}
              <div className="absolute inset-0 -z-10 hidden lg:block">
                {/* Soft orange glow - bottom left */}
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/15 rounded-full blur-[80px]" />
                {/* Soft purple glow - top right */}
                <div className="absolute top-0 right-0 w-56 h-56 bg-purple-500/12 rounded-full blur-[70px]" />
                {/* Center ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-br from-orange-500/8 to-purple-500/8 rounded-full blur-[90px]" />
              </div>

              <Image
                src="/hero-robot.png"
                alt="Cantaloupe AI Bot working on a laptop"
                width={438.3945617675781}
                height={707.9317016601562}
                className="pointer-events-none select-none object-contain relative z-10 drop-shadow-2xl w-full h-auto max-h-[16rem] sm:max-h-[20rem] md:max-h-[22.5rem] lg:max-h-[28.75rem] xl:max-h-[40rem]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
