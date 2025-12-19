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
      {/* 🔶 LEFT ORANGE BACKGROUND GLOW */}
      <div className="pointer-events-none absolute -top-32 -left-20 sm:-left-28 w-[200px] sm:w-[272px] h-[320px] sm:h-[437px] -z-0">
        <Image
          src="/corner-gradient.png"
          alt="Orange glow"
          fill
          className="object-cover"
          style={{
            transform: "rotate(-112.54deg)",
            opacity: 1,
            filter: "blur(18px)",
          }}
        />
      </div>

      {/* NAVBAR WRAPPER */}
      <div
        className="
          relative z-10
          mx-auto
          w-full
          max-w-[calc(100vw-24px)]   /* tighter gutter on very small screens */
          sm:max-w-[calc(100vw-64px)]
          lg:max-w-[calc(100vw-200px)] /* desktop: same as your original */
          px-3 sm:px-5 lg:px-8
          pt-3 pb-2.5
          rounded-[28px] md:rounded-[54px]
          flex items-center
          mt-3
          backdrop-blur-xl
        "
        style={{
          background: "#FFFFFF0A",
          boxShadow:
            "0px 2px 10px 0px #00000040, inset 2px 2px 8px 0px #FFFFFF26",
        }}
      >
        <div className="flex w-full items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="text-white leading-none text-lg sm:text-xl md:text-2xl"
            style={{
              fontFamily: "Futura-Bold, system-ui, sans-serif",
              fontWeight: 400,
              lineHeight: "100%",
            }}
          >
            PostGenerator.AI
          </Link>

          {/* Desktop Nav (md and up) */}
          <nav className="hidden md:flex flex-1 justify-center">
            <div className="flex gap-8 lg:gap-10">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* Desktop Button (only ≥ md) */}
          <div className="hidden md:block">
            <Link href="/signup">
              <GradientButton className="inline-flex">
                Start For Free
              </GradientButton>
            </Link>
          </div>

          {/* Mobile Menu Toggle (only < md) */}
          <button
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            <span className="sr-only">Open main menu</span>
            <div className="space-y-1.5">
              <span
                className={`block h-[2px] w-5 bg-white transition-transform duration-200 ${
                  isOpen ? "translate-y-[5px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-[2px] w-5 bg-white transition-opacity duration-200 ${
                  isOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block h-[2px] w-5 bg-white transition-transform duration-200 ${
                  isOpen ? "-translate-y-[5px] -rotate-45" : ""
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
          relative z-10
          mx-auto
          w-full
          max-w-[calc(100vw-24px)]
          sm:max-w-[calc(100vw-64px)]
          transition-[max-height,opacity,margin] duration-250 ease-out
          ${isOpen ? "max-h-72 opacity-100 mt-2" : "max-h-0 opacity-0 overflow-hidden"}
        `}
      >
        <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-lg px-5 py-3 space-y-2 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="block py-2 text-sm text-white/80 hover:text-white"
            >
              {item.name}
            </Link>
          ))}

          {/* Mobile Button (full width) */}
          <Link href="/signup" onClick={() => setIsOpen(false)}>
            <GradientButton className="mt-2 w-full">
              Start For Free
            </GradientButton>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
