"use client";
import React from "react";
import Header from "@/components/homepage/Header";
import ContactUs from "@/components/homepage/ContactUs";
// import CantaloupeTitle from "@/components/homepage/BackgroundWatermark";
import Footer from "@/components/homepage/Footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070616] text-white">
      <Header />
      <main className="space-y-8">
        <ContactUs />
      
      </main>
      {/* <CantaloupeTitle /> */}
      <Footer />
    </div>
  );
}