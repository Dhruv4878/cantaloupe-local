
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Sparkles,
  Check,
  ChevronDown
} from "lucide-react";
import UnusualActivityModal from "../UnusualActivityModal";
import UpgradeModal from "../UpgradeModal";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";

// New Components
import { PostHeader } from "./PostComponents/PostHeader";
import { PostPreviewSection } from "./PostComponents/PostPreviewSection";
import { PostEditorSection } from "./PostComponents/PostEditorSection";
import { PostActions } from "./PostComponents/PostActions";

import { ScheduleModal } from "./PostComponents/ScheduleModal";
import { RegenerationFeedbackModal } from "./RegenerationFeedbackModal";

// --- Helper Components --- //
const platformIcons = {
  instagram: <Instagram size={18} />,
  facebook: <Facebook size={18} />,
  linkedin: <Linkedin size={18} />,
  x: <Twitter size={18} />,
};

const platformColors = {
  instagram: "from-pink-500 to-purple-500",
  facebook: "from-blue-600 to-blue-500",
  linkedin: "from-blue-700 to-blue-600",
  x: "from-gray-700 to-gray-900", // X/Twitter
};

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

  // Creative Brief state
  const [creativeBrief, setCreativeBrief] = useState("");

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
  
  // Delete Success Modal State
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  
  // Plan status cache to avoid repeated API calls
  const [planStatusCache, setPlanStatusCache] = useState(null);
  const [planStatusChecked, setPlanStatusChecked] = useState(false);

  // NEW STATE: Schedule for all connected platforms
  const [scheduleAll, setScheduleAll] = useState(false);

  const [addPlatformsSelection, setAddPlatformsSelection] = useState({});
  const [addPlatformsLoading, setAddPlatformsLoading] = useState(false);
  const regenerateMenuContainerRef = useRef(null);
  const addPlatformsContainerRef = useRef(null);
  const analyticsRef = useRef(null);
  const [showAnalytics, setShowAnalytics] = useState(false);


  // Regeneration Feedback Modal State
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [regenerationConfig, setRegenerationConfig] = useState({
    type: "", // "text", "hashtags", "image", "post"
    title: "",
    placeholder: "",
  });


  const uiDisabled =
    imageGenerating ||
    addPlatformsLoading ||
    captionLoading ||
    hashtagsLoading ||
    isScheduling;

  // --- Helper: Handle API Response with Suspended Plan Check ---
  const handleApiResponse = async (response, errorMessage = "API call failed") => {
    if (!response.ok) {
      if (response.status === 403) {
        try {
          const errorData = await response.json();
          if (errorData.suspendedPlan) {
            setShowUnusualActivityModal(true);
            return null; 
          }
        } catch (parseError) {}
      }
      
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
      // If clicking "post", toggle it and clear others
      if (key === "post") {
        const nextPost = !prev.post;
        return nextPost
          ? { text: false, hashtags: false, image: false, post: true }
          : { ...prev, post: false };
      }
      
      // If clicking any other option, it should be the ONLY one selected
      // So if it's currently selected, deselect it. If it's not, select it and deselect everything else.
      const isCurrentlySelected = prev[key];
      
      if (isCurrentlySelected) {
          // Deselecting
          return { ...prev, [key]: false };
      } else {
          // Selecting: Clear everything else, set this one to true
          return {
              text: false,
              hashtags: false,
              image: false,
              post: false,
              [key]: true
          };
      }
    });
  };

  // Check if user's plan is suspended (cached version)
  const checkPlanStatus = async (forceRefresh = false) => {
    try {
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
        const hasActiveSubscription = data?.plan?.planName && data.plan.planName !== "Free";
        const isSubscriptionActive = data?.subscription?.is_active;
        
        if (hasActiveSubscription && isSubscriptionActive === false) {
          setPlanStatusCache(false);
          setPlanStatusChecked(true);
          setShowUnusualActivityModal(true);
          return false;
        }
      }
      
      setPlanStatusCache(true);
      setPlanStatusChecked(true);
      return true;
    } catch (error) {
      setPlanStatusCache(true);
      setPlanStatusChecked(true);
      return true;
    }
  };

  const canNavigateToGenerate = () => {
    try {
      if (typeof window === "undefined") return true;
      const used = parseInt(sessionStorage.getItem("usedPosts") || "0", 10) || 0;
      const limit = Number(sessionStorage.getItem("creditLimit") || "0");
      return used < limit;
    } catch (_) {
      return true;
    }
  };

  const getBackRoute = () => {
    if (!generatedData?.metadata?.source) return '/generate';
    const source = generatedData.metadata.source;
    const sourceRouteMap = {
      'generate-from-scratch': '/generate-scratch',
      'streamlined-template-customization': '/template-customizer',
      'caption-hashtag-generator': '/generate-caption-hashtags',
    };
    return sourceRouteMap[source] || '/generate';
  };

  const getBackLabel = () => {
    if (!generatedData?.metadata?.source) return 'Back to Options';
    const source = generatedData.metadata.source;
    const sourceLabelMap = {
      'generate-from-scratch': 'Back to Generate from Scratch',
      'streamlined-template-customization': 'Back to customization',
      'caption-hashtag-generator': 'Back to Caption Generator',
    };
    return sourceLabelMap[source] || 'Back to Options';
  };

  const handleRegeneratePost = async () => {
    const planActive = await checkPlanStatus();
    if (!planActive) return;
    if (!canNavigateToGenerate()) return;
    router.push("/generate");
  };

  const handleRegenerateSelected = async () => {
    if (!generatedData || !activeTab) return;
    const planActive = await checkPlanStatus();
    if (!planActive) return; 

    if (regenerateOptions.post) {
      if (window.confirm("This will discard current changes and let you start over. Continue?")) {
         router.push("/generate-scratch");
      }
      return;
    }

    if (regenerateOptions.text) {
      setRegenerationConfig({
        type: "text",
        title: "Refine Caption",
        placeholder: "E.g., Make it shorter, use more emojis, sound more professional...",
      });
      setIsRegenerateModalOpen(true);
      setIsRegenerateMenuOpen(false);
      return;
    }

    if (regenerateOptions.hashtags) {
        setRegenerationConfig({
          type: "hashtags",
          title: "Refine Hashtags",
          placeholder: "E.g., Focus on niche tags, use trending tags, limit to 5 tags...",
        });
        setIsRegenerateModalOpen(true);
        setIsRegenerateMenuOpen(false);
        return;
    }

    if (regenerateOptions.image) {
         const currentVariantCount = Array.isArray(generatedData.imageVariants)
          ? generatedData.imageVariants.length
          : 0;
        if (currentVariantCount >= 3) {
          if (typeof window !== "undefined") {
            window.alert("Enough images generated. Please create a new post to generate more.");
          }
          return;
        }

        setRegenerationConfig({
          type: "image",
          title: "Refine Image",
          placeholder: "E.g., Change background to blue, remove text, make it photorealistic...",
        });
        setIsRegenerateModalOpen(true);
        setIsRegenerateMenuOpen(false);
        return;
    }
  };

  const handleConfirmedRegeneration = async (instruction) => {
    setIsRegenerateModalOpen(false);
    
    // Reset options but keep the one active for processing state
    // We'll manually clear it after processing

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const token = typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null;
    if (!token) return;

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      
      let updated = {
        ...generatedData,
        platforms: { ...generatedData.platforms },
      };
      
      const targetPlatforms = applyToAllPlatforms ? Object.keys(updated.platforms || {}) : [activeTab];

      
      const projectContext =
        generatedData.metadata?.brief ||
        generatedData.template?.contentBrief ||
        generatedData.contentStrategy?.coreValue ||
        "Professional social media content";
        
      console.log("Regenerating with context:", projectContext);

      if (regenerationConfig.type === "text") {
        setCaptionLoading(true);
        try {
          const postContext = 
              generatedData.contentStrategy || 
              projectContext;

          const body = JSON.stringify({
             postContent: postContext,
             platforms: targetPlatforms,
             instruction,
             context: projectContext
          });
          
          const res = await fetch(`${apiUrl}/regenerate-captions`, {
            method: "POST",
            headers,
            body,
          });
          
          const json = await handleApiResponse(res, "Failed to regenerate captions");
          
          if (json && json.platforms) {
            for (const p of targetPlatforms) {
              const newCaption = json?.platforms?.[p]?.caption;
              if (!updated.platforms[p]) updated.platforms[p] = {};
              if (newCaption) updated.platforms[p].caption = newCaption;
              // Update timestamps/metadata if needed
            }
            setGeneratedData(updated);
            
            // Sync with DB
             if (postId) {
              await fetch(`${apiUrl}/posts/${postId}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ content: updated }),
              });
            }
          }
        } catch (error) {
           console.error("Regeneration error:", error);
           showToast(error.message, "error");
        } finally {
           setCaptionLoading(false);
        }
      } 
      
      else if (regenerationConfig.type === "hashtags") {
        setHashtagsLoading(true);
        try {
           const promises = targetPlatforms.map(p => {
             const baseCaption = 
                 updated.platforms?.[p]?.caption || 
                 updated.contentStrategy?.hook ||
                 updated.metadata?.brief || 
                 "";

             const body = JSON.stringify({ 
                 platforms: [p], 
                 caption: baseCaption.toString(),
                 instruction,
                 context: projectContext
             });
             
             return fetch(`${apiUrl}/regenerate-hashtags`, {
                method: "POST",
                headers,
                body
             }).then(res => res.json().then(data => ({ platform: p, data, ok: res.ok })));
           });
           
           const results = await Promise.all(promises);
           
           results.forEach(({ platform, data, ok }) => {
              if (ok && data?.platforms?.[platform]?.hashtags) {
                  if (!updated.platforms[platform]) updated.platforms[platform] = {};
                  updated.platforms[platform].hashtags = data.platforms[platform].hashtags;
              }
           });
           
           setGeneratedData(updated);
            if (postId) {
              await fetch(`${apiUrl}/posts/${postId}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ content: updated }),
              });
            }
        } catch (error) {
             console.error("Regeneration error:", error);
             showToast("Failed to regenerate hashtags", "error");
        } finally {
            setHashtagsLoading(false);
        }
      }
      
      else if (regenerationConfig.type === "image") {
         setImageGenerating(true);
         try {
             const existingVariants = Array.isArray(updated.imageVariants) ? updated.imageVariants : [];
             const previousImageUrl = updated.imageUrl;
             
             // Save current image as variant if not already
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

            const imagePrompt = 
                generatedData.aiImagePrompt || 
                generatedData.metadata?.imageGenerationPrompt || 
                generatedData.template?.customizationPrompt || 
                "Create a professional social media image";

            const res = await fetch(`${apiUrl}/generate-image`, {
                method: "POST",
                headers,
                body: JSON.stringify({ 
                    aiImagePrompt: imagePrompt,
                    instruction,
                    context: projectContext
                }),
            });

            const json = await handleApiResponse(res, "Failed to regenerate image");
            
             if (json?.imageUrl) {
                updated.imageUrl = json.imageUrl;
                const existing = Array.isArray(updated.imageVariants) ? updated.imageVariants : [];
                updated.imageVariants = [...existing, json.imageUrl];
                setGeneratedData(updated);
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
         } catch (error) {
              console.error("Image regeneration error:", error);
              showToast(error.message, "error");
         } finally {
             setImageGenerating(false);
         }
      }

    } finally {
       setRegenerationConfig({ type: "", title: "", placeholder: "" });
       // Clear selection options
       setRegenerateOptions({ text: false, hashtags: false, image: false, post: false });
    }
  };

  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const mapUiToBackendPlatform = (uiKey) => (uiKey === "x" ? "twitter" : uiKey);

  const handlePublishNow = async () => {
    try {
      if (!postId || !activeTab) return;
      setIsPosting(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const token = typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null;
      if (!token) {
        showToast("Please login again.", "error");
        router.push("/login");
        return;
      }

      const platformToSend = mapUiToBackendPlatform(activeTab);

      if (!["facebook", "instagram", "linkedin", "twitter"].includes(platformToSend)) {
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

      if (!resp.ok) {
        let errorMessage = "Unknown error";
        try {
          const errData = await resp.json();
          errorMessage = errData.error || errData.message || errData.detail || "Request failed";
        } catch (e) {
          errorMessage = await resp.text();
        }
        throw new Error(errorMessage);
      }

      showToast(`Posted to ${activeTab === "x" ? "X (Twitter)" : activeTab} successfully`, "success");
    } catch (e) {
      console.error(e);
      showToast(`Failed to post to ${activeTab}: ${e.message}`, "error");
    } finally {
      setIsPosting(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!scheduleDate || !scheduleTime) {
      showToast("Please choose both date and time to schedule.", "error");
      return;
    }

    try {
      setIsScheduling(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const token = typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null;
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
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      let targetPlatforms = [];

      if (scheduleAll) {
        const profResp = await fetch(`${apiUrl}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!profResp.ok) throw new Error("Failed to fetch connected accounts");
        const profile = await profResp.json();

        if (profile?.social?.facebook?.pageId && profile?.social?.facebook?.accessToken) targetPlatforms.push("facebook");
        if (profile?.social?.instagram?.igBusinessId && profile?.social?.instagram?.accessToken) targetPlatforms.push("instagram");
        if (profile?.social?.linkedin?.memberId && profile?.social?.linkedin?.accessToken) targetPlatforms.push("linkedin");
        if (profile?.social?.twitter?.userId && profile?.social?.twitter?.accessToken) targetPlatforms.push("twitter");

        if (targetPlatforms.length === 0) {
          showToast("No connected platforms found to schedule.", "error");
          setIsScheduling(false);
          return;
        }
      } else {
        targetPlatforms = [mapUiToBackendPlatform(activeTab)];
      }

      const existingResp = await fetch(`${apiUrl}/posts/${postId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!existingResp.ok) throw new Error("Unable to load post for scheduling");
      const existingPost = await existingResp.json();
      const existingSchedule = existingPost?.schedule || {};
      let existingEntries = Array.isArray(existingSchedule.entries) ? existingSchedule.entries : [];

      let mergedEntries = [...existingEntries];

      targetPlatforms.forEach((p) => {
        mergedEntries = mergedEntries.filter(
          (e) => !(e.platform === p && new Date(e.scheduledAt).getTime() === scheduledAt.getTime())
        );
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
        ? `Scheduled for all ${targetPlatforms.length} connected platforms`
        : `Scheduled ${activeTab === "x" ? "X (Twitter)" : activeTab} for ${scheduledAt.toLocaleString()}`;

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

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const token = typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null;
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
      if (profile?.social?.facebook?.pageId && profile?.social?.facebook?.accessToken) targets.push("facebook");
      if (profile?.social?.instagram?.igBusinessId && profile?.social?.instagram?.accessToken) targets.push("instagram");
      if (profile?.social?.linkedin?.memberId && profile?.social?.linkedin?.accessToken) targets.push("linkedin");
      if (profile?.social?.twitter?.userId && profile?.social?.twitter?.accessToken) targets.push("twitter");

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
          showToast(`Posted to ${succeeded.length} platforms. Failed: ${failed.join(", ")}`, "error");
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const token = typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null;

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
        
        const brief = content?.metadata?.brief || "";
        if (brief) {
          setCreativeBrief(brief);
        }
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to load post");
      } finally {
        setLoading(false);
      }
    };
    loadFromDb();
  }, [searchParams, router]);

  useEffect(() => {
    const initialPlanCheck = async () => {
      await checkPlanStatus(true);
    };
    initialPlanCheck();
  }, []);

  useEffect(() => {
    const generateIfMissing = async () => {
      if (!generatedData || generatedData.imageUrl || imageGenerating) return;
      const aiImagePrompt = generatedData.aiImagePrompt;
      if (!aiImagePrompt) return;
      
      if (imageRetryCountRef.current >= 3) return;
      
      try {
        setImageGenerating(true);
        imageRetryCountRef.current += 1;
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const token = sessionStorage.getItem("authToken");
        if (!token) {
          setImageGenerating(false);
          return;
        }

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
          setImageGenerating(false);
          return;
        }
        
        if (!data?.imageUrl) {
          setImageGenerating(false);
          return;
        }
        
        setGeneratedData(prev => ({ ...prev, imageUrl: data.imageUrl }));
        setImageGenerating(false);
        imageRetryCountRef.current = 0;
        
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

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
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

    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const token = typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null;
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

      // Show success modal instead of immediately redirecting
      setShowDeleteSuccessModal(true);
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

  const handleAddPlatforms = async () => {
    setAddPlatformsLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const token = sessionStorage.getItem("authToken");
    const toAdd = Object.keys(addPlatformsSelection).filter(k => addPlatformsSelection[k]);
    
    if (toAdd.length > 0 && token) {
      try {
        const res = await fetch(`${apiUrl}/create-text-plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ brief: generatedData.postContent || "", platforms: toAdd }),
        });
        if (res.ok) {
          const data = await res.json();
          const merged = { ...generatedData, platforms: { ...generatedData.platforms, ...data.platforms } };
          setGeneratedData(merged);
          if(toAdd[0]) setActiveTab(toAdd[0]);
          
          // Update DB
          if(postId) {
              await fetch(`${apiUrl}/posts/${postId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ content: merged }),
              });
          }
        }
      } catch (_) {}
    }
    setIsAddPlatformsOpen(false);
    setAddPlatformsSelection({});
    setAddPlatformsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* --- HEADER: Navigation --- */}
        <PostHeader
          onBack={() => router.push(getBackRoute())}
          backLabel={getBackLabel()}
          onDelete={handleDelete}
          onToggleAnalytics={() => {
              if (showAnalytics) {
                  setShowAnalytics(false);
              } else {
                  setShowAnalytics(true);
                  setTimeout(() => {
                      analyticsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 100);
              }
          }}
          showAnalytics={showAnalytics}
          isRegenerateMenuOpen={isRegenerateMenuOpen}
          setIsRegenerateMenuOpen={setIsRegenerateMenuOpen}
          regenerateOptions={regenerateOptions}
          toggleRegenerateOption={toggleRegenerateOption}
          handleRegenerateSelected={handleRegenerateSelected}
          uiDisabled={uiDisabled}
          generatedData={generatedData}
          isDeleting={isDeleting}
          regenerateMenuRef={regenerateMenuContainerRef}
          applyToAllPlatforms={applyToAllPlatforms}
          setApplyToAllPlatforms={setApplyToAllPlatforms}
        />

        {/* --- MAIN SPLIT LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* --- LEFT COLUMN: LIVE PREVIEW (iPhone/Card Style) --- */}
            <PostPreviewSection
              activeTab={activeTab}
              content={isEditing ? editedText : (activeTabData?.caption || "")}
              imageUrl={imageUrl}
              hashtags={
                  isEditing 
                  ? editedHashtags.split(/\s+/).filter(Boolean) 
                  : (activeTabData?.hashtags || [])
              }
              userLogoUrl={generatedData.userLogoUrl}
              imageGenerating={imageGenerating}
              generatedData={generatedData}
              setGeneratedData={setGeneratedData}
              uiDisabled={uiDisabled}
            />

            {/* --- RIGHT COLUMN: EDITOR & SETTINGS --- */}
            <div className="lg:col-span-7 flex flex-col gap-6">
                
                <PostEditorSection
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  platformNames={platformNames}
                  platformIcons={platformIcons}
                  platformColors={platformColors}
                  isAddPlatformsOpen={isAddPlatformsOpen}
                  setIsAddPlatformsOpen={setIsAddPlatformsOpen}
                  addPlatformsContainerRef={addPlatformsContainerRef}
                  addPlatformsSelection={addPlatformsSelection}
                  setAddPlatformsSelection={setAddPlatformsSelection}
                  addPlatformsLoading={addPlatformsLoading}
                  handleAddPlatforms={handleAddPlatforms}
                  uiDisabled={uiDisabled}
                  isEditing={isEditing}
                  startEditing={startEditing}
                  handleCancelEdit={handleCancelEdit}
                  saveEdits={saveEdits}
                  hasChanges={hasChanges}
                  isSaving={isSaving}
                  captionLoading={captionLoading}
                  hashtagsLoading={hashtagsLoading}
                  editedText={editedText}
                  setEditedText={setEditedText}
                  editedHashtags={editedHashtags}
                  setEditedHashtags={setEditedHashtags}
                  activeTabData={activeTabData}
                />

                {/* --- Bottom Actions (Schedule & Post) --- */}
                <PostActions
                  onSchedule={() => setIsScheduleOpen((v) => !v)}
                  onPostNow={handlePublishNow}
                  isPosting={isPosting}
                  isScheduleOpen={isScheduleOpen}
                  setIsScheduleOpen={setIsScheduleOpen}
                  isPostMenuOpen={isPostMenuOpen}
                  setIsPostMenuOpen={setIsPostMenuOpen}
                  handlePublishNow={handlePublishNow}
                  handlePublishAllConnected={handlePublishAllConnected}
                  activeTab={activeTab}
                  platformIcons={platformIcons}
                  uiDisabled={uiDisabled}
                  checkFeatureAccess={isFeatureAvailable}
                  setShowUpgradeModal={setShowUpgradeModal}
                />

                {/* Schedule Modal (Expandable) */}
                <ScheduleModal
                  isOpen={isScheduleOpen}
                  onClose={() => setIsScheduleOpen(false)}
                  onConfirm={handleSchedulePost}
                  scheduleDate={scheduleDate}
                  setScheduleDate={setScheduleDate}
                  scheduleTime={scheduleTime}
                  setScheduleTime={setScheduleTime}
                  scheduleAll={scheduleAll}
                  setScheduleAll={setScheduleAll}
                  isScheduling={isScheduling}
                />

                {/* Creative Brief Summary (Collapsible or small) */}
                {creativeBrief && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex items-start gap-3 transition-opacity">
                        <Sparkles size={16} className="text-orange-400 mt-0.5 shrink-0" />
                        <div>
                            <h5 className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-1">Generated From Brief</h5>
                            <p className="text-xs text-gray-300">{creativeBrief}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* --- Analytics (Below Fold) --- */}
        {showAnalytics && generatedData?.analytics && (
            <div ref={analyticsRef} className="mt-12 border-t border-white/10 pt-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Performance Analytics</h3>
                    <button 
                        onClick={() => setShowAnalytics(false)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="Close Analytics"
                    >
                        <ChevronDown size={24} className="transform rotate-180" />
                    </button>
                </div>
                <AnalyticsDashboard 
                    analytics={generatedData.analytics} 
                    metadata={generatedData.metadata} 
                />
            </div>
        )}

      </div>

      {/* TOAST */}
      {toastState.message && (
        <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-right-10 duration-300">
          <div
            className={`px-6 py-4 rounded-xl shadow-2xl text-white text-sm font-bold border flex items-center gap-3 backdrop-blur-md ${
              toastState.type === "error" 
              ? "bg-red-900/90 border-red-500/50" 
              : "bg-emerald-900/90 border-emerald-500/50"
            }`}
          >
            {toastState.type === "error" ? "⚠️" : "✅"} {toastState.message}
          </div>
        </div>
      )}
      
      <UnusualActivityModal 
        isOpen={showUnusualActivityModal}
        onClose={() => setShowUnusualActivityModal(false)}
      />
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Smart Scheduling"
        description="Schedule your posts for optimal engagement times across all your connected platforms."
        currentPlan={getPlanName()}
      />
      
      {/* Delete Success Modal */}
      {showDeleteSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative bg-[#161b2c] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl transform transition-all scale-100">
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <Check size={32} className="text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Deleted Successfully</h3>
            <p className="text-gray-400 text-center text-sm mb-6">The post has been permanently removed from your dashboard.</p>
            <button
              onClick={() => {
                setShowDeleteSuccessModal(false);
                router.push("/dashboard");
              }}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}


      {/* Regeneration Feedback Modal */}
      <RegenerationFeedbackModal 
        isOpen={isRegenerateModalOpen}
        onClose={() => {
            setIsRegenerateModalOpen(false);
            setRegenerationConfig({ type: "", title: "", placeholder: "" });
            setRegenerateOptions({ text: false, hashtags: false, image: false, post: false });
        }}
        onConfirm={handleConfirmedRegeneration}
        title={regenerationConfig.title}
        placeholder={regenerationConfig.placeholder}
        loading={captionLoading || hashtagsLoading || imageGenerating}
      />
    </div>
  );
};

export default PostEditor;