// components/CallToActionSection.js
import React from "react";
import Link from "next/link";
import GradientButton from "../GradientButton";

const CallToActionSection = () => {
  return (
    <section
      className="
        relative w-full flex justify-center
        px-4 sm:px-6 lg:px-0
        py-12 lg:py-20
      "
    >
      {/* Outer container that matches Figma on desktop */}
      <div
        className="
          relative
          w-full max-w-[1240px]
          lg:h-[475px]
          flex items-center justify-center
          overflow-hidden
          rounded-3xl
        "
        style={{
          backgroundColor: "transparent",
        }}
      >
        {/* 1. Grid Background Image */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 opacity-40 rounded-3xl"
          style={{
            backgroundImage: 'url("/Glass.png")',
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />

        {/* 2. Orange Linear / Radial Gradient Overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] rounded-3xl"
          style={{
            background: `radial-gradient(circle at center, 
              rgba(255, 165, 0, 0.2) 0%,
              rgba(255, 103, 0, 0.15) 20%,
              rgba(0, 0, 0, 0.05) 50%,
              rgba(0, 0, 0, 0) 70%
            ),
            linear-gradient(
              139.77deg,
              rgba(253, 211, 1, 0.05) -5.14%,
              rgba(255, 103, 0, 0.05) 71.46%
            )`,
          }}
        />

        {/* 3. Main Content Box */}
        <div
          className="
            relative z-10
            flex flex-col items-center justify-center
            text-white text-center
            rounded-[24px]
            px-4 sm:px-6 md:px-8
            py-6 sm:py-8 md:py-10
            gap-4 sm:gap-5 md:gap-6
            w-full max-w-[737px]
          "
        >
          {/* Heading Text */}
          <h2
            className="
              font-monument font-extrabold
              text-2xl sm:text-[28px] md:text-[32px] lg:text-[39px]
              leading-[130%] lg:leading-[150%]
            "
          >
            Get AI With <br /> All Your Socials
          </h2>

          {/* Paragraph Text */}
          <p
            className="
              font-poppins font-normal text-[#B4B4B4]
              text-sm sm:text-[16px] md:text-[20px] lg:text-[27px]
              leading-[140%] lg:leading-[100%]
              max-w-[90%] md:max-w-full
            "
          >
            From prompt to multi-platform publishing in{" "}
            <br className="hidden md:block" />
            seconds no designers, no writers, no hassle.
          </p>

          {/* CTA Button */}
          <Link href="/signup">
  <GradientButton className="hidden sm:inline-flex">
    Learn More
  </GradientButton>
</Link>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
