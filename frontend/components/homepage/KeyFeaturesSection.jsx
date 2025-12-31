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
      {/* Content Wrapper */}
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="relative mx-auto mt-0 sm:mt-0 flex max-w-5xl flex-col items-center gap-2 text-center">
          <h2
            className="
              keyfeatures-heading
              text-2xl sm:text-3xl md:text-[32px] lg:text-[39px]
              leading-[130%] lg:leading-[150%]
            "
          >
            Key Features of PostGenerator.AI
          </h2>
          <p
            className="
              keyfeatures-subtext
              text-sm sm:text-base md:text-lg lg:text-[25px]
              leading-[140%] lg:leading-[150%]
              px-4 sm:px-0
            "
          >
            Everything You Need to Create Better, Faster Content
          </p>
        </div>

        {/* Cards Grid */}
        <div
          className="
            mt-10 sm:mt-12
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

        {/* Extra bottom spacing so it feels centered in viewport */}
        {/* <div className="h-10 sm:h-12 lg:h-16" /> */}
      </div>
    </section>
  );
};

export default KeyFeaturesSection;
