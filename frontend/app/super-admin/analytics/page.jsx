"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Users,
  CreditCard,
  Repeat,
  TrendingUp,
  Eye,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Filter
} from "lucide-react";
import { RevenueChart, UserDistributionChart } from "@/components/admin/AnalyticsCharts";
import StatsCard from "@/components/ui/admin/StatsCard";
import DataTable from "@/components/ui/admin/DataTable";

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
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState(""); // Add search state

  // Transaction modal state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionPagination, setTransactionPagination] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const fetchAnalytics = async () => {
    try {
      // Don't set full loading on search interactions to avoid flickering whole page
      // But for initial load we want it. 
      // We can check if data exists.
      if (stats.totalEarnings === 0) setLoading(true);
      
      const fetchOptions = { credentials: 'include' };

      // Append search parameter
      const recentUrl = `${apiUrl}/super-admin/analytics/recent?filter=${filter}&search=${encodeURIComponent(searchTerm)}`;

      const [statsRes, graphRes, recentRes] = await Promise.all([
        fetch(`${apiUrl}/super-admin/analytics/stats`, fetchOptions),
        fetch(`${apiUrl}/super-admin/analytics/graph`, fetchOptions),
        fetch(recentUrl, fetchOptions),
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

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchAnalytics();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, searchTerm]); // Trigger on filter or search change

  // --- Transactions Modal Logic ---

  const fetchUserTransactions = async (userId, transactionPage = 1) => {
    try {
      setTransactionLoading(true);
      const res = await fetch(`${apiUrl}/super-admin/users/${userId}/transactions?page=${transactionPage}&limit=10`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTransactionPagination(data.pagination || {});
        setSelectedUser(data.user || null);
      }
    } catch (err) {
      console.error("Transaction fetch error:", err);
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleViewTransactions = (userId) => {
    setSelectedUserId(userId);
    setShowTransactionModal(true);
    fetchUserTransactions(userId);
  };

  const closeTransactionModal = () => {
    setShowTransactionModal(false);
    setSelectedUserId(null);
    setTransactions([]);
    setTransactionPagination({});
    setSelectedUser(null);
  };

  // --- Table Columns ---
  const columns = [
    {
      header: "User",
      accessor: "user",
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">
            {row.user_id?.firstName} {row.user_id?.lastName || row.user_id?.name}
          </div>
          <div className="text-xs text-gray-500">{row.user_id?.email}</div>
        </div>
      )
    },
    {
      header: "Plan",
      accessor: "plan",
      render: (row) => <span className="text-sm text-gray-600">{row.plan_id?.name || "N/A"}</span>
    },
    {
      header: "Amount",
      accessor: "amount",
      render: (row) => <span className="font-mono font-medium text-gray-900">₹{row.amount}</span>
    },
    {
      header: "IDs", // New Column for Order/Payment IDs
      accessor: "ids",
      render: (row) => (
        <div className="flex flex-col gap-1 max-w-[150px]">
           {row.gatewayOrderId && (
             <span className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100 truncate" title={`Order: ${row.gatewayOrderId}`}>
               Ord: {row.gatewayOrderId}
             </span>
           )}
           {row.gatewayPaymentId && (
             <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 truncate" title={`Payment: ${row.gatewayPaymentId}`}>
               Pay: {row.gatewayPaymentId}
             </span>
           )}
           {!row.gatewayOrderId && !row.gatewayPaymentId && <span className="text-xs text-gray-400">-</span>}
        </div>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            row.status === "completed"
              ? "bg-green-100 text-green-700"
              : row.status === "pending"
              ? "bg-yellow-100 text-yellow-700"
              : row.status === "free"
              ? "bg-gray-100 text-gray-600"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.status}
        </span>
      )
    },
    {
      header: "Date",
      accessor: "date",
      render: (row) => <span className="text-xs text-gray-500">{new Date(row.createdAt).toLocaleDateString()}</span>
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleViewTransactions(row.user_id?._id); }}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View History"
        >
          <Eye size={18} />
        </button>
      )
    }
  ];

  if (loading && !stats.totalEarnings) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of platform performance and revenue</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Earnings"
          value={`₹${stats.totalEarnings.toLocaleString()}`}
          icon={DollarSign}
          loading={loading}
        />
        <StatsCard
          title="Active Paid Users"
          value={stats.activePaidUsers}
          icon={CreditCard}
          loading={loading}
        />
        <StatsCard
          title="Free Users"
          value={stats.freeUsers}
          icon={Users}
          loading={loading}
        />
        <StatsCard
          title="Repeat Users"
          value={stats.repitors}
          icon={Repeat}
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" /> 
            Revenue Trend (30 Days)
          </h3>
          <RevenueChart data={graphData} theme="light" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users size={20} className="text-purple-600" /> 
            User Distribution
          </h3>
          <UserDistributionChart
            freeUsers={stats.freeUsers}
            paidUsers={stats.activePaidUsers}
            theme="light"
          />
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
          
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer hover:border-gray-300 transition-colors"
            >
              <option value="all">All Transactions</option>
              <option value="paid_users">Paid Users</option>
              <option value="free_users">Free Users</option>
              <option value="recurring">Recurring Users</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <DataTable 
          title="Transaction Log"
          columns={columns}
          data={recentTransactions}
          searchPlaceholder="Search by Name, Email, or Order ID..."
          onSearch={setSearchTerm}
          disableClientFilter={true}
        />
      </div>

      {/* Transaction Modal (Same as other pages, kept for consistency) */}
      {showTransactionModal && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
                {selectedUser && (
                  <p className="text-sm text-gray-500 mt-0.5">{selectedUser.name} ({selectedUser.email})</p>
                )}
              </div>
              <button onClick={closeTransactionModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
              {transactionLoading ? (
                 <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="mx-auto mb-3 text-gray-300" size={48} />
                  <p>No transactions found for this user.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx._id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2.5 rounded-lg ${tx.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
                            {tx.status === 'completed' ? <CheckCircle size={20} /> : <CreditCard size={20} />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{tx.planName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                                tx.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                tx.status === 'failed' ? 'bg-red-100 text-red-700' : 
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {tx.status}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">₹{tx.amount}</p>
                          <p className="text-xs text-gray-500 capitalize">{tx.paymentMode}ly</p>
                        </div>
                      </div>
                      
                      {/* Meta Details */}
                      <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div>
                          <span className="block text-gray-400">Gateway</span>
                          <span className="font-medium text-gray-700">{tx.gateway}</span>
                        </div>
                        <div>
                           <span className="block text-gray-400">Type</span>
                           <span className="font-medium text-gray-700 capitalize">{tx.type}</span>
                        </div>
                        {tx.gatewayTransactionId && (
                          <div className="col-span-2 border-t border-gray-200 pt-2">
                             <span className="block text-gray-400 mb-0.5">Transaction ID</span>
                             <span className="font-mono text-gray-600 select-all break-all">{tx.gatewayTransactionId}</span>
                          </div>
                        )}
                        {tx.gatewayOrderId && (
                          <div className="col-span-2 border-t border-gray-200 pt-2">
                             <span className="block text-gray-400 mb-0.5">Order ID</span>
                             <span className="font-mono text-gray-600 select-all break-all">{tx.gatewayOrderId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {transactionPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        onClick={() => fetchUserTransactions(selectedUserId, transactionPagination.page - 1)}
                        disabled={!transactionPagination.hasPrev}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm text-black"
                      >
                        Prev
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-600">
                        {transactionPagination.page} / {transactionPagination.totalPages}
                      </span>
                      <button
                        onClick={() => fetchUserTransactions(selectedUserId, transactionPagination.page + 1)}
                        disabled={!transactionPagination.hasNext}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm text-black"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={closeTransactionModal}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
