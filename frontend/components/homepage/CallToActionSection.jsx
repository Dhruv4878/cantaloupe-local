// components/CallToActionSection.js
import React from "react";
import Link from "next/link";
import GradientButton from "../GradientButton";

const CallToActionSection = () => {
  return (
    <section className="relative w-full text-white sm:py-2 lg:py-2">
      {/* Content Wrapper - matching hero section structure */}
      <div
        className="
          relative mx-auto
          w-full
          max-w-[calc(100vw-24px)]
          sm:max-w-[calc(100vw-64px)]
          lg:max-w-[calc(100vw-200px)]
        "
      >
        {/* CTA Card */}
        <div
          className="
            relative
            w-full
            md:min-h-[20rem] lg:min-h-[24rem] xl:min-h-[28rem]
            flex items-center justify-center
            overflow-hidden
            rounded-3xl
            border border-white/10
            backdrop-blur-xl
          "
          style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Grid Background Image */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 opacity-30 rounded-3xl"
            style={{
              backgroundImage: 'url("/Glass.png")',
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />

          {/* Orange Gradient Overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[1] rounded-3xl"
            style={{
              background: `radial-gradient(circle at center, 
                rgba(255, 165, 0, 0.15) 0%,
                rgba(255, 103, 0, 0.1) 30%,
                rgba(0, 0, 0, 0) 70%
              )`,
            }}
          />

          {/* Main Content */}
          <div
            className="
              relative z-10
              flex flex-col items-center justify-center
              text-white text-center
              px-6 sm:px-8 md:px-12
              py-10 sm:py-12 md:py-14 lg:py-16
              gap-5 sm:gap-6 md:gap-8
              w-full max-w-[50rem]
            "
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/20 backdrop-blur-sm">
              <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-300">Get Started</span>
            </div>

            {/* Heading */}
            <h2
              className="
                font-monument font-extrabold
                text-[1.375rem] sm:text-[1.75rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[3rem]
                leading-[120%] lg:leading-[130%]
                bg-gradient-to-br from-white via-white to-gray-300
                bg-clip-text text-transparent
              "
            >
              Get AI With <br /> All Your Socials
            </h2>

            {/* Paragraph */}
            <p
              className="
                text-[0.875rem] md:text-[1.125rem] lg:text-[1.25rem] xl:text-[1.375rem]
                leading-[150%]
                max-w-2xl
                text-gray-300
              "
            >
              From prompt to multi-platform publishing in seconds — no designers, no writers, no hassle.
            </p>

            {/* CTA Button */}
            <Link href="/signup">
              <GradientButton className="hidden sm:inline-flex text-base px-8 py-3.5 mt-4 shadow-2xl hover:shadow-orange-500/50">
                Learn More
              </GradientButton>
            </Link>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
