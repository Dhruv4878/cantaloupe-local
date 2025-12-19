"use client";
import React from "react";
import Header from "@/components/homepage/Header";
import AboutUs from "@/components/homepage/AboutUs";
import KeyFeaturesSection from "@/components/homepage/KeyFeaturesSection";
import CallToActionSection from "@/components/homepage/CallToActionSection";
// import CantaloupeTitle from "@/components/homepage/BackgroundWatermark";
import Footer from "@/components/homepage/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070616] text-white">
      <Header />
      <main className="space-y-8 pt-24 sm:pt-28 flex-1">
        <AboutUs />
        <KeyFeaturesSection />
        <CallToActionSection />
      </main>
      {/* <CantaloupeTitle /> */}
      <Footer />
    </div>
  );
}
