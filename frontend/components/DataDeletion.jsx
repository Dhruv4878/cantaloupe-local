"use client";
import React from "react";

export default function DataDeletion() {
  return (
    <section className="min-h-screen bg-[#070616] text-white px-6 md:px-20 py-16">
      <div className="max-w-3xl mx-auto rounded-2xl p-8 md:p-12 border border-white/10 backdrop-blur-xl bg-white/5 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          User Data Deletion
        </h1>

        <p className="text-sm text-white/70 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-6 text-white/85 leading-relaxed">
          <p>
            Cantaloupe AI / Post Generator respects your privacy and gives you
            full control over your data. This page explains how you can request
            deletion of your data from our systems.
          </p>

          <h2 className="text-xl font-semibold mt-6">
            What Data Is Deleted
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Facebook and Instagram access tokens</li>
            <li>Connected Page and Instagram account identifiers</li>
            <li>User-generated content stored in the app</li>
            <li>Profile and authentication data</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">
            How to Request Data Deletion
          </h2>
          <p>
            To request deletion of your data, please follow one of the methods
            below:
          </p>

          <ul className="list-disc list-inside space-y-2">
            <li>
              Send an email to{" "}
              <span className="text-white font-medium">
                support@postgenerator.app
              </span>{" "}
              with the subject line <strong>“Data Deletion Request”</strong>
            </li>
            <li>
              Include the email address associated with your Facebook login
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">
            Deletion Timeline
          </h2>
          <p>
            We will process data deletion requests within{" "}
            <strong>7 business days</strong>. Once completed, all associated
            data will be permanently removed from our systems.
          </p>

          <h2 className="text-xl font-semibold mt-6">
            Facebook & Instagram Data
          </h2>
          <p>
            You may also remove access directly from Facebook by going to:
          </p>
          <p className="text-white/90">
            Facebook Settings → Apps and Websites → Active → Remove
            Post Generator
          </p>

          <h2 className="text-xl font-semibold mt-6">
            Contact
          </h2>
          <p>
            For any questions regarding data deletion, contact us at:
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
