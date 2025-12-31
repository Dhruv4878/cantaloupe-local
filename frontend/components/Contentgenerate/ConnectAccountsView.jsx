//connect accounts
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Instagram, Facebook, Linkedin, Twitter } from "lucide-react";
import GradientButton from "../GradientButton";

/* ----------------------------- UI Wrapper ----------------------------- */
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
const BUTTON_LAYOUT =
  "w-full rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center justify-center";

const DisconnectButton = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`${BUTTON_LAYOUT}

      border border-orange-400/40
      text-orange-300
      bg-transparent
      hover:bg-orange-500/10
      hover:border-orange-400/60
      transition
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}`}
  >
    {children}
  </button>
);

/* ----------------------------- Platform Config ----------------------------- */
const PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "#E1306C",
    description: "Connect your Instagram Business account.",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "#4267B2",
    description: "Publish directly to your Facebook Page.",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "#0077B5",
    description: "Post updates using your LinkedIn account.",
  },
  {
    id: "twitter",
    name: "Twitter (X)",
    icon: Twitter,
    color: "#1DA1F2",
    description: "Post tweets using your connected account.",
  },
];

/* ----------------------------- Main Component ----------------------------- */
const ConnectAccountsView = () => {
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    []
  );

  const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID;
  const metaRedirectUri =
    process.env.NEXT_PUBLIC_META_REDIRECT_URI ||
    "http://localhost:5000/api/social/facebook/callback";

  const metaScopes =
    process.env.NEXT_PUBLIC_META_SCOPES ||
    "public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,";

  const [connections, setConnections] = useState({
    facebook: false,
    instagram: false,
    linkedin: false,
    twitter: false,
  });

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(null);
  const [error, setError] = useState(null); 

  /* ----------------------------- Helpers ----------------------------- */
  const getToken = () => {
    if (typeof window === "undefined") return null;
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      setError("Please sign in first.");
      return null;
    }
    return token;
  };

  /* ----------------------------- Fetch Backend Truth ----------------------------- */
  const fetchConnections = useCallback(async () => {
    try {
      setError(null);
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${apiUrl}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch profile");

      const profile = await res.json();
      const social = profile?.social || {};

      setConnections({
        facebook: !!social.facebook?.accessToken,
        instagram: !!(
          social.instagram?.accessToken && social.instagram?.igBusinessId
        ),
        linkedin: !!(social.linkedin?.accessToken && social.linkedin?.memberId),
        twitter: !!(social.twitter?.accessToken && social.twitter?.userId),
      });
    } catch (e) {
      setError(e.message || "Failed to load connections");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  /* ----------------------------- Initial + Redirect Sync ----------------------------- */
  useEffect(() => {
    fetchConnections();

    // Re-sync after OAuth redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") || params.get("instagram_error")) {
      fetchConnections();
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (params.get("connect_error")) {
      let msg = "Failed to connect Facebook.";
      if (params.get("no_pages"))
        msg = "No Facebook Pages found for your account.";
      if (params.get("no_page_token"))
        msg =
          "No valid Page Access Token found. Please ensure you grant 'Manage Pages' permissions.";

      setError(msg);
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Re-sync when tab regains focus (OAuth returns focus)
    const onFocus = () => fetchConnections();
    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, [fetchConnections]);

  /* ----------------------------- OAuth Starters ----------------------------- */
  const startMetaFlow = () => {
    const token = getToken();
    if (!token) return;

    if (!metaAppId) {
      setError("Missing NEXT_PUBLIC_META_APP_ID");
      return;
    }

    const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
    authUrl.searchParams.set("client_id", metaAppId);
    authUrl.searchParams.set("redirect_uri", metaRedirectUri);
    authUrl.searchParams.set("state", token);
    authUrl.searchParams.set("scope", metaScopes);

    window.location.href = authUrl.toString();
  };

  const startLinkedInFlow = () => {
    const token = getToken();
    if (!token) return;
    const url = new URL(`${apiUrl}/social/linkedin/auth`);
    url.searchParams.set("token", token);
    window.location.href = url.toString();
  };

  const startTwitterFlow = () => {
    const token = getToken();
    if (!token) return;
    const url = new URL(`${apiUrl}/social/twitter/auth`);
    url.searchParams.set("token", token);
    window.location.href = url.toString();
  };

  /* ----------------------------- Actions ----------------------------- */
  const handleConnect = (platform) => {
    setError(null);
    if (platform === "facebook" || platform === "instagram") {
      startMetaFlow();
    } else if (platform === "linkedin") {
      startLinkedInFlow();
    } else if (platform === "twitter") {
      startTwitterFlow();
    }
  };

  const handleDisconnect = async (platform) => {
    try {
      setWorking(platform);
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${apiUrl}/social/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platform }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Disconnect failed");
      }

      await fetchConnections();
    } catch (e) {
      setError(e.message || "Failed to disconnect");
    } finally {
      setWorking(null);
    }
  };

  const statusText = (platform) => {
    if (loading) return "Checking…";
    return connections[platform] ? "Connected" : "Not connected";
  };

  /* ----------------------------- Render ----------------------------- */
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Connect Your Social Accounts</h3>
      <p className="text-sm text-gray-400">
        Connections are managed securely via OAuth and stored on the server.
      </p>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLATFORMS.map((p) => {
          const connected = connections[p.id];

          return (
            <GlassCard
              key={p.id}
              className="flex flex-col text-center min-h-[240px]"
            >
              <div className="flex-1 flex flex-col items-center">
                <p.icon size={48} style={{ color: p.color }} className="mb-4" />
                <h4 className="text-xl font-semibold">{p.name}</h4>
                <p className="text-xs text-gray-400 mb-2 min-h-[36px]">
                  {p.description}
                </p>
                <p
                  className={`text-xs font-medium ${
                    connected ? "text-green-400" : "text-yellow-300"
                  }`}
                >
                  {statusText(p.id)}
                </p>
              </div>

              {connected ? (
                <DisconnectButton
                  className="mt-4"
                  disabled={working === p.id}
                  onClick={() => handleDisconnect(p.id)}
                >
                  {working === p.id ? "Disconnecting…" : "Disconnect"}
                </DisconnectButton>
              ) : (
                <GradientButton
                  className={`mt-4 ${BUTTON_LAYOUT}`}
                  disabled={working === p.id}
                  onClick={() => handleConnect(p.id)}
                >
                  {working === p.id ? "Please wait…" : "Connect"}
                </GradientButton>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectAccountsView;
