"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldCheck, KeyRound, Loader2, ArrowRight } from "lucide-react";
import GradientButton from "./GradientButton"; // Adjust path if needed

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  email: initialEmail = "",
}) {
  const [step, setStep] = useState("request"); // 'request' | 'verify'
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  if (!isOpen) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${apiUrl}/auth/send-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setSuccessMessage("OTP sent to your email!");
      setStep("verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
        setError("Password must be at least 8 characters");
        setIsLoading(false);
        return;
    }

    try {
      const res = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");

      setSuccessMessage("Password reset successfully!");
      setTimeout(() => {
        onClose();
        // Optionally redirect to login if not already there, but this modal might be used from Settings too.
        // If from settings, they might need to re-login? 
        // For now just close.
        setStep("request");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl pt-4 px-4 pb-6 max-w-sm w-full shadow-2xl max-h-[75vh] overflow-y-auto mx-auto"> 
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-2 mt-1">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20">
            {step === "request" ? (
              <ShieldCheck className="w-5 h-5 text-white" />
            ) : (
              <KeyRound className="w-5 h-5 text-white" />
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-2">
          <h3 className="text-base font-bold text-white mb-1">
            {step === "request" ? "Reset Password" : "Set New Password"}
          </h3>
          <p className="text-white/60 text-xs">
            {step === "request"
              ? "We'll send a verification code to your email."
              : `Enter the code sent to ${email}`}
          </p>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs text-center">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-2 p-1.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-200 text-xs text-center">
            {successMessage}
          </div>
        )}

        {/* Form */}
        {step === "request" ? (
          <form onSubmit={handleSendOtp} className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                disabled={!!initialEmail}
                className={`w-full rounded-xl bg-black/50 border border-white/10 px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition ${initialEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            <GradientButton
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Send Verification Code
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </GradientButton>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-2">
             <div>
              <label className="block text-xs font-medium text-white/80 mb-0.5">
                OTP Code
              </label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-1.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition text-center tracking-widest text-base"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-white/80 mb-0.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars"
                className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-0.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type password"
                className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
              />
            </div>

            <GradientButton
              type="submit"
              disabled={isLoading}
              className="w-full py-1.5 flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Reset Password"
              )}
            </GradientButton>
            
            <button
               type="button"
               onClick={() => setStep('request')}
               className="w-full text-xs text-white/50 hover:text-white transition pt-1"
            >
                Back to email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
