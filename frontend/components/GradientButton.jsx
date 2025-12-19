"use client";
import React from "react";

const GradientButton = ({
  children = "Start For Free",
  className = "",
  onClick,
  type = "button",
  disabled = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        rounded-full text-[14px] font-semibold text-white whitespace-nowrap
        px-4 py-2
        transition-all duration-300
         hover:scale-[1.03]
        shadow-[0_0_0px_rgba(255,140,0,0)]
        hover:shadow-[0_0_14px_rgba(255,140,0,0.55)]
        hover:opacity-100
        active:scale-95
        disabled:opacity-60 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-orange-400/70 focus:ring-offset-0
        ${className}
      `}
      style={{
        background:
          "linear-gradient(119.02deg, #FCAC00 -22.94%, #FF6E00 83.73%)",
      }}
    >
      {children}
    </button>
  );
};

export default GradientButton;
