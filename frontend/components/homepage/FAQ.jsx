// Faq.jsx
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqData = [
  {
    q: "How does the AI generate social media posts?",
    a: "The AI uses natural language processing (NLP) and machine learning models trained on vast datasets to understand context, tone, and trending topics, generating relevant and engaging content based on your inputs.",
  },
  {
    q: "Can I edit or customize the content after generation?",
    a: "Yes! All generated content is fully editable and customizable. You can tweak the text, adjust the length, or change the tone before publishing.",
  },
  {
    q: "Which platforms are supported?",
    a: "We support major platforms including Instagram, Facebook, Twitter (X), LinkedIn, Pinterest, and TikTok.",
  },
  {
    q: "What is One-Click Rewrites?",
    a: "One-Click Rewrites is a feature that instantly provides alternative versions (e.g., more formal, shorter, different tone) of any generated post with a single click.",
  },
  {
    q: "Is Video Post Generation available?",
    a: "We currently offer text and image generation. Video post generation is in beta and will be released to all users soon.",
  },
  {
    q: "Can I upload my own brand style or colors?",
    a: "Yes, you can upload your brand guidelines, color palettes, and preferred tone to ensure the AI-generated content aligns perfectly with your brand identity.",
  },
  {
    q: "Is my data safe and private?",
    a: "Absolutely. We use industry-standard encryption and security protocols to ensure your data is safe, private, and never shared with third parties.",
  },
];

const Faq = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative w-full bg-[#070616] text-white">
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
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-14 lg:mb-16 space-y-4">

          <h2
            className="
              text-[1.375rem] sm:text-[1.75rem] md:text-[2.125rem] lg:text-[2.375rem] xl:text-[2.625rem]
              font-extrabold
              leading-[120%] lg:leading-[130%]
            "
            style={{
              fontFamily: "Monument Extended, sans-serif",
            }}
          >
            Got questions?{" "}
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
              We've Got Answers
            </span>
          </h2>

          <p
            className="
              text-[0.875rem] md:text-[1.125rem] lg:text-[1.125rem] xl:text-[1.25rem]
              font-normal text-gray-400 leading-[150%]
              max-w-2xl mx-auto
            "
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Everything you need to know about how our platform works.
          </p>
        </div>

        {/* FAQ Items Container with glassmorphism */}
        <div className="w-full mx-auto rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-4 sm:p-6 lg:p-8">
          {faqData.map((item, index) => {
            const isOpen = openIndex === index;
            const isLast = index === faqData.length - 1;

            return (
              <div key={index} className="w-full">
                {/* Question */}
                <button
                  onClick={() => toggleFaq(index)}
                  className="
                    w-full flex justify-between items-center gap-4
                    py-4 sm:py-5
                    text-white
                    text-sm md:text-[1rem] lg:text-[1rem] xl:text-[1.125rem]
                    font-medium
                    hover:text-orange-400
                    transition-all duration-200
                    group
                  "
                  style={{
                    borderBottom: !isOpen && !isLast ? "1px solid rgba(255,255,255,0.05)" : "none",
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  <span className="text-left leading-relaxed">{item.q}</span>
                  <div className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-orange-500" />
                  </div>
                </button>

                {/* Answer */}
                <div
                  className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isOpen ? "max-h-96 opacity-100 pb-6 pt-4" : "max-h-0 opacity-0"}
                  `}
                  style={{
                    borderBottom: !isLast ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <div className="relative rounded-lg bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 p-3 sm:p-4">
                    {/* Decorative icon */}
                    <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>

                    <p
                      className="
                        text-gray-300
                        text-sm sm:text-[0.9375rem] md:text-base
                        leading-relaxed
                        pl-12
                      "
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10 sm:mt-12">
          <p className="text-gray-400 text-sm sm:text-base mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
            Still have questions?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 font-medium transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Contact our support team
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Faq;
