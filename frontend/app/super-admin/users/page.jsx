"use client";

import { useEffect, useState } from "react";
import { Facebook, Instagram, Linkedin, Twitter, Eye, X, Calendar, CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSortFields, setSelectedSortFields] = useState([]);
  const [sortDirection, setSortDirection] = useState("desc");
  const [appliedSortFields, setAppliedSortFields] = useState([]);
  const [appliedSortDirection, setAppliedSortDirection] = useState("desc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  
  // Transaction modal state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionPagination, setTransactionPagination] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const fetchUsers = async (options = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const sortParam =
        options.sortBy ??
        (appliedSortFields.length > 0
          ? appliedSortFields.join(",")
          : selectedSortFields.length > 0
          ? selectedSortFields.join(",")
          : null);
      const orderParam = options.order ?? appliedSortDirection ?? sortDirection;
      if (sortParam) params.set("sortBy", sortParam);
      if (sortParam && orderParam) params.set("order", orderParam);

      const pageParam = options.page ?? page;
      const limitParam = options.limit ?? limit;
      if (pageParam) params.set("page", String(pageParam));
      if (limitParam) params.set("limit", String(limitParam));

      const url = `${apiUrl}/super-admin/users${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Failed to fetch users");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setUsers(data.users || []);
      setTotal(Number(data.count || 0));
      setPage(Number(data.page || pageParam || 1));
      setLimit(Number(data.limit || limitParam || limit));
    } catch (err) {
      console.error("Users fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (userId, currentlyActive) => {
    const newActive = !currentlyActive;
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, active: newActive } : u))
    );

    try {
      const res = await fetch(`${apiUrl}/super-admin/users/${userId}/active`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !!newActive }),
      });

      if (!res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId ? { ...u, active: currentlyActive } : u
          )
        );
        return;
      }
      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, ...data.user } : u))
      );
    } catch (err) {
      console.error("Toggle active error:", err);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, active: currentlyActive } : u
        )
      );
    }
  };

  const togglePlanActive = async (userId, currentlyActive) => {
    const newActive = !currentlyActive;
    
    // Optimistically update UI
    setUsers((prev) =>
      prev.map((u) => 
        u._id === userId 
          ? { 
              ...u, 
              planInfo: { 
                ...u.planInfo, 
                isActive: newActive 
              } 
            } 
          : u
      )
    );

    try {
      const res = await fetch(`${apiUrl}/super-admin/users/${userId}/plan-active`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planActive: !!newActive }),
      });

      if (!res.ok) {
        // Revert on error
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId 
              ? { 
                  ...u, 
                  planInfo: { 
                    ...u.planInfo, 
                    isActive: currentlyActive 
                  } 
                } 
              : u
          )
        );
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || "Failed to update plan status");
        return;
      }
      
      const data = await res.json();
      console.log("Plan status updated:", data);
    } catch (err) {
      console.error("Toggle plan active error:", err);
      // Revert on error
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId 
            ? { 
                ...u, 
                planInfo: { 
                  ...u.planInfo, 
                  isActive: currentlyActive 
                } 
              } 
            : u
        )
      );
      alert("Failed to update plan status");
    }
  };

  const adjustCredit = async (userId, currentLimit) => {
    const answer = window.prompt(
      "Set new credit limit for user:",
      String(currentLimit ?? 0)
    );
    if (answer === null) return;

    const parsed = Number(answer);
    if (isNaN(parsed) || parsed < 0) {
      alert("Please enter a non-negative number for credit limit.");
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, creditLimit: parsed } : u))
    );

    try {
      const res = await fetch(`${apiUrl}/super-admin/users/${userId}/credit`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditLimit: parsed }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to update user credit");
        fetchUsers();
        return;
      }
      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, ...data.user } : u))
      );
    } catch (err) {
      console.error("Adjust credit error:", err);
      alert("Failed to update credit limit");
      fetchUsers();
    }
  };

  const fetchUserTransactions = async (userId, transactionPage = 1) => {
    try {
      setTransactionLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(transactionPage));
      params.set("limit", "10");

      const url = `${apiUrl}/super-admin/users/${userId}/transactions?${params.toString()}`;

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Failed to fetch user transactions");
        return;
      }

      const data = await res.json();
      setTransactions(data.transactions || []);
      setTransactionPagination(data.pagination || {});
      setSelectedUser(data.user || null);
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

  const toggleField = (field) => {
    setSelectedSortFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const applySort = () => {
    const sortByParam = selectedSortFields.join(",");
    setAppliedSortFields(selectedSortFields);
    setAppliedSortDirection(sortDirection);
    setPage(1);

    if (!sortByParam) {
      fetchUsers({ page: 1, limit });
    } else {
      fetchUsers({ sortBy: sortByParam, order: sortDirection, page: 1, limit });
    }
    setShowSortDropdown(false);
  };

  const clearSort = () => {
    setSelectedSortFields([]);
    setAppliedSortFields([]);
    setSortDirection("desc");
    setAppliedSortDirection("desc");
    setPage(1);
    fetchUsers({ page: 1, limit });
    setShowSortDropdown(false);
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div style={{ padding: "24px" }}>Loading users...</div>;
  }

  return (
    <div>
      {/* GLOBAL STYLES & MEDIA QUERIES */}
      <style>{`
        /* Toggle Switch Styles */
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #e4e4e7;
          transition: .3s;
          border-radius: 34px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        input:checked + .slider {
          background-color: #000000;
        }
        input:checked + .slider:before {
          transform: translateX(22px);
        }

        /* --- RESPONSIVE LAYOUT CLASSES --- */
        
        .page-container {
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
          padding: 0 24px;
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          margin-bottom: 20px;
        }
        
        .controls-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .pagination-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }

        /* Mobile Adjustments (Screens smaller than 768px) */
        @media (max-width: 768px) {
          .page-container {
            padding: 0 16px;
          }

          .header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .controls-row {
            width: 100%;
            justify-content: space-between;
          }

          .pagination-row {
            flex-direction: column;
            gap: 16px;
            align-items: center;
            text-align: center;
          }
        }
      `}</style>

      <div className="page-container">
        {/* --- HEADER ROW --- */}
        <div className="header-row">
          <h1 style={{ fontSize: "1.8rem", fontWeight: "600", margin: 0 }}>
            All Users
          </h1>

          <div className="controls-row">
            {/* Show Rows */}
            <div
              style={{
                background: "#fff",
                padding: "8px 12px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <label
                style={{
                  fontSize: "0.9rem",
                  color: "#444",
                  marginRight: "8px",
                  fontWeight: "500",
                }}
              >
                Rows:
              </label>
              <select
                value={limit}
                onChange={(e) => {
                  const newLimit = Number(e.target.value);
                  setLimit(newLimit);
                  setPage(1);
                  fetchUsers({ page: 1, limit: newLimit });
                }}
                style={{
                  padding: "4px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  cursor: "pointer",
                }}
              >
                {/* <option value={10}>10</option>
                <option value={20}>20</option> */}
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
              </select>
            </div>

            {/* Sort Control */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowSortDropdown((s) => !s)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: "500",
                  color: "#333",
                }}
              >
                <span>Sort by</span>
                <span>▾</span>
              </button>

              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "4px",
                  fontSize: "0.75rem",
                  color: "#666",
                  whiteSpace: "nowrap",
                  textAlign: "right",
                  pointerEvents: "none",
                }}
              >
                {appliedSortFields.length > 0 ? (
                  <span>
                    {appliedSortFields.join(", ")} ({appliedSortDirection})
                  </span>
                ) : null}
              </div>

              {showSortDropdown && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    background: "#fff",
                    border: "1px solid #ddd",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    borderRadius: "6px",
                    padding: "12px",
                    zIndex: 50,
                    minWidth: "220px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ marginBottom: "8px", fontWeight: 600 }}>
                    Fields
                  </div>
                  {["name", "postsGenerated", "creditsUsed", "monthlyPosts", "currentPlanPosts", "lastUsed"].map((field) => (
                    <label
                      key={field}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSortFields.includes(field)}
                        onChange={() => toggleField(field)}
                      />
                      {field === "postsGenerated" ? "Total Posts" :
                       field === "creditsUsed" ? "Credits Used" :
                       field === "monthlyPosts" ? "Overall Monthly" :
                       field === "currentPlanPosts" ? "Current Plan Usage" :
                       field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                  ))}

                  <div style={{ marginTop: "12px" }}>
                    <div style={{ marginBottom: "6px", fontWeight: 600 }}>
                      Direction
                    </div>
                    <select
                      value={sortDirection}
                      onChange={(e) => setSortDirection(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                      }}
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "16px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={clearSort}
                      style={{
                        padding: "6px 10px",
                        background: "none",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Clear
                    </button>
                    <button
                      onClick={applySort}
                      style={{
                        padding: "6px 10px",
                        background: "#111",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- INFO BOX --- */}
        <div style={{
          background: "#f8f9fa",
          border: "1px solid #e9ecef",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "20px",
          fontSize: "0.85rem",
          color: "#495057"
        }}>
          <div style={{ fontWeight: "600", marginBottom: "8px", color: "#212529" }}>
            📊 Column Explanations:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "12px" }}>
            <div>
              <strong>Overall Monthly:</strong> Total posts generated this calendar month regardless of plan changes
            </div>
            <div>
              <strong>Current Plan Usage:</strong> Posts generated on current active plan (resets when plan changes)
            </div>
            <div>
              <strong>Total Posts:</strong> All posts ever generated by the user
            </div>
            <div>
              <strong>Credits Used:</strong> Posts generated using lifetime credits (backup system)
            </div>
            <div>
              <strong>Total Posts:</strong> All-time posts generated by the user
            </div>
            <div>
              <strong>Credits Used:</strong> Posts generated using credit system (backup for monthly plans, primary for free users)
            </div>
            <div>
              <strong>Credit Limit:</strong> Maximum credits available (backup limit for monthly plans, primary limit for free users)
            </div>
          </div>
        </div>

        {/* --- MAIN TABLE CONTAINER --- */}
        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 0 10px rgba(0,0,0,0.08)",
            overflowX: "auto", // Keeps table scrollable on small screens
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "1200px", // Increased for additional columns
            }}
          >
            <thead>
              <tr style={{ background: "#f8f9fa", textAlign: "left" }}>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Plan</th>
                <th style={thStyle}>Plan Active</th>
                <th style={thStyle}>Overall Monthly</th>
                <th style={thStyle}>Current Plan Usage</th>
                <th style={thStyle}>Total Posts</th>
                <th style={thStyle}>Credits Used</th>
                <th style={thStyle}>Credit Limit</th>
                <th style={thStyle}>Platforms</th>
                <th style={thStyle}>Actions</th>
                <th style={thStyle}>User Active</th>
                <th style={thStyle}>Last Used</th>
                <th style={thStyle}>Created</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan="13"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#666",
                    }}
                  >
                    No users found.
                  </td>
                </tr>
              )}

              {users.map((u, i) => {
                const fn = u.firstName ?? u.first_name;
                const ln = u.lastName ?? u.last_name;
                const displayName =
                  fn || ln ? `${fn ?? ""} ${ln ?? ""}`.trim() : u.name || "N/A";

                // Plan information
                const planInfo = u.planInfo || {};
                const planName = planInfo.planName || "Free";
                // Show toggle if user has a monthly plan (even if suspended)
                const isMonthlyPlan = u.hasMonthlyPlan || u.hasActiveMonthlyPlan || false;
                const isPlanActive = planInfo.isActive !== false; // Default to true for Free plans
                const overallMonthlyPosts = u.monthlyPosts || 0; // Calendar month posts
                const currentPlanPosts = u.currentPlanPosts || 0; // Subscription-based posts
                const monthlyLimit = planInfo.monthlyLimit || 0;
                const totalPosts = u.postsGenerated || 0;
                const creditsUsed = u.creditsUsed || 0;
                const creditLimit = u.creditLimit ?? 0;

                return (
                  <tr key={u._id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={tdStyle}>{(page - 1) * limit + i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>
                      {displayName}
                    </td>
                    <td style={tdStyle}>{u.email}</td>
                    
                    {/* Plan Column */}
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ 
                          fontWeight: 500, 
                          color: isMonthlyPlan && isPlanActive ? "#059669" : "#6b7280" 
                        }}>
                          {planName}
                        </span>
                        <span style={{ 
                          fontSize: "0.75rem", 
                          color: isMonthlyPlan && isPlanActive ? "#059669" : "#9ca3af" 
                        }}>
                          {isMonthlyPlan ? (isPlanActive ? "Active" : "Suspended") : "Free Tier"}
                        </span>
                      </div>
                    </td>
                    
                    {/* Plan Active Toggle */}
                    <td style={tdStyle}>
                      {isMonthlyPlan ? (
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={isPlanActive}
                            onChange={() => togglePlanActive(u._id, isPlanActive)}
                          />
                          <span className="slider"></span>
                        </label>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>—</span>
                      )}
                    </td>
                    
                    {/* Overall Monthly Posts Column */}
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontWeight: 500 }}>
                          {overallMonthlyPosts}
                        </span>
                        <span style={{ 
                          fontSize: "0.75rem", 
                          color: "#6b7280" 
                        }}>
                          Calendar Month
                        </span>
                      </div>
                    </td>
                    
                    {/* Current Plan Usage Column */}
                    <td style={tdStyle}>
                      {isMonthlyPlan && isPlanActive ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 500 }}>
                            {currentPlanPosts} / {monthlyLimit}
                          </span>
                          <span style={{ 
                            fontSize: "0.75rem", 
                            color: "#6b7280" 
                          }}>
                            Current Plan
                          </span>
                          <div style={{ 
                            width: "60px", 
                            height: "4px", 
                            backgroundColor: "#e5e7eb", 
                            borderRadius: "2px",
                            overflow: "hidden"
                          }}>
                            <div style={{
                              width: `${Math.min((currentPlanPosts / Math.max(monthlyLimit, 1)) * 100, 100)}%`,
                              height: "100%",
                              backgroundColor: currentPlanPosts >= monthlyLimit ? "#ef4444" : "#3b82f6",
                              transition: "width 0.3s ease"
                            }} />
                          </div>
                        </div>
                      ) : isMonthlyPlan && !isPlanActive ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 500, color: "#9ca3af" }}>
                            Suspended
                          </span>
                          <span style={{ 
                            fontSize: "0.75rem", 
                            color: "#9ca3af" 
                          }}>
                            Plan Inactive
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 500, color: "#9ca3af" }}>
                            —
                          </span>
                          <span style={{ 
                            fontSize: "0.75rem", 
                            color: "#9ca3af" 
                          }}>
                            No Plan Limit
                          </span>
                        </div>
                      )}
                    </td>
                    
                    {/* Total Posts Column */}
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ 
                          fontWeight: 500,
                          color: totalPosts > 0 ? "#2563eb" : "#6b7280"
                        }}>
                          {totalPosts}
                        </span>
                        <span style={{ 
                          fontSize: "0.75rem", 
                          color: "#6b7280" 
                        }}>
                          Total Generated
                        </span>
                      </div>
                    </td>
                    
                    {/* Credits Used Column */}
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ 
                          fontWeight: 500,
                          color: creditsUsed > 0 ? "#dc2626" : "#059669"
                        }}>
                          {creditsUsed}
                        </span>
                        <span style={{ 
                          fontSize: "0.75rem", 
                          color: "#6b7280" 
                        }}>
                          {isMonthlyPlan && isPlanActive ? "Backup Credits" : "Primary Credits"}
                        </span>
                      </div>
                    </td>
                    
                    {/* Credit Limit Column */}
                    <td
                      style={{
                        ...tdStyle,
                        cursor: "pointer",
                        color: "#2563eb",
                      }}
                      title="Click to edit credit limit"
                      onClick={() => adjustCredit(u._id, creditLimit)}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontWeight: 500 }}>
                          {creditLimit}
                        </span>
                        <span style={{ 
                          fontSize: "0.75rem", 
                          color: "#2563eb" 
                        }}>
                          {isMonthlyPlan && isPlanActive ? "Backup Limit" : "Primary Limit"}
                        </span>
                      </div>
                    </td>
                    
                    <td style={tdStyle}>
                      {Array.isArray(u.connectedPlatforms) &&
                      u.connectedPlatforms.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          {u.connectedPlatforms.includes("facebook") && (
                            <Facebook size={16} />
                          )}
                          {u.connectedPlatforms.includes("instagram") && (
                            <Instagram size={16} />
                          )}
                          {u.connectedPlatforms.includes("linkedin") && (
                            <Linkedin size={16} />
                          )}
                          {u.connectedPlatforms.includes("twitter") && (
                            <Twitter size={16} />
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#ccc" }}>—</span>
                      )}
                    </td>
                    
                    {/* Actions Column */}
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleViewTransactions(u._id)}
                        style={{
                          background: "none",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          padding: "6px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#666",
                          fontSize: "0.85rem"
                        }}
                        title="View Transactions"
                      >
                        <Eye size={14} />
                      </button>
                    </td>

                    {/* User Active Toggle */}
                    <td style={tdStyle}>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={u.active !== false}
                          onChange={() =>
                            toggleActive(u._id, u.active !== false)
                          }
                        />
                        <span className="slider"></span>
                      </label>
                    </td>

                    <td style={{ ...tdStyle, fontSize: "0.85rem" }}>
                      {u.lastUsedAt
                        ? new Date(u.lastUsedAt).toLocaleString()
                        : "—"}
                    </td>

                    <td style={{ ...tdStyle, fontSize: "0.85rem" }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* --- PAGINATION --- */}
          <div className="pagination-row">
            <div style={{ fontSize: "0.85rem", color: "#666" }}>
              Showing {total === 0 ? 0 : (page - 1) * limit + 1} -{" "}
              {Math.min(page * limit, total)} of {total} results
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() => {
                  if (page > 1) {
                    const np = page - 1;
                    setPage(np);
                    fetchUsers({ page: np, limit });
                  }
                }}
                disabled={page <= 1}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  background: page <= 1 ? "#f5f5f5" : "#fff",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  color: page <= 1 ? "#aaa" : "#333",
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                Page {page}
              </span>
              <button
                onClick={() => {
                  const totalPages = Math.max(1, Math.ceil(total / limit));
                  if (page < totalPages) {
                    const np = page + 1;
                    setPage(np);
                    fetchUsers({ page: np, limit });
                  }
                }}
                disabled={page >= Math.max(1, Math.ceil(total / limit))}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  background:
                    page >= Math.ceil(total / limit) ? "#f5f5f5" : "#fff",
                  cursor:
                    page >= Math.ceil(total / limit)
                      ? "not-allowed"
                      : "pointer",
                  color: page >= Math.ceil(total / limit) ? "#aaa" : "#333",
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            width: "90%",
            maxWidth: "800px",
            maxHeight: "80vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "20px",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "600" }}>
                  Transaction History
                </h2>
                {selectedUser && (
                  <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: "0.9rem" }}>
                    {selectedUser.name} ({selectedUser.email})
                  </p>
                )}
              </div>
              <button
                onClick={closeTransactionModal}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
              {transactionLoading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  Loading transactions...
                </div>
              ) : transactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                  No transactions found for this user.
                </div>
              ) : (
                <div>
                  {transactions.map((tx) => (
                    <div key={tx._id} style={{
                      border: "1px solid #eee",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "12px",
                      backgroundColor: "#fafafa"
                    }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "12px"
                      }}>
                        <div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px"
                          }}>
                            <span style={{ fontWeight: "600", fontSize: "1rem" }}>
                              {tx.planName}
                            </span>
                            <span style={{
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              backgroundColor: 
                                tx.status === 'completed' ? '#dcfce7' :
                                tx.status === 'failed' ? '#fef2f2' :
                                tx.status === 'cancelled' ? '#f3f4f6' :
                                tx.status === 'pending' ? '#fef3c7' : '#f3f4f6',
                              color:
                                tx.status === 'completed' ? '#166534' :
                                tx.status === 'failed' ? '#dc2626' :
                                tx.status === 'cancelled' ? '#6b7280' :
                                tx.status === 'pending' ? '#d97706' : '#374151'
                            }}>
                              {tx.status === 'completed' && <CheckCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                              {tx.status === 'failed' && <XCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                              {tx.status === 'cancelled' && <XCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                              {tx.status === 'pending' && <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "#666" }}>
                            <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            {new Date(tx.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                            ₹{tx.amount}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#666" }}>
                            {tx.paymentMode === 'yearly' ? 'Yearly' : 'Monthly'}
                          </div>
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "12px",
                        fontSize: "0.85rem",
                        color: "#666"
                      }}>
                        <div>
                          <strong>Gateway:</strong> {tx.gateway}
                        </div>
                        <div>
                          <strong>Type:</strong> {tx.type}
                        </div>
                        {tx.gatewayTransactionId && (
                          <div>
                            <strong>Transaction ID:</strong> {tx.gatewayTransactionId}
                          </div>
                        )}
                        {tx.gatewayOrderId && (
                          <div>
                            <strong>Order ID:</strong> {tx.gatewayOrderId}
                          </div>
                        )}
                        {tx.failureReason && (
                          <div style={{ color: '#dc2626' }}>
                            <strong>Failure Reason:</strong> {tx.failureReason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Pagination for transactions */}
                  {transactionPagination.totalPages > 1 && (
                    <div style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "20px"
                    }}>
                      <button
                        onClick={() => fetchUserTransactions(selectedUserId, transactionPagination.page - 1)}
                        disabled={!transactionPagination.hasPrev}
                        style={{
                          padding: "6px 12px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          backgroundColor: transactionPagination.hasPrev ? "white" : "#f5f5f5",
                          cursor: transactionPagination.hasPrev ? "pointer" : "not-allowed"
                        }}
                      >
                        Previous
                      </button>
                      <span style={{ fontSize: "0.9rem", color: "#666" }}>
                        Page {transactionPagination.page} of {transactionPagination.totalPages}
                      </span>
                      <button
                        onClick={() => fetchUserTransactions(selectedUserId, transactionPagination.page + 1)}
                        disabled={!transactionPagination.hasNext}
                        style={{
                          padding: "6px 12px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          backgroundColor: transactionPagination.hasNext ? "white" : "#f5f5f5",
                          cursor: transactionPagination.hasNext ? "pointer" : "not-allowed"
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: "12px 10px",
  fontWeight: "600",
  fontSize: "0.85rem",
  color: "#444",
  borderBottom: "2px solid #eee",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px 10px",
  fontSize: "0.9rem",
  color: "#333",
  verticalAlign: "middle",
};
