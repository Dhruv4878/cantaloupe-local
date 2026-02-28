"use client";
import React from "react";

const AboutUs = () => {
  return (
    <section className="relative w-full bg-[#070616] text-white py-6 sm:py-8 lg:py-12">
      {/* Content Wrapper - matching other sections */}
      <div
        className="
          relative mx-auto
          w-full
          max-w-[calc(100vw-24px)]
          sm:max-w-[calc(100vw-64px)]
          lg:max-w-[calc(100vw-200px)]
        "
      >
        <div
          className="
            w-full
            rounded-2xl sm:rounded-3xl
            border border-white/10
            bg-gradient-to-br from-white/[0.05] to-white/[0.02]
            backdrop-blur-xl
            px-6 py-8
            sm:px-8 sm:py-10
            lg:px-12 lg:py-12
            text-center
            shadow-2xl
          "
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/20 backdrop-blur-sm mb-6">
            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs sm:text-sm font-medium text-gray-300 tracking-wider uppercase">About PostGenerator.AI</span>
          </div>

          <h2
            className="
              text-[1.5rem] md:text-[2rem] lg:text-[2.25rem] xl:text-[2.5rem]
              font-extrabold
              leading-[130%] lg:leading-[140%]
              mb-5 sm:mb-6
            "
            style={{ fontFamily: "Monument Extended, sans-serif" }}
          >
            Human teams, AI precision —{" "}
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
              one workspace for every launch.
            </span>
          </h2>

          <p
            className="
              mx-auto
              max-w-3xl
              text-sm md:text-[1rem] lg:text-[1.125rem] xl:text-[1.125rem]
              text-gray-400
              leading-relaxed
            "
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            We're a remote collective of strategists, engineers, and editors
            building a publishing OS for modern brands. From ideation to
            reporting, the PostGenerator.AI platform keeps every teammate in sync so
            campaigns move faster without losing the voice that makes them
            memorable.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
