"use client";

import React, { useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Check,
  Zap,
} from "lucide-react";
import PaymentSuccessModal from "./PaymentSuccessModal";
import PaymentFailureModal from "./PaymentFailureModal";

// --- Logic Helpers ---

const parseFeatures = (jsonString) => {
  const defaultFeatures = [
    "AI post generation (Unlimited)",
    "Advanced Caption generator",
    "Smart scheduling & Auto-posting",
    "Priority 24/7 Support",
    "Access to 5 Social Platforms",
  ];

  if (!jsonString) return defaultFeatures;

  try {
    const features = JSON.parse(jsonString);
    const list = [];

    if (features.ai_post_generation) list.push("AI post generation");
    if (features.caption_generator) list.push("Caption generator");
    if (features.hashtag_generator) list.push("Hashtag generator");
    if (features.content_calendar) list.push("Content calendar");
    if (features.smart_scheduling) list.push("Smart scheduling & Auto-posting");
    if (features.priority_support) list.push("Priority 24/7 Support");

    if (features.platforms_allowed) {
      list.push(`Access to ${features.platforms_allowed} Social Platform(s)`);
    }

    if (features.posts_per_month) {
      list.push(
        features.posts_per_month === "unlimited"
          ? "Unlimited posts per month"
          : `${features.posts_per_month} posts per month`,
      );
    }

    return list.length > 0 ? list : defaultFeatures;
  } catch (err) {
    console.error("Failed to parse features", err);
    return defaultFeatures;
  }
};

// --- Sub-Components ---

const BackButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="group flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-white"
  >
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 group-hover:bg-white/10 transition-colors border border-white/5">
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
    </div>
    <span>Back to Plans</span>
  </button>
);

const FaqItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-white/90 transition-colors hover:text-[#FFC56E]"
      >
        <span>{question}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-[#FFC56E]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/40" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-40 opacity-100 pb-4" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-sm text-white/50 leading-relaxed pr-4">{answer}</p>
      </div>
    </div>
  );
};

const FeatureBadge = ({ text }) => (
  <span className="inline-flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white">
    <Check className="w-3 h-3 text-[#FFC56E]" strokeWidth={3} />
    {text}
  </span>
);

// --- Main Page Component ---

