"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, 
  Clock, CheckCircle2, Send, Sparkles, AlertCircle,
  Facebook, Instagram, Linkedin, Twitter, Globe, ExternalLink
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
  if (name.includes("face")) return <Facebook size={14} />;
  if (name.includes("insta")) return <Instagram size={14} />;
  if (name.includes("link")) return <Linkedin size={14} />;
  if (name.includes("twit") || name.includes("x")) return <Twitter size={14} />;
  return <Globe size={14} />;
};

/* ---------- Preview Modal ---------- */
const PreviewModal = ({ isOpen, onClose, posts, date }) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => { setCurrentIndex(0); }, [isOpen, posts]);
  if (!isOpen || !posts || posts.length === 0) return null;

  const currentPost = posts[currentIndex];
  const total = posts.length;

  const handleViewPost = () => {
    if (currentPost.postId) {
      router.push(`/generatepost?id=${currentPost.postId}`);
    }
  };

  // Status Styling Logic
  let statusConfig = { color: "bg-gray-500/20 text-gray-400", icon: Clock, label: "Unknown" };
  
  if (currentPost.type === "published") {
    statusConfig = { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2, label: "Published" };
  } else if (currentPost.type === "scheduled") {
    statusConfig = { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock, label: "Scheduled" };
  } else if (currentPost.type === "failed") {
    statusConfig = { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: AlertCircle, label: "Failed" };
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
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 transition">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="relative flex-1 overflow-y-auto p-6 scrollbar-hide">
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
            {/* Badge */}
            <div className="flex justify-center">
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusConfig.color}`}>
                <StatusIcon size={14} /> {statusConfig.label}
              </span>
            </div>

            {/* Content Card */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              {currentPost.image && (
                <div className="w-full aspect-video bg-black/50 border-b border-white/5">
                   <img src={currentPost.image} alt="Post" className="w-full h-full object-cover" />
                </div>
              )}
              
              {/* Platforms List */}
              <div className="p-4 bg-black/20">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 font-semibold">
                   {currentPost.type === 'generated' ? 'Target Platforms' : 'Publish Status'}
                </h4>
                <div className="space-y-2">
                  {currentPost.platformDetails && currentPost.platformDetails.length > 0 ? (
                    currentPost.platformDetails.map((pd, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-white/10 rounded-full text-white">{getPlatformIcon(pd.name)}</div>
                          <span className="text-xs font-medium capitalize text-white/90">{pd.name}</span>
                        </div>
                        {currentPost.type !== 'generated' && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${
                            pd.status === 'posted' || pd.status === 'published' 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : pd.status === 'failed' 
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }`}>
                            {pd.status === 'posted' ? 'published' : pd.status}
                            </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-xs text-gray-500 py-2">No platform details</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-center text-xs text-gray-500">
               Time: {currentPost.time}
            </div>

            {/* View Post Button */}
            {currentPost.postId && (
              <button
                onClick={handleViewPost}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-xl"
              >
                <ExternalLink size={16} />
                View Full Post
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Filter Button ---------- */
const FilterButton = ({ active, onClick, color, label }) => {
    const colorClasses = {
        red: "bg-red-500",
        emerald: "bg-emerald-500",
        yellow: "bg-yellow-400",
        orange: "bg-orange-500"
    };
    const activeClasses = {
        red: "bg-red-500/20 text-red-400 border-red-500/50",
        emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
        yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
        orange: "bg-orange-500/20 text-orange-400 border-orange-500/50"
    };

    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition border ${
            active ? activeClasses[color] : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
            }`}
        >
            <div className={`w-2 h-2 rounded-full ${active ? colorClasses[color] : "bg-gray-500"}`} />
            {label}
        </button>
    );
};

/* ---------- Main Component ---------- */
const CalendarPage = () => {
  const [calendarMap, setCalendarMap] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [filters, setFilters] = useState({
    generated: true,
    published: true,
    scheduled: true,
    failed: true
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPosts, setSelectedPosts] = useState([]);

  useEffect(() => { fetchCalendarData(); }, [currentMonth]);

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

      const addEventToMap = (date, type, statusLabel, details, postData) => {
        if (!date) return; // Safety check
        const key = toLocalDateKey(date);
        if (!map[key]) map[key] = { types: new Set(), items: [] };
        
        map[key].types.add(type); 
        map[key].items.push({
          id: postData._id + type + date,
          postId: postData._id, // Store the actual post ID for navigation
          type: type, 
          status: statusLabel,
          time: new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          image: postData.content?.imageUrl || postData.content?.image || "",
          platformDetails: details
        });
      };

      posts.forEach((post) => {
        // -------------------------------------------
        // 1. GENERATED Event (Red Dot)
        // -------------------------------------------
        if (post.createdAt) {
          const platformsObj = post.content?.platforms || {};
          const names = Object.keys(platformsObj).length > 0 ? Object.keys(platformsObj) : ['Social'];
          const details = names.map(n => ({ name: n, status: 'created' }));
          addEventToMap(post.createdAt, "generated", "Generated", details, post);
        }

        // -------------------------------------------
        // 2. SCHEDULED Event Logic (Split by Status)
        // -------------------------------------------
        if (post.schedule?.entries?.length > 0) {
            // Group by time first
            const groupedByTime = {};
            post.schedule.entries.forEach(entry => {
                const t = new Date(entry.scheduledAt).toISOString();
                if (!groupedByTime[t]) groupedByTime[t] = [];
                groupedByTime[t].push(entry);
            });

            Object.entries(groupedByTime).forEach(([timeStr, entries]) => {
                const dateObj = new Date(timeStr);
                
                // Bucket entries by status
                const successEntries = entries.filter(e => e.status === 'posted' || e.status === 'published');
                const failedEntries = entries.filter(e => e.status === 'failed');
                const pendingEntries = entries.filter(e => e.status !== 'posted' && e.status !== 'published' && e.status !== 'failed');

                // A. Add Success Event (Green)
                if (successEntries.length > 0) {
                    const details = successEntries.map(e => ({ name: e.platform, status: e.status }));
                    addEventToMap(dateObj, "published", "Published", details, post);
                }

                // B. Add Failure Event (Orange)
                if (failedEntries.length > 0) {
                    const details = failedEntries.map(e => ({ name: e.platform, status: e.status }));
                    addEventToMap(dateObj, "failed", "Failed", details, post);
                }

                // C. Add Pending Schedule Event (Yellow)
                if (pendingEntries.length > 0) {
                    const details = pendingEntries.map(e => ({ name: e.platform, status: e.status }));
                    addEventToMap(dateObj, "scheduled", "Scheduled", details, post);
                }
            });
        } 
        // -------------------------------------------
        // 3. DIRECT PUBLISH / FAIL Logic (Split by Lifecycle Arrays)
        // -------------------------------------------
        else if (post.lifecycle?.publish) {
            const pub = post.lifecycle.publish;
            
            // A. Handle SUCCESSES (Green Event)
            // Even if isPublished is false, we might have some successes in the array
            if (pub.platforms && Array.isArray(pub.platforms) && pub.platforms.length > 0) {
                const details = pub.platforms.map(p => ({ name: p, status: 'posted' }));
                const pubDate = pub.publishedAt || post.createdAt;
                addEventToMap(pubDate, "published", "Published", details, post);
            }

            // B. Handle FAILURES (Orange Event)
            if (pub.failedPlatforms && Array.isArray(pub.failedPlatforms) && pub.failedPlatforms.length > 0) {
                const details = pub.failedPlatforms.map(p => ({ name: p, status: 'failed' }));
                // Use lastFailedAt if available, else createdAt
                const failDate = pub.lastFailedAt || post.createdAt;
                addEventToMap(failDate, "failed", "Failed", details, post);
            }
        }
      });

      setCalendarMap(map);
    } catch (err) { console.error(err); }
  };

  const handleDateClick = (dateKey, items) => {
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10"><CalendarIcon size={20} /></div>
            <h3 className="text-lg sm:text-xl font-bold">Content Calendar</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterButton active={filters.generated} onClick={() => toggleFilter('generated')} color="red" label="Generated" />
            <FilterButton active={filters.published} onClick={() => toggleFilter('published')} color="emerald" label="Published" />
            <FilterButton active={filters.scheduled} onClick={() => toggleFilter('scheduled')} color="yellow" label="Scheduled" />
            <FilterButton active={filters.failed} onClick={() => toggleFilter('failed')} color="orange" label="Failed" />
          </div>
        </div>

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