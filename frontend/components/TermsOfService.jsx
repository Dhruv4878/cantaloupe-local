"use client";
import React from "react";

export default function TermsOfService() {
  return (
    <section className="min-h-screen bg-[#070616] text-white px-6 md:px-20 py-16">
      <div className="max-w-4xl mx-auto rounded-2xl p-8 md:p-12 border border-white/10 backdrop-blur-xl bg-white/5 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          Terms of Service
        </h1>

        <p className="text-sm text-white/70 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-6 text-white/85 leading-relaxed">
          <p>
            By accessing or using Post Generator, you agree to be bound by
            these Terms of Service. If you do not agree, do not use the app.
          </p>

          <h2 className="text-xl font-semibold mt-8">
            1. Description of Service
          </h2>
          <p>
            Post Generator allows users to generate and publish social media
            content to Facebook Pages and Instagram Business accounts after
            explicit user approval.
          </p>

          <h2 className="text-xl font-semibold mt-8">
            2. User Responsibilities
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>You are responsible for content you publish</li>
            <li>You must comply with Facebook and Instagram policies</li>
            <li>You must not use the service for illegal or harmful activity</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">
            3. Account Access
          </h2>
          <p>
            Access to Facebook and Instagram accounts is granted only through
            Meta’s official authorization process. We do not access accounts
            without user consent.
          </p>

          <h2 className="text-xl font-semibold mt-8">
            4. Content Ownership
          </h2>
          <p>
            You retain full ownership of the content you create and publish.
            We claim no ownership rights over user-generated content.
          </p>

          <h2 className="text-xl font-semibold mt-8">
            5. Service Availability
          </h2>
          <p>
            We strive for high availability but do not guarantee uninterrupted
            service. Features may change or be discontinued.
          </p>

          <h2 className="text-xl font-semibold mt-8">
            6. Limitation of Liability
          </h2>
          <p>
            Post Generator is provided “as is”. We are not liable for any
            indirect or consequential damages arising from use of the service.
          </p>

          <h2 className="text-xl font-semibold mt-8">
            7. Termination
          </h2>
          <p>
            We may suspend or terminate access if these terms are violated or
            if required by law.
          </p>

          <h2 className="text-xl font-semibold mt-8">
            8. Changes to Terms
          </h2>
          <p>
            We may update these Terms periodically. Continued use of the app
            constitutes acceptance of the updated terms.
          </p>

          <h2 className="text-xl font-semibold mt-8">
            9. Contact
          </h2>
          <p>
            For questions regarding these Terms, contact:
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
