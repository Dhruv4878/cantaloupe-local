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

const PostEditor = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [postToast, setPostToast] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

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



  useEffect(() => {
    function handleDocClick(e) {
      try {
        const regNode = regenerateMenuContainerRef.current;
        const addNode = addPlatformsContainerRef.current;
        const clickedInsideReg = regNode && regNode.contains(e.target);
        const clickedInsideAdd = addNode && addNode.contains(e.target);
        if (!clickedInsideReg) setIsRegenerateMenuOpen(false);
        if (!clickedInsideAdd) setIsAddPlatformsOpen(false);
      } catch (_) { }
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  function handlerRegenerate() {
    router.push("/generate");
  }

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

  const handleRegeneratePost = () => {
    router.push("/generate");
  };

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
    const statusInfo = `(${response.status}${response.statusText ? " " + response.statusText : ""
      })`;
    const err = new Error(
      messageFromBody || `${defaultMessage} ${statusInfo}`.trim()
    );
    err.status = response.status;
    return err;
  };

  const handleRegenerateSelected = async () => {
    if (!generatedData || !activeTab) return;
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("authToken")
        : null;
    if (!token) return;

    try {
      if (regenerateOptions.post) {
        handleRegeneratePost();
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
          .then(async (res) => (res.ok ? res.json() : null))
          .then((json) => {
            captionsResult = json;
          })
          .catch(() => { });
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
            .then(async (res) => (res.ok ? res.json() : null))
            .then((json) => {
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
          if (res.ok) {
            const json = await res.json();
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
  // helper map (put at top of file)
  const mapUiToBackendPlatform = (uiKey) => (uiKey === "x" ? "twitter" : uiKey);
  // In your Post.jsx (or the file you posted earlier) replace the functions:

  // helper map (put at top of file)

  // handlePublishNow
  const handlePublishNow = async () => {
    try {
      if (!postId || !activeTab) return;
      setIsPosting(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const token = typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null;
      if (!token) {
        setError("Please login again.");
        router.push("/login");
        return;
      }

      // send mapped platform (map "x" -> "twitter")
      const platformToSend = mapUiToBackendPlatform(activeTab);

      // Validate we support the requested platform
      if (!["facebook", "instagram", "linkedin", "twitter"].includes(platformToSend)) {
        setPostToast(`Posting to ${activeTab} is not supported yet.`);
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
        const txt = await resp.text();
        throw new Error(`Failed to post to ${activeTab}: ${txt}`);
      }

      setPostToast(`Posted to ${activeTab === "x" ? "X (Twitter)" : activeTab} successfully`);
      setTimeout(() => setPostToast(""), 3000);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to post");
    } finally {
      setIsPosting(false);
    }
  };


  const handleSchedulePost = async () => {
    if (!scheduleDate || !scheduleTime) {
      setPostToast("Please choose both date and time to schedule.");
      setTimeout(() => setPostToast(""), 2500);
      return;
    }

    try {
      setIsScheduling(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const token = typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null;
      if (!token) {
        setError("Please login again.");
        router.push("/login");
        return;
      }
      if (!postId || !activeTab) {
        setPostToast("Missing post or platform to schedule.");
        setTimeout(() => setPostToast(""), 2500);
        return;
      }

      // Build scheduled datetime in local timezone
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      if (Number.isNaN(scheduledAt.getTime())) {
        setPostToast("Invalid date/time");
        setTimeout(() => setPostToast(""), 2500);
        return;
      }
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "UTC";

      // Map UI tab to backend platform key
      const platformToSend = mapUiToBackendPlatform(activeTab);

      // Fetch current post to merge schedule entries
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
      const existingEntries = Array.isArray(existingSchedule.entries)
        ? existingSchedule.entries
        : [];

      // Upsert schedule entry for this platform at this datetime
      const newEntry = {
        platform: platformToSend,
        scheduledAt,
        status: "pending",
        timezone,
      };

      const mergedEntries = [
        ...existingEntries.filter(
          (e) =>
            !(
              e.platform === platformToSend &&
              new Date(e.scheduledAt).getTime() === scheduledAt.getTime()
            )
        ),
        newEntry,
      ];

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

      setPostToast(
        `Scheduled ${activeTab === "x" ? "X (Twitter)" : activeTab} for ${scheduledAt.toLocaleString()}`
      );
      setTimeout(() => setPostToast(""), 3000);
      setIsScheduleOpen(false);
    } catch (e) {
      console.error(e);
      setPostToast(e.message || "Failed to schedule post.");
      setTimeout(() => setPostToast(""), 3000);
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
        setError("Please login again.");
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
        setPostToast("No connected platforms found");
        setTimeout(() => setPostToast(""), 2500);
        return;
      }

      // Post serially (you can parallelize if you want)
      for (const p of targets) {
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
          console.error(`Failed to post to ${p}:`, txt);
        }
      }

      setPostToast("Posted to all connected platforms");
      setTimeout(() => setPostToast(""), 3000);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to post to all platforms");
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

  useEffect(() => {
    const generateIfMissing = async () => {
      if (!generatedData || generatedData.imageUrl || imageGenerating) return;
      const aiImagePrompt = generatedData.aiImagePrompt;
      if (!aiImagePrompt) return;
      try {
        setImageGenerating(true);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const token =
          typeof window !== "undefined"
            ? sessionStorage.getItem("authToken")
            : null;
        if (!token) return;
        const resp = await fetch(`${apiUrl}/generate-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ aiImagePrompt }),
        });
        if (!resp.ok) return;
        const data = await resp.json();
        if (!data?.imageUrl) return;
        const updated = { ...generatedData, imageUrl: data.imageUrl };
        setGeneratedData(updated);
        if (postId) {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
            }/posts/${postId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ content: updated }),
            }
          );
        }
      } finally {
        setImageGenerating(false);
      }
    };
    generateIfMissing();
  }, [generatedData, imageGenerating, postId]);

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
    // no need to reset text; generatedData never changed until Save
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

      router.push("/generate");
    } catch (e) {
      console.error("Failed to delete post:", e);
      setError(e.message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDashboard = () => {
    router.push("/dashboard");
  }

  const handleRecentPost = () => {
    router.push("/recentpost");
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* MAIN EDITOR CARD */}
        <GlassCard className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-white/10 pb-4">
            <h1 className="text-2xl font-bold mb-2 sm:mb-0">
              Generated Post
            </h1>
            <div className="flex space-x-2 relative">
              {/* EDIT / CANCEL TOGGLE */}
              {!isEditing ? (
                <button
                  onClick={startEditing}
                  disabled={uiDisabled}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm border ${uiDisabled
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
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm border ${uiDisabled
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
                        className={`flex items-center gap-2 px-2 py-1 rounded ${regenerateOptions.post
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
                        className={`flex items-center gap-2 px-2 py-1 rounded ${regenerateOptions.post
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
                        className={`flex items-center gap-2 px-2 py-1 rounded ${regenerateOptions.post
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
                        className={`px-3 py-1.5 text-xs rounded-full border ${uiDisabled
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
                <h2 className="text-lg font-semibold text-white">
                  Post Image
                </h2>
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
                          className={`px-2 py-1 text-xs rounded-full border ${generatedData.imageUrl === url
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
              {/* Tabs */}
              <div className="mb-4 border-b border-white/10">
                <nav className="flex space-x-4">
                  {platformNames.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => !uiDisabled && setActiveTab(platform)}
                      disabled={uiDisabled}
                      className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium capitalize ${activeTab === platform
                        ? "border-orange-400 text-orange-300"
                        : uiDisabled
                          ? "border-transparent text-gray-500 cursor-not-allowed"
                          : "border-transparent text-gray-300 hover:text-white"
                        }`}
                    >
                      {platformIcons[platform]}
                      {platform}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Caption */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-4">
                <h3 className="font-medium text-white mb-2">Post Text</h3>
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
                        className={`w-full text-left px-3 py-2 text-sm ${uiDisabled
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
                        className={`w-full text-left px-3 py-2 text-sm ${uiDisabled
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
                  onClick={() => setIsScheduleOpen((v) => !v)}
                  disabled={uiDisabled}
                  className={`w-full px-4 py-2 rounded-full text-sm font-medium border transition ${uiDisabled
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
                          className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-orange-400"
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
                          className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] sm:text-xs text-white/50">
                      Your post will be queued and automatically published at the selected time.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsScheduleOpen(false);
                          setScheduleDate("");
                          setScheduleTime("");
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
                className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm border ${uiDisabled
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
                          className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${alreadySelected
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
                      className={`px-3 py-1.5 text-xs rounded-full border ${uiDisabled
                        ? "border-white/10 text_gray-500 cursor-not-allowed"
                        : "border-white/20 text-gray-100 hover:bg-white/5"
                        }`.replace("text_gray", "text-gray")}
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
                          const res = await fetch(`${apiUrl}/create-text-plan`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              brief: generatedData.postContent || "",
                              platforms: toAdd,
                            }),
                          });
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
                        } catch (_) { }
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
                className={`w-full text-left flex items-center space-x-2 px-3 py-2 rounded-xl ${isDeleting || uiDisabled
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
              <button onClick={handleDashboard} className="w-full px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/20 text-white">
                Go to Dashboard
              </button>
              <button onClick={handleRecentPost} className="w-full px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/20 text-white">
                Recently Generated Posts
              </button>
            </div>
          </GlassCard>
        </div>
      </div>

      {postToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/90 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {postToast}
        </div>
      )}
    </div>
  );
};

export default PostEditor;
