"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  ShieldCheck,
  CreditCard,
  Zap,
  Sparkles,
  Image as ImageIcon,
  Type,
  CheckCircle2,
} from "lucide-react";
// Assuming you have these modals from your previous code
import PaymentSuccessModal from "./PaymentSuccessModal";
import PaymentFailureModal from "./PaymentFailureModal";

// --- Configuration: Credit Packs ---
// Industry standard: Buying in bulk usually offers a 20-40% discount per unit.
const CREDIT_PACKS = [
  {
    id: "starter",
    credits: 10,
    price: 199,
    label: "Starter",
    description: "Perfect for testing the waters.",
    popular: false,
  },
  {
    id: "growth",
    credits: 30,
    price: 499,
    label: "Growth",
    description: "Enough for a month of casual posting.",
    popular: true, // Highlights this card
  },
  {
    id: "power",
    credits: 50,
    price: 749,
    label: "Power User",
    description: "Serious content creation at best value.",
    popular: false,
  },
  {
    id: "agency",
    credits: 100,
    price: 1299,
    label: "Agency",
    description: "Maximum savings for heavy usage.",
    popular: false,
  },
];

// --- Sub-Components ---

const BackButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="group flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-white"
  >
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 group-hover:bg-white/10 transition-colors border border-white/5">
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
    </div>
    <span>Back to Dashboard</span>
  </button>
);

