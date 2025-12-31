"use client";
import React from "react";

const AboutUs = () => {
  return (
    <section
      className="
        w-full bg-[#070616]
        py-4 sm:py-4 lg:py-4
        px-4 sm:px-6 lg:px-0
      "
    >
      <div
        className="
          mx-auto
          w-full
          lg:w-[calc(100vw-200px)]     /* keep Figma width on desktop */
          max-w-[1100px]
          rounded-[24px] sm:rounded-[32px]
          border border-white/10
          bg-white/5
          px-5 py-8
          sm:px-8 sm:py-12
          lg:px-10 lg:py-14
          text-center
          shadow-[0px_20px_120px_rgba(0,0,0,0.35)]
          backdrop-blur
        "
      >
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.4em] sm:tracking-[0.6em] text-white/60">
          About PostGenerator.AI
        </p>

        <h2
          className="
            mt-3 sm:mt-4
            text-2xl sm:text-3xl
            lg:text-[44px]
            font-extrabold text-white
            leading-[130%] lg:leading-[140%]
          "
          style={{ fontFamily: '"Monument Extended", sans-serif' }}
        >
          Human teams, AI precision — one workspace for every launch.
        </h2>

        <p
          className="
            mx-auto mt-4 sm:mt-6
            max-w-3xl
            text-sm sm:text-base lg:text-lg
            text-white/75
            leading-[150%]
          "
        >
          We’re a remote collective of strategists, engineers, and editors
          building a publishing OS for modern brands. From ideation to
          reporting, the PostGenerator.AI platform keeps every teammate in sync so
          campaigns move faster without losing the voice that makes them
          memorable.
        </p>
      </div>
    </section>
  );
};

export default AboutUs;
