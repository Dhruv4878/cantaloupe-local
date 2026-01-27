"use client";
import { Suspense } from "react";
import Checkout from "@/components/Checkout";

function CheckoutContent() {
  return <Checkout />;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070616] flex items-center justify-center text-white">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
