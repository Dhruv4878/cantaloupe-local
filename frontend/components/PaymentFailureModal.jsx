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

export default function PaymentFailureModal({ isOpen, onRetry, errorMessage }) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    router.back();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]" />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
        <GlassCard className="max-w-md w-full relative text-center">
          {/* Red Error Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
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
              className="text-red-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white mb-2">Payment Failed</h3>

          {/* Message */}
          <p className="text-gray-300 mb-2">
            {errorMessage || "Your payment could not be processed."}
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Please check your payment details and try again.
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/pricing")}
              className="px-6 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition flex-1"
            >
              Back to Plans
            </button>
            <button
              onClick={handleRetry}
              className="px-6 py-2 rounded-full text-white font-semibold transition hover:scale-105 flex-1"
              style={{
                background:
                  "linear-gradient(119.02deg, #FCAC00 -22.94%, #FF6E00 83.73%)",
              }}
            >
              Retry Payment
            </button>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
