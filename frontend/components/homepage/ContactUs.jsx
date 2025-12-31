// ContactUs.jsx - Responsive Version (desktop layout preserved)
"use client";
import React, { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Instagram,
  Facebook,
  Twitter,
} from "lucide-react";
import Link from "next/link";
import GradientButton from "../GradientButton";

const ContactUs = () => {
  // State for form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [statusMessage, setStatusMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setStatusMessage(
      "Your message has been sent successfully! We'll be in touch within 24 hours."
    );
    setFormData({ name: "", email: "", subject: "", message: "" });

    setTimeout(() => setStatusMessage(""), 5000);
  };

  const ContactDetailCard = ({
    icon: Icon,
    title,
    content,
    isLink = false,
    linkHref = "#",
  }) => (
    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition duration-300 hover:bg-white/10">
      <div
        className="
          flex-shrink-0 p-2.5 sm:p-3 
          rounded-full
          shadow-[0_0_12px_rgba(255,140,0,0.45)]
        "
        style={{
          background:
            "linear-gradient(119.02deg, #FCAC00 -22.94%, #FF6E00 83.73%)",
        }}
      >
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
      <div className="text-left">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-0.5">
          {title}
        </h3>
        {isLink ? (
          <a
            href={linkHref}
            className="text-white/80 hover:text-orange-400 transition text-xs sm:text-sm md:text-base"
            target="_blank"
            rel="noopener noreferrer"
          >
            {content}
          </a>
        ) : (
          <p className="text-white/80 text-xs sm:text-sm md:text-base">
            {content}
          </p>
        )}
      </div>
    </div>
  );

  const FormInput = ({
    type,
    name,
    placeholder,
    value,
    onChange,
    isTextArea = false,
  }) => {
    const baseClass =
      "w-full p-3 sm:p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition duration-200 outline-none text-sm sm:text-base";

    if (isTextArea) {
      return (
        <textarea
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows="4"
          className={`${baseClass} resize-none`}
          required
        ></textarea>
      );
    }

    return (
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={baseClass}
        required
      />
    );
  };

  return (
    <section
      className="
        w-full
        pt-24 sm:pt-28 lg:pt-30
        pb-0 sm:pb-0 lg:pb-0
        relative overflow-hidden
      "
    >
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 right-0 w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 bg-orange-700/20 rounded-full filter blur-[90px] opacity-70 animate-pulse" />
      <div className="absolute bottom-1/4 left-0 w-52 h-52 sm:w-68 sm:h-68 lg:w-72 lg:h-72 bg-purple-700/20 rounded-full filter blur-[90px] opacity-70 animate-pulse delay-1000" />

      {/* Main Content Area */}
      <div className="mx-auto w-[calc(100vw-40px)] max-w-7xl relative z-10">
        {/* Headline Section */}
        <div className="text-center mb-12 sm:mb-16 px-2 sm:px-4">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] sm:tracking-[0.5em] text-teal-400">
            Get in Touch
          </p>
          <h1
            className="
              mt-3 sm:mt-4
              text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl
              leading-tight
              font-extrabold text-white
            "
            style={{ fontFamily: '"Monument Extended", sans-serif' }}
          >
            Let&apos;s{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
              Build Faster
            </span>
            , Together.
          </h1>
          <p className="mx-auto mt-4 sm:mt-6 max-w-3xl text-sm sm:text-base md:text-lg text-white/75">
            Have questions about integrations, enterprise solutions, or just
            want to talk content strategy? Our team is here to help.
          </p>
        </div>

        {/* Contact Grid: Details + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16">
          {/* 1. Contact Details Column */}
          <div className="lg:pr-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 border-b border-white/10 pb-2 sm:pb-3">
              Direct Channels
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <ContactDetailCard
                icon={Mail}
                title="General Inquiries"
                  content="hello@PostGenerator.AI"
                isLink
                linkHref="mailto:hello@PostGenerator.AI"
              />
              <ContactDetailCard
                icon={Briefcase}
                title="Sales & Partnership"
                content="sales@PostGenerator.AI"
                isLink
                linkHref="mailto:sales@PostGenerator.AI"
              />
              <ContactDetailCard
                icon={Phone}
                title="Customer Support"
                content="+1 (800) 555-CANT"
                isLink
                linkHref="tel:+1800555CANT"
              />
              <ContactDetailCard
                icon={MapPin}
                title="Our Headquarters"
                content="101 Digital Stream, Silicon Valley, CA 94005"
              />
            </div>

            {/* Social Media Links */}
            <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-white/10">
              <p className="text-white/60 text-xs sm:text-sm">
                Follow us on social media for the latest updates.
              </p>
              <div className="flex gap-3 sm:gap-4 mt-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-orange-500/60 transition cursor-pointer"
                >
                  <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-orange-500/60 transition cursor-pointer"
                >
                  <Facebook className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-orange-500/60 transition cursor-pointer"
                >
                  <Twitter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </a>
              </div>
            </div>
          </div>

          {/* 2. Contact Form Column */}
          <div className="p-6 sm:p-8 lg:p-10 rounded-[24px] sm:rounded-[32px] border border-white/20 bg-white/5 shadow-[0px_0px_100px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
              Send a Direct Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <FormInput
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
              <FormInput
                type="email"
                name="email"
                placeholder="Work Email"
                value={formData.email}
                onChange={handleChange}
              />
              <FormInput
                type="text"
                name="subject"
                placeholder="Subject (e.g., Enterprise Inquiry)"
                value={formData.subject}
                onChange={handleChange}
              />
              <FormInput
                isTextArea
                name="message"
                placeholder="Your message details..."
                value={formData.message}
                onChange={handleChange}
              />

              {statusMessage && (
                <p className="text-xs sm:text-sm font-medium text-teal-400 p-2 bg-teal-900/20 rounded-lg">
                  {statusMessage}
                </p>
              )}

              <Link href="/signup">
                <GradientButton className="hidden sm:inline-flex w-full">
                  Send Message
                </GradientButton>
              </Link>
            </form>
          </div>
        </div>
      </div>

      {/* Footer Under Contact Section */}
      <div className="mt-10 sm:mt-10   text-center text-white/50">
        {/* <p className="text-[11px] sm:text-sm">
          &copy; {new Date().getFullYear()} Generation-next. All rights reserved. | The
          power of AI, in your hands.
        </p> */}
      </div>
    </section>
  );
};

export default ContactUs;
