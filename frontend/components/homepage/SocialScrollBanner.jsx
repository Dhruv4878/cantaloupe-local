import React from "react";
import Image from "next/image";

const SocialScrollBanner = () => {
  // Logo configuration
  const logos = [
    { src: "/fb.png", alt: "Facebook" },
    { src: "/linkedin.png", alt: "LinkedIn" },
    { src: "/inst.png", alt: "Instagram" },
    { src: "/fb.png", alt: "Facebook" },
    { src: "/linkedin.png", alt: "LinkedIn" },
    { src: "/inst.png", alt: "Instagram" },
    { src: "/linkedin.png", alt: "LinkedIn" },
  ];

  const DUPLICATE_COUNT = 2; // Number of logo sets for seamless scrolling

  return (
    <section
      className="relative w-full bg-[#070616] overflow-hidden flex items-center justify-center h-[8.75rem] sm:h-[11.25rem] lg:h-[12rem] xl:h-[15.25rem]"
      aria-label="Supported social media platforms"
    >
      {/* Gradient Overlays for Fade Effect */}
      <div
        className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#070616] to-transparent z-10 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#070616] to-transparent z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Full Width Scrolling Container */}
      <div className="relative w-full">
        <div className="relative overflow-hidden">
          <div className="flex items-center gap-16 lg:gap-20 xl:gap-24 animate-scroll">
            {/* Render logos multiple times for seamless loop */}
            {[...Array(DUPLICATE_COUNT)].map((_, setIndex) => (
              <div
                key={`logo-set-${setIndex}`}
                className="flex items-center gap-16 lg:gap-20 xl:gap-24 flex-shrink-0"
                aria-hidden={setIndex > 0} // Hide duplicates from screen readers
              >
                {logos.map((logo, index) => (
                  <div
                    key={`${setIndex}-logo-${index}`}
                    className="flex-shrink-0"
                  >
                    <Image
                      src={logo.src}
                      alt={setIndex === 0 ? logo.alt : ""} // Only first set has alt text
                      width={137}
                      height={44}
                      className="w-auto h-[5rem] sm:h-[6rem] lg:h-[7rem] xl:h-[8rem]"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialScrollBanner;
