
import React from "react";
import { 
  MoreHorizontal, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Globe 
} from "lucide-react";

export const FacebookPreview = ({ 
  content, 
  imageUrl, 
  hashtags = [], 
  brandName = "Your Brand",
  userImage,
  isGenerating = false
}) => {
  return (
    <div className="w-full max-w-[420px] bg-[#242526] border border-gray-700/50 rounded-xl overflow-hidden shadow-2xl relative mx-auto text-white font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
             {userImage ? (
                <img src={userImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700"></div>
            )}
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#E4E6EB] leading-tight">{brandName}</h3>
            <div className="flex items-center gap-1.5 text-[13px] text-[#B0B3B8]">
              <span>Just now</span>
              <span>•</span>
              <Globe size={12} />
            </div>
          </div>
        </div>
        <div className="flex gap-4 text-[#B0B3B8]">
            <MoreHorizontal size={20} />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-2 text-[15px] text-[#E4E6EB] leading-normal break-words whitespace-pre-wrap">
        {content}
        <div className="mt-1 text-blue-400">
             {hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(" ")}
        </div>
      </div>

      {/* Image */}
        <div className="w-full bg-black flex items-center justify-center overflow-hidden min-h-[200px]">
            {isGenerating ? (
                <div className="flex flex-col items-center gap-3 py-10">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-orange-500 animate-pulse">Generating visual...</span>
                </div>
            ) : imageUrl ? (
                <img src={imageUrl} alt="Post content" className="w-full h-auto max-h-[500px] object-cover" />
            ) : (
                <div className="w-full aspect-video bg-[#18191A] flex items-center justify-center text-gray-500 text-sm">
                    No image available
                </div>
            )}
        </div>

      {/* Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-[13px] text-[#B0B3B8] border-b border-gray-700">
        <div className="flex items-center gap-1.5">
            <div className="bg-blue-500 rounded-full p-1"><ThumbsUp size={10} fill="white" className="text-white"/></div>
            <span>12</span>
        </div>
        <div className="flex gap-3">
            <span>4 comments</span>
            <span>1 share</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex items-center justify-between">
         <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-white/10 rounded-lg transition-colors text-[#B0B3B8] font-semibold text-[15px]">
            <ThumbsUp size={18} /> Like
         </button>
         <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-white/10 rounded-lg transition-colors text-[#B0B3B8] font-semibold text-[15px]">
            <MessageSquare size={18} /> Comment
         </button>
         <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-white/10 rounded-lg transition-colors text-[#B0B3B8] font-semibold text-[15px]">
            <Share2 size={18} /> Share
         </button>
      </div>
    </div>
  );
};
