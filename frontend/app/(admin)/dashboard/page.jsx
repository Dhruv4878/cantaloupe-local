"use client";

import { useState } from "react";
import DashboardView from "@/components/Contentgenerate/DashboardView";

export default function DashboardPage({ onPostCountUpdate }) {
  const [usedPosts, setUsedPosts] = useState(0);

  // If layout injected a setter, use it; otherwise fall back to local setter
  const setter = typeof onPostCountUpdate === "function" ? onPostCountUpdate : setUsedPosts;

  return <DashboardView onPostCountUpdate={setter} />;
}