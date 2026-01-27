"use client";

import { useRouter } from "next/navigation";

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`p-6 rounded-2xl relative overflow-hidden text-white ${className}`}
    style={{
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
    }}
  >
    {children}
  </div>
);

export default function PaymentSuccessModal({ planName, isOpen, onProceed }) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleProceed = () => {
    if (onProceed) {
      onProceed();
    }
    // Small delay to allow state to propagate, then navigate
    setTimeout(() => {
      console.log(
        "Navigating to /dashboard/billing with justUpgraded flag set",
      );
      router.push("/billing");
    }, 100);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]" />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
        <GlassCard className="max-w-md w-full relative text-center">
          {/* Green Success Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-400"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white mb-2">
            Payment Successful! 🎉
          </h3>

          {/* Message */}
          <p className="text-gray-300 mb-2">
            Your upgrade to{" "}
            <span className="font-semibold text-green-400">{planName}</span> is
            complete!
          </p>
          <p className="text-gray-400 text-sm mb-6">
            You now have access to all premium features. Let's get started!
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleProceed}
              className="px-8 py-2 rounded-full text-white font-semibold transition hover:scale-105 w-full"
              style={{
                background:
                  "linear-gradient(119.02deg, #00D084 -22.94%, #00B376 83.73%)",
              }}
            >
              View Billing
            </button>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
