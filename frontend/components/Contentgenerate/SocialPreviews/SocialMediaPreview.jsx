
import React from "react";
import { InstagramPreview } from "./InstagramPreview";
import { FacebookPreview } from "./FacebookPreview";
import { LinkedInPreview } from "./LinkedInPreview";
import { TwitterPreview } from "./TwitterPreview";

export const SocialMediaPreview = ({
  platform,
  content,
  imageUrl,
  hashtags = [],
  brandName = "Your Brand",
  userImage,
  isGenerating
}) => {
  // Normalize platform key/names
  const p = platform?.toLowerCase();

  switch (p) {
    case "instagram":
      return (
        <InstagramPreview
          content={content}
          imageUrl={imageUrl}
          hashtags={hashtags}
          brandName={brandName}
          userImage={userImage}
          isGenerating={isGenerating}
        />
      );
    case "facebook":
      return (
        <FacebookPreview
          content={content}
          imageUrl={imageUrl}
          hashtags={hashtags}
          brandName={brandName}
          userImage={userImage}
          isGenerating={isGenerating}
        />
      );
    case "linkedin":
      return (
        <LinkedInPreview
          content={content}
          imageUrl={imageUrl}
          hashtags={hashtags}
          brandName={brandName}
          userImage={userImage}
          isGenerating={isGenerating}
        />
      );
    case "x":
    case "twitter":
      return (
        <TwitterPreview
          content={content}
          imageUrl={imageUrl}
          hashtags={hashtags}
          brandName={brandName}
          userImage={userImage}
          isGenerating={isGenerating}
        />
      );
    default:
      return (
        <div className="w-full max-w-[420px] aspect-square bg-[#111] rounded-[30px] flex items-center justify-center text-gray-500 border border-gray-800">
          Unsupported Platform: {platform}
        </div>
      );
  }
};