export default function UpgradePlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Refs to store subscription and user data for webhook callback
  const subscriptionIdRef = useRef(null);
  const userIdRef = useRef(null);
  const planIdRef = useRef(null);
  const orderRef = useRef(null);

  // API URL
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    [],
  );

  // 1. Data Retrieval
  const planName = searchParams.get("plan") || "Pro Plan";
  const cycle = searchParams.get("billing") || "monthly";
  const price = searchParams.get("price") || "2999";
  const planId = searchParams.get("planId") || "";
  const featuresJson = searchParams.get("features");

  const isAnnual = cycle === "annual";

  // 2. Memoized Features
  const planFeatures = useMemo(
    () => parseFeatures(featuresJson),
    [featuresJson],
  );

  // Load Razorpay script
  React.useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleConfirmUpgrade = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) {
        setError("You must be logged in to upgrade");
        setIsProcessing(false);
        return;
      }

      // Step 1: Create order on backend
      const paymentMode = isAnnual ? "yearly" : "monthly";
      const subscribeRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            plan_id: planId,
            payment_mode: paymentMode,
          }),
        },
      );

      if (!subscribeRes.ok) {
        const errData = await subscribeRes.json();
        throw new Error(errData.message || "Failed to create subscription");
      }

      const subscribeData = await subscribeRes.json();
      const { order, subscriptionId } = subscribeData;

      // Store IDs in refs for use in payment handler
      subscriptionIdRef.current = subscriptionId;
      userIdRef.current = sessionStorage.getItem("userId");
      planIdRef.current = planId;
      orderRef.current = order;

      // Step 2: Get Razorpay key from backend
      const keyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/razorpay-key`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!keyRes.ok) {
        throw new Error("Failed to fetch Razorpay key");
      }

      const { keyId } = await keyRes.json();

      // Step 3: Open Razorpay checkout
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ContentFlow",
        description: `Upgrade to ${planName} Plan (${paymentMode})`,
        order_id: order.id,
        prefill: {
          email: sessionStorage.getItem("userEmail") || "",
        },
        handler: async function (response) {
          // Payment successful - activate subscription immediately on client
          try {
            const token = sessionStorage.getItem("authToken");

            // Log what we're sending
            console.log("Webhook payload:", {
              subscriptionId: subscriptionIdRef.current,
              status: "success",
              payment_mode: paymentMode,
            });

            // Call backend to activate subscription with payment details
            const activateResponse = await fetch(`${apiUrl}/webhook/payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                subscriptionId: subscriptionIdRef.current,
                status: "success",
                payment: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  userId: userIdRef.current,
                  planId: planIdRef.current,
                  amount: orderRef.current?.amount
                    ? orderRef.current.amount / 100
                    : 0,
                  currency: orderRef.current?.currency || "INR",
                  payment_mode: paymentMode,
                  gateway: "razorpay",
                },
              }),
            });

            const responseData = await activateResponse.json();
            console.log("Webhook response:", responseData);

            if (activateResponse.ok) {
              setIsProcessing(false);
              // Small delay to ensure backend updates are persisted
              await new Promise((resolve) => setTimeout(resolve, 500));
              console.log("Setting justUpgraded flag before showing modal");
              // Set flag to show upgrade notice on billing page BEFORE the modal appears
              sessionStorage.setItem("justUpgraded", "true");
              console.log("Flag set, showing success modal");
              setShowSuccessModal(true);
            } else {
              throw new Error(
                responseData?.message || "Failed to activate subscription",
              );
            }
          } catch (err) {
            console.error("Activation error:", err);
            setIsProcessing(false);
            setPaymentError(
              err.message ||
                "Payment received but subscription activation failed. Please contact support.",
            );
          }
        },
        modal: {
          ondismiss: async function () {
            setIsProcessing(false);
            setError("Payment cancelled");
            
            // Call backend to mark transaction as cancelled
            try {
              const token = sessionStorage.getItem("authToken");
              if (token && orderRef.current?.id) {
                await fetch(`${apiUrl}/cancel`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    orderId: orderRef.current.id,
                    subscriptionId: subscriptionIdRef.current
                  }),
                });
                console.log("Payment marked as cancelled");
              }
            } catch (err) {
              console.error("Error marking payment as cancelled:", err);
            }
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setIsProcessing(false);
      const errorMsg = err.message || "Failed to process payment";
      setPaymentError(errorMsg);
      setShowFailureModal(true);
      console.error("Payment error:", err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070616] text-white selection:bg-[#FFC56E] selection:text-[#070616]">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-600/5 blur-[100px] rounded-full mix-blend-screen" />
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
        {/* Title Section - MOVED OUTSIDE GRID FOR ALIGNMENT */}
        <div className="mb-10 max-w-2xl">
          <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl font-sans">
            Confirm your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFC56E] to-purple-400">
              Upgrade
            </span>
          </h1>
          <p className="mt-4 text-lg text-white/60">
            You're upgrading to the{" "}
            <span className="text-white font-semibold">{planName}</span>.
            Instant access to all premium features immediately after payment.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-12 items-start">
          {/* --- LEFT COLUMN: Plan Details (8 cols) --- */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Plan Card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0B0A1F] shadow-2xl">
              {/* REMOVED GRADIENT STRIP HERE */}

              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-inner">
                      <Zap className="h-7 w-7 text-[#FFC56E] fill-[#FFC56E]/20" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {planName}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-white/50">
                          Billed {isAnnual ? "Yearly" : "Monthly"}
                        </p>
                        {isAnnual && (
                          <span className="text-[10px] font-bold bg-[#FFC56E] text-[#070616] px-2 py-0.5 rounded-full">
                            SAVE 20%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-3xl font-bold text-white">₹{price}</p>
                    <p className="text-xs text-white/40 mt-1">
                      Total due today
                    </p>
                  </div>
                </div>

                <div className="h-px w-full bg-white/5 mb-8" />

                <div>
                  <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">
                    Included in plan
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {planFeatures.map((feature, idx) => (
                      <FeatureBadge key={idx} text={feature} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-white/40" />
                Frequently Asked Questions
              </h3>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 lg:px-8">
                <FaqItem
                  question="When will the charge go through?"
                  answer="You will be charged immediately upon clicking confirm. You will receive an invoice via email instantly."
                  isOpen={openFaqIndex === 0}
                  onToggle={() =>
                    setOpenFaqIndex(openFaqIndex === 0 ? null : 0)
                  }
                />
                <FaqItem
                  question="Can I cancel my subscription?"
                  answer="Yes, you can cancel anytime from your dashboard. Your access will continue until the end of your billing period."
                  isOpen={openFaqIndex === 1}
                  onToggle={() =>
                    setOpenFaqIndex(openFaqIndex === 1 ? null : 1)
                  }
                />
                <FaqItem
                  question="Is my payment secure?"
                  answer="Absolutely. We use Stripe for processing. We do not store your card details on our servers."
                  isOpen={openFaqIndex === 2}
                  onToggle={() =>
                    setOpenFaqIndex(openFaqIndex === 2 ? null : 2)
                  }
                />
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: Checkout Action (4 cols) --- */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-28 flex flex-col gap-6">
              {/* Checkout Summary Card */}
              <div className="relative rounded-3xl bg-[#16152D] border border-white/10 shadow-xl overflow-hidden">
                <div className="p-6 md:p-8">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                    <CreditCard className="w-5 h-5 text-[#FFC56E]" />
                    Order Summary
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm text-white/60">
                      <span>Plan Cost</span>
                      <span className="text-white">₹{price}</span>
                    </div>
                    <div className="flex justify-between text-sm text-white/60">
                      <span>Tax & Fees</span>
                      <span className="text-white">₹0.00</span>
                    </div>
                    <div className="h-px w-full bg-white/10 my-2" />
                    <div className="flex justify-between items-end">
                      <span className="text-base font-medium text-white">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-[#FFC56E]">
                        ₹{price}
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleConfirmUpgrade}
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
                        "Pay & Upgrade"
                      )}
                    </span>
                  </button>

                  <div className="mt-4 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-white/30">
                      <ShieldCheck className="w-3 h-3" />
                      <span>SSL Encrypted Payment via Razorpay</span>
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
                    <p className="text-sm font-medium text-white">Need help?</p>
                    <p className="text-xs text-white/40 mt-1 mb-3">
                      Our team is available 24/7.
                    </p>
                    <button className="text-xs font-semibold text-[#FFC56E] hover:text-white transition-colors">
                      Chat with us &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        planName={planName}
        isOpen={showSuccessModal}
        onProceed={() => setShowSuccessModal(false)}
      />

      {/* Payment Failure Modal */}
      <PaymentFailureModal
        isOpen={showFailureModal}
        onRetry={() => setShowFailureModal(false)}
        errorMessage={paymentError}
      />
    </div>
  );
}
