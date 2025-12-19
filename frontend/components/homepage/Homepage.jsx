'use client';
import React from 'react';
import Header from './Header';
import Hero from './Hero';
import Footer from './Footer';
import KeyFeaturesSection from './KeyFeaturesSection';
import SocialScrollBanner from './SocialScrollBanner';
import CallToActionSection from './CallToActionSection';
// import CantaloupeTitle from './BackgroundWatermark';
import ComingSoon from './ComingSoon';
import Faq from '@/components/homepage/FAQ'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070616] text-white">
      <Header />
      <main className="pt-24 sm:pt-28 flex-1">
        <Hero />
        <KeyFeaturesSection />
        <SocialScrollBanner />
        <CallToActionSection />
        <ComingSoon />
        <Faq/>

      </main>
      {/* <CantaloupeTitle /> */}
      <Footer />
    </div>
  );
}