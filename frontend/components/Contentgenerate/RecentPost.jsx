"use client";

import React, { useEffect, useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import GradientButton from "../GradientButton";

// --- Shared UI helpers (same style as new dashboard) ---

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl relative overflow-hidden text-white ${className}`}
    style={{
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.25)",
    }}
  >
    {children}
  </div>
);

const OrangeButton = ({
  children,
  className = "",
  disabled = false,
  onClick,
}) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`px-4 py-2 rounded-full font-semibold transition duration-200 text-white shadow-none hover:shadow-xl hover:shadow-[rgba(255,140,0,0.6)] disabled:opacity-50 ${className}`}
    style={{
      background: "linear-gradient(to right, #FF8C00, #FFD700)",
    }}
  >
    {children}
  </button>
);

// --- Component ---

export default function Generatedpost() {
  const router = useRouter();
  const POST_LIMIT = 10;

  const canNavigateToGenerate = () => {
    try {
      if (typeof window === "undefined") return true;
      const used = parseInt(sessionStorage.getItem("usedPosts") || "0", 10) || 0;
      return used < POST_LIMIT;
    } catch (_) {
      return true;
    }
  };

  const [businessName, setBusinessName] = useState("");
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postFilter, setPostFilter] = useState("all"); // "all", "today", "week", "month"
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch business profile
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("authToken")
        : null;
    if (!token) return;

    const hasProfile =
      typeof window !== "undefined" &&
      sessionStorage.getItem("hasProfile") === "true";
    if (!hasProfile) return;

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    (async () => {
      try {
        const res = await fetch(`${apiUrl}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const profile = await res.json();
        setBusinessName((profile?.businessName || "").trim());
      } catch (_) {
        // ignore
      }
    })();
  }, []);

  // Fetch posts
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("authToken")
        : null;
    if (!token) {
      setIsLoading(false);
      return;
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    (async () => {
      try {
        const res = await fetch(`${apiUrl}/posts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setIsLoading(false);
          return;
        }

        const raw = await res.json();
        const normalized = (Array.isArray(raw) ? raw : []).map((p) => {
          const c = p?.content || {};

          const image =
            c.imageUrl ||
            c.thumbnailUrl ||
            c?.instagram?.imageUrl ||
            c?.facebook?.imageUrl ||
            c?.linkedin?.imageUrl ||
            c?.twitter?.imageUrl ||
            null;

          const platformsObj = c.platforms || {};
          const captionPriorityOrder = [
            "instagram",
            "facebook",
            "linkedin",
            "x",
            "twitter",
          ];

          let firstCaption = "";
          for (const key of captionPriorityOrder) {
            const maybe = platformsObj?.[key]?.caption;
            if (typeof maybe === "string" && maybe.trim()) {
              firstCaption = maybe;
              break;
            }
          }

          const primaryText =
            c.postContent ||
            firstCaption ||
            c.title ||
            c.heading ||
            c.caption ||
            "Generated Post";

          const title = String(primaryText).slice(0, 80);

          const body = c.description || firstCaption || c.longForm || "";
          const excerpt = String(body).slice(0, 180);

          const platforms = Object.keys(platformsObj || {}).map((k) => {
            if (k === "x") return "Twitter";
            if (k === "linkedin") return "LinkedIn";
            return k.charAt(0).toUpperCase() + k.slice(1);
          });

          return {
            id: p._id || p.id,
            image,
            title,
            excerpt,
            createdAt: p?.createdAt,
            platforms,
          };
        });

        setItems(normalized);
      } catch (_) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const goToGenerate = () => {
    if (!canNavigateToGenerate()) return;
    router.push("/generatepost");
  };

  // Filter posts based on selected time period
  const filterPostsByDate = (posts, filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate start of week (assuming week starts on Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    // Calculate start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return posts.filter((post) => {
      if (!post.createdAt) return false;
      const postDate = new Date(post.createdAt);
      
      switch (filter) {
        case "today":
          return postDate >= today;
        case "week":
          return postDate >= startOfWeek;
        case "month":
          return postDate >= startOfMonth;
        default:
          return true;
      }
    });
  };

  const filteredItems = filterPostsByDate(items, postFilter);

  return (
    <div className="text-white">
      {/* Header + breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs sm:text-sm text-gray-400 mb-1">
            {businessName && (
              <>
                <span className="font-semibold text-gray-200">
                  {businessName}
                </span>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-gray-400">Posts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Content Library
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Manage all your AI-generated posts and social media content.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-medium border border-white/10"
            >
              <span>
                {postFilter === "all" ? "All Posts" : postFilter === "today" ? "Today" : postFilter === "week" ? "This Week" : "This Month"}
              </span>
              <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full mt-2 left-0 w-40 rounded-lg bg-[#1a1a1a] border border-white/10 shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setPostFilter("all");
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors ${
                    postFilter === "all" ? "bg-orange-500/20 text-orange-400" : "text-gray-300"
                  }`}
                >
                  All Posts
                </button>
                <button
                  onClick={() => {
                    setPostFilter("today");
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors ${
                    postFilter === "today" ? "bg-orange-500/20 text-orange-400" : "text-gray-300"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    setPostFilter("week");
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors ${
                    postFilter === "week" ? "bg-orange-500/20 text-orange-400" : "text-gray-300"
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => {
                    setPostFilter("month");
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors ${
                    postFilter === "month" ? "bg-orange-500/20 text-orange-400" : "text-gray-300"
                  }`}
                >
                  This Month
                </button>
              </div>
            )}
          </div>

          <GradientButton className="hidden sm:inline-flex" onClick={goToGenerate}>
            <Plus size={14}/>
            Generate New Content
          </GradientButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-6">
        {isLoading ? (
          <GlassCard className="w-full flex items-center justify-center py-16">
            <p className="text-gray-300 text-sm sm:text-base">
              Loading your posts…
            </p>
          </GlassCard>
        ) : items.length === 0 ? (
          <GlassCard className="w-full py-10 px-6 text-center flex flex-col items-center">
            <p className="text-lg font-semibold text-white">No posts yet</p>
            <p className="text-gray-400 text-sm mt-1 max-w-md">
              Generate your first post to get started with your content
              library.
            </p>
            <OrangeButton
              onClick={goToGenerate}
              className="mt-4 inline-flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Generate Your First Post</span>
            </OrangeButton>
          </GlassCard>
        ) : filteredItems.length === 0 ? (
          <GlassCard className="w-full py-10 px-6 text-center flex flex-col items-center">
            <p className="text-lg font-semibold text-white">No posts found</p>
            <p className="text-gray-400 text-sm mt-1 max-w-md">
              No posts found for {postFilter === "all" ? "all time" : postFilter === "today" ? "today" : postFilter === "week" ? "this week" : "this month"}. Try generating new content.
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredItems.map((post) => (
              <GlassCard
                key={post.id}
                className="flex flex-col overflow-hidden"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-black/40 overflow-hidden">
                  {post.image ? (
                    <img
                      src={post.image}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs sm:text-sm">
                      No image available
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-sm sm:text-base leading-snug line-clamp-2">
                    {post.title}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center font-medium text-emerald-300 bg-emerald-900/50 px-2 py-1 rounded-full">
                      Generated
                    </span>
                    {post.createdAt && (
                      <span className="text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    )}
                  </div>

                  {post.platforms?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {post.platforms.map((p) => (
                        <span
                          key={p}
                          className="text-[10px] uppercase tracking-wide text-gray-300 bg-white/5 px-2 py-0.5 rounded-full"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-gray-300 mt-3 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <button
                    onClick={() =>
                      router.push(
                        `/post?id=${encodeURIComponent(post.id)}`
                      )
                    }
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 border border-white/15 text-gray-100 hover:bg-white/10 px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition"
                  >
                    View Details
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
