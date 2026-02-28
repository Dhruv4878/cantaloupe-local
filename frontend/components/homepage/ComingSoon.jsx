// app/components/ComingSoon.jsx
"use client";
import React from "react";

const ComingSoon = () => {
  return (
    <section className="relative w-full bg-[#070616] text-white py-16 sm:py-20 lg:py-24">
      {/* Content Wrapper - matching other sections */}
      <div
        className="
          relative mx-auto
          w-full
          max-w-[calc(100vw-24px)]
          sm:max-w-[calc(100vw-64px)]
          lg:max-w-[calc(100vw-200px)]
          px-4 sm:px-6 lg:px-10
        "
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          {/* LEFT — robot only on desktop */}
          <div className="hidden lg:flex items-center justify-center lg:w-[45%]">
            <div className="relative w-[21.875rem] h-[28.125rem]">
              <img
                src="/coming-soon-gradient-2.png"
                alt=""
                className="absolute inset-0 w-full h-full object-contain opacity-80"
                draggable="false"
                aria-hidden="true"
              />
              <img
                src="/coming-soon-bot.png"
                alt="Cantaloupe AI Bot"
                className="absolute inset-0 m-auto w-[18.75rem] h-auto object-contain select-none z-10"
                draggable="false"
              />
            </div>
          </div>

          {/* RIGHT — main content */}
          <div className="flex flex-col lg:w-[55%] text-center lg:text-left items-center lg:items-start">
            <h2
              className="
                text-[1.5rem] md:text-[2.125rem] lg:text-[2.375rem] xl:text-[2.625rem]
                font-extrabold
                leading-[120%] lg:leading-[130%]
                mb-4
              "
              style={{ fontFamily: "Monument Extended, sans-serif" }}
            >
              New Features<span className="bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">.</span><span className="bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">.</span><span className="bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">.</span>
            </h2>

            <p
              className="
                text-[0.875rem] md:text-[1.125rem] lg:text-[1.125rem] xl:text-[1.25rem]
                leading-[150%]
                text-gray-400
                mb-10 sm:mb-12
                max-w-xl
              "
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Plan posts your way and publish on more platforms than ever.
            </p>

            {/* FEATURES LIST */}
            <div className="flex flex-col gap-6 sm:gap-8 w-full max-w-xl">
              {/* Feature 1 */}
              <div className="flex items-start gap-4 group">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-orange-500/30 flex items-center justify-center">
                    <span className="text-lg sm:text-xl font-bold text-orange-500" style={{ fontFamily: "Monument Extended, sans-serif" }}>1</span>
                  </div>
                </div>
                <div className="text-left pt-1">
                  <h3
                    className="
                      text-[0.875rem] md:text-[1.125rem] lg:text-[1.125rem] xl:text-[1.25rem]
                      font-bold
                      mb-2
                      text-white
                    "
                    style={{ fontFamily: "Monument Extended, sans-serif" }}
                  >
                    Post Scheduling
                  </h3>
                  <p
                    className="
                      text-sm sm:text-[0.9375rem] md:text-base
                      text-gray-400
                      leading-relaxed
                    "
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Schedule posts in advance and publish automatically at the perfect time.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-4 group">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-orange-500/30 flex items-center justify-center">
                    <span className="text-lg sm:text-xl font-bold text-orange-500" style={{ fontFamily: "Monument Extended, sans-serif" }}>2</span>
                  </div>
                </div>
                <div className="text-left pt-1">
                  <h3
                    className="
                      text-[0.875rem] md:text-[1.125rem] lg:text-[1.125rem] xl:text-[1.25rem]
                      font-bold
                      mb-2
                      text-white
                    "
                    style={{ fontFamily: "Monument Extended, sans-serif" }}
                  >
                    Post On More Platforms
                  </h3>
                  <p
                    className="
                      text-sm sm:text-[0.9375rem] md:text-base
                      text-gray-400
                      leading-relaxed
                    "
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Share your content across multiple social platforms instantly and effortlessly.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-4 group">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-orange-500/30 flex items-center justify-center">
                    <span className="text-lg sm:text-xl font-bold text-orange-500" style={{ fontFamily: "Monument Extended, sans-serif" }}>3</span>
                  </div>
                </div>
                <div className="text-left pt-1">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2">
                    <h3
                      className="
                        text-[0.875rem] md:text-[1.125rem] lg:text-[1.125rem] xl:text-[1.25rem]
                        font-bold
                        text-white
                      "
                      style={{ fontFamily: "Monument Extended, sans-serif" }}
                    >
                      Video Post Generation
                    </h3>
                    <span className="px-2.5 py-1 text-[0.625rem] sm:text-xs font-semibold bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-full whitespace-nowrap shrink-0 leading-none">
                      Coming Soon
                    </span>
                  </div>
                  <p
                    className="
                      text-sm sm:text-[0.9375rem] md:text-base
                      text-gray-400
                      leading-relaxed
                    "
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Create AI-generated video posts with captions, visuals and transitions in seconds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComingSoon;
