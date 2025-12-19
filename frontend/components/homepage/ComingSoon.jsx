// app/components/ComingSoon.jsx
"use client";
import React from "react";

const ComingSoon = () => {
  return (
    <section
      className="
        w-full bg-[#070616]
        flex items-center justify-center overflow-hidden
        px-6 sm:px-10 lg:px-24
        pb-4 sm:pb-6 lg:pb-0
        min-h-[480px] sm:min-h-[540px] lg:min-h-[640px]
        lg:h-screen
      "
    >
      <div
        className="
          w-full max-w-[1240px]
          min-h-[480px] sm:min-h-[520px] lg:min-h-[640px]
          h-auto
          flex flex-col lg:flex-row
          items-center justify-center
          gap-10 lg:gap-8
        "
      >
        {/* LEFT — robot only on desktop */}
        <div className="hidden lg:flex items-center">
          <div
            className="relative"
            style={{ width: "420px", height: "520px", marginLeft: "30px" }}
          >
            <img
              src="/coming-soon-gradient-2.png"
              alt="Coming soon glow"
              className="absolute inset-0 w-auto h-auto object-contain opacity-100 z-0"
              draggable="false"
            />
            <img
              src="/coming-soon-bot.png"
              alt="Cantaloupe bot"
              className="absolute inset-0 m-auto w-[350px] h-auto object-contain select-none z-[5]"
              draggable="false"
            />
          </div>
        </div>

        {/* RIGHT — main content (also used on mobile) */}
        <div
          className="
            flex flex-col justify-center
            max-w-[520px]
            text-center lg:text-left
            items-center lg:items-start
            px-2 sm:px-0
          "
        >
          <h2
            className="
              font-monument font-extrabold text-white
              text-2xl sm:text-3xl md:text-[32px] lg:text-[38px]
              leading-[130%] lg:leading-[140%]
              mb-3
            "
          >
            Coming Soon…
          </h2>

          <p
            className="
              font-poppins
              text-sm sm:text-base md:text-[18px] lg:text-[20px]
              leading-[150%]
              text-[#CFCFCF]
              mb-8
            "
          >
            Plan posts your way and publish on more platforms than ever.
          </p>

          {/* FEATURES LIST */}
          <div className="flex flex-col gap-8 sm:gap-10 w-full">
            {/* 01 */}
            <div className="relative flex items-start gap-4 sm:gap-6">
              <img
                src="/ptn-gradient.png"
                alt=""
                className="absolute left-[-14px] w-[75px] sm:w-[92px] h-auto opacity-50 pointer-events-none"
                draggable="false"
              />
              <img
                src="/ptn1.png"
                alt="1"
                className="relative w-[45px] sm:w-[60px] h-auto select-none flex-shrink-0"
                draggable="false"
              />
              <div className="pl-[6px] text-left">
                <h3
                  className="
                    font-monument text-white
                    text-sm sm:text-lg md:text-[19px] lg:text-[22px]
                    mb-1
                  "
                >
                  Post Scheduling
                </h3>
                <p
                  className="
                    font-poppins
                    text-xs sm:text-sm md:text-[15px] lg:text-[16px]
                    text-[#CFCFCF]
                  "
                >
                  Schedule posts in advance and publish automatically at the
                  perfect time.
                </p>
              </div>
            </div>

            {/* 02 */}
            <div className="relative flex items-start gap-4 sm:gap-6">
              <img
                src="/ptn-gradient.png"
                alt=""
                className="absolute left-[-14px] w-[75px] sm:w-[92px] h-auto opacity-50 pointer-events-none"
                draggable="false"
              />
              <img
                src="/ptn2.png"
                alt="2"
                className="relative w-[45px] sm:w-[60px] h-auto select-none flex-shrink-0"
                draggable="false"
              />
              <div className="pl-[6px] text-left">
                <h3
                  className="
                    font-monument text-white
                    text-sm sm:text-lg md:text-[19px] lg:text-[22px]
                    mb-1
                  "
                >
                  Post On More Platforms
                </h3>
                <p
                  className="
                    font-poppins
                    text-xs sm:text-sm md:text-[15px] lg:text-[16px]
                    text-[#CFCFCF]
                  "
                >
                  Share your content across multiple social platforms instantly
                  and effortlessly.
                </p>
              </div>
            </div>

            {/* 03 */}
            <div className="relative flex items-start gap-4 sm:gap-6">
              <img
                src="/ptn-gradient.png"
                alt=""
                className="absolute left-[-14px] w-[75px] sm:w-[92px] h-auto opacity-50 pointer-events-none"
                draggable="false"
              />
              <img
                src="/ptn3.png"
                alt="3"
                className="relative w-[45px] sm:w-[60px] h-auto select-none flex-shrink-0"
                draggable="false"
              />
              <div className="pl-[6px] text-left">
                <h3
                  className="
                    font-monument text-white
                    text-sm sm:text-lg md:text-[19px] lg:text-[22px]
                    mb-1
                  "
                >
                  Video Post Generation
                </h3>
                <p
                  className="
                    font-poppins
                    text-xs sm:text-sm md:text-[15px] lg:text-[16px]
                    text-[#CFCFCF]
                  "
                >
                  Create AI-generated video posts with captions, visuals and
                  transitions in seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComingSoon;
