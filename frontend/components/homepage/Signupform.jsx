// SignupPage.jsx
"use client";
import React, { useState, useEffect } from "react";
import { Mail, Lock, User, AlertTriangle } from "lucide-react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import GradientButton from "../GradientButton"; // adjust path if needed


const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 8.841C34.553 4.806 29.625 2.5 24 2.5C11.667 2.5 1.5 12.667 1.5 25s10.167 22.5 22.5 22.5s22.5-10.167 22.5-22.5c0-1.563-.149-3.09-.421-4.584z"
    ></path>
    <path
      fill="#FF3D00"
      d="M6.306 14.691c-2.238 4.22-3.594 9.078-3.594 14.309c0 5.231 1.356 10.089 3.594 14.309L15.17 35.65C13.235 31.668 12 27.46 12 23c0-4.46 1.235-8.668 3.17-12.65L6.306 14.691z"
      transform="translate(0 2)"
    ></path>
    <path
      fill="#4CAF50"
      d="M24 47.5c5.625 0 10.553-1.806 14.802-4.841L31.961 34.96C29.842 36.846 27.059 38 24 38c-5.223 0-9.649-3.343-11.303-7.918L4.389 38.08C8.638 43.194 15.825 47.5 24 47.5z"
    ></path>
    <path
      fill="#1976D2"
      d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.16-4.082 5.571l7.662 7.662C41.438 37.138 44.5 31.812 44.5 25c0-2.619-.406-5.125-1.125-7.489L43.611 20.083z"
    ></path>
  </svg>
);

