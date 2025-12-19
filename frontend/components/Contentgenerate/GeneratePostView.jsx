"use client";

import React, { useEffect, useState } from "react";
import { Plus, Instagram, Linkedin, Facebook, Twitter } from "lucide-react";
import { useRouter } from "next/navigation";

/* ---------- Shared UI Components ---------- */

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

/* ---------- Platform Data ---------- */

const socialPlatforms = [
  {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram size={18} className="text-pink-400" />,
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: <Twitter size={18} className="text-sky-400" />,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: <Linkedin size={18} className="text-blue-400" />,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: <Facebook size={18} className="text-blue-500" />,
  },
];

/* ---------- Main Component ---------- */

const GenerateAIContent = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const [selectedPlatforms, setSelectedPlatforms] = useState({});
  const [brief, setBrief] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const router = useRouter();

  /* ---------- Helpers ---------- */

  const readJsonSafely = async (response) => {
    const contentType = response.headers?.get?.("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        return await response.json();
      } catch (_) {
        return null;
      }
    }
    try {
      const text = await response.text();
      return JSON.parse(text);
    } catch (_) {
      return null;
    }
  };

  const buildHttpError = async (response, defaultMessage) => {
    const body = await readJsonSafely(response);
    const messageFromBody = body?.message || body?.error || body?.detail;
    const statusInfo = `(${response.status}${
      response.statusText ? " " + response.statusText : ""
    })`;
    const err = new Error(
      messageFromBody || `${defaultMessage} ${statusInfo}`.trim()
    );
    err.status = response.status;
    return err;
  };

  const handlePlatformChange = (platformId) => {
    setSelectedPlatforms((prevSelected) => ({
      ...prevSelected,
      [platformId]: !prevSelected[platformId],
    }));
  };

  /* ---------- Effects ---------- */

  useEffect(() => {
    try {
      const storedBrief = sessionStorage.getItem("creativeBrief");
      const storedPlatforms = sessionStorage.getItem("targetPlatforms");
      if (storedBrief) setBrief(storedBrief);
      if (storedPlatforms) {
        const parsed = JSON.parse(storedPlatforms);
        if (parsed && typeof parsed === "object") {
          setSelectedPlatforms(parsed);
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("creativeBrief", brief || "");
      sessionStorage.setItem(
        "targetPlatforms",
        JSON.stringify(selectedPlatforms || {})
      );
    } catch (_) {}
  }, [brief, selectedPlatforms]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        if (!token) {
          setError("Please log in to view your generated posts.");
          router.push("/login");
          return;
        }

        const response = await fetch(`${apiUrl}/posts`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw await buildHttpError(response, "Failed to fetch history.");
        }

        const postsFromDb = await readJsonSafely(response);
        if (!postsFromDb) {
          throw new Error("History response was not valid JSON.");
        }
        setHistory(postsFromDb);
      } catch (err) {
        console.error("Error fetching history:", err);
        if (err?.status === 401 || err?.status === 403) {
          try {
            sessionStorage.removeItem("authToken");
          } catch (_) {}
          setError("Your session expired. Please log in again.");
          router.push("/login");
          return;
        }
      }
    };

    fetchHistory();
  }, [apiUrl, router]);

  /* ---------- Handlers ---------- */

  const saveContentToDb = async (generatedData, token) => {
    try {
      const response = await fetch(`${apiUrl}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(generatedData),
      });

      if (!response.ok) {
        throw new Error("Failed to save the post to the database.");
      }
      const saved = await readJsonSafely(response);
      console.log("Content saved to database successfully!", saved);
      return saved?.post?._id;
    } catch (error) {
      console.error("Error saving to DB:", error.message);
      setError(
        "Content was generated but failed to save. You can try saving it manually later."
      );
      return null;
    }
  };

  const handleGenerateContent = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) {
        setError("Your session has ended. Please log in again.");
        router.push("/login");
        return;
      }

      const generateResponse = await fetch(`${apiUrl}/create-text-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brief,
          platforms: Object.keys(selectedPlatforms).filter(
            (key) => selectedPlatforms[key]
          ),
        }),
      });

      if (!generateResponse.ok) {
        const err = await buildHttpError(
          generateResponse,
          "Failed to generate content."
        );
        if (err?.status === 401 || err?.status === 403) {
          try {
            sessionStorage.removeItem("authToken");
          } catch (_) {}
          setError("Your session expired. Please log in again.");
          router.push("/login");
          return;
        }
        throw err;
      }

      const textPlan = await readJsonSafely(generateResponse);
      if (!textPlan) {
        throw new Error("Generate response was not valid JSON.");
      }

      const newPostId = await saveContentToDb(textPlan, token);
      if (newPostId) {
        router.push(`/generatepost?id=${newPostId}`);
      } else {
        console.error("Could not get a new post ID, staying on page.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewHistory = (post) => {
    router.push(`/generatepost?id=${post._id}`);
  };

  const handleClear = () => {
    setBrief("");
    setSelectedPlatforms({});
    setError(null);
    try {
      sessionStorage.removeItem("creativeBrief");
      sessionStorage.removeItem("targetPlatforms");
    } catch (_) {}
  };

  /* ---------- UI Render ---------- */

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      {/* GRID LAYOUT:
         The 'items-stretch' (default) ensures both columns are equal height.
         We add 'h-full' to the GlassCards so they fill that available height.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: Brief + Platforms + Generate */}
        <div className="lg:col-span-2">
          {/* Added 'h-full' to stretch this card to match the neighbor */}
          <GlassCard className="h-full flex flex-col">
            <form onSubmit={handleGenerateContent} className="space-y-6 flex-grow">
              
              {/* Step 1: Creative Brief */}
              <div>
                <h2 className="text-xl font-bold mb-2">1. Creative Brief</h2>
                <p className="text-sm text-gray-300 mb-3">
                  Describe the topic or idea for your social media post. The more
                  detail, the better the result.
                </p>
                <textarea
                  className="w-full h-32 p-3 rounded-lg bg-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500 border border-transparent"
                  placeholder="e.g., A post about the top 5 benefits of using our new productivity app..."
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                />
              </div>

              {/* Step 2: Target Platforms */}
              <div>
                <h2 className="text-xl font-bold mb-2">2. Target Platforms</h2>
                <p className="text-sm text-gray-300 mb-3">
                  Select the social media platforms you want to target.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {socialPlatforms.map((platform) => {
                    const selected = !!selectedPlatforms[platform.id];
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => handlePlatformChange(platform.id)}
                        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border text-sm transition-all
                          ${
                            selected
                              ? "bg-white/15 border-orange-400 shadow-lg shadow-orange-500/30"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {platform.icon}
                          <span className="font-medium">{platform.name}</span>
                        </div>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px]
                            ${
                              selected
                                ? "bg-orange-400 border-orange-300"
                                : "border-white/30"
                            }`}
                        >
                          {selected ? "✓" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions (Pushed to bottom via flex-grow on form if needed, but here just standard flow) */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2 mt-auto">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 rounded-full border border-white/20 text-sm text-gray-200 hover:bg-white/10 transition"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    !brief.trim() ||
                    Object.values(selectedPlatforms).every((v) => !v)
                  }
                  className="
                    inline-flex
                    items-center justify-center
                    rounded-full
                    text-[14px] font-semibold text-white
                    whitespace-nowrap
                    px-4 py-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition
                    hover:scale-[1.03]
                  "
                  style={{
                    background:
                      "linear-gradient(119.02deg, #FCAC00 -22.94%, #FF6E00 83.73%)",
                  }}
                >
                  {isLoading ? "Generating..." : "Generate Content"}
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-400 mt-2">{error}</p>
              )}
            </form>
          </GlassCard>
        </div>

        {/* RIGHT: Recent AI Generations (history) */}
        <div className="lg:col-span-1">
          {/* Added 'h-full' to stretch this card to match the left card */}
          <GlassCard className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Generations</h2>
            </div>

            {history && history.length > 0 ? (
              <div className="space-y-3">
                {history.slice(0, 4).map((h) => (
                  <div
                    key={h._id}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start justify-between gap-3"
                  >
                    <div className="pr-2 min-w-0">
                      <h3 className="font-medium text-sm text-white mb-1 line-clamp-2">
                        {(h.content?.postContent || "Generated Post").slice(0, 80)}
                      </h3>
                      <p className="text-xs text-gray-300 line-clamp-1">
                        {h.content?.platforms
                          ? Object.keys(h.content.platforms).join(", ")
                          : ""}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleViewHistory(h)}
                      className="text-xs font-semibold text-orange-300 hover:text-orange-200 whitespace-nowrap mt-1"
                    >
                      View →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-300 py-4">
                <p className="font-medium">No generated content yet</p>
                <p className="text-xs mt-1 text-gray-500">
                  Generate a post to see it appear here.
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default GenerateAIContent;