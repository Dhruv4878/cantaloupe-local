// components/Footer.js
import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="relative w-full bg-[#070616] text-white overflow-hidden">
      {/* Orange gradient corners */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* Left corner */}
        <div
          className="
            absolute
            -bottom-36 sm:-bottom-40 lg:-bottom-44
            -left-40 sm:-left-44 lg:-left-48
            w-[260px] h-[260px]
            sm:w-[360px] sm:h-[360px]
            lg:w-[520px] lg:h-[520px]
            bg-no-repeat bg-cover opacity-70
            rotate-180
          "
          style={{ backgroundImage: 'url("/corner-gradient.png")' }}
        />

        {/* Right corner */}
        <div
          className="
            absolute 
            -bottom-32 sm:-bottom-36 lg:-bottom-40 
            -right-40 sm:-right-44 lg:-right-52 
            w-[260px] h-[260px]
            sm:w-[360px] sm:h-[360px]
            lg:w-[520px] lg:h-[520px]
            bg-no-repeat bg-cover opacity-70
          "
          style={{ backgroundImage: 'url("/corner-gradient.png")' }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 pt-12 sm:pt-16 pb-8 sm:pb-10">
        <div
          className="
            grid grid-cols-3
            gap-6 sm:gap-10 lg:gap-24
            text-[10px] xs:text-xs sm:text-sm md:text-base
            items-start
          "
        >
          {/* Quick Links */}
          <div className="text-center lg:text-left">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4 tracking-wide">
              Quick Links
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-gray-300">
              <li>
                <Link
                  href="/"
                  className="hover:text-white transition-colors duration-150"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-white transition-colors duration-150"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors duration-150"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="text-center">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4 tracking-wide">
              Social Media
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-gray-300">
              <li>Instagram</li>
              <li>Facebook</li>
              <li>Twitter</li>
              <li>LinkedIn</li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="text-center lg:text-right">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4 tracking-wide">
              Legal Links
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-gray-300">
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-white transition-colors duration-150"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="hover:text-white transition-colors duration-150"
                >
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-8 sm:mt-10 border-t border-white/5 pt-4 sm:pt-5 text-center text-[10px] sm:text-xs md:text-sm text-gray-400">
          © 2025 Generation-next From prompt to multi platform publishing
        </div>
      </div>
    </footer>
  );
};

export default Footer;
