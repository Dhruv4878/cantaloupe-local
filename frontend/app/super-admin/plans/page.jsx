// SuperAdminPlansPage.jsx
"use client";

import { useEffect, useState } from "react";

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [discountInput, setDiscountInput] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);

  // State for Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Track if we are editing (stores the ID) or creating (null)
  const [editingId, setEditingId] = useState(null);

  // New State: Discount Calculator
  const [discountPercent, setDiscountPercent] = useState("");

  const initialFormState = {
    name: "",
    description: "",
    price_monthly: "",
    price_yearly: "",
    recommended: false,
    features: {
      ai_post_generation: false,
      caption_generator: false,
      hashtag_generator: false,
      content_calendar: false,
      smart_scheduling: false,
      priority_support: false,
      platforms_allowed: 1,
      posts_per_month: "unlimited",
    },
  };

  const [formData, setFormData] = useState(initialFormState);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // --- API Calls ---

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/super-admin/plans`, {
        credentials: "include",
      });
      const data = await res.json();
      setPlans(data);
    } catch (e) {
      console.error("Failed to fetch plans", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalDiscount = async () => {
    try {
      const res = await fetch(`${apiUrl}/super-admin/discount`, {
        credentials: "include",
      });
      const data = await res.json();
      setGlobalDiscount(data.globalDiscount);
      setDiscountInput(data.globalDiscount.toString());
    } catch (e) {
      console.error("Failed to fetch global discount", e);
    }
  };

  const updateGlobalDiscount = async () => {
    if (discountInput === "") {
      alert("Please enter a discount percentage");
      return;
    }

    const discountValue = parseFloat(discountInput);
    if (discountValue < 0 || discountValue > 100) {
      alert("Discount must be between 0 and 100");
      return;
    }

    setDiscountLoading(true);
    try {
      const res = await fetch(`${apiUrl}/super-admin/discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ globalDiscount: discountValue }),
      });

      if (!res.ok) throw new Error("Failed to update discount");

      const data = await res.json();
      setGlobalDiscount(data.globalDiscount);
      alert("Global discount updated successfully!");
      fetchPlans(); // Refresh plans to show updated discount
    } catch (err) {
      alert("Error updating discount: " + err.message);
    } finally {
      setDiscountLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchGlobalDiscount();
  }, []);

  // --- Helper: Calculate Yearly Price ---
  const calculateYearly = (monthly, percent) => {
    if (!monthly || !percent) return "";
    const total = monthly * 12;
    const discountAmount = total * (percent / 100);
    return Math.round(total - discountAmount);
  };

  // --- Handlers ---

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setDiscountPercent(""); // Reset discount
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setEditingId(plan._id);

    // Reverse calculate the discount % for display purposes
    let calculatedDiscount = "";
    if (plan.price_monthly && plan.price_yearly) {
      const fullYear = plan.price_monthly * 12;
      const saved = fullYear - plan.price_yearly;
      if (saved > 0) {
        calculatedDiscount = Math.round((saved / fullYear) * 100);
      }
    }
    setDiscountPercent(calculatedDiscount);

    // Populate form with plan data
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly || "",
      recommended: plan.recommended || false,
      features: {
        ai_post_generation: plan.features?.ai_post_generation || false,
        caption_generator: plan.features?.caption_generator || false,
        hashtag_generator: plan.features?.hashtag_generator || false,
        content_calendar: plan.features?.content_calendar || false,
        smart_scheduling: plan.features?.smart_scheduling || false,
        priority_support: plan.features?.priority_support || false,
        platforms_allowed: plan.features?.platforms_allowed || 1,
        posts_per_month: plan.features?.posts_per_month || "unlimited",
      },
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === "checkbox" ? checked : value;

    if (type === "number") {
      finalValue = value === "" ? 0 : Number(value);
    }

    if (name.startsWith("feat_")) {
      const featureName = name.replace("feat_", "");
      setFormData((prev) => ({
        ...prev,
        features: {
          ...prev.features,
          [featureName]: finalValue,
        },
      }));
    } else {
      setFormData((prev) => {
        const newData = { ...prev, [name]: finalValue };

        // Auto-calculate logic: If Monthly Price changes while discount is set, update Yearly
        if (name === "price_monthly" && discountPercent) {
          newData.price_yearly = calculateYearly(finalValue, discountPercent);
        }
        return newData;
      });
    }
  };

  // Handler specifically for the Discount Input
  const handleDiscountChange = (e) => {
    const val = e.target.value;
    setDiscountPercent(val);

    // Apply calculation immediately to formData
    if (formData.price_monthly && val) {
      setFormData((prev) => ({
        ...prev,
        price_yearly: calculateYearly(prev.price_monthly, val),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Determine URL and Method based on Editing vs Creating
      const url = editingId
        ? `${apiUrl}/super-admin/plans/${editingId}`
        : `${apiUrl}/super-admin/plans`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save plan");

      setShowModal(false);
      await fetchPlans();
    } catch (err) {
      alert("Error saving plan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await fetch(`${apiUrl}/super-admin/plans/${id}/status`, {
        method: "PATCH",
        credentials: "include",
      });
      fetchPlans(); // Refresh list to confirm status
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete plan? This cannot be undone")) return;
    try {
      await fetch(`${apiUrl}/super-admin/plans/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchPlans();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        backgroundColor: "#f9fafb",
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
        color: "#333",
      }}
    >
      {/* Styles for the Toggle Switch */}
      <style jsx>{`
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
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
          background-color: #ccc;
          transition: 0.4s;
          border-radius: 34px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #000;
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              color: "#000",
              fontSize: 26,
              fontWeight: "700",
              margin: 0,
            }}
          >
            All Plans
          </h1>
          <p style={{ color: "#666", marginTop: 4, fontSize: "0.9rem" }}>
            Manage pricing and features for the public page.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            padding: "10px 20px",
            backgroundColor: "#fff",
            color: "#000",
            border: "1px solid #ddd",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            fontSize: "0.9rem",
          }}
        >
          <span>+</span> Create Plan
        </button>
      </div>

      {/* Global Discount Card */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          border: "1px solid #eaeaea",
          padding: "24px",
          marginBottom: "24px",
          backgroundColor: "#fffbeb",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div>
            <h3
              style={{
                color: "#d97706",
                fontSize: "1.1rem",
                fontWeight: "700",
                margin: "0 0 8px 0",
              }}
            >
              Global Annual Discount
            </h3>
            <p style={{ color: "#666", fontSize: "0.9rem", margin: 0 }}>
              Apply a discount to all annual plans displayed on the pricing page
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div>
              <label
                style={{ ...labelStyle, color: "#d97706", marginBottom: "6px" }}
              >
                Discount %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="0"
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "2px solid #d97706",
                  backgroundColor: "#fff",
                  color: "#111",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  width: "120px",
                  textAlign: "center",
                  outline: "none",
                }}
              />
            </div>
            <button
              onClick={updateGlobalDiscount}
              disabled={discountLoading}
              style={{
                padding: "12px 24px",
                backgroundColor: "#d97706",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: discountLoading ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "0.95rem",
                opacity: discountLoading ? 0.7 : 1,
              }}
            >
              {discountLoading ? "Saving..." : "Apply"}
            </button>
          </div>
        </div>
        <p
          style={{
            color: "#d97706",
            fontSize: "0.85rem",
            margin: "12px 0 0 0",
            fontWeight: "500",
          }}
        >
          Current Global Discount: <strong>{globalDiscount}%</strong>
        </p>
      </div>

      {/* Table Container */}
      {loading ? (
        <p style={{ color: "#666" }}>Loading plans...</p>
      ) : (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            overflow: "hidden",
            border: "1px solid #eaeaea",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "#fff",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#f9fafb",
                  borderBottom: "1px solid #eaeaea",
                  textAlign: "left",
                }}
              >
                <th
                  style={{
                    padding: "16px 24px",
                    color: "#666",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  PLAN NAME
                </th>
                <th
                  style={{
                    padding: "16px 24px",
                    color: "#666",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  PRICE (MO)
                </th>
                <th
                  style={{
                    padding: "16px 24px",
                    color: "#666",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  STATUS
                </th>
                <th
                  style={{
                    padding: "16px 24px",
                    color: "#666",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    textAlign: "right",
                  }}
                >
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{ padding: 30, textAlign: "center", color: "#888" }}
                  >
                    No plans found.
                  </td>
                </tr>
              )}
              {plans.map((p) => (
                <tr key={p._id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "16px 24px", verticalAlign: "middle" }}>
                    <div
                      style={{
                        fontWeight: "600",
                        color: "#111",
                        fontSize: "0.95rem",
                      }}
                    >
                      {p.name}
                    </div>
                    {p.recommended && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#d97706",
                          marginTop: 4,
                          fontWeight: "500",
                        }}
                      >
                        ★ Recommended
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "#888",
                        marginTop: 2,
                      }}
                    >
                      {p.description}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "16px 24px",
                      verticalAlign: "middle",
                      color: "#333",
                      fontWeight: "500",
                    }}
                  >
                    ₹{p.price_monthly}
                  </td>

                  {/* Status Toggle */}
                  <td style={{ padding: "16px 24px", verticalAlign: "middle" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={p.status === "active"}
                          onChange={() => toggleStatus(p._id, p.status)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </td>

                  {/* Actions */}
                  <td
                    style={{
                      padding: "16px 24px",
                      textAlign: "right",
                      verticalAlign: "middle",
                    }}
                  >
                    <button
                      onClick={() => openEditModal(p)}
                      style={{
                        background: "transparent",
                        border: "1px solid #ddd",
                        color: "#333",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        marginRight: "8px",
                        fontSize: "0.85rem",
                        fontWeight: "500",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(p._id)}
                      style={{
                        background: "transparent",
                        border: "1px solid #fee2e2",
                        color: "#ef4444",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: "500",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Modal (Create & Edit) --- */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "32px",
              borderRadius: "16px",
              width: "600px",
              maxWidth: "95%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #f0f0f0",
            }}
          >
            <h2
              style={{
                fontSize: 24,
                marginBottom: 24,
                color: "#111",
                fontWeight: "700",
              }}
            >
              {editingId ? "Edit Plan" : "Create New Plan"}
            </h2>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Basic Info */}
              <div>
                <label style={labelStyle}>Plan Name</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Pro Plan"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <input
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Short marketing description"
                  style={inputStyle}
                />
              </div>

              {/* PRICING WITH DISCOUNT CALCULATOR */}
              <div
                style={{ display: "flex", gap: "15px", alignItems: "flex-end" }}
              >
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Monthly Price (₹)</label>
                  <input
                    required
                    type="number"
                    name="price_monthly"
                    value={formData.price_monthly}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                </div>

                {/* DISCOUNT INPUT */}
                <div style={{ width: "110px" }}>
                  <label style={{ ...labelStyle, color: "#d97706" }}>
                    Discount %
                  </label>
                  <input
                    type="number"
                    placeholder="%"
                    value={discountPercent}
                    onChange={handleDiscountChange}
                    style={{
                      ...inputStyle,
                      borderColor: "#d97706",
                      backgroundColor: "#fffbeb",
                      fontWeight: "600",
                      color: "#d97706",
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Yearly Price (₹)</label>
                  <input
                    type="number"
                    name="price_yearly"
                    placeholder="Auto-calculated"
                    value={formData.price_yearly}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                </div>
              </div>
              {/* Pricing Helper Text */}
              <div
                style={{
                  marginTop: -15,
                  fontSize: "0.8rem",
                  color: "#888",
                  textAlign: "right",
                }}
              >
                {discountPercent && formData.price_monthly ? (
                  <span>
                    {formData.price_monthly} x 12 minus {discountPercent}%
                  </span>
                ) : (
                  <span>Set Monthly Price and Discount to auto-calculate</span>
                )}
              </div>

              {/* Features Box */}
              <div
                style={{
                  padding: 20,
                  border: "1px solid #eee",
                  borderRadius: 12,
                  backgroundColor: "#f9fafb",
                }}
              >
                <p
                  style={{
                    fontWeight: "600",
                    marginBottom: 16,
                    fontSize: "0.9rem",
                    color: "#333",
                  }}
                >
                  Features Enabled
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  {[
                    { key: "ai_post_generation", label: "AI Post Generation" },
                    { key: "caption_generator", label: "Caption Generator" },
                    { key: "hashtag_generator", label: "Hashtag Generator" },
                    { key: "content_calendar", label: "Content Calendar" },
                    { key: "smart_scheduling", label: "Smart Scheduling" },
                    { key: "priority_support", label: "Priority Support" },
                  ].map((feat) => (
                    <label
                      key={feat.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        name={`feat_${feat.key}`}
                        checked={formData.features[feat.key]}
                        onChange={handleInputChange}
                        style={{
                          accentColor: "#000",
                          width: 18,
                          height: 18,
                          cursor: "pointer",
                        }}
                      />
                      <span style={{ fontSize: "0.9rem", color: "#4b5563" }}>
                        {feat.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Limits */}
              <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Platforms Allowed</label>
                  <input
                    type="number"
                    name="feat_platforms_allowed"
                    value={formData.features.platforms_allowed}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Posts / Month</label>
                  <input
                    type="text"
                    name="feat_posts_per_month"
                    value={formData.features.posts_per_month}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Recommendation Toggle */}
              <div style={{ marginTop: 4 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    name="recommended"
                    checked={formData.recommended}
                    onChange={handleInputChange}
                    style={{ width: 18, height: 18, accentColor: "#d97706" }}
                  />
                  <span
                    style={{
                      color: "#d97706",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                    }}
                  >
                    Highlight as "Recommended"
                  </span>
                </label>
              </div>

              {/* Footer Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  marginTop: "10px",
                  borderTop: "1px solid #f0f0f0",
                  paddingTop: "24px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "12px 24px",
                    background: "transparent",
                    color: "#555",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "0.95rem",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "12px 24px",
                    background: "#000",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.95rem",
                  }}
                >
                  {submitting
                    ? "Saving..."
                    : editingId
                      ? "Update Plan"
                      : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper styles for cleaner JSX
const labelStyle = {
  display: "block",
  fontSize: "0.85rem",
  fontWeight: "600",
  marginBottom: 8,
  color: "#4b5563",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111",
  fontSize: "0.95rem",
  outline: "none",
  transition: "border 0.2s",
};
