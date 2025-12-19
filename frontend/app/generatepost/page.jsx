"use client";
import PostEditor from "@/components/Contentgenerate/Post";
import React, { Suspense } from "react";

export default function Postpage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
          Loading post...
        </div>
      }
    >
      <PostEditor />
    </Suspense>
  );
}