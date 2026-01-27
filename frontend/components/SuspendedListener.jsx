"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Reusing the GlassCard component for consistent styling
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

const SUSPENDED_MSG =
  "You are suspended by admin. If this is a mistake, contact us at postgen@gmail.com";

export default function SuspendedListener() {
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const origFetch = window.fetch;

    window.fetch = async (...args) => {
      try {
        const res = await origFetch(...args);

        if (res && res.status === 403) {
          // Try parse body for message
          let body = null;
          try {
            body = await res.clone().json();
          } catch (_) {}

          const msg = (body && body.message) || "";
          if (msg && msg.toLowerCase().includes("suspend")) {
            // Clear token
            try {
              sessionStorage.removeItem("authToken");
            } catch (_) {}
            setMessage(msg || SUSPENDED_MSG);
          }
        }

        return res;
      } catch (err) {
        // On network errors return a synthetic 503 Response so callers receive an HTTP response
        console.error("Fetch wrapper network error:", err);
        try {
          return new Response(JSON.stringify({ message: "Network error" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          // If Response isn't available, rethrow original error
          throw err;
        }
      }
    };

    return () => {
      window.fetch = origFetch;
    };
  }, []);

  const close = () => {
    setMessage("");
    // redirect to login
    router.push("/login");
  };

  if (!message) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        onClick={close}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
        <GlassCard className="max-w-md w-full relative text-center">
          {/* Red Alert Icon */}
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
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white mb-2">
            Account Suspended
          </h3>

          {/* Message */}
          <p className="text-gray-300 mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={close}
              className="px-6 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition"
            >
              Close & Logout
            </button>

            {/* Optional: Contact Support Button */}
            <a
              href="mailto:postgen@gmail.com"
              className="px-6 py-2 rounded-full text-white font-semibold transition hover:scale-105"
              style={{
                background:
                  "linear-gradient(119.02deg, #FCAC00 -22.94%, #FF6E00 83.73%)",
              }}
            >
              Contact Support
            </a>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
