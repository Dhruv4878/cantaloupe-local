"use client";
import React from "react";

export default function PrivacyPolicy() {
  return (
    <section className="min-h-screen bg-[#070616] text-white px-6 md:px-20 py-16">
      <div className="max-w-4xl mx-auto rounded-2xl p-8 md:p-12 border border-white/10 backdrop-blur-xl bg-white/5 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          Privacy Policy
        </h1>

        <p className="text-sm text-white/70 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-6 text-white/85 leading-relaxed">
          <p>
            Post Generator (“we”, “our”, or “us”) values your privacy. This
            Privacy Policy explains how we collect, use, store, and protect
            your information when you use our web application.
          </p>

          <h2 className="text-xl font-semibold mt-8">
            1. Information We Collect
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Basic profile information from Facebook Login</li>
            <li>Facebook Page and Instagram Business account identifiers</li>
            <li>Access tokens required to publish content on your behalf</li>
            <li>User-generated content created within the app</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">
            2. How We Use Your Information
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Authenticate users via Facebook Login</li>
            <li>Generate social media content on user request</li>
            <li>Publish posts to Facebook Pages and Instagram Business accounts</li>
            <li>Display basic post performance and engagement metrics</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">
            3. Facebook & Instagram Data
          </h2>
          <p>
            Our app integrates with Meta APIs. We access Facebook and Instagram
            data only after explicit user consent and strictly according to
            Meta Platform Policies.
          </p>
          <p>
            We do not sell, rent, or share Meta user data with third parties.
          </p>

          <h2 className="text-xl font-semibold mt-8">
            4. Data Storage & Security
          </h2>
          <p>
            Access tokens are stored securely and encrypted. We implement
            industry-standard security practices to protect your data from
            unauthorized access.
          </p>

          <h2 className="text-xl font-semibold mt-8">
            5. Data Retention & Deletion
          </h2>
          <p>
            Users may disconnect their Facebook or Instagram account at any
            time. Upon disconnection, access tokens are revoked and deleted
            from our systems.
          </p>

          <h2 className="text-xl font-semibold mt-8">
            6. Third-Party Services
          </h2>
          <p>
            We use trusted third-party services for hosting and analytics.
            These services are bound by confidentiality and data protection
            obligations.
          </p>

          <h2 className="text-xl font-semibold mt-8">
            7. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy periodically. Continued use of
            the app constitutes acceptance of the updated policy.
          </p>

          <h2 className="text-xl font-semibold mt-8">
            8. Contact Us
          </h2>
          <p>
            If you have questions about this Privacy Policy, contact us at:
            <br />
            <span className="text-white font-medium">
              support@postgenerator.app
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
    