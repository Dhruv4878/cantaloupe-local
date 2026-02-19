
import React from "react";

export const OrangeButton = ({
  children,
  className = "",
  disabled,
  onClick,
  type = "button",
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`relative inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg px-4 py-2
      ${
        disabled
          ? "opacity-50 cursor-not-allowed bg-gray-600"
          : "hover:scale-[1.02] active:scale-95 shadow-lg shadow-orange-500/20"
      }
      bg-gradient-to-r from-orange-500 to-amber-500 text-white ${className}`}
  >
    {children}
  </button>
);
