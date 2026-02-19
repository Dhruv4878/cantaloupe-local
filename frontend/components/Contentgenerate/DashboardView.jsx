"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  TrendingUp,
  DollarSign,
  Instagram,
  Cpu,
  Facebook,
  Twitter,
  Linkedin,
  Plus,
  ArrowRight,
  Sparkles, // Added for the new input bar
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import GradientButton from "../GradientButton";

const PRIMARY_ORANGE = "#FF8C00";
const POST_LIMIT = 10;

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`relative overflow-hidden text-white rounded-2xl p-4 sm:p-6 ${className}`}
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

const LineGraph = ({ data, color, label, maxValue }) => {
  const maxVal = maxValue || Math.max(...data.map((d) => d.value));
  return (
    <div className="h-40 sm:h-48 md:h-56 flex flex-col justify-end p-1 sm:p-2 relative">
      <span className="absolute top-0 left-0 text-[10px] sm:text-xs text-gray-500">
        {maxVal}
      </span>
      <div className="absolute inset-x-0 bottom-6 h-px bg-white/20" />
      <div className="flex justify-between items-end h-full relative z-10 gap-1">
        {data.map((d, index) => (
          <div
            key={index}
            className="flex flex-col items-center h-full justify-end flex-1 group"
          >
            <div
              className="w-full rounded-t-lg transition-all duration-500"
              style={{
                height: `${(d.value / maxVal) * 100}%`,
                minHeight: "4px",
                backgroundColor: color,
              }}
            />
            <span className="text-[10px] sm:text-xs text-gray-500 mt-1">
              {d.month.slice(0, 3)}
            </span>
            <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white/20 text-white text-[10px] sm:text-xs rounded-lg whitespace-nowrap -translate-y-8">
              {label}: {d.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BASE_PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: Facebook, color: "#4267B2" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "#E1306C" },
  { id: "twitter", name: "Twitter", icon: Twitter, color: "#1DA1F2" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "#0077B5" },
];

const mockData = {
  totalPosts: 1250,
  engagementRate: 7.2,
  connectedPlatforms: BASE_PLATFORMS.map((p) => ({ ...p, status: "Inactive" })),
  topEngagingPlatform: "Instagram",
  topEngagingPost: {
    platform: "Facebook",
    content:
      "Our new product is launching soon! Get ready for a revolution in efficiency...",
    engagements: 452,
  },
  engagementGraph: [
    { month: "Jan", value: 120 },
    { month: "Feb", value: 190 },
    { month: "Mar", value: 160 },
    { month: "Apr", value: 250 },
    { month: "May", value: 310 },
    { month: "Jun", value: 400 },
  ],
  paymentGraph: [
    { month: "Jan", value: 50 },
    { month: "Feb", value: 75 },
    { month: "Mar", value: 60 },
    { month: "Apr", value: 90 },
    { month: "May", value: 110 },
    { month: "Jun", value: 130 },
  ],
  aiInsight:
    "Content mentioning 'product launch' on Instagram saw 20% higher engagement last month. Focus on visual content this week.",
};

const DashboardView = ({ onPostCountUpdate }) => {
  const pathname = usePathname();

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      window.location.replace("/login");
    }
  }, []);

  const dashboardData = mockData;
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    []
  );
  const [profile, setProfile] = useState(null);

  const [platforms, setPlatforms] = useState(mockData.connectedPlatforms);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);
  const [postStats, setPostStats] = useState({
    lifetime: 0,
    monthlyOverall: 0,
    currentPlan: { used: 0, limit: 0, hasLimit: false, planName: 'Free' }
  });
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loadingRecentPosts, setLoadingRecentPosts] = useState(true);

  // Analytics state
  const [analytics, setAnalytics] = useState({
    engagementRate: 0,
    monthlyTrend: [],
    topPlatform: null,
    topPost: null,
    insights: '',
    loading: true,
    lastSynced: null,
  });

  // Calculate limit reached based on current plan usage
  const isLimitReached = postStats.currentPlan.hasLimit && 
    postStats.currentPlan.used >= postStats.currentPlan.limit;

  const requireToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    const token = window.sessionStorage.getItem("authToken");
    return token && token !== "null" ? token : null;
  }, []);

  useEffect(() => {
    const mapStatus = (social) =>
      BASE_PLATFORMS.map((p) => {
        let isConnected = false;
        let explicitStatus = null;

        if (p.id === "facebook") {
          isConnected = !!social?.facebook?.accessToken;
          explicitStatus = social?.facebook?.status;
        } else if (p.id === "instagram") {
          isConnected =
            !!social?.instagram?.accessToken &&
            !!social?.instagram?.igBusinessId;
          explicitStatus = social?.instagram?.status;
        } else if (p.id === "linkedin") {
          isConnected =
            !!social?.linkedin?.accessToken && !!social?.linkedin?.memberId;
          explicitStatus = social?.linkedin?.status;
        } else if (p.id === "twitter") {
          const hasUserId =
            !!social?.twitter?.userId || !!social?.twitter?.userID;
          const hasToken =
            !!social?.twitter?.accessToken || !!social?.twitter?.oauthToken;
          isConnected = hasToken && hasUserId;
          explicitStatus = social?.twitter?.status;
        }

        let statusLabel = "Inactive";
        if (isConnected) {
          if (explicitStatus && explicitStatus.toLowerCase() === "inactive") {
            statusLabel = "Inactive";
          } else {
            statusLabel = "Active";
          }
        }
        return { ...p, status: statusLabel };
      });

    const fetchPlatforms = async () => {
      try {
        setLoadingPlatforms(true);
        const token = requireToken();
        if (!token) {
          setPlatforms(mockData.connectedPlatforms);
          return;
        }
        const res = await fetch(`${apiUrl}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          // Handle 401/403 - token invalid
          if (res.status === 401 || res.status === 403) {
            console.error("Unauthorized - token may be invalid");
            setPlatforms(mockData.connectedPlatforms);
            return;
          }
          // Handle 404 or other errors - use empty profile
          if (res.status === 404) {
            setPlatforms(mapStatus({}));
            return;
          }
          // For other errors, use mock data and log
          console.error("Failed to load platform status:", res.status);
          setPlatforms(mockData.connectedPlatforms);
          return;
        }
        const profileData = await res.json();
        setProfile(profileData);
        setPlatforms(mapStatus(profileData?.social || {}));
      } catch (e) {
        console.error("Fetch error:", e);
        setPlatforms(mockData.connectedPlatforms);
      } finally {
        setLoadingPlatforms(false);
      }
    };

    fetchPlatforms();
  }, [apiUrl]);
  // Fetch post stats function - can be called manually or on mount
  const fetchPostStats = useCallback(async () => {
    try {
      setLoadingCounts(true);

      const token = requireToken();
      if (!token) {
        const defaultStats = {
          lifetime: 0,
          monthlyOverall: 0,
          currentPlan: { used: 0, limit: 0, hasLimit: false, planName: 'Free' }
        };
        setPostStats(defaultStats);
        if (typeof onPostCountUpdate === "function") {
          onPostCountUpdate(0);
        }
        return;
      }

      const res = await fetch(`${apiUrl}/posts/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Handle 401/403 - token invalid
        if (res.status === 401 || res.status === 403) {
          console.error("Unauthorized - token may be invalid");
          const defaultStats = {
            lifetime: 0,
            monthlyOverall: 0,
            currentPlan: { used: 0, limit: 0, hasLimit: false, planName: 'Free' }
          };
          setPostStats(defaultStats);
          if (typeof onPostCountUpdate === "function") {
            onPostCountUpdate(0);
          }
          return;
        }
        // For other errors, just set stats to 0 and log
        console.error("Failed to fetch post stats:", res.status);
        const defaultStats = {
          lifetime: 0,
          monthlyOverall: 0,
          currentPlan: { used: 0, limit: 0, hasLimit: false, planName: 'Free' }
        };
        setPostStats(defaultStats);
        if (typeof onPostCountUpdate === "function") {
          onPostCountUpdate(0);
        }
        return;
      }

      const data = await res.json();
      setPostStats(data);
      // Update parent component with the lifetime count for backward compatibility
      if (typeof onPostCountUpdate === "function") {
        onPostCountUpdate(data.lifetime ?? 0);
      }
    } catch (err) {
      console.error("Post stats error:", err);
      const defaultStats = {
        lifetime: 0,
        monthlyOverall: 0,
        currentPlan: { used: 0, limit: 0, hasLimit: false, planName: 'Free' }
      };
      setPostStats(defaultStats);
      if (typeof onPostCountUpdate === "function") {
        onPostCountUpdate(0);
      }
    } finally {
      setLoadingCounts(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, requireToken]);

  // Fetch recent posts function - gets last 3 posts
  const fetchRecentPosts = useCallback(async () => {
    try {
      setLoadingRecentPosts(true);

      const token = requireToken();
      if (!token) {
        setRecentPosts([]);
        return;
      }

      const res = await fetch(`${apiUrl}/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch recent posts:", res.status);
        setRecentPosts([]);
        return;
      }

      const posts = await res.json();
      
      // Take only first 3 posts and normalize data
      const recentThree = (Array.isArray(posts) ? posts : []).slice(0, 3).map((p) => {
        const c = p?.content || {};
        
        // Get image URL
        const image =
          c.imageUrl ||
          c.thumbnailUrl ||
          c?.instagram?.imageUrl ||
          c?.facebook?.imageUrl ||
          c?.linkedin?.imageUrl ||
          c?.twitter?.imageUrl ||
          null;
        
        // Get caption/title
        const platformsObj = c.platforms || {};
        const captionPriorityOrder = ["instagram", "facebook", "linkedin", "x", "twitter"];
        
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
        
        const title = String(primaryText).slice(0, 60);
        
        return {
          id: p._id || p.id,
          image,
          title,
          createdAt: p?.createdAt,
        };
      });
      
      setRecentPosts(recentThree);
    } catch (err) {
      console.error("Recent posts error:", err);
      setRecentPosts([]);
    } finally {
      setLoadingRecentPosts(false);
    }
  }, [apiUrl, requireToken]);

  // Fetch post stats on mount and when API URL changes
  useEffect(() => {
    fetchPostStats();
  }, [fetchPostStats]);

  // Refresh post stats when navigating to dashboard route
  useEffect(() => {
    if (pathname === "/dashboard") {
      fetchPostStats();
    }
  }, [pathname, fetchPostStats]);

  // Also update parent when postStats changes (backup mechanism)
  useEffect(() => {
    if (typeof onPostCountUpdate === "function") {
      onPostCountUpdate(postStats.lifetime);
    }
  }, [postStats.lifetime, onPostCountUpdate]);

  // Refresh post stats when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchPostStats();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchPostStats]);

  // Fetch recent posts on mount and when API URL changes
  useEffect(() => {
    fetchRecentPosts();
  }, [fetchRecentPosts]);

  // Refresh recent posts when navigating to dashboard route
  useEffect(() => {
    if (pathname === "/dashboard") {
      fetchRecentPosts();
    }
  }, [pathname, fetchRecentPosts]);

  // Refresh recent posts when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchRecentPosts();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchRecentPosts]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      const token = requireToken();
      if (!token) {
        setAnalytics(prev => ({ ...prev, loading: false }));
        return;
      }

      setAnalytics(prev => ({ ...prev, loading: true }));

      const headers = { Authorization: `Bearer ${token}` };

      const [engagementRes, trendRes, platformRes, postRes, insightsRes] = await Promise.allSettled([
        fetch(`${apiUrl}/analytics/engagement-summary`, { headers }),
        fetch(`${apiUrl}/analytics/monthly-trend`, { headers }),
        fetch(`${apiUrl}/analytics/top-platform`, { headers }),
        fetch(`${apiUrl}/analytics/top-post`, { headers }),
        fetch(`${apiUrl}/analytics/insights`, { headers }),
      ]);

      const engagementData = engagementRes.status === 'fulfilled' && engagementRes.value.ok 
        ? await engagementRes.value.json() 
        : { engagementRate: 0 };

      const trendData = trendRes.status === 'fulfilled' && trendRes.value.ok 
        ? await trendRes.value.json() 
        : [];

      const platformData = platformRes.status === 'fulfilled' && platformRes.value.ok 
        ? await platformRes.value.json() 
        : null;

      const postData = postRes.status === 'fulfilled' && postRes.value.ok 
        ? await postRes.value.json() 
        : null;

      const insightsData = insightsRes.status === 'fulfilled' && insightsRes.value.ok 
        ? await insightsRes.value.json() 
        : { insights: '' };

      setAnalytics({
        engagementRate: engagementData.engagementRate || 0,
        monthlyTrend: trendData,
        topPlatform: platformData?.platform || null,
        topPost: postData,
        insights: insightsData.insights || 'No insights available yet. Publish posts to see analytics.',
        loading: false,
        lastSynced: new Date(),
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(prev => ({ ...prev, loading: false }));
    }
  }, [apiUrl, requireToken]);

  // Fetch analytics on mount
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Refresh analytics when navigating to dashboard
  useEffect(() => {
    if (pathname === "/dashboard") {
      fetchAnalytics();
    }
  }, [pathname, fetchAnalytics]);

  const EnhancedPostsStatBlock = ({ postStats, loading, icon: Icon, color }) => (
    <GlassCard className="flex flex-col justify-between h-full min-h-[160px]">
      <div className="flex items-start justify-between w-full gap-3">
        <p className="text-xs sm:text-sm text-gray-400 max-w-[70%] break-words">
          Total Posts Generated
        </p>
        <div
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 flex-shrink-0"
          style={{ color }}
        >
          <Icon size={18} className="sm:w-5 sm:h-5" />
        </div>
      </div>
      
      {/* Main lifetime count */}
      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mt-3">
        {loading ? "—" : postStats.lifetime.toLocaleString()}
      </h3>
      
      {/* Three metrics breakdown */}
      <div className="mt-4 space-y-2">
        {/* Monthly Overall */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">This Month:</span>
          <span className="text-white font-medium">
            {loading ? "—" : postStats.monthlyOverall}
          </span>
        </div>
        
        {/* Current Plan Usage */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Current Plan:</span>
          <span className="text-white font-medium">
            {loading ? "—" : postStats.currentPlan.hasLimit 
              ? `${postStats.currentPlan.used}/${postStats.currentPlan.limit}`
              : postStats.currentPlan.planName === 'Free' ? 'No Limit' : '—'
            }
          </span>
        </div>
        
        {/* Progress bar for current plan (if has limit) */}
        {!loading && postStats.currentPlan.hasLimit && (
          <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
            <div 
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((postStats.currentPlan.used / Math.max(postStats.currentPlan.limit, 1)) * 100, 100)}%`,
                backgroundColor: postStats.currentPlan.used >= postStats.currentPlan.limit ? '#ef4444' : color
              }}
            />
          </div>
        )}
      </div>
      
      <p className="text-[11px] sm:text-xs text-gray-500 mt-auto pt-3">
        All-time count from AI
      </p>
    </GlassCard>
  );

  const StatBlock = ({ title, value, icon: Icon, color, subtitle }) => (
    <GlassCard className="flex flex-col justify-between h-full min-h-[120px]">
      <div className="flex items-start justify-between w-full gap-3">
        <p className="text-xs sm:text-sm text-gray-400 max-w-[70%] break-words">
          {title}
        </p>
        <div
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 flex-shrink-0"
          style={{ color }}
        >
          <Icon size={18} className="sm:w-5 sm:h-5" />
        </div>
      </div>
      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mt-3">
        {value}
      </h3>
      <p className="text-[11px] sm:text-xs text-gray-500 mt-auto pt-3">
        {subtitle}
      </p>
    </GlassCard>
  );

  const ConnectedPlatformsList = ({ platforms }) => {
    const hasDisconnected = platforms.some((p) => p.status !== "Active");
    return (
      <div className="space-y-4">
        {platforms.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.name}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              <div className="flex items-center min-w-0">
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full mr-3 flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  <Icon size={16} className="sm:w-5 sm:h-5" />
                </div>
                <span className="font-medium text-gray-200 text-sm truncate">
                  {p.name}
                </span>
              </div>
              <span
                className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${
                  p.status === "Active"
                    ? "bg-green-600/30 text-green-300"
                    : "bg-red-600/30 text-red-300"
                }`}
              >
                {loadingPlatforms ? "..." : p.status}
              </span>
            </div>
          );
        })}
        {hasDisconnected && !loadingPlatforms && (
          <Link href="/connectplatform" className="block mt-4">
            <GradientButton className="hidden sm:inline-flex w-full">
              <Plus size={14} />
              Link Account
            </GradientButton>
          </Link>
        )}
      </div>
    );
  };

  const RecentPostsHistory = ({ posts, loading }) => {
    const router = useRouter();
    
    return (
      <div className="space-y-3">
        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-400 text-sm">Loading recent posts…</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-400 text-sm">No posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              onClick={() => router.push(`/post?id=${encodeURIComponent(post.id)}`)}
              className="flex gap-3 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-all group"
            >
              {/* Post Thumbnail */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-black/40 flex-shrink-0">
                {post.image ? (
                  <img
                    src={post.image}
                    alt="Post thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                    No image
                  </div>
                )}
              </div>

              {/* Post Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-sm font-medium text-gray-200 line-clamp-2 leading-tight group-hover:text-white transition-colors">
                  {post.title}
                </p>
                {post.createdAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 lg:mb-8">
        <Link href="/recentpost" style={{ textDecoration: "none" }}>
          <EnhancedPostsStatBlock
            postStats={postStats}
            loading={loadingCounts}
            icon={Send}
            color={PRIMARY_ORANGE}
          />
        </Link>
        <StatBlock
          title="Avg. Engagement Rate"
          value={analytics.loading ? "—" : `${analytics.engagementRate}%`}
          icon={TrendingUp}
          color="#4DD0E1"
          subtitle="Average across all published posts"
        />
        <StatBlock
          title="Subscription Usage Cost (dummy)"
          value={`Free`}
          icon={DollarSign}
          color="#FF5252"
          subtitle="Current month's estimated cost"
        />
        <StatBlock
          title="Top Platform"
          value={analytics.loading ? "—" : (analytics.topPlatform || "N/A")}
          icon={Instagram}
          color="#F06292"
          subtitle="Highest engagement rate"
        />
      </div>

      {/* Create Content Placeholder Bar */}
      <div className="mb-6 lg:mb-8">
        <Link
          href={isLimitReached ? "#" : "/generatepost"}
          className={isLimitReached ? "pointer-events-none opacity-50" : ""}
        >
          <GlassCard className="flex items-center py-4 px-5 gap-4 cursor-pointer group hover:bg-white/5 transition-all duration-300 border border-white/10 hover:border-orange-500/30">
            {/* 1. Avatar Icon (Left) */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-orange-400/20 to-pink-500/20 border border-white/10 flex items-center justify-center flex-shrink-0 p-1.5">
              <Sparkles size={20} className="text-orange-400" />
            </div>

            {/* 2. The "Input Pill" Container (Middle) */}
            {/* This div creates the 'placeholder' background behind the text */}
            <div className="flex-grow h-11 bg-white/5 border border-white/5 rounded-full flex items-center px-5 group-hover:bg-white/10 transition-all duration-300">
              <span className="text-gray-400 text-sm font-medium group-hover:text-gray-200 transition-colors truncate">
                Let's create something for your business...
              </span>
            </div>

            {/* 3. Action Button (Right) */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-lg transition-all duration-300">
              <ArrowRight size={20} />
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Main Graphs and Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Engagement Graph */}
        <div className="lg:col-span-2 min-w-0">
          {/* CHANGED: h-auto -> h-full to stretch height */}
          <GlassCard className="h-full">
            <h3 className="text-lg sm:text-xl font-bold mb-8 border-b border-white/10 pb-5">
              Monthly Engagement Trend
            </h3>
            {analytics.loading ? (
              <div className="flex items-center justify-center h-48">
                <p className="text-gray-400 text-sm">Loading analytics...</p>
              </div>
            ) : analytics.monthlyTrend.length > 0 ? (
              <>
                <LineGraph
                  data={analytics.monthlyTrend}
                  color="#38B2AC"
                  label="Engagements"
                />
                <p className="text-[11px] sm:text-xs text-gray-500 mt-2 text-right">
                  Last {analytics.monthlyTrend.length} Months
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center h-48">
                <p className="text-gray-400 text-sm">No engagement data available</p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Connected Platforms */}
        <div className="min-w-0">
          {/* ADDED: className="h-full" to match the graph's height */}
          <GlassCard className="h-full">
            <h3 className="text-lg sm:text-xl font-bold mb-4 border-b border-white/10 pb-2">
              Platform Status
            </h3>
            <ConnectedPlatformsList platforms={platforms} />
          </GlassCard>
        </div>

        {/* AI Insight */}
        <div className="lg:col-span-1 min-w-0">
          {/* CHANGED: Removed 'h-auto md:h-48', added 'h-full' to stretch to bottom */}
          <GlassCard className="h-full flex flex-col">
            <h3 className="text-lg sm:text-xl font-bold mb-4 border-b border-white/10 pb-2">
              AI Content Insights
            </h3>
            <div className="flex items-start flex-grow">
              <Cpu
                size={22}
                className="text-orange-400 mr-3 flex-shrink-0 mt-0.5"
              />
              {analytics.loading ? (
                <p className="text-sm text-gray-400 italic">Loading insights...</p>
              ) : (
                <p className="text-sm text-gray-300 italic leading-relaxed">
                  "{analytics.insights}"
                </p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Recent Posts History */}
        <div className="lg:col-span-1 min-w-0">
          <GlassCard className="h-full flex flex-col">
            <h3 className="text-lg sm:text-xl font-bold mb-4 border-b border-white/10 pb-2">
              Recent Posts
            </h3>
            <RecentPostsHistory posts={recentPosts} loading={loadingRecentPosts} />
          </GlassCard>
        </div>

        {/* Top Post and Billing Graph */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
          {/* CHANGED: Added 'h-full' */}
          <GlassCard className="h-full">
            <h3 className="text-lg sm:text-xl font-bold mb-4 border-b border-white/10 pb-2">
              Top Engaging Post
            </h3>
            {analytics.loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : analytics.topPost ? (
              <>
                <p className="text-gray-400 text-xs sm:text-sm mb-2">
                  Platform:{" "}
                  <span className="font-semibold text-white">
                    {analytics.topPost.platform}
                  </span>
                </p>
                <p className="text-gray-300 italic text-sm line-clamp-3">
                  "{analytics.topPost.content}"
                </p>
                <div className="mt-3 space-y-1">
                  <p className="text-xs sm:text-sm text-gray-400">
                    Engagements:{" "}
                    <span className="text-lg font-bold text-green-400">
                      {analytics.topPost.totalEngagements}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Engagement Rate: {analytics.topPost.engagementRate}%
                  </p>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm">No post data available</p>
            )}
          </GlassCard>

          {/* CHANGED: Added 'h-full' */}
          <GlassCard className="h-full">
            <h3 className="text-lg sm:text-xl font-bold mb-4 border-b border-white/10 pb-2">
              Subscription Cost Trend (dummy)
            </h3>
            <LineGraph
              data={dashboardData.paymentGraph}
              color="#FF5252"
              label="Cost ($)"
              maxValue={150}
            />
            <p className="text-[11px] sm:text-xs text-gray-500 mt-2 text-right">
              Last 6 Months Billing
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
