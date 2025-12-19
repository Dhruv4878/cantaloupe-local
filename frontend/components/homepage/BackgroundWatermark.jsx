// app/components/CantaloupeTitle.js
"use client";
import React from "react";

const CantaloupeTitle = () => {
  return (
    <section
      className="
        relative mx-auto
        px-4 sm:px-6       /* space on small screens */
        mt-16 sm:mt-20 lg:mt-[100px]
        mb-16 sm:mb-20 lg:mb-[100px]
      "
      style={{
        maxWidth: "1442px",   // keep figma width on desktop
      }}
    >
      {/* TITLE IMAGE */}
      <img
        src="/Cantaloupe.png"
        alt="Cantaloupe"
        draggable={false}
        className="
          block
          select-none
          w-full
          h-auto
          max-w-[1442px]
          mx-auto
          /* scale for small devices */
          /* bigger on phones so it still feels impactful */
          scale-[0.88] sm:scale-[0.95] lg:scale-100
        "
      />

      {/* GRADIENT BEHIND LOWER HALF OF TEXT */}
      <div
        className="absolute left-0 w-full pointer-events-none"
        style={{
          top: "46%", /* halfway down text */
          height: "83px",
          background:
            "linear-gradient(180deg, rgba(7, 6, 22, 0) 0%, #070616 100%)",
        }}
      ></div>
    </section>
  );
};

export default CantaloupeTitle;
