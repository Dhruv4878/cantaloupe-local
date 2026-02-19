"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Tag, Percent, Check, AlertCircle } from "lucide-react";
import DataTable from "@/components/ui/admin/DataTable";

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [discountInput, setDiscountInput] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Discount Calculator State
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

  // --- API Handling ---

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/super-admin/plans`, { credentials: "include" });
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
      const res = await fetch(`${apiUrl}/super-admin/discount`, { credentials: "include" });
      const data = await res.json();
      setGlobalDiscount(data.globalDiscount);
      setDiscountInput(data.globalDiscount.toString());
    } catch (e) {
      console.error("Failed to fetch global discount", e);
    }
  };

  const updateGlobalDiscount = async () => {
    if (discountInput === "") return alert("Please enter a discount percentage");
    const val = parseFloat(discountInput);
    if (val < 0 || val > 100) return alert("Discount must be between 0 and 100");

    setDiscountLoading(true);
    try {
      const res = await fetch(`${apiUrl}/super-admin/discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ globalDiscount: val }),
      });
      if (!res.ok) throw new Error("Failed");
      
      const data = await res.json();
      setGlobalDiscount(data.globalDiscount);
      // alert("Global discount updated!");
      fetchPlans();
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

  // --- Logic Helpers ---

  const calculateYearly = (monthly, percent) => {
    if (!monthly || !percent) return "";
    const total = monthly * 12;
    const discountAmount = total * (percent / 100);
    return Math.round(total - discountAmount);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setDiscountPercent("");
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setEditingId(plan._id);
    let calculatedDiscount = "";
    if (plan.price_monthly && plan.price_yearly) {
      const full = plan.price_monthly * 12;
      const saved = full - plan.price_yearly;
      if (saved > 0) calculatedDiscount = Math.round((saved / full) * 100);
    }
    setDiscountPercent(calculatedDiscount);
    
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
    if (type === "number") finalValue = value === "" ? 0 : Number(value);

    if (name.startsWith("feat_")) {
      const featKey = name.replace("feat_", "");
      setFormData(prev => ({
        ...prev,
        features: { ...prev.features, [featKey]: finalValue }
      }));
    } else {
      setFormData(prev => {
        const newData = { ...prev, [name]: finalValue };
        if (name === "price_monthly" && discountPercent) {
          newData.price_yearly = calculateYearly(finalValue, discountPercent);
        }
        return newData;
      });
    }
  };

  const handleDiscountChange = (e) => {
    const val = e.target.value;
    setDiscountPercent(val);
    if (formData.price_monthly && val) {
      setFormData(prev => ({
        ...prev,
        price_yearly: calculateYearly(prev.price_monthly, val)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingId ? `${apiUrl}/super-admin/plans/${editingId}` : `${apiUrl}/super-admin/plans`;
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save");
      
      setShowModal(false);
      fetchPlans();
    } catch (err) {
      alert("Error saving: " + err.message);
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
      fetchPlans();
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete plan?")) return;
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

  // --- Columns for DataTable ---
  const columns = [
    {
      header: "Plan Name",
      accessor: "name",
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{row.name}</span>
            {row.recommended && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700 bg-orange-100 rounded-full">
                Recommended
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{row.description}</p>
        </div>
      )
    },
    {
      header: "Price (Mo)",
      accessor: "price",
      render: (row) => (
        <span className="font-medium text-gray-900">₹{row.price_monthly}</span>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <button 
          onClick={(e) => { e.stopPropagation(); toggleStatus(row._id, row.status); }}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${row.status === 'active' ? 'bg-blue-600' : 'bg-gray-200'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${row.status === 'active' ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      )
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); openEditModal(row); }}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); remove(row._id); }}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-500">Manage pricing tiers and features</p>
        </div>
        <button 
          onClick={openCreateModal} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Create Plan
        </button>
      </div>

      {/* Global Discount Card */}
      <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              <Percent size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Global Annual Discount</h3>
              <p className="text-sm text-gray-500 max-w-md mt-1">
                This percentage is applied to all annual plans. It's automatically calculated when setting prices but can be overridden here.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="w-24 px-4 py-2 text-center text-lg font-bold text-orange-600 border-2 border-orange-200 rounded-lg outline-none focus:border-orange-500 bg-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
            </div>
            <button
              onClick={updateGlobalDiscount}
              disabled={discountLoading}
              className="px-6 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {discountLoading ? "Saving..." : "Update"}
            </button>
          </div>
        </div>
      </div>

      <DataTable 
        title="Active Plans"
        columns={columns}
        data={plans}
        searchPlaceholder="Search plans..."
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Plan" : "Create New Plan"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <AlertCircle size={20} className="rotate-45" /> {/* Using generic icon as close */}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Pro Plan"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Short marketing description"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Pricing Section */}
                <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Tag size={16} /> Pricing Configuration
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Price (₹)</label>
                      <input
                        required
                        type="number"
                        name="price_monthly"
                        value={formData.price_monthly}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-orange-600 mb-1">Discount %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={handleDiscountChange}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-orange-200 rounded-lg outline-none focus:border-orange-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Yearly Price (₹)</label>
                      <input
                        type="number"
                        name="price_yearly"
                        value={formData.price_yearly}
                        onChange={handleInputChange}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Features Toggles */}
                <div className="md:col-span-2 space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Features</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "ai_post_generation", label: "AI Post Generation" },
                      { key: "caption_generator", label: "Caption Generator" },
                      { key: "hashtag_generator", label: "Hashtag Generator" },
                      { key: "content_calendar", label: "Content Calendar" },
                      { key: "smart_scheduling", label: "Smart Scheduling" },
                      { key: "priority_support", label: "Priority Support" },
                    ].map((feat) => (
                      <label key={feat.key} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name={`feat_${feat.key}`}
                          checked={formData.features[feat.key]}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{feat.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Numeric/Select Limits */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Posts Per Month</label>
                   <input
                    name="feat_posts_per_month"
                    value={formData.features.posts_per_month}
                    onChange={handleInputChange}
                    placeholder="e.g. 15 or unlimited"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Platforms Allowed</label>
                   <input
                    type="number"
                    name="feat_platforms_allowed"
                    value={formData.features.platforms_allowed}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="recommended"
                      checked={formData.recommended}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Mark as Recommended Plan</span>
                  </label>
                </div>
              </div>
            </form>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3 justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all"
              >
                 {submitting ? "Saving..." : (editingId ? "Update Plan" : "Create Plan")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
