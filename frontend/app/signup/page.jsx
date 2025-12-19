"use client";
import React from "react";
import Footer from "@/components/homepage/Footer";
import Signupform from "@/components/homepage/Signupform";
import Header from "@/components/homepage/Header";
// import BackgroundWatermark from "@/components/homepage/BackgroundWatermark";


export default function SignupPage() {
  return (
    <div >
      <Header />
      <Signupform />
      {/* <BackgroundWatermark/> */}
      <Footer />
    </div>
  );
}