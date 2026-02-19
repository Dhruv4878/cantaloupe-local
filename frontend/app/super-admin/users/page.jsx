"use client";

import { useEffect, useState } from "react";
import { Eye, CheckCircle, XCircle, MoreVertical, Edit2, CreditCard, RefreshCw, X } from "lucide-react";
import DataTable from "@/components/ui/admin/DataTable";

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination state
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  // Filter State
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [availablePlans, setAvailablePlans] = useState([]);

  // Transaction modal state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users
  // Fetch users & plans
  useEffect(() => {
    fetchAvailablePlans();
  }, []);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page, limit, filterStatus, filterPlan, sortBy, sortOrder]);

  const fetchAvailablePlans = async () => {
    try {
      const res = await fetch(`${apiUrl}/super-admin/plans`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAvailablePlans(data);
      }
    } catch (e) {
      console.error("Failed to fetch plans", e);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (debouncedSearch) params.set("search", debouncedSearch);
      
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterPlan !== "all") params.set("plan", filterPlan);
      
      params.set("sortBy", sortBy);
      params.set("order", sortOrder);

      const res = await fetch(`${apiUrl}/super-admin/users?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      
      setUsers(data.users || []);
      setTotal(Number(data.count || 0));
    } catch (err) {
      console.error("Users fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  const togglePlanActive = async (userId, currentlyActive) => {
    // Optimistic update
    const newActive = !currentlyActive;
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, planInfo: { ...u.planInfo, isActive: newActive } } : u));

    try {
      const res = await fetch(`${apiUrl}/super-admin/users/${userId}/plan-active`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planActive: newActive }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      console.log("Plan updated:", data);
    } catch (err) {
      console.error("Error toggling plan:", err);
      // Revert
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, planInfo: { ...u.planInfo, isActive: currentlyActive } } : u));
      if (typeof window !== 'undefined') window.alert("Failed to update plan status");
    }
  };

  const toggleUserActive = async (userId, currentlyActive) => {
    // Optimistic update
    const newActive = !currentlyActive;
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, active: newActive } : u));

    try {
      const res = await fetch(`${apiUrl}/super-admin/users/${userId}/active`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update account status");
      const data = await res.json();
      console.log("User status updated:", data);
    } catch (err) {
      console.error("Error toggling user status:", err);
      // Revert
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, active: currentlyActive } : u));
      if (typeof window !== 'undefined') window.alert("Failed to update account status");
    }
  };

  const adjustCredit = async (userId, currentLimit) => {
    const answer = window.prompt("Set new credit limit:", String(currentLimit ?? 0));
    if (answer === null) return;
    
    const parsed = Number(answer);
    if (isNaN(parsed) || parsed < 0) {
      alert("Invalid credit limit");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/super-admin/users/${userId}/credit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditLimit: parsed }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update credit");
      const data = await res.json();
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, ...data.user } : u));
    } catch (err) {
      console.error("Credit update error:", err);
      alert("Failed to update credit");
    }
  };

  const fetchUserTransactions = async (userId) => {
    try {
      setTransactionLoading(true);
      const res = await fetch(`${apiUrl}/super-admin/users/${userId}/transactions?page=1&limit=10`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setSelectedUser(data.user || null);
      }
    } catch (err) {
      console.error("Transaction error:", err);
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleViewTransactions = (userId) => {
    setSelectedUserId(userId);
    setShowTransactionModal(true);
    fetchUserTransactions(userId);
  };

  // --- COLUMNS DEF ---
  const columns = [
    {
      header: "User",
      accessor: "name",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            {row.firstName || row.lastName ? `${row.firstName} ${row.lastName}` : row.name || "N/A"}
          </span>
          <span className="text-xs text-gray-400">{row.email}</span>
        </div>
      )
    },
    {
      header: "Total Posts",
      accessor: "postsGenerated",
      render: (row) => (
        <span className="font-medium text-gray-900 text-center block w-full">{row.postsGenerated || 0}</span>
      )
    },
    {
      header: "Plan Usage (Mo/Limit)",
      accessor: "monthlyUsage",
      render: (row) => (
        <div className="text-sm">
           <span className="font-medium text-gray-900">{row.monthlyPosts || 0}</span>
           <span className="text-gray-400 mx-1">/</span>
           <span className="text-gray-500">
             {row.planInfo?.monthlyLimit > 0 ? row.planInfo.monthlyLimit : "∞"}
           </span>
        </div>
      )
    },
    {
      header: "Account",
      accessor: "accountStatus",
      render: (row) => {
        const isActive = row.active !== false; // Default to true if undefined
        
        return (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${isActive ? "text-green-600" : "text-red-600"}`}>
              {isActive ? "Active" : "Disabled"}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleUserActive(row._id, isActive); }}
              className={`
                relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                ${isActive ? 'bg-green-500' : 'bg-gray-300'}
              `}
              title={isActive ? "Disable Account" : "Enable Account"}
            >
              <span
                className={`
                  inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
                  ${isActive ? 'translate-x-4' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        );
      }
    },
    {
      header: "Plan",
      accessor: "plan",
      render: (row) => {
        const planName = row.currentPlanName || row.planInfo?.planName || "Free";
        const isActive = row.planInfo?.isActive !== false;
        
        return (
          <div className="flex items-center gap-3">
             <div className="flex flex-col">
              <span className={`text-sm font-medium ${isActive ? "text-green-600" : "text-gray-500"}`}>
                {planName}
              </span>
            </div>
            {/* Toggle Switch */}
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlanActive(row._id, isActive); }}
              className={`
                relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isActive ? 'bg-blue-600' : 'bg-gray-200'}
              `}
              title={isActive ? "Deactivate Plan" : "Activate Plan"}
            >
              <span
                className={`
                  inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
                  ${isActive ? 'translate-x-4' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        );
      }
    },
    {
      header: "Credits",
      accessor: "credits",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {row.creditsUsed || 0} / {row.creditLimit || 0}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); adjustCredit(row._id, row.creditLimit); }}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600"
            title="Edit Credit Limit"
          >
            <Edit2 size={14} />
          </button>
        </div>
      )
    },
    {
      header: "Joined",
      accessor: "createdAt",
      render: (row) => (
        <span className="text-xs text-gray-500">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleViewTransactions(row._id); }}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Transactions"
          >
            <CreditCard size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500">Manage user accounts, plans, and credits</p>
          </div>
          <button 
             onClick={() => { setPage(1); fetchUsers(); }} 
             disabled={loading}
             className="p-2 sm:px-4 sm:py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>

        <DataTable 
          title="All Users"
          columns={columns}
          data={users}
          searchPlaceholder="Search by name or email..."
          onSearch={(term) => setSearchTerm(term)}
          
          // Server-side Pagination Props
          manualPagination={true}
          totalItems={total}
          currentPage={page}
          itemsPerPage={limit}
          onPageChange={(newPage) => setPage(newPage)}
          
          // Filters
          filters={
            <>
               <select 
                 value={filterStatus}
                 onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                 className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="all">All Status</option>
                 <option value="active">Active</option>
                 <option value="disabled">Disabled</option>
               </select>

               <select 
                 value={filterPlan}
                 onChange={(e) => { setFilterPlan(e.target.value); setPage(1); }}
                 className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[150px]"
               >
                 <option value="all">All Plans</option>
                 <option value="free">Free</option>
                 {availablePlans.filter(p => p.name.toLowerCase() !== 'free').map(p => (
                   <option key={p._id} value={p._id}>{p.name}</option>
                 ))}
                 <optgroup label="Credit Packs">
                   <option value="starter">Starter Pack (10)</option>
                   <option value="growth">Growth Pack (30)</option>
                   <option value="power">Power Pack (50)</option>
                   <option value="agency">Agency Pack (100)</option>
                 </optgroup>
               </select>

               <select 
                 value={`${sortBy}-${sortOrder}`}
                 onChange={(e) => { 
                    const [field, order] = e.target.value.split("-");
                    setSortBy(field);
                    setSortOrder(order);
                    setPage(1);
                 }}
                 className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="createdAt-desc">Newest First</option>
                 <option value="createdAt-asc">Oldest First</option>
                 <option value="postsGenerated-desc">Most Posts</option>
                 <option value="monthlyPosts-desc">High Usage</option>
                 <option value="creditsUsed-desc">Top Credit Users</option>
                 <option value="lastUsed-desc">Recently Active</option>
                 <option value="name-asc">Name (A-Z)</option>
               </select>
            </>
          }
        />
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Transactions Log</h3>
                <p className="text-sm text-gray-500">{selectedUser?.email}</p>
              </div>
              <button 
                onClick={() => setShowTransactionModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {transactionLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3">
              {transactions.map((tx, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2.5 rounded-lg ${
                            tx.status === 'succeeded' || tx.status === 'completed' ? 'bg-green-50 text-green-600' : 
                            tx.status === 'failed' ? 'bg-red-50 text-red-700' : 
                            'bg-yellow-50 text-yellow-700'
                          }`}>
                            {tx.status === 'succeeded' || tx.status === 'completed' ? <CheckCircle size={20} /> : <CreditCard size={20} />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{tx.description || tx.planName || "Plan Purchase"}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                                tx.status === 'succeeded' || tx.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                tx.status === 'failed' ? 'bg-red-100 text-red-700' : 
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {tx.status}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                {new Date(tx.date || tx.createdAt).toLocaleDateString()} {new Date(tx.date || tx.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {tx.currency === 'inr' || !tx.currency ? '₹' : '$'}{(tx.amount || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{tx.paymentMode ? `${tx.paymentMode}ly` : 'One-time'}</p>
                        </div>
                      </div>
                      
                      {/* Meta Details */}
                      <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div>
                          <span className="block text-gray-400">Gateway</span>
                          <span className="font-medium text-gray-700">{tx.gateway || "N/A"}</span>
                        </div>
                        <div>
                           <span className="block text-gray-400">Type</span>
                           <span className="font-medium text-gray-700 capitalize">{tx.type || "Purchase"}</span>
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
                        {tx.failureReason && (
                          <div className="col-span-2 text-red-600 bg-red-50 p-1.5 rounded border border-red-100 mt-1">
                            <span className="font-semibold">Failed:</span> {tx.failureReason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <CreditCard size={48} className="mb-4 opacity-50" />
                  <p>No transactions found for this user.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex justify-end">
              <button 
                onClick={() => setShowTransactionModal(false)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
