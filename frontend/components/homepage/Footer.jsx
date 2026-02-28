// components/Footer.js
import React from "react";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative w-full bg-[#070616] text-white py-16 sm:py-18 lg:py-18">
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
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 sm:gap-8 md:gap-12 lg:gap-16 mb-12">
          {/* Brand Section (Left) */}
          <div className="flex flex-col items-center sm:items-start md:items-center sm:col-span-2 md:col-span-1 text-center sm:text-left md:text-center">
            <Link
              href="/"
              className="text-white leading-none text-2xl md:text-3xl lg:text-2xl xl:text-3xl hover:opacity-80 transition-opacity mb-4 sm:mb-6"
              style={{
                fontFamily: "Futura-Bold, system-ui, sans-serif",
                fontWeight: 400,
                lineHeight: "100%",
              }}
            >
              PostGenerator.AI
            </Link>
            <p
              className="text-gray-400 text-sm sm:text-base mb-6 sm:mb-8 max-w-xs leading-relaxed"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              From prompt to multi-platform publishing in seconds.
            </p>
            {/* Social Media Icons */}
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-purple-500/20 border border-white/10 hover:border-orange-500/50 flex items-center justify-center transition-all duration-300 group"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-purple-500/20 border border-white/10 hover:border-orange-500/50 flex items-center justify-center transition-all duration-300 group"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-purple-500/20 border border-white/10 hover:border-orange-500/50 flex items-center justify-center transition-all duration-300 group"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-purple-500/20 border border-white/10 hover:border-orange-500/50 flex items-center justify-center transition-all duration-300 group"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links (Center) */}
          <div className="flex flex-col items-center sm:items-start md:items-center">
            <h3
              className="text-lg sm:text-xl lg:text-xl xl:text-2xl font-bold mb-4 sm:mb-6 text-white"
              style={{ fontFamily: "Monument Extended, sans-serif" }}
            >
              Quick Links
            </h3>
            <ul className="space-y-3 sm:space-y-4 flex flex-col items-center sm:items-start md:items-center" style={{ fontFamily: "Poppins, sans-serif" }}>
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-200 text-base inline-block relative group"
                >
                  Home
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 group-hover:w-full transition-all duration-300" />
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-200 text-base inline-block relative group"
                >
                  Pricing
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 group-hover:w-full transition-all duration-300" />
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-200 text-base inline-block relative group"
                >
                  Contact Us
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 group-hover:w-full transition-all duration-300" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links (Right) */}
          <div className="flex flex-col items-center sm:items-start md:items-center">
            <h3
              className="text-lg sm:text-xl lg:text-xl xl:text-2xl font-bold mb-4 sm:mb-6 text-white"
              style={{ fontFamily: "Monument Extended, sans-serif" }}
            >
              Legal Links
            </h3>
            <ul className="space-y-3 sm:space-y-4 flex flex-col items-center sm:items-start md:items-center" style={{ fontFamily: "Poppins, sans-serif" }}>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-200 text-base inline-block relative group"
                >
                  Privacy
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 group-hover:w-full transition-all duration-300" />
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-200 text-base inline-block relative group"
                >
                  Terms &amp; Conditions
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 group-hover:w-full transition-all duration-300" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-white/10">
          <p
            className="text-gray-400 text-sm sm:text-base text-center"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            © 2025 PostGenerator.AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
