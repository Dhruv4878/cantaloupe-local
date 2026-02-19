"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Users,
  CreditCard,
  Repeat,
  TrendingUp,
} from "lucide-react";
import { RevenueChart, UserDistributionChart } from "@/components/admin/AnalyticsCharts";

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`p-6 rounded-2xl relative text-white ${className}`}
    style={{
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
    }}
  >
    {children}
  </div>
);

const StatCard = ({ title, value, icon: Icon, color }) => (
  <GlassCard className="flex items-center space-x-4">
    <div className={`p-3 rounded-full ${color} bg-opacity-20`}>
      <Icon size={24} className={color.replace("bg-", "text-")} />
    </div>
    <div>
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  </GlassCard>
);

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activePaidUsers: 0,
    freeUsers: 0,
    repitors: 0,
  });
  const [graphData, setGraphData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        const headers = { Authorization: `Bearer ${token}` };
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

        const [statsRes, graphRes, recentRes] = await Promise.all([
          fetch(`${apiUrl}/super-admin/analytics/stats`, { headers }),
          fetch(`${apiUrl}/super-admin/analytics/graph`, { headers }),
          fetch(`${apiUrl}/super-admin/analytics/recent`, { headers }),
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (graphRes.ok) setGraphData(await graphRes.json());
        if (recentRes.ok) setRecentTransactions(await recentRes.json());
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading Analytics...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Earnings"
          value={`₹${stats.totalEarnings.toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Active Paid Users"
          value={stats.activePaidUsers}
          icon={CreditCard}
          color="bg-purple-500"
        />
        <StatCard
          title="Free Users"
          value={stats.freeUsers}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Repeat Users"
          value={stats.repitors}
          icon={Repeat}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} /> Revenue Trend (Last 30 Days)
          </h3>
          <RevenueChart data={graphData} />
        </GlassCard>

        <GlassCard>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users size={20} /> User Distribution
          </h3>
          <UserDistributionChart
            freeUsers={stats.freeUsers}
            paidUsers={stats.activePaidUsers}
          />
        </GlassCard>
      </div>

      {/* Recent Transactions Table */}
      <GlassCard>
        <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="p-3">User</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => (
                <tr key={tx._id} className="border-b border-gray-800 hover:bg-white/5">
                  <td className="p-3">
                    {tx.user_id?.firstName} {tx.user_id?.lastName}
                    <div className="text-xs text-gray-500">{tx.user_id?.email}</div>
                  </td>
                  <td className="p-3 text-sm">{tx.plan_id?.name || "N/A"}</td>
                  <td className="p-3 font-mono">₹{tx.amount}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        tx.status === "completed"
                          ? "bg-green-500/20 text-green-400"
                          : tx.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-400">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
