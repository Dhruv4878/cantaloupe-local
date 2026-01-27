"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Edit,
  RefreshCw,
  Trash2,
  Plus,
  ChevronDown,
} from "lucide-react";
import GradientButton from "../GradientButton";
import UnusualActivityModal from "../UnusualActivityModal";
import UpgradeModal from "../UpgradeModal";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";

// --- Shared UI (Glass + Gradient) --- //
const GlassCard = ({ children, className = "" }) => (
  <div
    className={`p-6 rounded-2xl relative text-white ${className}`}
    style={{
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.4)",
    }}
  >
    {children}
  </div>
);

// --- Helper Components --- //
const platformIcons = {
  instagram: <Instagram size={16} />,
  facebook: <Facebook size={16} />,
  linkedin: <Linkedin size={16} />,
  x: <Twitter size={16} />,
};

// --- Helper Button (Orange) --- //
const OrangeButton = ({
  children,
  className = "",
  disabled,
  onClick,
  type = "button",
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`relative inline-flex items-center justify-center font-medium transition-all duration-200 
      ${
        disabled
          ? "opacity-50 cursor-not-allowed bg-gray-600"
          : "hover:scale-[1.02] active:scale-95"
      }
      bg-gradient-to-r from-orange-500 to-amber-500 text-white ${className}`}
  >
    {children}
  </button>
);

