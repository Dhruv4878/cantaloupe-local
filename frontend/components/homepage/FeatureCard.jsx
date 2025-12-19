// components/FeatureCard.js
import React from "react";
import Image from "next/image";

const CardIcons = {
  "Multi Platform Support": { src: "/box 1.png", alt: "Multi platform support icon" },
  "Prompt Generated Posts": { src: "/box 2.png", alt: "Prompt generated posts icon" },
  "Calendar View": { src: "/box 3.png", alt: "Calendar view icon" },
  "One-Click Regenerate": { src: "/box 4.png", alt: "One-click regenerate icon" },
};

const FeatureCard = ({ title, description, iconName }) => {
  const icon = CardIcons[iconName];

  return (
    <div
      className="
        feature-card
        px-4 py-5                     /* smallest screens */
        sm:px-6 sm:py-6               /* tablets */
        lg:px-8 lg:py-8               /* desktop */
        rounded-2xl sm:rounded-3xl
        scale-[0.95] xs:scale-[0.97] sm:scale-100
        transition-transform
      "
    >
      {/* ICON */}
      <div
        className="
          feature-card-icon-wrapper
          w-[60px] h-[60px]
          sm:w-[78px] sm:h-[78px]
          lg:w-[100px] lg:h-[100px]
          mb-4 sm:mb-5
        "
      >
        {icon && (
          <Image
            src={icon.src}
            alt={icon.alt}
            width={60}
            height={60}
            className="object-contain"
          />
        )}
      </div>

      {/* TITLE */}
      <h3
        className="
          feature-card-title
          text-base xs:text-lg sm:text-xl lg:text-[22px]
          leading-[130%]
          text-center
          mb-1
        "
      >
        {title}
      </h3>

      {/* DESCRIPTION */}
      <p
        className="
          feature-card-description
          text-[13px] xs:text-sm sm:text-[15px] lg:text-[16px]
          leading-[150%]
          text-center
          max-w-[310px] mx-auto
        "
      >
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;
