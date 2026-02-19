"use client";

import React, { useState, useEffect } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import GradientButton from "../GradientButton"; // adjust path if needed
import axios from "axios";
import ForgotPasswordModal from "../ForgotPasswordModal";

// Google Icon
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8
      c-6.627 0-12-5.373-12-12s5.373-12 12-12
      c3.059 0 5.842 1.154 7.961 3.039L38.802 8.841
      C34.553 4.806 29.625 2.5 24 2.5
      C11.667 2.5 1.5 12.667 1.5 25
      s10.167 22.5 22.5 22.5
      s22.5-10.167 22.5-22.5
      c0-1.563-.149-3.09-.421-4.584z"
    ></path>
    <path
      fill="#FF3D00"
      d="M6.306 14.691c-2.238 4.22-3.594 9.078-3.594 14.309
      c0 5.231 1.356 10.089 3.594 14.309L15.17 35.65
      C13.235 31.668 12 27.46 12 23
      c0-4.46 1.235-8.668 3.17-12.65L6.306 14.691z"
      transform="translate(0 2)"
    ></path>
    <path
      fill="#4CAF50"
      d="M24 47.5c5.625 0 10.553-1.806 14.802-4.841L31.961 34.96
      C29.842 36.846 27.059 38 24 38
      c-5.223 0-9.649-3.343-11.303-7.918L4.389 38.08
      C8.638 43.194 15.825 47.5 24 47.5z"
    ></path>
    <path
      fill="#1976D2"
      d="M43.611 20.083H24v8h11.303
      c-.792 2.237-2.231 4.16-4.082 5.571l7.662 7.662
      C41.438 37.138 44.5 31.812 44.5 25
      c0-2.619-.406-5.125-1.125-7.489L43.611 20.083z"
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
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2
      5.291A7.962 7.962 0 014 12H0
      c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export default function LoginForm() {
  const [view, setView] = useState("initial");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true); // start true while checking auth
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // ✅ Auto-check if user already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem("authToken");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const knownHasProfile = sessionStorage.getItem("hasProfile");
        if (knownHasProfile === "false") {
          router.replace("/businesses/create");
        } else {
          const res = await fetch(`${apiUrl}/profile/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            try {
              sessionStorage.setItem("hasProfile", "true");
            } catch (_) {}
            router.replace("/dashboard");
          } else {
            try {
              sessionStorage.setItem("hasProfile", "false");
            } catch (_) {}
            router.replace("/businesses/create");
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        try {
          sessionStorage.setItem("hasProfile", "false");
        } catch (_) {}
        router.replace("/businesses/create");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // ✅ Login via email
  const handleEmailLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          // JSON parse failed, use the text content
          throw new Error(text || response.statusText || "Login failed");
        }
        // JSON parsed successfully
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      if (data.token) {
        sessionStorage.setItem("authToken", data.token);
        sessionStorage.setItem("flashMessage", "Signed in successfully");
        try {
          const normalizedEmail = (email || "").trim();
          if (normalizedEmail)
            sessionStorage.setItem("userEmail", normalizedEmail);
        } catch (_) {}

        const rawFlag =
          data && (data.hasProfile ?? data.hasflag ?? data.userHasProfile);
        const hasProfileNorm =
          rawFlag === true ||
          rawFlag === 1 ||
          String(rawFlag).toLowerCase() === "true" ||
          String(rawFlag) === "1";

        const apiUrlBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

        // Always verify profile status by checking the profile endpoint
        try {
          const profileRes = await fetch(`${apiUrlBase}/profile/me`, {
            headers: { Authorization: `Bearer ${data.token}` },
          });
          if (profileRes.ok) {
            // User has a profile, check if onboarding is complete
            try {
              const profile = await profileRes.json();
              const email = (profile?.user?.email || "").trim();
              if (email) sessionStorage.setItem("userEmail", email);

              // Check if onboarding is complete
              const onboardingComplete = profile?.onboardingComplete === true;
              sessionStorage.setItem(
                "hasProfile",
                onboardingComplete ? "true" : "false"
              );

              if (onboardingComplete) {
                router.push("/dashboard");
              } else {
                router.push("/businesses/create");
              }
              return;
            } catch (_) {}
          }
        } catch (_) {}

        // Fallback: use the hasProfile flag from login response
        if (rawFlag !== undefined) {
          sessionStorage.setItem(
            "hasProfile",
            hasProfileNorm ? "true" : "false"
          );
          if (hasProfileNorm) {
            router.push("/dashboard");
          } else {
            router.push("/businesses/create");
          }
        } else {
          // Default: no profile found, redirect to onboarding
          try {
            sessionStorage.setItem("hasProfile", "false");
          } catch (_) {}
          router.push("/businesses/create");
        }
      }
    } catch (err) {
      // If the user is suspended, the global SuspendedListener will show the modal.
      if (err.message && err.message.toLowerCase().includes("suspend")) {
        try {
          sessionStorage.removeItem("authToken");
        } catch (_) {}
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Login via Google
  const handleSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      try {
        if (user?.email) sessionStorage.setItem("userEmail", user.email);
      } catch (_) {}

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
        throw new Error(errorData.message || "Google login failed");
      }

      const data = await response.json();
      if (data.token) {
        sessionStorage.setItem("authToken", data.token);
        sessionStorage.setItem("flashMessage", "Signed in with Google");

        const rawFlag =
          data && (data.hasProfile ?? data.hasflag ?? data.userHasProfile);
        const hasProfileNorm =
          rawFlag === true ||
          rawFlag === 1 ||
          String(rawFlag).toLowerCase() === "true" ||
          String(rawFlag) === "1";

        const apiUrlBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

        if (rawFlag !== undefined) {
          sessionStorage.setItem(
            "hasProfile",
            hasProfileNorm ? "true" : "false"
          );
          if (hasProfileNorm) {
            try {
              const profileRes = await fetch(`${apiUrlBase}/profile/me`, {
                headers: { Authorization: `Bearer ${data.token}` },
              });
              if (profileRes.ok) {
                try {
                  const profile = await profileRes.json();
                  const email = (profile?.user?.email || "").trim();
                  if (email) sessionStorage.setItem("userEmail", email);
                } catch (_) {}
              }
            } catch (_) {}
            router.push("/dashboard");
          } else {
            router.push("/businesses/create");
          }
        } else {
          try {
            const profileRes = await fetch(`${apiUrlBase}/profile/me`, {
              headers: { Authorization: `Bearer ${data.token}` },
            });
            if (profileRes.ok) {
              try {
                sessionStorage.setItem("hasProfile", "true");
              } catch (_) {}
              try {
                const profile = await profileRes.json();
                const email = (profile?.user?.email || "").trim();
                if (email) sessionStorage.setItem("userEmail", email);
              } catch (_) {}
              router.push("/dashboard");
              return;
            }
          } catch (_) {}
          try {
            sessionStorage.setItem("hasProfile", "false");
          } catch (_) {}
          router.push("/businesses/create");
        }
      }
    } catch (error) {
      if (error.message && error.message.toLowerCase().includes("suspend")) {
        try {
          sessionStorage.removeItem("authToken");
        } catch (_) {}
      } else {
        setError(
          error.message || "Failed to sign in with Google. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Loading screen while checking login
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050315] text-white">
        <div className="flex flex-col items-center space-y-4">
          <SpinnerIcon />
          <p className="text-sm text-white/70">Checking your session...</p>
        </div>
      </div>
    );
  }

  // ✅ Dark neon-style UI (aligned with signup)
  return (
    <div
      className="
      relative flex w-full
      min-h-[620px] sm:min-h-[680px] lg:min-h-screen
      items-center justify-center
      overflow-hidden
      px-4
      py-10 sm:py-14 lg:py-0
      text-white
    "
    >
      {/* soft background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 bottom-0 h-80 w-80 rounded-full blur-[120px]" />
        <div className="absolute -right-40 top-0 h-80 w-80 rounded-full blur-[120px]" />
      </div>

      {/* centered card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="pointer-events-none absolute -inset-[1px] rounded-[32px] opacity-70" />
        <div className="relative rounded-[30px] border border-white/10 bg-[#080819]/95 px-8 py-9 backdrop-blur-xl shadow-[0_0_55px_rgba(255,110,0,0.35)]">
          {/* header */}
          <div className="mb-8 space-y-2 text-center">
            <h1
              className="text-[30px] sm:text-[32px] font-bold leading-tight"
              style={{
                background:
                  "linear-gradient(119.02deg, rgb(252,172,0) -22.94%, rgb(255,110,0) 83.73%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Welcome Back
            </h1>
            <p className="text-sm sm:text-base text-white/65">
              Sign in to continue to your workspace.
            </p>
          </div>

          {/* INITIAL VIEW */}
          {view === "initial" && (
            <div className="space-y-5 text-sm">
              <button
                onClick={handleSignInWithGoogle}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#101024] px-4 py-3 font-medium text-white hover:border-[#ff4b26]/70 hover:bg-[#151531] transition disabled:opacity-60"
              >
                <GoogleIcon />
                <span>Sign in with Google</span>
              </button>

              <div className="flex items-center gap-3 text-xs text-white/40">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <span>OR</span>
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              </div>

              <GradientButton
                type="button"
                onClick={() => {
                  setView("email");
                  setError(null);
                }}
                className="w-full py-3 text-sm font-semibold"
              >
                Sign in with Email
              </GradientButton>
            </div>
          )}
          {view === "email" && (
            <form
              onSubmit={handleEmailLoginSubmit}
              className="space-y-5 text-sm"
            >
              <div>
                <label className="mb-1 block font-medium text-white/75">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#101024] px-3.5 py-2.5"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-white/75">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#101024] px-3.5 py-2.5"
                  placeholder="••••••••"
                />
                <div className="text-right mt-1">
                   <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs text-white/50 hover:text-white transition"
                   >
                     Forgot password?
                   </button>
                </div>
              </div>

              {error && (
                <p className="rounded-md bg-red-900/30 px-3 py-2 text-center text-xs text-red-300">
                  {error}
                </p>
              )}

              <GradientButton
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 text-sm font-semibold"
              >
                {isLoading ? <SpinnerIcon /> : "Sign In"}
              </GradientButton>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setView("initial")}
                  className="text-xs font-medium text-[#ff4b26] hover:underline"
                >
                  ← Back
                </button>
              </div>
            </form>
          )}

          {/* footer */}
          <p className="mt-6 text-center text-xs text-white/60">
            Don’t have an account?{" "}
            <a
              href="/signup"
              className="font-semibold text-[#ff4b26] hover:underline"
            >
              Sign up for free
            </a>
          </p>
        </div>
      </div>
      
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        email={email}
      />
    </div>
  );
}
