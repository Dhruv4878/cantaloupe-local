// components/KeyFeaturesSection.js
import React from "react";
import FeatureCard from "./FeatureCard";

const featureData = [
  {
    iconName: "Multi Platform Support",
    title: "Multi Platform Support",
    description:
      "Auto tailored captions and hashtags for every platform. One post, perfectly adapted everywhere.",
  },
  {
    iconName: "Prompt Generated Posts",
    title: "Prompt Generated Posts",
    description:
      "Type a prompt, get a stunning post—image and caption crafted together in seconds.",
  },
  {
    iconName: "Calendar View",
    title: "Calendar View",
    description:
      "See all your creations in one clean, organized calendar. Plan, review, and stay in control effortlessly.",
  },
  {
    iconName: "One-Click Regenerate",
    title: "One-Click Regenerate",
    description:
      "Regenerate or improve captions, hashtags or full posts— instant AI rewrites & fresh variations.",
  },
];

const KeyFeaturesSection = () => {
  return (
    <section className="relative w-full text-white">
      {/* Content Wrapper - matching hero section structure */}
      <div
        className="
          relative mx-auto
          w-full
          max-w-[calc(100vw-24px)]
          sm:max-w-[calc(100vw-64px)]
          lg:max-w-[calc(100vw-200px)]
        "
      >
        {/* Section Header */}
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-4 text-center mb-12 sm:mb-16">

          <h2
            className="
              keyfeatures-heading
              text-[1.375rem] sm:text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] xl:text-[2.75rem]
              leading-[120%] lg:leading-[130%]
              bg-gradient-to-br from-white via-white to-gray-300
              bg-clip-text text-transparent
            "
          >
            Key Features of PostGenerator.AI
          </h2>
          <p
            className="
              keyfeatures-subtext
              text-[0.875rem] md:text-[1.125rem] lg:text-[1.25rem]
              leading-[150%] lg:leading-[160%]
              px-4 sm:px-0
              max-w-2xl
              text-gray-300
            "
          >
            Everything You Need to Create Better, Faster Content
          </p>
        </div>

        {/* Cards Grid */}
        <div
          className="
            mt-10 sm:mt-10
            grid grid-cols-1 md:grid-cols-2
            gap-y-8 sm:gap-y-10
            gap-x-6 lg:gap-x-10
          "
        >
          {featureData.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              iconName={feature.iconName}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyFeaturesSection;