const SpinnerIcon = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [view, setView] = useState("form"); // form | otp
  const [otp, setOtp] = useState("");
  const [tempSignupData, setTempSignupData] = useState(null);


  // your redirect logic (unchanged)
  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    if (!token) return;
    const hasProfile = sessionStorage.getItem("hasProfile") === "true";
    if (!hasProfile) {
      window.location.replace("/businesses/create");
      return;
    }
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    fetch(`${apiUrl}/profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) window.location.replace("/dashboard");
        else window.location.replace("/businesses/create");
      })
      .catch(() => window.location.replace("/businesses/create"));
  }, []);

  // ✅ Signup via Google
  const handleSignUpWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      try {
        if (user?.email) sessionStorage.setItem("userEmail", user.email);
      } catch (_) { }

      const idToken = await user.getIdToken();

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Google signup failed");
      }

      const data = await response.json();
      if (data.token) {
        sessionStorage.setItem("authToken", data.token);
        
        const rawFlag =
          data && (data.hasProfile ?? data.hasflag ?? data.userHasProfile);
        const hasProfileNorm =
          rawFlag === true ||
          rawFlag === 1 ||
          String(rawFlag).toLowerCase() === "true" ||
          String(rawFlag) === "1";

        const apiUrlBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

        // Check if user has existing profile/data
        try {
          const profileRes = await fetch(`${apiUrlBase}/profile/me`, {
            headers: { Authorization: `Bearer ${data.token}` },
          });
          
          if (profileRes.ok) {
            const profile = await profileRes.json();
            sessionStorage.setItem("hasProfile", "true");
            
            // Get user email if available
            const email = (profile?.user?.email || user?.email || "").trim();
            if (email) sessionStorage.setItem("userEmail", email);
            
            // User has existing profile - redirect to dashboard
            sessionStorage.setItem("flashMessage", "Signed in successfully");
            router.push("/dashboard");
            return;
          }
        } catch (_) { }

        // If profile check failed or no profile, use hasProfile from response
        if (rawFlag !== undefined) {
          sessionStorage.setItem("hasProfile", hasProfileNorm ? "true" : "false");
          if (hasProfileNorm) {
            sessionStorage.setItem("flashMessage", "Signed in successfully");
            router.push("/dashboard");
          } else {
            sessionStorage.setItem("flashMessage", "Signed up with Google successfully");
            router.push("/businesses/create");
          }
        } else {
          // Default: assume no profile, go to create profile page
          sessionStorage.setItem("hasProfile", "false");
          sessionStorage.setItem("flashMessage", "Signed up with Google successfully");
          router.push("/businesses/create");
        }
      }
    } catch (error) {
      setError(
        error.message || "Failed to sign up with Google. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setError(null);

    // ✅ REQUIRED FIELD CHECK (MISSING)
    if (!firstName || !lastName || !email || !password) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreedToTerms) {
      setError("You must agree to the Terms.");
      return;
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send OTP");
      }

      const data = await res.json();

      setTempSignupData({ firstName, lastName, email, password });
      setView("otp");
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError("Cannot connect to server. Please make sure the backend server is running on port 5000.");
      } else {
        setError(err.message || "Failed to send OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifySignupOtp = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

      const res = await fetch(`${apiUrl}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: tempSignupData.email,
          otp,
          ...tempSignupData,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "OTP verification failed");
      }

      const data = await res.json();

      // ✅ OTP verified & user created
      // ❌ NO auto-login here

      window.location.href = "/login"; // ✅ REQUIRED
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError("Cannot connect to server. Please make sure the backend server is running on port 5000.");
      } else {
        setError(err.message || "OTP verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden mt-20 px-4 text-white">
      {/* soft corners like screenshot */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 bottom-0 h-80 w-80 rounded-full  blur-[120px]" />
        <div className="absolute -right-40 top-0 h-80 w-80 rounded-full  blur-[120px]" />
      </div>

      {/* main card – tall, calm, centered */}
      <div
        className="
            relative z-10 w-full max-w-xl
            rounded-[32px]
            border border-[#ff4b26]/55
            bg-[#080819]/95
            px-8 py-10
            shadow-[0_0_45px_rgba(255,110,0,0.35)]
          "
      >
        {/* slight inner border to mimic neon edge */}
        <div className="pointer-events-none absolute inset-[1px] rounded-[30px] border border-white/5" />

        <div className="relative space-y-7">
          {/* header */}
          <div className="space-y-2 text-center ">
            <h1
              className="text-[30px] sm:text-[32px] font-bold leading-tight"
              style={{
                background:
                  "linear-gradient(119.02deg, rgb(252,172,0) -22.94%, rgb(255,110,0) 83.73%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Create Your AI Account
            </h1>

            <p className="text-sm sm:text-base text-white/70">
              Join thousands of businesses automating their work.
            </p>
          </div>

          {/* google btn */}
          {view === "form" && (
            <button
              type="button"
              onClick={handleSignUpWithGoogle}
              disabled={isLoading}
              className="
                flex w-full items-center justify-center gap-2
                rounded-xl border border-white/10 bg-[#101024]
                px-4 py-3 text-sm font-medium text-white
                hover:border-[#ff4b26]/70 hover:bg-[#151531]
                transition
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              <GoogleIcon />
              <span>Sign up with Google</span>
            </button>
          )}

          {/* OR divider */}
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <span>OR</span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </div>

          {/* form */}
          {view === "form" && (
            <form onSubmit={handleSignupSubmit} className="space-y-5 text-sm">
              {/* first + last name */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-1 block font-medium text-white/70"
                  >
                    First Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Name"
                      className="w-full rounded-lg border border-white/15 bg-[#101024] px-3.5 py-2.5 pl-9 text-white placeholder:text-white/35 focus:border-[#ff4b26] focus:outline-none focus:ring-1 focus:ring-[#ff4b26]"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-1 block font-medium text-white/70"
                  >
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className="w-full rounded-lg border border-white/15 bg-[#101024] px-3.5 py-2.5 pl-9 text-white placeholder:text-white/35 focus:border-[#ff4b26] focus:outline-none focus:ring-1 focus:ring-[#ff4b26]"
                    />
                  </div>
                </div>
              </div>

              {/* email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block font-medium text-white/70"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-white/15 bg-[#101024] px-3.5 py-2.5 pl-9 text-white placeholder:text-white/35 focus:border-[#ff4b26] focus:outline-none focus:ring-1 focus:ring-[#ff4b26]"
                  />
                </div>
              </div>

              {/* password + confirm */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1 block font-medium text-white/70"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-white/15 bg-[#101024] px-3.5 py-2.5 pl-9 text-white placeholder:text-white/35 focus:border-[#ff4b26] focus:outline-none focus:ring-1 focus:ring-[#ff4b26]"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1 block font-medium text-white/70"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-white/15 bg-[#101024] px-3.5 py-2.5 pl-9 text-white placeholder:text-white/35 focus:border-[#ff4b26] focus:outline-none focus:ring-1 focus:ring-[#ff4b26]"
                    />
                  </div>
                </div>
              </div>

              {/* terms */}
              <div className="flex items-start gap-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/40 bg-[#101024] text-[#ff4b26] focus:ring-[#ff4b26]"
                />
                <label htmlFor="terms" className="text-xs text-white/70">
                  I agree to the{" "}
                  <a
                    href="/terms-of-service"
                    className="font-medium text-[#ff4b26] hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy-policy"
                    className="font-medium text-[#ff4b26] hover:underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </label>
              </div>

              {error && (
                <p className="text-xs text-red-400 text-center">
                  {error}
                </p>
              )}

              {/* CTA */}
              <GradientButton
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-sm font-semibold"
              >
                {isLoading ? <SpinnerIcon /> : "Create Account"}
              </GradientButton>

            </form>
          )}

          {view === "otp" && (
            <div className="space-y-5 text-sm">

              {view === "otp" && !error && (
                <p className="text-center text-xs text-green-400">
                  OTP sent to your Registered email.
                  Please check your email.
                </p>
              )}

              <div>
                <label className="block font-medium text-white/70">
                  Enter OTP
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-lg border border-white/15 bg-[#101024] px-3 py-2 text-center tracking-widest"
                  placeholder="Enter 6-digit code"
                />
              </div>

              <GradientButton
                type="button"
                onClick={verifySignupOtp}
                disabled={isLoading || otp.length !== 6}
                className="w-full py-3"
              >
                {isLoading ? <SpinnerIcon /> : "Verify OTP"}
              </GradientButton>
            </div>
          )}


          {/* bottom link */}
          <p className="pt-4 text-center text-xs text-white/55">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium text-[#ff4b26] hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}