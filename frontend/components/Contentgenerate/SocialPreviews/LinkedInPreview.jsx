
import React from "react";
import { 
  MoreHorizontal, 
  ThumbsUp, 
  MessageSquare, 
  Repeat, 
  Send,
  Globe
} from "lucide-react";

export const LinkedInPreview = ({ 
  content, 
  imageUrl, 
  hashtags = [], 
  brandName = "Your Brand",
  userImage,
  isGenerating = false
}) => {
  return (
    <div className="w-full max-w-[420px] bg-[#1B1F23] border border-gray-700/50 rounded-xl overflow-hidden shadow-2xl relative mx-auto text-white font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
            {userImage ? (
                <img src={userImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-gray-600"></div>
            )}
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-white leading-tight flex items-center gap-1">
                {brandName} 
            </h3>
            <p className="text-[12px] text-gray-400">Promoted</p>
            <div className="flex items-center gap-1 text-[12px] text-gray-400">
              <span>1h</span>
              <span>•</span>
              <Globe size={12} />
            </div>
          </div>
        </div>
        <MoreHorizontal size={20} className="text-gray-400" />
      </div>

      {/* Content */}
      <div className="px-4 pb-2 text-[14px] text-gray-200 leading-relaxed whitespace-pre-wrap">
        {content}
        <div className="mt-2 text-blue-400 font-semibold">
           {hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(" ")}
        </div>
      </div>

      {/* Image */}
      {isGenerating ? (
          <div className="w-full min-h-[200px] bg-gray-800 flex flex-col items-center justify-center gap-3 mt-2">
             <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
             <span className="text-xs text-orange-500 animate-pulse">Generating visual...</span>
          </div>
      ) : imageUrl ? (
          <div className="w-full mt-2">
            <img src={imageUrl} alt="Post content" className="w-full h-auto object-cover" />
          </div>
      ) : (
           <div className="w-full h-40 bg-gray-800 flex items-center justify-center text-gray-500 text-sm mt-2">
               No Media
           </div>
      )}

      {/* Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-[12px] text-gray-400 border-b border-gray-700/50">
          <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full bg-blue-500 border border-[#1B1F23] flex items-center justify-center"><ThumbsUp size={8} fill="white" className="text-white"/></div>
                  <div className="w-4 h-4 rounded-full bg-red-500 border border-[#1B1F23] flex items-center justify-center"><span className="text-[8px]">❤️</span></div>
              </div>
              <span>154</span>
          </div>
          <div className="flex gap-2">
              <span>24 comments</span>
              <span>•</span>
              <span>12 reposts</span>
          </div>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex items-center justify-between">
         <button className="flex flex-col items-center justify-center gap-1 py-2 px-3 hover:bg-white/5 rounded transition-colors text-gray-300 font-medium text-[12px]">
            <ThumbsUp size={18} />
            <span>Like</span>
         </button>
         <button className="flex flex-col items-center justify-center gap-1 py-2 px-3 hover:bg-white/5 rounded transition-colors text-gray-300 font-medium text-[12px]">
            <MessageSquare size={18} />
            <span>Comment</span>
         </button>
         <button className="flex flex-col items-center justify-center gap-1 py-2 px-3 hover:bg-white/5 rounded transition-colors text-gray-300 font-medium text-[12px]">
            <Repeat size={18} />
            <span>Repost</span>
         </button>
         <button className="flex flex-col items-center justify-center gap-1 py-2 px-3 hover:bg-white/5 rounded transition-colors text-gray-300 font-medium text-[12px]">
            <Send size={18} />
            <span>Send</span>
         </button>
      </div>
    </div>
  );
};
