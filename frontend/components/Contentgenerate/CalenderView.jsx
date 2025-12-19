"use client";
import React, { useEffect, useState } from "react";
import { 
  Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, 
  Clock, CheckCircle2, Send, Sparkles, Filter,
  Facebook, Instagram, Linkedin, Twitter, Globe
} from "lucide-react";
import MonthCalendar from "./MonthCalendar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/* ---------- Helpers ---------- */
const toLocalDateKey = (date) => new Date(date).toLocaleDateString("en-CA");

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl relative text-white ${className}`}
    style={{
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
    }}
  >
    {children}
  </div>
);

const getPlatformIcon = (p) => {
  const name = p?.toLowerCase() || "";
  if (name.includes("face")) return <Facebook size={16} />;
  if (name.includes("insta")) return <Instagram size={16} />;
  if (name.includes("link")) return <Linkedin size={16} />;
  if (name.includes("twit") || name.includes("x")) return <Twitter size={16} />;
  return <Globe size={16} />;
};

/* ---------- Preview Modal ---------- */
const PreviewModal = ({ isOpen, onClose, posts, date }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => { setCurrentIndex(0); }, [isOpen, posts]);
  if (!isOpen || !posts || posts.length === 0) return null;

  const currentPost = posts[currentIndex];
  const total = posts.length;

  // Status Styling
  let statusConfig = { color: "bg-gray-500/20 text-gray-400", icon: Clock, label: "Unknown" };
  
  if (currentPost.type === "published") {
    statusConfig = { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Send, label: "Published" };
  } else if (currentPost.type === "scheduled") {
    statusConfig = { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock, label: "Scheduled" };
  } else if (currentPost.type === "generated") {
    statusConfig = { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: Sparkles, label: "Generated" };
  }

  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-white">{new Date(date).toDateString()}</h3>
            <p className="text-xs text-gray-400">{currentIndex + 1} of {total}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/70 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <Clock size={12} /> {currentPost.time}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 transition">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-y-auto p-6">
          {/* Navigation */}
          {total > 1 && (
            <>
              <button onClick={() => setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1))} 
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-white/20 text-white border border-white/10 z-10">
                <ChevronLeft size={24} />
              </button>
              <button onClick={() => setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1))} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-white/20 text-white border border-white/10 z-10">
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div className="flex flex-col gap-5 px-4">
            {/* Status Badge */}
            <div className="flex justify-center">
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusConfig.color}`}>
                <StatusIcon size={14} /> {statusConfig.label}
              </span>
            </div>

            {/* Post Card */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              {currentPost.image && (
                <div className="w-full aspect-video bg-black/50 border-b border-white/5">
                   <img src={currentPost.image} alt="Post" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="p-6 flex flex-col items-center justify-center text-center gap-4">
                {/* Unified Platforms List */}
                <div className="flex flex-wrap justify-center gap-2">
                  {currentPost.platforms && currentPost.platforms.length > 0 ? (
                    currentPost.platforms.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-xs font-medium capitalize">
                        {getPlatformIcon(p)} {p}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">No platforms specified</span>
                  )}
                </div>

                {/* Info Text */}
                <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">
                  {currentPost.type === "generated" ? "Created On" : "Target Platforms"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Main Page Component ---------- */
const CalendarPage = () => {
  const [calendarMap, setCalendarMap] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Filter State
  const [filters, setFilters] = useState({
    generated: true,
    published: true,
    scheduled: true
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPosts, setSelectedPosts] = useState([]);

  useEffect(() => { fetchCalendarData(); }, [currentMonth]); // Re-fetch only on month change
  // Note: We do NOT re-fetch on filter change; filters just toggle visibility in UI

  const fetchCalendarData = async () => {
    const token = sessionStorage.getItem("authToken");
    if (!token) return;

    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    try {
      const res = await fetch(`${API_URL}/posts/calendar?from=${start.toISOString()}&to=${end.toISOString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      const json = await res.json();
      const posts = Array.isArray(json.posts) ? json.posts : [];

      const map = {};

      posts.forEach((post) => {
        const content = post.content || {};
        const imageUrl = content.imageUrl || content.image || ""; 
        const platformsObj = content.platforms || {};
        const platformsList = Object.keys(platformsObj).length > 0 ? Object.keys(platformsObj) : ["Social"];

        // Helper to add distinct events
        const addEvent = (date, type, statusLabel) => {
           const key = toLocalDateKey(date);
           if (!map[key]) map[key] = { types: new Set(), items: [] };
           
           map[key].types.add(type); // 'generated', 'published', 'scheduled'

           // Check if we already have this post for this day & type to merge platforms?
           // Actually, "Generated" is one-time. "Scheduled" could be multiple times.
           // Simplification: Add a new item.
           map[key].items.push({
             id: post._id + type, // Unique Key
             type: type, // for filtering/styling
             status: statusLabel,
             time: new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
             image: imageUrl,
             platforms: platformsList
           });
        };

        // 1. GENERATED Event (Red)
        if (post.createdAt) {
          addEvent(post.createdAt, "generated", "Generated");
        }

        // 2. SCHEDULED / PUBLISHED Events (Green/Yellow)
        // Check schedule array
        if (post.schedule?.entries?.length > 0) {
          post.schedule.entries.forEach(entry => {
            if (entry.scheduledAt) {
               const isPub = entry.status === "published";
               const type = isPub ? "published" : "scheduled";
               const label = isPub ? "Published" : "Scheduled";
               // For scheduled items, the platform might be specific to the entry
               const entryPlatform = entry.platform ? [entry.platform] : platformsList;
               
               // Custom add for schedule to support specific platform entry
               const key = toLocalDateKey(entry.scheduledAt);
               if (!map[key]) map[key] = { types: new Set(), items: [] };
               map[key].types.add(type);
               
               map[key].items.push({
                 id: post._id + entry.platform + type,
                 type: type,
                 status: label,
                 time: new Date(entry.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                 image: imageUrl,
                 platforms: entryPlatform
               });
            }
          });
        } 
        // If no schedule entries but we want to treat it as Published (Direct Publish)
        else if (post.createdAt && (!post.schedule?.entries || post.schedule.entries.length === 0)) {
           // If your logic considers unscheduled posts as "Published Immediately", add that event too.
           // To avoid duplicate dots (Red + Green on same second), we usually separate them.
           // However, user requested "generated" separate. So we keep both.
           addEvent(post.createdAt, "published", "Direct Publish");
        }
      });

      setCalendarMap(map);
    } catch (err) { console.error(err); }
  };

  const handleDateClick = (dateKey, items) => {
    // Filter items in the modal based on active toggles too!
    const visibleItems = items.filter(item => filters[item.type]);
    if (visibleItems.length === 0) return;
    
    setSelectedDate(dateKey);
    setSelectedPosts(visibleItems);
    setIsModalOpen(true);
  };

  const toggleFilter = (key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="w-full">
      <GlassCard className="p-4 sm:p-5">
        {/* Top Header with Toggles */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10"><CalendarIcon size={20} /></div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold">Content Calendar</h3>
            </div>
          </div>

          {/* Filter Toggles */}
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => toggleFilter('generated')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                filters.generated ? "bg-red-500/20 text-red-400 border-red-500/50" : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${filters.generated ? "bg-red-500" : "bg-gray-500"}`} />
              Generated
            </button>

            <button 
              onClick={() => toggleFilter('published')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                filters.published ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${filters.published ? "bg-emerald-500" : "bg-gray-500"}`} />
              Published
            </button>

            <button 
              onClick={() => toggleFilter('scheduled')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                filters.scheduled ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${filters.scheduled ? "bg-yellow-400" : "bg-gray-500"}`} />
              Scheduled
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="w-full">
          <MonthCalendar
            calendarMap={calendarMap}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onDateClick={handleDateClick}
            filters={filters}
          />
        </div>
      </GlassCard>

      <PreviewModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        posts={selectedPosts}
        date={selectedDate}
      />
    </div>
  );
};

export default CalendarPage;