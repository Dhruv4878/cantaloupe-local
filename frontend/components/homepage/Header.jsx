// components/Navbar.js
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import GradientButton from "../GradientButton";

const navItems = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Pricing", href: "/pricing" },
  { name: "Contact Us", href: "/contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = useRef(0);

  // ✅ Show navbar when scrolling up, hide when scrolling down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show near the very top
      if (currentScrollY < 10) {
        setShowNav(true);
      } else {
        if (currentScrollY > lastScrollY.current) {
          // scrolling down
          setShowNav(false);
        } else {
          // scrolling up
          setShowNav(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`
        fixed left-0 top-0 w-full
        z-50
        transition-transform duration-300 ease-out
        ${showNav ? "translate-y-0" : "-translate-y-full"}
      `}
    >
      {/* NAVBAR WRAPPER */}
      <div
        className="
          relative z-10
          mx-auto
          w-full
          max-w-[calc(100vw-24px)]
          sm:max-w-[calc(100vw-64px)]
          lg:max-w-[calc(100vw-200px)]
          px-4 sm:px-6 lg:px-8 xl:px-12
          py-2.5 sm:py-3.5 lg:py-4 xl:py-5
          rounded-[2rem] sm:rounded-full md:rounded-[3.375rem]
          flex items-center
          mt-3 lg:mt-4
          backdrop-blur-xl
          border border-white/10
        "
        style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)",
          boxShadow:
            "0px 4px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="flex w-full items-center justify-between gap-4">
          {/* Logo with enhanced styling */}
          <Link
            href="/"
            className="text-white leading-none text-sm sm:text-base md:text-lg lg:text-xl xl:text-3xl hover:opacity-80 transition-opacity flex items-center gap-2"
            style={{
              fontFamily: "Futura-Bold, system-ui, sans-serif",
              fontWeight: 400,
              lineHeight: "100%",
            }}
          >
            <span className="hidden sm:inline">PostGenerator.AI</span>
            <span className="sm:hidden">PG.AI</span>
          </Link>

          {/* Desktop Nav (md and up) */}
          <nav className="hidden md:flex flex-1 justify-center">
            <div className="flex gap-4 md:gap-6 lg:gap-8 xl:gap-14">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm md:text-sm lg:text-base xl:text-lg lg:font-medium lg:tracking-wide text-white hover:text-white/80 transition-all duration-200 relative group whitespace-nowrap"
                >
                  {item.name}
                  <span className="absolute -bottom-1.5 left-0 w-0 h-[2px] bg-gradient-to-r from-orange-400 to-yellow-400 group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </div>
          </nav>

          {/* Desktop Button (only ≥ md) */}
          <div className="hidden md:block">
            <Link href="/signup">
              <GradientButton className="inline-flex px-3 md:px-4 lg:px-5 xl:px-7 py-2 md:py-2.5 lg:py-2.5 xl:py-3 text-xs md:text-sm lg:text-sm xl:text-base lg:font-medium shadow-lg hover:shadow-orange-500/40 transition-all duration-300">
                Start For Free
              </GradientButton>
            </Link>
          </div>

          {/* Mobile Menu Toggle (only < md) */}
          <button
            className="md:hidden inline-flex items-center justify-center w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] rounded-[14px] sm:rounded-[18px] border border-white/20 bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            <span className="sr-only">Open main menu</span>
            <div className={`space-y-[4px] sm:space-y-[5px] transition-all duration-300 ${isOpen ? "transform rotate-180" : ""}`}>
              <span
                className={`block h-[2px] w-[18px] sm:w-[22px] bg-white rounded-full transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? "translate-y-[6px] sm:translate-y-[7px] rotate-45" : ""
                  }`}
              />
              <span
                className={`block h-[2px] w-[18px] sm:w-[22px] bg-white rounded-full transition-opacity duration-200 ${isOpen ? "opacity-0" : "opacity-100"
                  }`}
              />
              <span
                className={`block h-[2px] w-[18px] sm:w-[22px] bg-white rounded-full transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? "-translate-y-[6px] sm:-translate-y-[7px] -rotate-45" : ""
                  }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu (only < md) */}
      <div
        className={`
          md:hidden
          absolute right-4 sm:right-6 lg:right-8 top-full mt-2
          z-40
          w-64 sm:w-72
          transition-[max-height,opacity] duration-250 ease-out
          ${isOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}
        `}
      >
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg px-5 py-4 space-y-2 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="block py-2.5 px-3 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              {item.name}
            </Link>
          ))}

          {/* Mobile Button (full width) */}
          <Link href="/signup" onClick={() => setIsOpen(false)}>
            <GradientButton className="mt-3 w-full py-3">
              Start For Free
            </GradientButton>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
