
import React from "react";
import { 
  MoreHorizontal, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark,
  Image as ImageIcon
} from "lucide-react";

export const InstagramPreview = ({ 
  content, 
  imageUrl, 
  hashtags = [], 
  brandName = "Your Brand",
  userImage,
  isGenerating = false
}) => {
  return (
    <div className="w-full max-w-[420px] bg-black border border-gray-800 rounded-[30px] overflow-hidden shadow-2xl relative mx-auto">
      {/* Fake Status Bar */}
      <div className="h-7 bg-black flex items-center justify-between px-6">
        <span className="text-[10px] font-bold text-white">9:41</span>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 bg-white/20 rounded-full"></div>
          <div className="w-3 h-3 bg-white/20 rounded-full"></div>
        </div>
      </div>

      {/* App Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black border-b border-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-purple-600 p-[2px]">
            {userImage ? (
                <img src={userImage} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-black" />
            ) : (
                <div className="w-full h-full rounded-full bg-gray-900 border-2 border-black"></div>
            )}
          </div>
          <span className="text-sm font-semibold text-white">{brandName}</span>
        </div>
        <MoreHorizontal size={20} className="text-gray-400" />
      </div>

      {/* Image Area */}
      <div className="relative w-full bg-[#111] aspect-square flex items-center justify-center overflow-hidden bg-contain bg-center bg-no-repeat" style={{ backgroundImage: imageUrl && !isGenerating ? `url(${imageUrl})` : 'none' }}>
        {isGenerating ? (
             <div className="flex flex-col items-center gap-3">
                 <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-xs text-orange-500 animate-pulse">Generating visual...</span>
             </div>
        ) : !imageUrl && (
            <div className="text-gray-600 flex flex-col items-center">
                 <ImageIcon size={32} className="mb-2 opacity-50"/>
                 <span className="text-xs">No image available</span>
            </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="px-4 py-3 flex items-center justify-between bg-black">
        <div className="flex items-center gap-4 text-white">
          <Heart size={24} className="hover:text-red-500 transition-colors cursor-pointer"/>
          <MessageCircle size={24} className="hover:text-gray-300 transition-colors cursor-pointer"/>
          <Send size={24} className="hover:text-gray-300 transition-colors cursor-pointer"/>
        </div>
        <Bookmark size={24} className="text-white hover:text-gray-300 transition-colors cursor-pointer" />
      </div>

      {/* Caption Preview Area */}
      <div className="px-4 pb-6 bg-black min-h-[120px]">
        <div className="text-sm text-white mb-2 font-semibold">1,234 likes</div>
        <div className="text-sm text-gray-100 leading-relaxed break-words">
          <span className="font-semibold mr-2">{brandName}</span>
          {content}
        </div>
        <div className="mt-2 text-sm text-blue-400 leading-relaxed break-words font-light">
          {hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(" ")}
        </div>
      </div>
    </div>
  );
};