const UsageItem = ({ icon: Icon, title, cost }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-[#FFC56E]/10 text-[#FFC56E]">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm text-white/80">{title}</span>
    </div>
    <span className="text-xs font-mono text-white/40">{cost} Credit</span>
  </div>
);

// --- Main Component ---

export default function CreditTopUpPage() {
  const router = useRouter();
  
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  // State
  const [selectedPackId, setSelectedPackId] = useState("growth"); // Default to popular
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Refs for Payment
  const orderRef = useRef(null);

  // Derived state
  const selectedPack = useMemo(
    () => CREDIT_PACKS.find((p) => p.id === selectedPackId),
    [selectedPackId]
  );

  // Calculate price per credit to show savings
  const pricePerCredit = Math.round(selectedPack.price / selectedPack.credits);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem("authToken");
      if (!token || token === "null") {
        // Redirect to login if not authenticated
        router.push("/login?redirect=/credittopup");
        return;
      }
      setIsAuthenticated(true);
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // NOW WE CAN HAVE CONDITIONAL RENDERING AFTER ALL HOOKS
  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#070616] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-4 border-gray-600 border-t-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render the page if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) {
        setError("You must be logged in to purchase credits.");
        setIsProcessing(false);
        return;
      }

      // Step 1: Create order on backend
      const purchaseRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/credits/purchase`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            packId: selectedPackId,
          }),
        },
      );

      if (!purchaseRes.ok) {
        const errData = await purchaseRes.json();
        throw new Error(errData.message || "Failed to create credit purchase order");
      }

      const purchaseData = await purchaseRes.json();
      const { order, pack } = purchaseData;

      // Store order reference
      orderRef.current = order;

      // Check if this is a mock order (development mode)
      if (order.mock) {
        console.log("Mock payment mode - simulating successful payment");
        
        // Simulate payment success directly
        try {
          const processResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhook/payment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              creditPurchase: {
                packId: selectedPackId,
                credits: pack.credits,
              },
              status: "success",
              payment: {
                razorpay_payment_id: `mock_payment_${Date.now()}`,
                razorpay_order_id: order.id,
                razorpay_signature: `mock_signature_${Date.now()}`,
                amount: order.amount / 100,
                currency: order.currency,
                gateway: "mock",
              },
            }),
          });

          const responseData = await processResponse.json();
          console.log("Mock credit purchase processed:", responseData);

          if (processResponse.ok) {
            setIsProcessing(false);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setShowSuccessModal(true);
          } else {
            throw new Error(responseData?.message || "Failed to process credit purchase");
          }
        } catch (err) {
          console.error("Mock credit purchase processing error:", err);
          setIsProcessing(false);
          setPaymentError(err.message || "Failed to process mock payment");
          setShowFailureModal(true);
        }
        return;
      }

      // Step 2: Get Razorpay key from backend (for real payments)
      const keyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/razorpay-key`,
        {
          method: "GET",
        },
      );

      if (!keyRes.ok) {
        throw new Error("Failed to fetch Razorpay key");
      }

      const { keyId } = await keyRes.json();

      // Step 3: Open Razorpay checkout (for real payments)
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ContentFlow",
        description: `${pack.credits} Credits Pack`,
        order_id: order.id,
        prefill: {
          email: sessionStorage.getItem("userEmail") || "",
        },
        handler: async function (response) {
          // Payment successful - process credit purchase
          try {
            console.log("Credit purchase payment successful:", response);

            // Call backend to process credit purchase
            const processResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhook/payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                creditPurchase: {
                  packId: selectedPackId,
                  credits: pack.credits,
                },
                status: "success",
                payment: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  amount: order.amount / 100,
                  currency: order.currency,
                  gateway: "razorpay",
                },
              }),
            });

            const responseData = await processResponse.json();
            console.log("Credit purchase processed:", responseData);

            if (processResponse.ok) {
              setIsProcessing(false);
              // Small delay to ensure backend updates are persisted
              await new Promise((resolve) => setTimeout(resolve, 500));
              setShowSuccessModal(true);
            } else {
              throw new Error(
                responseData?.message || "Failed to process credit purchase",
              );
            }
          } catch (err) {
            console.error("Credit purchase processing error:", err);
            setIsProcessing(false);
            setPaymentError(
              err.message ||
                "Payment received but credit processing failed. Please contact support.",
            );
            setShowFailureModal(true);
          }
        },
        modal: {
          ondismiss: async function () {
            setIsProcessing(false);
            setError("Payment cancelled");
            
            // Call backend to mark credit transaction as cancelled
            try {
              const token = sessionStorage.getItem("authToken");
              if (token && orderRef.current?.id) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cancel`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    creditOrderId: orderRef.current.id
                  }),
                });
                console.log("Credit payment marked as cancelled");
              }
            } catch (err) {
              console.error("Error marking credit payment as cancelled:", err);
            }
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setPaymentError("Failed to initiate payment transaction.");
      setShowFailureModal(true);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070616] text-white selection:bg-[#FFC56E] selection:text-[#070616]">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-[#FFC56E]/5 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#070616]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <BackButton onClick={() => router.back()} />
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-white/30 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-[#FFC56E]" /> Secure Checkout
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl font-sans">
            Top up your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFC56E] to-purple-400">
              Creative Credits
            </span>
          </h1>
          <p className="mt-4 text-lg text-white/60">
            Pay as you go. Credits never expire. <br />
            Purchase more to unlock lower costs per post.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-12 items-start">
          {/* --- LEFT COLUMN: Selection & Value Prop (8 cols) --- */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* 1. Credit Pack Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CREDIT_PACKS.map((pack) => {
                const isSelected = selectedPackId === pack.id;
                return (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPackId(pack.id)}
                    className={`group relative cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ${
                      isSelected
                        ? "bg-[#FFC56E]/10 border-[#FFC56E] shadow-[0_0_30px_-10px_rgba(255,197,110,0.3)]"
                        : "bg-[#0B0A1F] border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Popular Tag */}
                    {pack.popular && (
                      <div className="absolute top-0 right-0 rounded-bl-xl bg-[#FFC56E] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#070616]">
                        Most Popular
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className={`text-sm font-medium uppercase tracking-wider ${isSelected ? 'text-[#FFC56E]' : 'text-white/50'}`}>
                            {pack.label}
                          </p>
                          <h3 className="text-3xl font-bold text-white mt-1">
                            {pack.credits} <span className="text-lg font-normal text-white/40">Credits</span>
                          </h3>
                        </div>
                        {isSelected && (
                          <div className="h-6 w-6 rounded-full bg-[#FFC56E] flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-[#070616]" />
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-white/60 mb-6 min-h-[40px]">
                        {pack.description}
                      </p>

                      <div className="flex items-end justify-between border-t border-white/5 pt-4">
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold text-white">₹{pack.price}</span>
                          <span className="text-xs text-white/40">One-time payment</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono text-white/30">Cost per credit</span>
                          <p className="text-sm font-medium text-[#FFC56E]">₹{Math.round(pack.price / pack.credits)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Value Proposition (What can I do?) */}
            <div className="rounded-3xl border border-white/10 bg-[#0B0A1F] p-6 md:p-8">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FFC56E]" />
                What can you do with {selectedPack.credits} credits?
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UsageItem 
                  icon={ImageIcon} 
                  title="Generate AI Image Post" 
                  cost="1" 
                />
                <UsageItem 
                  icon={Type} 
                  title="Generate Blog to Post" 
                  cost="1" 
                />
                <UsageItem 
                  icon={Zap} 
                  title="Viral Caption Generation" 
                  cost="0.5" 
                />
                <UsageItem 
                  icon={MessageCircle} 
                  title="Reply Suggestions" 
                  cost="0.1" 
                />
              </div>

              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/5">
                <p className="text-sm text-white/70 text-center">
                  With the <span className="text-white font-bold">{selectedPack.label}</span> pack, 
                  you can generate approximately <span className="text-[#FFC56E] font-bold">{selectedPack.credits} full posts</span>.
                </p>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: Checkout Summary (4 cols) --- */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-28 flex flex-col gap-6">
              
              <div className="relative rounded-3xl bg-[#16152D] border border-white/10 shadow-xl overflow-hidden">
                <div className="p-6 md:p-8">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                    <CreditCard className="w-5 h-5 text-[#FFC56E]" />
                    Order Summary
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm text-white/60">
                      <span>Pack</span>
                      <span className="text-white">{selectedPack.credits} Credits</span>
                    </div>
                    <div className="flex justify-between text-sm text-white/60">
                      <span>Price</span>
                      <span className="text-white">₹{selectedPack.price}</span>
                    </div>
                    <div className="flex justify-between text-sm text-white/60">
                      <span>GST (18%)</span>
                      <span className="text-white">₹{(selectedPack.price * 0.18).toFixed(2)}</span>
                    </div>
                    
                    <div className="h-px w-full bg-white/10 my-2" />
                    
                    <div className="flex justify-between items-end">
                      <span className="text-base font-medium text-white">Total</span>
                      <span className="text-2xl font-bold text-[#FFC56E]">
                        ₹{(selectedPack.price * 1.18).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className={`group relative w-full overflow-hidden rounded-xl ${
                      isProcessing
                        ? "bg-gray-600 cursor-not-allowed opacity-70"
                        : "bg-gradient-to-r from-orange-400 to-purple-600 hover:shadow-orange-500/20"
                    } py-4 text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98]`}
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative flex items-center justify-center gap-2">
                      {isProcessing ? (
                        <>
                          <span className="inline-block animate-spin">⏳</span>
                          Processing...
                        </>
                      ) : (
                        "Pay & Top Up"
                      )}
                    </span>
                  </button>

                  <div className="mt-4 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-white/30">
                      <ShieldCheck className="w-3 h-3" />
                      <span>SSL Encrypted Payment</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Pill */}
              <div className="rounded-2xl border border-white/5 bg-[#0B0A1F]/50 backdrop-blur-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-white/5 p-2 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-white/60" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Questions about credits?</p>
                    <p className="text-xs text-white/40 mt-1 mb-2">
                      Credits are one-time purchases and do not expire.
                    </p>
                    <button className="text-xs font-semibold text-[#FFC56E] hover:text-white transition-colors">
                      Chat with support &rarr;
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      <PaymentSuccessModal
        planName={`${selectedPack.credits} Credits Pack`}
        isOpen={showSuccessModal}
        onProceed={() => {
            setShowSuccessModal(false);
            router.push('/billing');
        }}
      />

      {/* Failure Modal */}
      <PaymentFailureModal
        isOpen={showFailureModal}
        onRetry={() => {
          setShowFailureModal(false);
          // Stay on the same page to retry
        }}
        errorMessage={paymentError}
      />
    </div>
  );
}