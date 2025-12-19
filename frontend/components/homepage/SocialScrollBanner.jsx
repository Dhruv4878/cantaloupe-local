// components/SocialBanner.js
import React from "react";
import Image from "next/image";

const SocialBanner = () => {
  return (
    <section
      className="
        relative 
        w-full 
        bg-[#070616] 
        mx-auto 
        overflow-hidden 
        flex 
        items-center 
        justify-center
        h-[180px] lg:h-[244px]
      "
    >
      <div className="w-full max-w-[1440px] flex items-center justify-center">
        {/* DESKTOP / LAPTOP – EXACT FIGMA LAYOUT (7 LOGOS) */}
        <div className="hidden lg:flex items-center gap-20">
          {/* Left side (faded) */}
          <Image
            src="/inst.png"
            alt="Instagram"
            width={137.29}
            height={43.85}
            className="opacity-15"
          />
          <Image
            src="/fb.png"
            alt="Facebook"
            width={137.29}
            height={43.85}
            className="opacity-30"
          />
          <Image
            src="/linkedin.png"
            alt="LinkedIn"
            width={137.29}
            height={43.85}
            className="opacity-60"
          />

          {/* Center (bright) */}
          <Image
            src="/inst.png"
            alt="Instagram"
            width={137.29}
            height={43.85}
            className="opacity-100"
          />

          {/* Right side (mirrored fade) */}
          <Image
            src="/linkedin.png"
            alt="LinkedIn"
            width={137.29}
            height={43.85}
            className="opacity-60"
          />
          <Image
            src="/fb.png"
            alt="Facebook"
            width={137.29}
            height={43.85}
            className="opacity-30"
          />
          <Image
            src="/inst.png"
            alt="Instagram"
            width={137.29}
            height={43.85}
            className="opacity-15"
          />
        </div>

        {/* MOBILE / TABLET – 3 LOGOS ONLY (LEFT FADE, BRIGHT MIDDLE, RIGHT FADE) */}
        <div className="flex lg:hidden items-center justify-center gap-8">
          {/* Left – faded */}
          <Image
            src="/inst.png"
            alt="Instagram"
            width={110}
            height={35}
            className="opacity-40 h-auto"
          />

          {/* Middle – bright */}
          <Image
            src="/linkedin.png"
            alt="LinkedIn"
            width={120}
            height={38}
            className="opacity-100 h-auto"
          />

          {/* Right – faded */}
          <Image
            src="/fb.png"
            alt="Facebook"
            width={110}
            height={35}
            className="opacity-40 h-auto"
          />
        </div>
      </div>
    </section>
  );
};

export default SocialBanner;