const PostEditor = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isFeatureAvailable, getPlanName } = useFeatureAccess();
  
  const [generatedData, setGeneratedData] = useState(null);
  const [postId, setPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [editedHashtags, setEditedHashtags] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);
  const imageRetryCountRef = useRef(0);
  const [isRegenerateMenuOpen, setIsRegenerateMenuOpen] = useState(false);
  const [regenerateOptions, setRegenerateOptions] = useState({
    text: false,
    hashtags: false,
    image: false,
    post: false,
  });
  const [applyToAllPlatforms, setApplyToAllPlatforms] = useState(false);
  const [isAddPlatformsOpen, setIsAddPlatformsOpen] = useState(false);
  const [captionLoading, setCaptionLoading] = useState(false);
  const [hashtagsLoading, setHashtagsLoading] = useState(false);

  // TOAST STATE (Message + Type)
  const [toastState, setToastState] = useState({ message: "", type: "" });

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Unusual Activity Modal State
  const [showUnusualActivityModal, setShowUnusualActivityModal] = useState(false);
  
  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Plan status cache to avoid repeated API calls
  const [planStatusCache, setPlanStatusCache] = useState(null);
  const [planStatusChecked, setPlanStatusChecked] = useState(false);

  // NEW STATE: Schedule for all connected platforms
  const [scheduleAll, setScheduleAll] = useState(false);

  const [addPlatformsSelection, setAddPlatformsSelection] = useState({});
  const [addPlatformsLoading, setAddPlatformsLoading] = useState(false);
  const regenerateMenuContainerRef = useRef(null);
  const addPlatformsContainerRef = useRef(null);

  const uiDisabled =
    imageGenerating ||
    addPlatformsLoading ||
    captionLoading ||
    hashtagsLoading ||
    isScheduling;

  // --- Helper: Handle API Response with Suspended Plan Check ---
  const handleApiResponse = async (response, errorMessage = "API call failed") => {
    if (!response.ok) {
      // Check for suspended plan error first
      if (response.status === 403) {
        try {
          const errorData = await response.json();
          if (errorData.suspendedPlan) {
            setShowUnusualActivityModal(true);
            return null; // Return null to indicate suspended plan
          }
        } catch (parseError) {
          // Continue with normal error handling if JSON parsing fails
        }
      }
      
      // Handle other errors
      let errorMsg = errorMessage;
      try {
        const errData = await response.json();
        errorMsg = errData.error || errData.message || errData.detail || errorMessage;
      } catch (e) {
        errorMsg = await response.text() || errorMessage;
      }
      throw new Error(errorMsg);
    }
    
    return response.json();
  };

  // --- Helper: Show Toast ---
  const showToast = (message, type = "success") => {
    setToastState({ message, type });
    setTimeout(() => {
      setToastState({ message: "", type: "" });
    }, 3500);
  };

  useEffect(() => {
    function handleDocClick(e) {
      try {
        const regNode = regenerateMenuContainerRef.current;
        const addNode = addPlatformsContainerRef.current;
        const clickedInsideReg = regNode && regNode.contains(e.target);
        const clickedInsideAdd = addNode && addNode.contains(e.target);
        if (!clickedInsideReg) setIsRegenerateMenuOpen(false);
        if (!clickedInsideAdd) setIsAddPlatformsOpen(false);
      } catch (_) {}
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  const toggleRegenerateOption = (key) => {
    setRegenerateOptions((prev) => {
      if (key === "post") {
        const nextPost = !prev.post;
        return nextPost
          ? { text: false, hashtags: false, image: false, post: true }
          : { ...prev, post: false };
      }
      if (prev.post) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  // Check if user's plan is suspended (cached version)
  const checkPlanStatus = async (forceRefresh = false) => {
    try {
      // Use cached result if available and not forcing refresh
      if (planStatusCache !== null && planStatusChecked && !forceRefresh) {
        if (!planStatusCache) {
          setShowUnusualActivityModal(true);
        }
        return planStatusCache;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const token = typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null;
      
      if (!token) {
        setPlanStatusCache(false);
        setPlanStatusChecked(true);
        return false;
      }

      const response = await fetch(`${apiUrl}/subscription/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Plan status check:", data);
        
        // Check if user has a paid subscription that's been suspended by admin
        const hasActiveSubscription = data?.plan?.planName && data.plan.planName !== "Free";
        const isSubscriptionActive = data?.subscription?.is_active;
        
        // If user has a paid plan but it's been deactivated by admin, show unusual activity modal
        if (hasActiveSubscription && isSubscriptionActive === false) {
          console.log("Plan suspended by admin - showing unusual activity modal");
          setPlanStatusCache(false);
          setPlanStatusChecked(true);
          setShowUnusualActivityModal(true);
          return false; // Plan is suspended
        }
      }
      
      setPlanStatusCache(true);
      setPlanStatusChecked(true);
      return true; // Plan is active or user is on free plan
    } catch (error) {
      console.error("Error checking plan status:", error);
      setPlanStatusCache(true);
      setPlanStatusChecked(true);
      return true; // Allow on error to avoid blocking legitimate users
    }
  };

  const canNavigateToGenerate = () => {
    try {
      if (typeof window === "undefined") return true;
      const used =
        parseInt(sessionStorage.getItem("usedPosts") || "0", 10) || 0;
      const limit = Number(sessionStorage.getItem("creditLimit") || "0");
      return used < limit;
    } catch (_) {
      return true;
    }
  };

  const handleRegeneratePost = async () => {
    const planActive = await checkPlanStatus();
    if (!planActive) return; // Modal will be shown by checkPlanStatus
    
    if (!canNavigateToGenerate()) return;
    router.push("/generate");
  };

  const handleRegenerateSelected = async () => {
    if (!generatedData || !activeTab) return;
    
    // Check plan status before allowing regeneration
    const planActive = await checkPlanStatus();
    if (!planActive) return; // Modal will be shown by checkPlanStatus
    
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("authToken")
        : null;
    if (!token) return;

    try {
      if (regenerateOptions.post) {
        await handleRegeneratePost();
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      let updated = {
        ...generatedData,
        platforms: { ...generatedData.platforms },
      };
      const allPlatformKeys = Object.keys(updated.platforms || {});
      const targetPlatforms = applyToAllPlatforms
        ? allPlatformKeys
        : [activeTab];

      const promises = [];
      let captionsResult = null;

      if (regenerateOptions.text) {
        setCaptionLoading(true);
        const body = JSON.stringify({
          postContent: generatedData.postContent,
          platforms: targetPlatforms,
        });
        const p = fetch(`${apiUrl}/regenerate-captions`, {
          method: "POST",
          headers,
          body,
        })
          .then(async (res) => {
            const json = await handleApiResponse(res, "Failed to regenerate captions");
            if (json === null) {
              // Plan is suspended, modal will be shown
              captionsResult = null;
              return;
            }
            captionsResult = json;
          })
          .catch(() => {
            captionsResult = null;
          });
        promises.push(p);
      }

      const hashtagResults = {};
      if (regenerateOptions.hashtags) {
        setHashtagsLoading(true);
        for (const p of targetPlatforms) {
          const baseCaption = (
            generatedData.platforms?.[p]?.caption ||
            generatedData.postContent ||
            ""
          ).toString();
          const body = JSON.stringify({ platforms: [p], caption: baseCaption });
          const hp = fetch(`${apiUrl}/regenerate-hashtags`, {
            method: "POST",
            headers,
            body,
          })
            .then(async (res) => {
              const json = await handleApiResponse(res, "Failed to regenerate hashtags");
              if (json === null) {
                // Plan is suspended, modal will be shown
                hashtagResults[p] = null;
                return;
              }
              hashtagResults[p] = json?.platforms?.[p]?.hashtags || null;
            })
            .catch(() => {
              hashtagResults[p] = null;
            });
          promises.push(hp);
        }
      }

      if (promises.length) {
        await Promise.all(promises);
      }

      if (captionsResult && captionsResult.platforms) {
        for (const p of targetPlatforms) {
          const newCaption = captionsResult?.platforms?.[p]?.caption;
          const newHashtagsFromCaption =
            captionsResult?.platforms?.[p]?.hashtags;
          if (!updated.platforms[p]) updated.platforms[p] = {};
          if (newCaption) updated.platforms[p].caption = newCaption;
          if (
            !regenerateOptions.hashtags &&
            Array.isArray(newHashtagsFromCaption)
          ) {
            updated.platforms[p].hashtags = newHashtagsFromCaption;
          }
        }
      }

      if (regenerateOptions.hashtags) {
        for (const p of targetPlatforms) {
          const newTags = hashtagResults[p];
          if (!updated.platforms[p]) updated.platforms[p] = {};
          if (Array.isArray(newTags)) updated.platforms[p].hashtags = newTags;
        }
      }

      setCaptionLoading(false);
      setHashtagsLoading(false);

      if (regenerateOptions.image) {
        setImageGenerating(true);
        const currentVariantCount = Array.isArray(generatedData.imageVariants)
          ? generatedData.imageVariants.length
          : 0;
        if (currentVariantCount >= 3) {
          setImageGenerating(false);
          if (typeof window !== "undefined") {
            window.alert(
              "Enough images generated. Please create a new post to generate more."
            );
          }
        } else {
          const existingVariants = Array.isArray(updated.imageVariants)
            ? updated.imageVariants
            : [];
          const previousImageUrl = updated.imageUrl;
          if (previousImageUrl && existingVariants.length === 0) {
            updated.imageVariants = [...existingVariants, previousImageUrl];
            if (postId) {
              await fetch(`${apiUrl}/posts/${postId}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({
                  content: updated,
                  imageUrlVariant: previousImageUrl,
                }),
              });
            }
          }

          const res = await fetch(`${apiUrl}/generate-image`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              aiImagePrompt: generatedData.aiImagePrompt,
            }),
          });
          
          const json = await handleApiResponse(res, "Failed to regenerate image");
          if (json === null) {
            // Plan is suspended, modal will be shown
            setImageGenerating(false);
            return;
          }
          
          if (json?.imageUrl) {
            updated.imageUrl = json.imageUrl;
            const existing = Array.isArray(updated.imageVariants)
              ? updated.imageVariants
              : [];
            updated.imageVariants = [...existing, json.imageUrl];
            if (postId) {
              await fetch(`${apiUrl}/posts/${postId}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({
                  content: updated,
                  imageUrlVariant: json.imageUrl,
                }),
              });
            }
          }
        }
        setImageGenerating(false);
      }

      if (postId && !regenerateOptions.image) {
        await fetch(`${apiUrl}/posts/${postId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ content: updated }),
        });
      }
      setGeneratedData(updated);
    } finally {
      setIsRegenerateMenuOpen(false);
      setRegenerateOptions({
        text: false,
        hashtags: false,
        image: false,
        post: false,
      });
    }
  };

  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const mapUiToBackendPlatform = (uiKey) => (uiKey === "x" ? "twitter" : uiKey);

  // --- HANDLE PUBLISH (With Red Toast on Error) ---
  const handlePublishNow = async () => {
    try {
      if (!postId || !activeTab) return;
      setIsPosting(true);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const token =
        typeof window !== "undefined"
          ? sessionStorage.getItem("authToken")
          : null;
      if (!token) {
        showToast("Please login again.", "error");
        router.push("/login");
        return;
      }

      const platformToSend = mapUiToBackendPlatform(activeTab);

      if (
        !["facebook", "instagram", "linkedin", "twitter"].includes(
          platformToSend
        )
      ) {
        showToast(`Posting to ${activeTab} is not supported yet.`, "error");
        setIsPosting(false);
        return;
      }

      const resp = await fetch(`${apiUrl}/social/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, platform: platformToSend }),
      });

      // Handle Errors
      if (!resp.ok) {
        let errorMessage = "Unknown error";
        try {
          const errData = await resp.json();
          errorMessage =
            errData.error ||
            errData.message ||
            errData.detail ||
            "Request failed";
        } catch (e) {
          errorMessage = await resp.text();
        }
        throw new Error(errorMessage);
      }

      // Success
      showToast(
        `Posted to ${
          activeTab === "x" ? "X (Twitter)" : activeTab
        } successfully`,
        "success"
      );
    } catch (e) {
      console.error(e);
      // RED TOAST FOR ERROR
      showToast(`Failed to post to ${activeTab}: ${e.message}`, "error");
    } finally {
      setIsPosting(false);
    }
  };

  // --- UPDATED: HANDLE SCHEDULE (Supports 'All Connected') ---
  const handleSchedulePost = async () => {
    if (!scheduleDate || !scheduleTime) {
      showToast("Please choose both date and time to schedule.", "error");
      return;
    }

    try {
      setIsScheduling(true);
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const token =
        typeof window !== "undefined"
          ? sessionStorage.getItem("authToken")
          : null;
      if (!token) {
        showToast("Please login again.", "error");
        router.push("/login");
        return;
      }
      if (!postId || !activeTab) {
        showToast("Missing post or platform to schedule.", "error");
        return;
      }

      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      if (Number.isNaN(scheduledAt.getTime())) {
        showToast("Invalid date/time", "error");
        return;
      }
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      // 1. DETERMINE TARGET PLATFORMS
      let targetPlatforms = [];

      if (scheduleAll) {
        // Fetch profile to find ALL connected platforms
        const profResp = await fetch(`${apiUrl}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!profResp.ok) throw new Error("Failed to fetch connected accounts");
        const profile = await profResp.json();

        if (
          profile?.social?.facebook?.pageId &&
          profile?.social?.facebook?.accessToken
        )
          targetPlatforms.push("facebook");
        if (
          profile?.social?.instagram?.igBusinessId &&
          profile?.social?.instagram?.accessToken
        )
          targetPlatforms.push("instagram");
        if (
          profile?.social?.linkedin?.memberId &&
          profile?.social?.linkedin?.accessToken
        )
          targetPlatforms.push("linkedin");
        if (
          profile?.social?.twitter?.userId &&
          profile?.social?.twitter?.accessToken
        )
          targetPlatforms.push("twitter");

        if (targetPlatforms.length === 0) {
          showToast("No connected platforms found to schedule.", "error");
          setIsScheduling(false);
          return;
        }
      } else {
        // Just the current active tab
        targetPlatforms = [mapUiToBackendPlatform(activeTab)];
      }

      // 2. GET EXISTING SCHEDULE
      const existingResp = await fetch(`${apiUrl}/posts/${postId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!existingResp.ok) {
        throw new Error("Unable to load post for scheduling");
      }
      const existingPost = await existingResp.json();
      const existingSchedule = existingPost?.schedule || {};
      let existingEntries = Array.isArray(existingSchedule.entries)
        ? existingSchedule.entries
        : [];

      // 3. MERGE / UPSERT ENTRIES
      // We start with existing entries...
      let mergedEntries = [...existingEntries];

      targetPlatforms.forEach((p) => {
        // Remove any conflict for this specific platform & time (overwrite logic)
        mergedEntries = mergedEntries.filter(
          (e) =>
            !(
              e.platform === p &&
              new Date(e.scheduledAt).getTime() === scheduledAt.getTime()
            )
        );

        // Add new entry
        mergedEntries.push({
          platform: p,
          scheduledAt,
          status: "pending",
          timezone,
        });
      });

      const schedulePayload = {
        timezone: existingSchedule.timezone || timezone,
        entries: mergedEntries,
      };

      // 4. SEND UPDATE
      const updateResp = await fetch(`${apiUrl}/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schedule: schedulePayload }),
      });

      if (!updateResp.ok) {
        const txt = await updateResp.text();
        throw new Error(txt || "Failed to save schedule");
      }

      const msg = scheduleAll
        ? `Scheduled for all ${
            targetPlatforms.length
          } connected platforms at ${scheduledAt.toLocaleString()}`
        : `Scheduled ${
            activeTab === "x" ? "X (Twitter)" : activeTab
          } for ${scheduledAt.toLocaleString()}`;

      showToast(msg, "success");
      setIsScheduleOpen(false);
    } catch (e) {
      console.error(e);
      showToast(e.message || "Failed to schedule post.", "error");
    } finally {
      setIsScheduling(false);
    }
  };

  const handlePublishAllConnected = async () => {
    try {
      if (!postId) return;
      setIsPosting(true);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const token =
        typeof window !== "undefined"
          ? sessionStorage.getItem("authToken")
          : null;
      if (!token) {
        showToast("Please login again.", "error");
        router.push("/login");
        return;
      }

      const profResp = await fetch(`${apiUrl}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profResp.ok) throw new Error("Failed to read profile");
      const profile = await profResp.json();

      const targets = [];
      if (
        profile?.social?.facebook?.pageId &&
        profile?.social?.facebook?.accessToken
      )
        targets.push("facebook");
      if (
        profile?.social?.instagram?.igBusinessId &&
        profile?.social?.instagram?.accessToken
      )
        targets.push("instagram");
      if (
        profile?.social?.linkedin?.memberId &&
        profile?.social?.linkedin?.accessToken
      )
        targets.push("linkedin");
      if (
        profile?.social?.twitter?.userId &&
        profile?.social?.twitter?.accessToken
      )
        targets.push("twitter");

      if (!targets.length) {
        showToast("No connected platforms found", "error");
        return;
      }

      let failed = [];
      let succeeded = [];

      for (const p of targets) {
        try {
          const resp = await fetch(`${apiUrl}/social/post`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ postId, platform: p }),
          });

          if (!resp.ok) {
            const txt = await resp.text();
            failed.push(p);
            console.error(`Failed to post to ${p}:`, txt);
          } else {
            succeeded.push(p);
          }
        } catch (err) {
          failed.push(p);
          console.error(`Network error for ${p}`, err);
        }
      }

      if (failed.length > 0) {
        if (succeeded.length === 0) {
          showToast("Failed to post to any platform.", "error");
        } else {
          showToast(
            `Posted to ${succeeded.length} platforms. Failed: ${failed.join(
              ", "
            )}`,
            "error"
          );
        }
      } else {
        showToast("Posted to all connected platforms!", "success");
      }
    } catch (e) {
      console.error(e);
      showToast(e.message || "Failed to post to all platforms", "error");
    } finally {
      setIsPostMenuOpen(false);
      setIsPosting(false);
    }
  };

  useEffect(() => {
    const loadFromDb = async () => {
      setLoading(true);
      const id = searchParams.get("id");
      setPostId(id);

      if (!id) {
        setError("No post ID provided. Please select a post to view.");
        setLoading(false);
        return;
      }

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const token =
          typeof window !== "undefined"
            ? sessionStorage.getItem("authToken")
            : null;

        if (!token) {
          setError("Your session has ended. Please log in again.");
          setLoading(false);
          router.push("/login");
          return;
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const res = await fetch(`${apiUrl}/posts/${id}`, { headers });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setError("Session expired. Please log in again.");
            setLoading(false);
            router.push("/login");
            return;
          }
          const text = await res.text();
          throw new Error(`Failed to load post (${res.status}) ${text}`);
        }

        const post = await res.json();
        const content = post?.content;

        if (!content) {
          setError("Post record is missing content");
          setLoading(false);
          return;
        }

        setGeneratedData(content);
        const platforms = Object.keys(content.platforms || {});
        if (platforms.length > 0) setActiveTab((prev) => prev || platforms[0]);
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to load post");
      } finally {
        setLoading(false);
      }
    };
    loadFromDb();
  }, [searchParams, router]);

  // Check plan status on component load
  useEffect(() => {
    const initialPlanCheck = async () => {
      await checkPlanStatus(true); // Force refresh on initial load
    };
    
    initialPlanCheck();
  }, []);

  // Simple debug logging
  useEffect(() => {
    console.log("imageGenerating:", imageGenerating);
  }, [imageGenerating]);

  useEffect(() => {
    const generateIfMissing = async () => {
      // Simple checks - if we already have an image or are generating, skip
      if (!generatedData || generatedData.imageUrl || imageGenerating) {
        return;
      }
      
      const aiImagePrompt = generatedData.aiImagePrompt;
      if (!aiImagePrompt) return;
      
      // Prevent infinite loops - max 3 retries
      if (imageRetryCountRef.current >= 3) {
        console.log("Max image generation retries reached");
        return;
      }
      
      try {
        setImageGenerating(true);
        imageRetryCountRef.current += 1;
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const token = sessionStorage.getItem("authToken");
        
        if (!token) {
          setImageGenerating(false);
          return;
        }

        console.log(`Generating image (attempt ${imageRetryCountRef.current}/3)`);

        const requestBody = {
          aiImagePrompt,
          ...(generatedData.userLogoUrl && { userLogoUrl: generatedData.userLogoUrl }),
        };

        const resp = await fetch(`${apiUrl}/generate-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
        
        const data = await handleApiResponse(resp, "Failed to generate image");
        if (data === null) {
          // Plan is suspended, modal will be shown
          setImageGenerating(false);
          return;
        }
        
        if (!data?.imageUrl) {
          console.error("No image URL in response");
          setImageGenerating(false);
          return;
        }
        
        console.log("Image generated successfully:", data.imageUrl);
        
        // Update state immediately
        setGeneratedData(prev => ({ ...prev, imageUrl: data.imageUrl }));
        setImageGenerating(false);
        imageRetryCountRef.current = 0;
        
        // Update database in background (don't wait for it)
        if (postId) {
          fetch(`${apiUrl}/posts/${postId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content: { ...generatedData, imageUrl: data.imageUrl } }),
          }).catch(err => console.error("Database update failed:", err));
        }
        
      } catch (error) {
        console.error("Image generation error:", error);
        setImageGenerating(false);
      }
    };
    
    generateIfMissing();
  }, [generatedData, postId]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        Loading post...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-[#050816] text-red-400 flex items-center justify-center">
        Error: {error}
      </div>
    );
  if (!generatedData || !generatedData.platforms)
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        No generated content found.
      </div>
    );

  const { imageUrl, platforms } = generatedData;
  const platformNames = Object.keys(platforms);
  const activeTabData = platforms[activeTab];

  if (!activeTabData) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        No content available for the selected platform.
      </div>
    );
  }

  const startEditing = () => {
    if (!activeTab) return;
    setEditedText(activeTabData?.caption || "");
    setEditedHashtags((activeTabData?.hashtags || []).join(" "));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const hasChanges =
    isEditing &&
    (editedText !== (activeTabData?.caption || "") ||
      editedHashtags.trim() !== (activeTabData?.hashtags || []).join(" "));

  const saveEdits = async () => {
    if (!hasChanges || !postId) return;
    setIsSaving(true);

    try {
      const updatedContent = { ...generatedData };
      if (!updatedContent.platforms[activeTab]) {
        updatedContent.platforms[activeTab] = {};
      }
      updatedContent.platforms[activeTab].caption = editedText;
      updatedContent.platforms[activeTab].hashtags = editedHashtags
        .split(/\s+/)
        .map((h) => h.trim())
        .filter(Boolean);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const token = sessionStorage.getItem("authToken");

      const response = await fetch(`${apiUrl}/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: updatedContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to save changes to the server.");
      }

      setGeneratedData(updatedContent);
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save post edits", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!postId || isDeleting) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post?"
    );
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const token =
        typeof window !== "undefined"
          ? sessionStorage.getItem("authToken")
          : null;
      if (!token) {
        setError("Your session has ended. Please log in again.");
        router.push("/login");
        return;
      }

      const res = await fetch(`${apiUrl}/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete post");
      }

      if (canNavigateToGenerate()) {
        router.push("/generate");
      }
    } catch (e) {
      console.error("Failed to delete post:", e);
      setError(e.message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDashboard = () => {
    router.push("/dashboard");
  };

  const handleRecentPost = () => {
    router.push("/recentpost");
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* MAIN EDITOR CARD */}
        <GlassCard className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-white/10 pb-4">
            <h1 className="text-2xl font-bold mb-2 sm:mb-0">Generated Post</h1>
            <div className="flex space-x-2 relative">
              {/* EDIT / CANCEL TOGGLE */}
              {!isEditing ? (
                <button
                  onClick={startEditing}
                  disabled={uiDisabled}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm border ${
                    uiDisabled
                      ? "bg-white/5 text-gray-500 border-white/10 cursor-not-allowed"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                  }`}
                >
                  <Edit size={14} />
                  <span>Edit Post</span>
                </button>
              ) : (
                <button
                  onClick={handleCancelEdit}
                  disabled={uiDisabled}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm border ${
                    uiDisabled
                      ? "bg-white/5 text-gray-500 border-white/10 cursor-not-allowed"
                      : "bg-transparent text-orange-300 border-orange-400 hover:bg-orange-500/10"
                  }`}
                >
                  <span>Cancel</span>
                </button>
              )}

              {/* Regenerate dropdown */}
              <div className="relative" ref={regenerateMenuContainerRef}>
                <GradientButton
                  type="button"
                  disabled={uiDisabled}
                  onClick={() =>
                    !uiDisabled && setIsRegenerateMenuOpen((v) => !v)
                  }
                  className="flex items-center gap-2 px-3 py-1.5 text-sm"
                >
                  <RefreshCw size={14} />
                  <span>Regenerate</span>
                  <ChevronDown size={14} />
                </GradientButton>

                {isRegenerateMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#0b1020] border border-white/10 rounded-xl shadow-lg z-30 text-sm text-gray-100">
                    <div className="p-2 font-medium border-b border-white/10">
                      Choose what to regenerate
                    </div>
                    <div className="p-2 space-y-1">
                      <label
                        className={`flex items-center gap-2 px-2 py-1 rounded ${
                          regenerateOptions.post
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-white/5 cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!regenerateOptions.text}
                          onChange={() => toggleRegenerateOption("text")}
                          className="h-4 w-4"
                          disabled={regenerateOptions.post || uiDisabled}
                        />
                        <span>Regenerate post text</span>
                      </label>
                      <label
                        className={`flex items-center gap-2 px-2 py-1 rounded ${
                          regenerateOptions.post
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-white/5 cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!regenerateOptions.hashtags}
                          onChange={() => toggleRegenerateOption("hashtags")}
                          className="h-4 w-4"
                          disabled={regenerateOptions.post || uiDisabled}
                        />
                        <span>Regenerate hashtags</span>
                      </label>
                      <label
                        className={`flex items-center gap-2 px-2 py-1 rounded ${
                          regenerateOptions.post
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-white/5 cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!regenerateOptions.image}
                          onChange={() => toggleRegenerateOption("image")}
                          className="h-4 w-4"
                          disabled={regenerateOptions.post || uiDisabled}
                        />
                        <span>Regenerate image</span>
                      </label>
                      <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!regenerateOptions.post}
                          onChange={() => toggleRegenerateOption("post")}
                          className="h-4 w-4"
                          disabled={uiDisabled}
                        />
                        <span>Regenerate post</span>
                      </label>
                    </div>
                    <div className="flex items-center justify-end gap-2 p-2 border-t border-white/10 bg-white/5">
                      <button
                        type="button"
                        onClick={() => setIsRegenerateMenuOpen(false)}
                        disabled={uiDisabled}
                        className={`px-3 py-1.5 text-xs rounded-full border ${
                          uiDisabled
                            ? "border-white/10 text-gray-500 cursor-not-allowed"
                            : "border-white/20 text-gray-100 hover:bg-white/5"
                        }`}
                      >
                        Close
                      </button>
                      <GradientButton
                        type="button"
                        onClick={handleRegenerateSelected}
                        disabled={uiDisabled}
                        className="px-3 py-1.5 text-xs"
                      >
                        Regenerate
                      </GradientButton>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main content grid */}
          <div className="mt-2 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* IMAGE COLUMN */}
            <div className="lg:col-span-7">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-white">Post Image</h2>
                {Array.isArray(generatedData.imageVariants) &&
                  generatedData.imageVariants.length > 0 && (
                    <div className="flex items-center gap-2">
                      {generatedData.imageVariants.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            !uiDisabled &&
                            setGeneratedData((prev) => ({
                              ...prev,
                              imageUrl: url,
                            }))
                          }
                          disabled={uiDisabled}
                          className={`px-2 py-1 text-xs rounded-full border ${
                            generatedData.imageUrl === url
                              ? "bg-indigo-500 text-white border-indigo-400"
                              : uiDisabled
                              ? "bg-white/5 text-gray-500 border-white/10 cursor-not-allowed"
                              : "bg-white/5 text-gray-100 border-white/20 hover:bg-white/10"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
              <div className="relative w-full rounded-2xl border border-white/15 bg-black/40 min-h-64 p-4 md:p-6">
                <div className="w-full h-full flex items-center justify-center">
                  {imageGenerating && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                      <div className="h-10 w-10 rounded-full border-4 border-gray-600 border-t-indigo-400 animate-spin" />
                    </div>
                  )}
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Generated Post"
                      className="max-w-full max-h-[480px] object-contain rounded-xl"
                    />
                  ) : !imageGenerating ? (
                    <div className="w-full flex flex-col items-center justify-center text-center">
                      <div className="text-gray-200 font-medium mb-4">
                        Generating image…
                      </div>
                      <div className="h-10 w-10 rounded-full border-4 border-gray-600 border-t-indigo-400 animate-spin" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* TEXT COLUMN */}
            <div className="lg:col-span-5 self-stretch h-full">
              {/* RESPONSIVE TABS (Grid 2x2 on Mobile, Flex on Desktop) */}
              <div className="mb-4 border-b border-white/10 pb-2">
                <nav className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {platformNames.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => !uiDisabled && setActiveTab(platform)}
                      disabled={uiDisabled}
                      className={`flex items-center justify-center sm:justify-start gap-2 py-2 px-2 border-b-2 font-medium capitalize transition-colors
                        ${
                          activeTab === platform
                            ? "border-orange-400 text-orange-300 bg-white/5 sm:bg-transparent rounded sm:rounded-none"
                            : uiDisabled
                            ? "border-transparent text-gray-500 cursor-not-allowed"
                            : "border-transparent text-gray-300 hover:text-white hover:bg-white/5 sm:hover:bg-transparent rounded sm:rounded-none"
                        }`}
                    >
                      {platformIcons[platform]}
                      <span className="text-sm">{platform}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Caption */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white">Post Text</h3>
                </div>
                {isEditing ? (
                  <textarea
                    className="w-full text-sm rounded-md border border-white/20 bg-black/40 text-white p-2 focus:outline-none focus:ring-1 focus:ring-orange-400"
                    rows={6}
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                  />
                ) : (
                  <div className="relative">
                    {captionLoading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                        <div className="h-6 w-6 rounded-full border-2 border-gray-500 border-t-indigo-400 animate-spin" />
                      </div>
                    )}
                    <p
                      className="text-gray-100 text-sm"
                      dangerouslySetInnerHTML={{
                        __html: (activeTabData?.caption || "").replace(
                          /\n/g,
                          "<br/>"
                        ),
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Hashtags */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <h3 className="font-medium text-white mb-2">
                  Suggested Hashtags for {activeTab}
                </h3>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full text-sm rounded-md border border-white/20 bg-black/40 text-white p-2 focus:outline-none focus:ring-1 focus:ring-orange-400"
                    value={editedHashtags}
                    onChange={(e) => setEditedHashtags(e.target.value)}
                    placeholder="#tag1 #tag2"
                  />
                ) : (
                  <div className="relative">
                    {hashtagsLoading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                        <div className="h-6 w-6 rounded-full border-2 border-gray-500 border-t-indigo-400 animate-spin" />
                      </div>
                    )}
                    <p className="text-orange-300 text-sm">
                      {(activeTabData.hashtags || []).join(" ")}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 space-y-3">
                {/* Post button + dropdown */}
                <div className="w-full">
                  <GradientButton
                    type="button"
                    onClick={() => setIsPostMenuOpen((v) => !v)}
                    disabled={uiDisabled}
                    className="w-full"
                  >
                    {isPosting ? (
                      <span className="flex items-center gap-2 justify-center">
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Posting...
                      </span>
                    ) : (
                      "Post"
                    )}
                  </GradientButton>

                  {isPostMenuOpen && (
                    <div className="mt-2 w-full bg-[#0b1020] border border-white/10 rounded-xl shadow-lg text-sm">
                      <div className="p-2 text-gray-100 font-medium border-b border-white/10">
                        Publish Options
                      </div>
                      <button
                        type="button"
                        onClick={handlePublishNow}
                        disabled={uiDisabled}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          uiDisabled
                            ? "text-gray-500 cursor-not-allowed"
                            : "hover:bg-white/5 text-gray-100"
                        }`}
                      >
                        Post to current platform ({activeTab || "—"})
                      </button>
                      <button
                        type="button"
                        onClick={handlePublishAllConnected}
                        disabled={uiDisabled}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          uiDisabled
                            ? "text-gray-500 cursor-not-allowed"
                            : "hover:bg-white/5 text-gray-100"
                        }`}
                      >
                        Post to all connected platforms
                      </button>
                      <div className="flex items-center justify-end gap-2 p-2 border-t border-white/10 bg-white/5">
                        <button
                          type="button"
                          onClick={() => setIsPostMenuOpen(false)}
                          className="px-3 py-1.5 text-xs rounded-full border border-white/20 text-gray-100 hover:bg-white/5"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Toggle schedule panel */}
                <button
                  type="button"
                  onClick={() => {
                    // Check if user has smart scheduling feature
                    if (!isFeatureAvailable('smart_scheduling')) {
                      setShowUpgradeModal(true);
                      return;
                    }
                    setIsScheduleOpen((v) => !v);
                  }}
                  disabled={uiDisabled}
                  className={`w-full px-4 py-2 rounded-full text-sm font-medium border transition ${
                    uiDisabled
                      ? "bg-white/5 text-gray-500 border-white/10 cursor-not-allowed"
                      : isScheduleOpen
                      ? "bg-white/15 text-white border-white/30"
                      : "bg-transparent text-white border-white/30 hover:bg-white/10"
                  }`}
                >
                  {isScheduleOpen ? "Close Scheduling" : "Schedule Post"}
                </button>

                {/* Schedule UI */}
                {isScheduleOpen && (
                  <div className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 sm:px-5 sm:py-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm text-white/70 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-white/70 mb-1">
                          Time (24h)
                        </label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          step="900" // 15 min steps
                          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>
                    </div>

                    {/* NEW CHECKBOX FOR "ALL PLATFORMS" */}
                    <label className="flex items-center gap-2 text-xs sm:text-sm text-white/80 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={scheduleAll}
                        onChange={(e) => setScheduleAll(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        disabled={uiDisabled}
                      />
                      <span>Schedule to all connected platforms</span>
                    </label>

                    <p className="text-[11px] sm:text-xs text-white/50">
                      Your post will be queued and automatically published at
                      the selected time.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsScheduleOpen(false);
                          setScheduleDate("");
                          setScheduleTime("");
                          setScheduleAll(false);
                        }}
                        className="w-full sm:w-auto px-4 py-2 rounded-full text-xs sm:text-sm border border-white/20 text-gray-100 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <GradientButton
                        type="button"
                        onClick={handleSchedulePost}
                        disabled={uiDisabled || isScheduling}
                        className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm"
                      >
                        {isScheduling ? "Scheduling..." : "Confirm Schedule"}
                      </GradientButton>
                    </div>
                  </div>
                )}

                {/* Save button when editing */}
                {isEditing && (
                  <GradientButton
                    type="button"
                    disabled={!hasChanges || isSaving || uiDisabled}
                    onClick={saveEdits}
                    className="w-full px-4 py-2 text-sm"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </GradientButton>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* SIDEBAR */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Selected Platforms */}
          <GlassCard>
            <h2 className="text-lg font-semibold mb-3 border-b border-white/10 pb-2">
              Selected Platforms
            </h2>
            <div className="space-y-2 text-sm">
              {platformNames && platformNames.length > 0 ? (
                platformNames.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-gray-100"
                  >
                    {platformIcons[name]}
                    <span className="capitalize">{name}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-300">No platforms selected</div>
              )}
            </div>

            {/* Add Platforms */}
            <div className="mt-4" ref={addPlatformsContainerRef}>
              <button
                type="button"
                onClick={() => !uiDisabled && setIsAddPlatformsOpen((v) => !v)}
                disabled={uiDisabled}
                className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm border ${
                  uiDisabled
                    ? "bg-white/5 text-gray-500 border-white/10 cursor-not-allowed"
                    : "bg-white/10 text-white hover:bg-white/20 border-white/20"
                }`}
              >
                <Plus size={14} />
                Add platforms
                <ChevronDown size={14} />
              </button>

              {/* DROPDOWN NOW FLOWS IN LAYOUT (NO ABSOLUTE) */}
              {isAddPlatformsOpen && (
                <div className="mt-2 w-full bg-[#0b1020] border border-white/10 rounded-xl shadow-lg z-0 text-sm">
                  <div className="p-2 text-gray-100 font-medium border-b border-white/10">
                    Add more platforms
                  </div>
                  <div className="p-2 space-y-1">
                    {["instagram", "x", "linkedin", "facebook"].map((p) => {
                      const alreadySelected = platformNames.includes(p);
                      return (
                        <label
                          key={p}
                          className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${
                            alreadySelected
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-white/5"
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={alreadySelected}
                            checked={
                              !!addPlatformsSelection[p] && !alreadySelected
                            }
                            onChange={() =>
                              !alreadySelected &&
                              setAddPlatformsSelection((prev) => ({
                                ...prev,
                                [p]: !prev[p],
                              }))
                            }
                            className="h-4 w-4"
                          />
                          <span className="flex items-center gap-2 capitalize text-gray-100">
                            {platformIcons[p]} {p}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-end gap-2 p-2 border-t border-white/10 bg-white/5">
                    <button
                      type="button"
                      onClick={() => setIsAddPlatformsOpen(false)}
                      disabled={uiDisabled}
                      className={`px-3 py-1.5 text-xs rounded-full border ${
                        uiDisabled
                          ? "border-white/10 text-gray-500 cursor-not-allowed"
                          : "border-white/20 text-gray-100 hover:bg-white/5"
                      }`}
                    >
                      Close
                    </button>
                    <OrangeButton
                      type="button"
                      onClick={async () => {
                        setAddPlatformsLoading(true);
                        const apiUrl =
                          process.env.NEXT_PUBLIC_API_URL ||
                          "http://localhost:5000/api";
                        const token =
                          typeof window !== "undefined"
                            ? sessionStorage.getItem("authToken")
                            : null;
                        const toAdd = Object.keys(addPlatformsSelection).filter(
                          (k) =>
                            addPlatformsSelection[k] &&
                            !platformNames.includes(k)
                        );
                        if (!token || !generatedData || toAdd.length === 0) {
                          setIsAddPlatformsOpen(false);
                          setAddPlatformsSelection({});
                          setAddPlatformsLoading(false);
                          return;
                        }
                        try {
                          const res = await fetch(
                            `${apiUrl}/create-text-plan`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({
                                brief: generatedData.postContent || "",
                                platforms: toAdd,
                              }),
                            }
                          );
                          if (res.ok) {
                            const data = await res.json();
                            const merged = {
                              ...generatedData,
                              platforms: {
                                ...(generatedData.platforms || {}),
                              },
                            };
                            Object.keys(data.platforms || {}).forEach((p) => {
                              merged.platforms[p] = data.platforms[p];
                            });
                            setGeneratedData(merged);
                            if (postId) {
                              await fetch(`${apiUrl}/posts/${postId}`, {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ content: merged }),
                              });
                            }
                            if (toAdd[0]) setActiveTab(toAdd[0]);
                          }
                        } catch (_) {}
                        setIsAddPlatformsOpen(false);
                        setAddPlatformsSelection({});
                        setAddPlatformsLoading(false);
                      }}
                      disabled={uiDisabled || addPlatformsLoading}
                      className="px-3 py-1.5 text-xs rounded-full"
                    >
                      {addPlatformsLoading ? "Adding..." : "Add"}
                    </OrangeButton>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Other Actions */}
          <GlassCard>
            <h2 className="text-lg font-semibold mb-3 border-b border-white/10 pb-2">
              Other Actions
            </h2>
            <div className="space-y-2 text-sm">
              {isEditing && (
                <button
                  onClick={handleCancelEdit}
                  className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-xl bg-white/5 text-gray-100 hover:bg-white/10"
                >
                  <span>Cancel Editing</span>
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={isDeleting || uiDisabled}
                className={`w-full text-left flex items-center space-x-2 px-3 py-2 rounded-xl ${
                  isDeleting || uiDisabled
                    ? "bg-red-500/20 text-red-300 cursor-not-allowed"
                    : "bg-red-500/10 text-red-300 hover:bg-red-500/20"
                }`}
              >
                <Trash2 size={16} />
                <span>{isDeleting ? "Deleting..." : "Delete Post"}</span>
              </button>
            </div>
          </GlassCard>

          {/* NEW CARD: Navigation buttons */}
          <GlassCard>
            <h2 className="text-lg font-semibold mb-3 border-b border-white/10 pb-2">
              Next Steps
            </h2>
            <div className="space-y-3">
              <button
                onClick={handleDashboard}
                className="w-full px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/20 text-white"
              >
                Go to Dashboard
              </button>
              <button
                onClick={handleRecentPost}
                className="w-full px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/20 text-white"
              >
                Recently Generated Posts
              </button>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* UPDATED DYNAMIC TOAST (Red for Errors) */}
      {toastState.message && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-right-5 duration-300">
          <div
            className={`px-4 py-2 rounded shadow-lg text-white text-sm font-medium ${
              toastState.type === "error" ? "bg-red-600" : "bg-emerald-600"
            }`}
          >
            {toastState.message}
          </div>
        </div>
      )}
      
      {/* Unusual Activity Modal */}
      <UnusualActivityModal 
        isOpen={showUnusualActivityModal}
        onClose={() => setShowUnusualActivityModal(false)}
      />
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Smart Scheduling"
        description="Schedule your posts for optimal engagement times across all your connected platforms."
        currentPlan={getPlanName()}
      />
    </div>
  );
};

export default PostEditor;
