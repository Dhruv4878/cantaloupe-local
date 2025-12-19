// Faq.jsx
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

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
    <section className="w-full bg-[#00001A] flex flex-col items-center px-4 sm:px-6 lg:px-0 pt-16 sm:pt-20 pb-10 sm:pb-14 min-h-[640px]">
      
      {/* Heading */}
      <div className="w-full max-w-[963px] mx-auto text-center mb-10 space-y-3">
        <h1
          className="
            text-2xl sm:text-3xl md:text-[34px] lg:text-[38px]
            font-extrabold text-white
            leading-[140%] lg:leading-[150%]
          "
          style={{
            fontFamily: "Monument Extended, sans-serif",
            textShadow: "0px 0px 17.7px rgba(0, 0, 0, 0.7)",
          }}
        >
          Got questions? We've Got Answers
        </h1>

        <p
          className="
            text-base sm:text-lg md:text-[20px] lg:text-[25px]
            font-normal text-white/80 leading-[150%]
          "
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Everything you need to know about how our platform works.
        </p>
      </div>

      {/* FAQ Items */}
      <div className="w-full max-w-[1030px] mx-auto mt-4 sm:mt-6 md:mt-10">
        {faqData.map((item, index) => {
          const isOpen = openIndex === index;
          const isLast = index === faqData.length - 1;

          return (
            <div key={index} className="w-full">
              {/* Question */}
              <button
                onClick={() => toggleFaq(index)}
                className="
                  w-full flex justify-between items-center
                  py-3 sm:py-4
                  px-4 sm:px-6
                  text-white
                  text-sm sm:text-base md:text-[18px] lg:text-[20px]
                  font-normal
                  hover:bg-[#1A1A33]/60
                  transition-colors
                "
                style={{
                  borderTop: "0.46px solid rgba(255,255,255,0.6)",
                  borderBottom: isLast && !isOpen ? "0.46px solid rgba(255,255,255,0.6)" : "none",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                <span className="text-left leading-normal pr-4">{item.q}</span>
                {isOpen ? <ChevronUp /> : <ChevronDown />}
              </button>

              {/* Answer */}
              <div
                className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${isOpen ? "max-h-64 sm:max-h-80 opacity-100 py-3" : "max-h-0 opacity-0"}
                `}
                style={{
                  borderBottom: isOpen || isLast ? "0.46px solid rgba(255,255,255,0.6)" : "none",
                }}
              >
                <p
                  className="
                    px-4 sm:px-6
                    text-gray-300
                    text-sm sm:text-base md:text-lg
                    leading-relaxed
                  "
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {item.a}
                </p>
              </div>

              {/* Divider for closed items (not last) */}
              {!isOpen && !isLast && <div className="w-full border-b border-white/20" />}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Faq;
