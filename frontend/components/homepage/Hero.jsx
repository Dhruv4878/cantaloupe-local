// components/HeroSection.jsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import GradientButton from "../GradientButton";

const HeroSection = () => {
  return (
    <section className="relative w-full text-white overflow-hidden min-h-[70vh]">
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

      {/* 3. ROBOT BEHIND TEXT ON MOBILE/TABLET (hidden on desktop) */}
      <div
        aria-hidden="true"
        className="
          absolute inset-0
          z-[2]
          flex justify-center items-center
          pointer-events-none
          lg:hidden
        "
      >
        <Image
          src="/hero-robot.png"
          alt=""
          width={438}
          height={708}
          priority
          className="
            object-contain
            max-h-[340px] sm:max-h-[420px] md:max-h-[500px]
            opacity-25 sm:opacity-35 md:opacity-45
          "
          style={{ transform: "translateY(8px)" }}
        />
      </div>

      {/* 4. Black fade at bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 z-[3]
                   bg-gradient-to-b from-transparent to-[#070616]"
      />

      {/* 5. CONTENT WRAPPER – aligned with navbar (desktop px-24 kept) */}
      <div
        className="
          relative z-10 mx-auto
          flex flex-col lg:flex-row
          items-center lg:items-center
          justify-between
          gap-8 lg:gap-12
          px-4 sm:px-6 lg:px-10
          py-14 sm:py-16 lg:py-20
          max-w-6xl
        "
      >
        {/* LEFT: HERO TEXT BLOCK */}
        <div className="w-full lg:w-[55%] flex flex-col gap-3 text-center lg:text-left">
          {/* Top line */}
          <p
            className="
              hero-kicker
              text-sm sm:text-base md:text-lg lg:text-[20px]
            "
          >
            What If Your Next Post Could Be Ready in Instantly?
          </p>

          {/* Main heading */}
          <h1
            className="
              hero-heading
              text-[24px] sm:text-[30px] md:text-[34px] lg:text-[39px] xl:text-[44px]
              leading-[120%] lg:leading-[140%]
            "
          >
            The Fastest Way To <br /> Create &amp; Post Socials
          </h1>

          {/* Subtext */}
          <p
            className="
              hero-subtext
              text-[14px] sm:text-[15px] md:text-[17px] lg:text-[19px]
              leading-[150%] md:leading-[140%] lg:leading-[125%]
            "
          >
            From prompt to multi-platform publishing in seconds no designers,
            no writers, no hassle.
          </p>

          {/* Buttons Row */}
          <div
            className="
              flex flex-wrap items-center gap-4 mt-4
              justify-center lg:justify-start
            "
          >
            {/* Start For Free Button */}
            <Link href="/signup">
  <GradientButton className="hidden sm:inline-flex">
    Start For Free
  </GradientButton>
</Link>

            {/* Explore Features Button – rotating border, pill radius */}
            <div className="border-rotate-glow relative inline-flex items-center justify-center">
              <Link
                href="/features"
                className="
                  border-rotate-inner
                  flex items-center justify-center 
                  text-xs sm:text-sm md:text-[14px]
                  text-gray-300 hover:text-white
                  transition duration-200
                  whitespace-nowrap
                  px-4 py-2 sm:px-5 sm:py-2.5
                "
              >
                Explore Features 
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT: ROBOT IMAGE – DESKTOP ONLY (original layout preserved) */}
        <div className="hidden lg:flex w-full lg:w-[45%] justify-center lg:justify-end">
          <Image
            src="/hero-robot.png"
            alt="Cantaloupe AI Bot working on a laptop"
            width={438.3945617675781}
            height={707.9317016601562}
            priority
            className="pointer-events-none select-none object-contain"
            style={{
              maxHeight: "640px",
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
