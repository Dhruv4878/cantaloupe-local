"use client";

import { useEffect, useState } from "react";

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
    return <div>Loading stats...</div>;
  }

  if (!stats) {
    return <div>Error fetching stats.</div>;
  }

  return (
    <div>
      <h1
        style={{ fontSize: "1.8rem", fontWeight: "600", marginBottom: "20px" }}
      >
        Platform Statistics
      </h1>

      {/* KPI CARDS */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "30px",
        }}
      >
        {/* Total Users */}
        <StatCard title="Total Users" value={stats.totalUsers} />

        {/* Total Posts */}
        <StatCard title="Total Posts" value={stats.totalPosts} />

        {/* Reserved Future Metrics */}
        <StatCard title="Active Users" value={stats.activeUsers || 0} />
        <StatCard
          title="Weekly Active Users"
          value={stats.weeklyActiveUsers || 0}
        />
        <StatCard title="Scheduled Posts" value={stats.scheduledPosts || 0} />
        <StatCard title="Failed Posts" value={stats.failedPosts || 0} />
      </div>

      {/* FUTURE: CHARTS SECTION */}
      <div
        style={{
          padding: "20px",
          background: "#fff",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginBottom: "20px", fontSize: "1.4rem" }}>Analytics</h2>

        <p style={{ opacity: 0.7 }}>
          Chart components (Recharts / Chart.js) can be added here once
          additional data is available from backend. The layout is ready for
          extension.
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// COMPONENT: KPI Card
// ----------------------------------------------------------

function StatCard({ title, value }) {
  return (
    <div
      style={{
        flex: "1",
        minWidth: "240px",
        padding: "20px",
        background: "#fff",
        borderRadius: "10px",
        boxShadow: "0 0 10px rgba(0,0,0,0.08)",
      }}
    >
      <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{title}</h3>
      <p
        style={{
          fontSize: "2rem",
          fontWeight: "700",
          marginTop: "10px",
        }}
      >
        {value}
      </p>
    </div>
  );
}
