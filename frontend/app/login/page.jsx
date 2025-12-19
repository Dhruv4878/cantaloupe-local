"use client";
import React from 'react';
import Loginform from '@/components/homepage/Loginform';
import Header from '@/components/homepage/Header';
import Footer from '@/components/homepage/Footer';
// import BackgroundWatermark from "@/components/homepage/BackgroundWatermark";
export default function LoginPage() {
  return (
    <div >
      <Header />  
      <Loginform />
      {/* <BackgroundWatermark/> */}
      <Footer />
      
    </div>
  );
}

