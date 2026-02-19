
import React from "react";

export const GlassCard = ({ children, className = "", noPadding = false }) => (
  <div
    className={`rounded-2xl relative text-white ${noPadding ? "p-0" : "p-6"} ${className}`}
    style={{
      background: "#0f121e", // Darker, solid base for better contrast
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
    }}
  >
    {children}
  </div>
);
