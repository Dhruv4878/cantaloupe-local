"use client";
import React from "react";
import Header from "@/components/homepage/Header";
import Pricing from "@/components/homepage/Pricing";
import Faq from "@/components/homepage/FAQ";
// import CantaloupeTitle from "@/components/homepage/BackgroundWatermark";
import Footer from "@/components/homepage/Footer";

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070616] text-white">
      <Header />
      <main className="space-y-8">
        <Pricing />
        <Faq />
      </main>
      {/* <CantaloupeTitle /> */}
      <Footer />
    </div>
  );
}
