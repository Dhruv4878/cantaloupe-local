
import React from "react";
import { 
  MoreHorizontal, 
  MessageCircle, 
  Repeat2, 
  Heart, 
  Share, 
  BarChart2
} from "lucide-react";

export const TwitterPreview = ({ 
  content, 
  imageUrl, 
  hashtags = [], 
  brandName = "Your Brand",
  userImage,
  isGenerating = false
}) => {
  return (
    <div className="w-full max-w-[420px] bg-black border border-gray-800 rounded-xl overflow-hidden shadow-2xl relative mx-auto text-white font-sans p-4">
      {/* Header */}
      <div className="flex gap-3">
         <div className="w-10 h-10 rounded-full bg-gray-800 shrink-0 overflow-hidden">
             {userImage ? (
                <img src={userImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-gray-700"></div>
            )}
         </div>
         
         <div className="flex-1 min-w-0">
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-1 truncate">
                     <span className="font-bold text-[15px] truncate">{brandName}</span>
                     <span className="text-gray-500 text-[15px] truncate">@{brandName.replace(/\s+/g, '').toLowerCase()}</span>
                     <span className="text-gray-500 text-[15px] mx-1">·</span>
                     <span className="text-gray-500 text-[15px]">1h</span>
                 </div>
                 <MoreHorizontal size={16} className="text-gray-500" />
             </div>

             {/* Content */}
             <div className="mt-1 text-[15px] text-white leading-normal break-words whitespace-pre-wrap">
                {content}
                <div className="mt-2 text-blue-400">
                    {hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(" ")}
                </div>
             </div>

             {/* Image */}
             {isGenerating ? (
                <div className="mt-3 h-64 rounded-2xl border border-gray-800 bg-gray-900/50 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-orange-500 animate-pulse">Generating visual...</span>
                </div>
             ) : imageUrl ? (
                 <div className="mt-3 rounded-2xl overflow-hidden border border-gray-800">
                    <img src={imageUrl} alt="Post media" className="w-full max-h-[300px] object-cover" />
                 </div>
             ) : (
                <div className="mt-3 h-32 rounded-2xl border border-gray-800 bg-gray-900/50 flex items-center justify-center text-gray-500 text-sm">
                    No Media
                </div>
             )}

            {/* Actions */}
            <div className="mt-3 flex items-center justify-between text-gray-500 max-w-md pr-4">
                <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-500">
                    <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                        <MessageCircle size={18} />
                    </div>
                    <span className="text-xs">24</span>
                </div>
                <div className="flex items-center gap-2 group cursor-pointer hover:text-green-500">
                    <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                        <Repeat2 size={18} />
                    </div>
                    <span className="text-xs">12</span>
                </div>
                <div className="flex items-center gap-2 group cursor-pointer hover:text-pink-500">
                    <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition-colors">
                        <Heart size={18} />
                    </div>
                    <span className="text-xs">154</span>
                </div>
                 <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-500">
                    <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                        <BarChart2 size={18} />
                    </div>
                    <span className="text-xs">1.2k</span>
                </div>
                <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-500">
                    <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                        <Share size={18} />
                    </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};
