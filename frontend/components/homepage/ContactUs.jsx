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
  MessageCircle,
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
    <div className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-orange-500/30">
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-orange-500/30 flex items-center justify-center">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
        </div>
      </div>
      <div className="text-left flex-1">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-1" style={{ fontFamily: '"Monument Extended", sans-serif' }}>
          {title}
        </h3>
        {isLink ? (
          <a
            href={linkHref}
            className="text-gray-400 hover:text-orange-400 transition text-sm sm:text-base"
            target="_blank"
            rel="noopener noreferrer"
          >
            {content}
          </a>
        ) : (
          <p className="text-gray-400 text-sm sm:text-base">
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
      "w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 outline-none text-sm sm:text-base backdrop-blur-sm";

    if (isTextArea) {
      return (
        <textarea
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows="5"
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
      className="w-full py-16 sm:py-20 lg:py-24 relative overflow-hidden bg-[#070616]"
    >
      {/* Background Neon Glows */}

      {/* Main Content Area */}
      <div className="mx-auto mt-14 max-w-[calc(100vw-24px)] sm:max-w-[calc(100vw-64px)] lg:max-w-[calc(100vw-200px)] relative z-10">
        {/* Headline Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight font-extrabold text-white"
            style={{ fontFamily: '"Monument Extended", sans-serif' }}
          >
            Let&apos;s{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
              Build Faster
            </span>
            , Together.
          </h1>
          <p className="mx-auto mt-4 sm:mt-6 max-w-3xl text-base sm:text-lg text-gray-400" style={{ fontFamily: '"Poppins", sans-serif' }}>
            Have questions about integrations, enterprise solutions, or just
            want to talk content strategy? Our team is here to help.
          </p>
        </div>

        {/* Contact Grid: Details + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12">
          {/* 1. Contact Details Column */}
          <div>
            <h2 
              className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 pb-3 border-b border-white/10"
              style={{ fontFamily: '"Monument Extended", sans-serif' }}
            >
              Direct Channels
            </h2>
            <div className="space-y-4">
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
          </div>

          {/* 2. Contact Form Column */}
          <div className="p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <h2 
              className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8"
              style={{ fontFamily: '"Monument Extended", sans-serif' }}
            >
              Send a Direct Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                  <p className="text-sm font-medium text-teal-400">
                    {statusMessage}
                  </p>
                </div>
              )}

              <div className="pt-2">
                <Link href="/signup">
                  <GradientButton className="w-full">
                    Send Message
                  </GradientButton>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
