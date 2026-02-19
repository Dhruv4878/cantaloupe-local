"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Settings,
  User,
  Shield,
  Bell,
  Globe2,
  Link2,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
} from "lucide-react";
import GradientButton from "../GradientButton";
import ForgotPasswordModal from "../ForgotPasswordModal";
import { useRouter } from "next/navigation";

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`p-4 sm:p-6 rounded-2xl relative overflow-hidden text-white ${className}`}
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

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account & Security", icon: Shield },
  { id: "publishing", label: "Publishing Preferences", icon: Globe2 },
  // { id: "social", label: "Social Connections", icon: Link2 },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const Toggle = ({ checked, onChange, label, helper }) => (
  <div className="flex items-start justify-between gap-3 py-2">
    <div className="flex-1">
      <p className="text-sm font-medium">{label}</p>
      {helper && <p className="text-xs text-white/60 mt-0.5">{helper}</p>}
    </div>
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${checked ? "bg-orange-500" : "bg-white/20"
        }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-1"
          }`}
      />
    </button>
  </div>
);

const InputField = ({
  label,
  type = "text",
  placeholder = "",
  value,
  onChange,
}) => (
  <div className="space-y-1 w-full">
    <label className="text-sm text-white/80">{label}</label>
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-xl bg-black/50 border border-white/18 px-3.5 py-2.5 text-sm sm:text-[15px] text-white placeholder-white/40 shadow-sm hover:border-brand-orange/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/80 transition"
    />
  </div>
);

const SettingsView = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', message: '' }
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    timezone: "Asia/Kolkata",
    // Backend profile fields
    accountType: "Creator",
    businessName: "",
    website: "",
    businessDescription: "",
  });

  const [publishing, setPublishing] = useState({
    defaultPlatform: "instagram",
    defaultPostTime: "11:00",
    hashtagCount: 5,
  });

  const [notifications, setNotifications] = useState({
    emailActivity: true,
    emailReports: true,
    browserAlerts: true,
    productUpdates: false,
  });

  // Fetch Profile on Mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${apiUrl}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          // Map backend data to state
          const firstName = data.user?.firstName || "";
          const lastName = data.user?.lastName || "";
          const name = (firstName + " " + lastName).trim();

          setProfile((prev) => ({
            ...prev,
            name,
            email: data.user?.email || "",
            timezone: data.timezone || "Asia/Kolkata",
            accountType: data.accountType || "Creator",
            businessName: data.businessName || "",
            website: data.website || "",
            businessDescription: data.businessDescription || "",
          }));
          
          // If you had publishing/notification preferences in backend, load them here
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);


  /* Removed passwords state since we use modal now */

  const handleSave = async () => {
    setNotification(null);
    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      
      const res = await fetch(`${apiUrl}/profile`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        setNotification({ type: 'success', message: 'Profile updated successfully!' });
        // Update userEmail in session if needed, though usually email isn't changed here yet
        setTimeout(() => setNotification(null), 3000);
      } else {
        const err = await res.json();
        setNotification({ type: 'error', message: err.message || 'Failed to update profile' });
      }
    } catch (error) {
       setNotification({ type: 'error', message: 'An unexpected error occurred' });
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-1">
                Profile
              </h2>
              <p className="text-xs sm:text-sm text-white/60">
                Update your basic details. These are used across your workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Full Name"
                value={profile.name}
                placeholder="Dhruv Patel"
                onChange={(e) =>
                  setProfile((p) => ({ ...p, name: e.target.value }))
                }
              />
              <div className="w-full">
                <label className="text-sm text-white/80 block mb-1">Email</label>
                <input 
                    type="email" 
                    value={profile.email} 
                    disabled
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm sm:text-[15px] text-white/50 cursor-not-allowed"
                />
              </div>
              <div className="w-full">
                <label className="text-sm text-white/80 block mb-1.5">
                  Timezone
                </label>
                <CustomSelect
                  id="timezone"
                  value={profile.timezone}
                  onChange={(v) =>
                    setProfile((p) => ({ ...p, timezone: v }))
                  }
                  options={[
                    "Asia/Kolkata",
                    "UTC",
                    "America/New_York",
                    "Europe/London",
                  ]}
                  placeholder="Select timezone"
                />
              </div>
            </div>
          </div>
        );

      case "account":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-1">
                Account & Security
              </h2>
              <p className="text-xs sm:text-sm text-white/60">
                Manage password, sessions and security controls.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                 <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-medium text-white">Password</h3>
                        <p className="text-xs text-white/60 mt-1">
                            Secure your account with a strong password.
                        </p>
                    </div>
                    <GradientButton 
                        onClick={() => setIsForgotPasswordOpen(true)}
                        className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm"
                    >
                        Change Password
                    </GradientButton>
                 </div>
              </div>
            </div>

            <GlassCard className="mt-2 bg-white/5">
              <h3 className="text-sm font-semibold mb-3">
                Two-Factor Authentication
              </h3>
              <p className="text-xs text-white/60 mb-3">
                Protect your account with an extra layer of security on login.
              </p>
              <GradientButton className="w-full sm:w-auto text-xs sm:text-sm">
                Enable 2FA (coming soon)
              </GradientButton>
            </GlassCard>
            
            <ForgotPasswordModal 
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
                email={profile.email}
            />
          </div>
        );

      case "publishing":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-1">
                Publishing Preferences
              </h2>
              <p className="text-xs sm:text-sm text-white/60">
                Defaults used when generating and scheduling new posts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full">
                <label className="text-sm text-white/80 block mb-1.5">
                  Default Primary Platform
                </label>
                <CustomSelect
                  id="defaultPlatform"
                  value={publishing.defaultPlatform}
                  onChange={(v) =>
                    setPublishing((p) => ({
                      ...p,
                      defaultPlatform: v,
                    }))
                  }
                  options={["instagram", "linkedin", "facebook", "x"]}
                  placeholder="Select platform"
                />
              </div>

              <div className="w-full">
                <label className="text-sm text-white/80 block mb-1.5">
                  Default Posting Time (24h)
                </label>
                <input
                  type="time"
                  value={publishing.defaultPostTime}
                  onChange={(e) =>
                    setPublishing((p) => ({
                      ...p,
                      defaultPostTime: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl bg-black/50 border border-white/18 px-3.5 py-2.5 text-sm sm:text-[15px] text-white shadow-sm hover:border-brand-orange/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/80 transition"
                />
              </div>

              <div className="w-full">
                <label className="text-sm text-white/80 block mb-1.5">
                  Default Hashtag Count
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={publishing.hashtagCount}
                  onChange={(e) =>
                    setPublishing((p) => ({
                      ...p,
                      hashtagCount: Number(e.target.value || 0),
                    }))
                  }
                  className="w-full rounded-xl bg-black/50 border border-white/18 px-3.5 py-2.5 text-sm sm:text-[15px] text-white shadow-sm hover:border-brand-orange/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/80 transition"
                />
                <p className="text-xs text-white/60 mt-1">
                  Used as a hint when generating hashtags.
                </p>
              </div>
            </div>
          </div>
        );

      // case "social":
      //   return (
      //     <div className="space-y-6">
      //       <div>
      //         <h2 className="text-lg sm:text-xl font-semibold mb-1">
      //           Social Connections
      //         </h2>
      //         <p className="text-xs sm:text-sm text-white/60">
      //           Connect and manage your social profiles used for publishing.
      //         </p>
      //       </div>

      //       <div className="space-y-3">
      //         <GlassCard className="bg-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      //           <div className="flex items-center gap-3">
      //             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-yellow-500 flex items-center justify-center">
      //               <Instagram size={16} />
      //             </div>
      //             <div>
      //               <p className="text-sm font-medium">Instagram Business</p>
      //               <p className="text-xs text-white/60">
      //                 Connect to publish reels & posts.
      //               </p>
      //             </div>
      //           </div>
      //           <GradientButton className="w-full sm:w-auto px-4 py-1.5 text-xs sm:text-sm">
      //             Connect
      //           </GradientButton>
      //         </GlassCard>

      //         <GlassCard className="bg-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      //           <div className="flex items-center gap-3">
      //             <div className="w-8 h-8 rounded-full bg-[#1877F2]/80 flex items-center justify-center">
      //               <Facebook size={16} />
      //             </div>
      //             <div>
      //               <p className="text-sm font-medium">Facebook Pages</p>
      //               <p className="text-xs text-white/60">
      //                 Publish to your brand pages.
      //               </p>
      //             </div>
      //           </div>
      //           <GradientButton className="w-full sm:w-auto px-4 py-1.5 text-xs sm:text-sm">
      //             Connect
      //           </GradientButton>
      //         </GlassCard>

      //         <GlassCard className="bg-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      //           <div className="flex items-center gap-3">
      //             <div className="w-8 h-8 rounded-full bg-[#0A66C2]/80 flex items-center justify-center">
      //               <Linkedin size={16} />
      //             </div>
      //             <div>
      //               <p className="text-sm font-medium">LinkedIn</p>
      //               <p className="text-xs text-white/60">
      //                 Post to company pages or personal profile.
      //               </p>
      //             </div>
      //           </div>
      //           <GradientButton className="w-full sm:w-auto px-4 py-1.5 text-xs sm:text-sm">
      //             Connect
      //           </GradientButton>
      //         </GlassCard>

      //         <GlassCard className="bg-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      //           <div className="flex items-center gap-3">
      //             <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
      //               <Twitter size={16} className="text-black" />
      //             </div>
      //             <div>
      //               <p className="text-sm font-medium">X (Twitter)</p>
      //               <p className="text-xs text-white/60">
      //                 Share short updates & threads.
      //               </p>
      //             </div>
      //           </div>
      //           <GradientButton className="w-full sm:w-auto px-4 py-1.5 text-xs sm:text-sm">
      //             Connect
      //           </GradientButton>
      //         </GlassCard>
      //       </div>
      //     </div>
      //   );

      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-1">
                Notifications
              </h2>
              <p className="text-xs sm:text-sm text-white/60">
                Choose how Cantaloupe should keep you in the loop.
              </p>
            </div>

            <GlassCard className="bg-white/5 space-y-3">
              <Toggle
                checked={notifications.emailActivity}
                onChange={() =>
                  setNotifications((n) => ({
                    ...n,
                    emailActivity: !n.emailActivity,
                  }))
                }
                label="Email me about important activity"
                helper="Post failures, connection issues, and permission errors."
              />
              <Toggle
                checked={notifications.emailReports}
                onChange={() =>
                  setNotifications((n) => ({
                    ...n,
                    emailReports: !n.emailReports,
                  }))
                }
                label="Weekly performance report"
                helper="A summary of your recent content performance."
              />
              <Toggle
                checked={notifications.browserAlerts}
                onChange={() =>
                  setNotifications((n) => ({
                    ...n,
                    browserAlerts: !n.browserAlerts,
                  }))
                }
                label="Browser alerts"
                helper="Show subtle in-app alerts for schedules and status updates."
              />
              <Toggle
                checked={notifications.productUpdates}
                onChange={() =>
                  setNotifications((n) => ({
                    ...n,
                    productUpdates: !n.productUpdates,
                  }))
                }
                label="Product tips & updates"
                helper="Occasional emails with new features and best practices."
              />
            </GlassCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-[#050816] text-white ${isForgotPasswordOpen ? 'min-h-[150vh]' : ''}`}>
      <div className="mx-auto w-full max-w-6xl px-0 sm:px-0 lg:px-0 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-teal-400 uppercase tracking-[0.25em]">
            <Settings size={16} />
            <span>Settings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
            Control how Cantaloupe works for you.
          </h1>
        </div>

        {/* Notification Banner */}
        {notification && (
            <div className={`mb-6 p-4 rounded-xl border ${
                notification.type === 'success' 
                    ? 'bg-green-500/10 border-green-500/20 text-green-200' 
                    : 'bg-red-500/10 border-red-500/20 text-red-200'
            }`}>
                {notification.message}
            </div>
        )}

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Sidebar */}
          <GlassCard className="lg:w-64 flex-shrink-0 bg-white/5">
            <p className="text-xs text-white/50 mb-3">Sections</p>
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              {sections.map(({ id, label, icon: Icon }) => {
                const active = id === activeSection;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveSection(id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm whitespace-nowrap transition ${active
                        ? "bg-white/15 text-white"
                        : "bg-white/5 text-white/70 hover:bg-white/10"

                      }`}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Main content */}
          <GlassCard className="flex-1 bg-white/5 flex flex-col gap-6">
            {renderSectionContent()}

            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <p className="text-[11px] sm:text-xs md:text-sm text-white/60">
                Changes are saved to your account and used across the app.
              </p>
              <GradientButton
                type="button"
                onClick={handleSave}
                className="w-full sm:w-auto"
              >
                Save Changes
              </GradientButton>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

/* ----------------- CustomSelect Component ----------------- */

function CustomSelect({ id, value, onChange, options = [], placeholder = "" }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!btnRef.current) return;
      if (btnRef.current.contains(e.target)) return;
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (open && panelRef.current) {
      const node = panelRef.current.children[highlighted];
      if (node) node.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted, open]);

  function toggle() {
    setOpen((v) => !v);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const val = options[highlighted] || placeholder;
      onChange(val === placeholder ? "" : val);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Format display value for timezone and platform
  const formatDisplayValue = (val) => {
    if (!val) return placeholder;
    
    // Timezone formatting
    if (val === "Asia/Kolkata") return "Asia / Kolkata (IST)";
    if (val === "UTC") return "UTC";
    if (val === "America/New_York") return "America / New York (EST)";
    if (val === "Europe/London") return "Europe / London (GMT)";
    
    // Platform formatting
    if (val === "instagram") return "Instagram";
    if (val === "linkedin") return "LinkedIn";
    if (val === "facebook") return "Facebook";
    if (val === "x") return "X (Twitter)";
    
    return val;
  };

  const formatOptionValue = (opt) => {
    // Timezone formatting
    if (opt === "Asia/Kolkata") return "Asia / Kolkata (IST)";
    if (opt === "UTC") return "UTC";
    if (opt === "America/New_York") return "America / New York (EST)";
    if (opt === "Europe/London") return "Europe / London (GMT)";
    
    // Platform formatting
    if (opt === "instagram") return "Instagram";
    if (opt === "linkedin") return "LinkedIn";
    if (opt === "facebook") return "Facebook";
    if (opt === "x") return "X (Twitter)";
    
    return opt;
  };

  return (
    <div className="relative">
      <button
        id={id}
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className="appearance-none w-full text-left rounded-xl border border-white/18 px-3.5 py-2.5 pr-9 bg-black/50 text-sm sm:text-[15px] text-white shadow-sm hover:border-brand-orange/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/80 transition"
      >
        <span
          className={
            "truncate " + (value ? "text-white" : "text-slate-500")
          }
        >
          {formatDisplayValue(value)}
        </span>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <svg
            className={
              "w-4 h-4 transition-transform " + (open ? "rotate-180" : "")
            }
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8l4 4 4-4" />
          </svg>
        </div>
      </button>

      {open && (
        <ul
          role="listbox"
          ref={panelRef}
          tabIndex={-1}
          className="absolute z-40 mt-2 w-full bg-[#05040F] border border-white/15 rounded-xl shadow-xl max-h-44 overflow-auto"
          onKeyDown={onKeyDown}
        >
          {options.map((opt, i) => (
            <li
              key={opt + i}
              role="option"
              aria-selected={value === opt}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => {
                onChange(opt === placeholder ? "" : opt);
                setOpen(false);
              }}
              className={
                "px-3.5 py-2 text-sm cursor-pointer " +
                (highlighted === i
                  ? "bg-white/10 text-white"
                  : "text-slate-200") +
                (value === opt ? " font-semibold" : "")
              }
            >
              {formatOptionValue(opt)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SettingsView;
