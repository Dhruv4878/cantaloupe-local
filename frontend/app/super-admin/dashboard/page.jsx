"use client";

import { useEffect, useState } from "react";
import StatsCard from "@/components/ui/admin/StatsCard";
import { Users, FileText, Activity, Calendar, AlertCircle, TrendingUp } from "lucide-react";

export default function SuperAdminStatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/super-admin/stats`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Failed to load stats");
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Normalize backend payload so UI uses consistent field names
      const raw = data.stats || {};
      const normalized = {
        totalUsers: raw.totalUsers ?? raw.users ?? 0,
        totalPosts: raw.totalPosts ?? raw.posts ?? 0,
        activeUsers: raw.activeUsers ?? raw.active_users ?? 0,
        weeklyActiveUsers:
          raw.weeklyActiveUsers ?? raw.weekly_active_users ?? 0,
        scheduledPosts: raw.scheduledPosts ?? raw.scheduled_posts ?? 0,
        failedPosts: raw.failedPosts ?? raw.failed_posts ?? 0,
        ...raw,
      };

      setStats(normalized);
    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
        Error fetching stats. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-gray-500">
          Real-time insights and performance metrics.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={Users}
          trend={{ value: 12, label: "vs last month", isPositive: true }}
        />
        <StatsCard 
          title="Total Posts" 
          value={stats.totalPosts} 
          icon={FileText}
          trend={{ value: 8, label: "vs last month", isPositive: true }}
        />
        <StatsCard 
          title="Active Users" 
          value={stats.activeUsers} 
          icon={Activity}
          description="Users active in last 30 days"
        />
        <StatsCard 
          title="Weekly Active" 
          value={stats.weeklyActiveUsers} 
          icon={TrendingUp}
          description="Users active in last 7 days"
        />
        <StatsCard 
          title="Scheduled" 
          value={stats.scheduledPosts} 
          icon={Calendar}
          description="Posts waiting to be published"
        />
        <StatsCard 
          title="Failed Posts" 
          value={stats.failedPosts} 
          icon={AlertCircle}
          trend={{ value: 2, label: "vs last month", isPositive: false }}
          className="bg-red-50/30 border-red-100"
        />
      </div>

      {/* Analytics Placeholder */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Analytics Trends</h3>
          <select className="text-sm border-gray-200 rounded-lg text-gray-500 focus:ring-blue-500 focus:border-blue-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
        
        <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center p-6">
          <div className="bg-white p-3 rounded-full shadow-sm mb-3">
            <TrendingUp className="text-blue-500" size={24} />
          </div>
          <h4 className="text-gray-900 font-medium mb-1">Chart Visualization</h4>
          <p className="text-gray-500 text-sm max-w-sm">
            Detailed analytics charts will appear here once connected to historical data.
          </p>
        </div>
      </div>
    </div>
  );
}
