'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Image as ImageIcon, Loader2, ArrowLeft, Upload, Sparkles, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// --- Improved GlassCard with better gradients and hover depth ---
const GlassCard = ({ children, className = "", onClick, noPadding = false }) => (
  <div
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-2xl border border-white/10 
      bg-white/[0.03] backdrop-blur-xl transition-all duration-300
      shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
      ${onClick ? 'cursor-pointer hover:bg-white/[0.07] hover:border-white/20 hover:-translate-y-1' : ''}
      ${noPadding ? '' : 'p-6'}
      ${className}
    `}
  >
    {children}
  </div>
);

const TemplateLibrary = () => {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState('');

  const allCategories = [
    'Quotes & Motivation', 'Business & Corporate', 'Product & Promotion',
    'Offers & Sales', 'Festivals', 'Educational', 'Testimonials',
    'Personal Brand', 'Real Estate', 'Hospitality', 'Healthcare', 'Events'
  ];

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchCategories(), fetchTemplates()]);
      setLoading(false);
    };
    init();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/templates/categories`);
      if (response.data?.success) setCategories(response.data.data);
    } catch (e) { console.error('Category fetch error', e); }
  };

  const fetchTemplates = async (category = 'all') => {
    try {
      const url = category !== 'all' 
        ? `${process.env.NEXT_PUBLIC_API_URL}/templates/category/${encodeURIComponent(category)}`
        : `${process.env.NEXT_PUBLIC_API_URL}/templates`;
      const response = await axios.get(url);
      if (response.data?.success) setTemplates(response.data.data);
    } catch (e) { console.error('Template fetch error', e); }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    fetchTemplates(category);
  };

  // Memoized search for performance
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, templates]);

  const handleTemplateSelect = (template) => {
    sessionStorage.setItem('selectedTemplate', JSON.stringify(template));
    router.push('/template-customizer');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Please use JPG, PNG or WebP');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const customTemplate = {
        _id: `custom-${Date.now()}`,
        name: file.name,
        imageUrl: e.target?.result,
        category: 'Custom Upload',
        isCustomUpload: true
      };
      sessionStorage.setItem('selectedTemplate', JSON.stringify(customTemplate));
      router.push('/template-customizer');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 py-8 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button
            onClick={() => router.push('/generatepost')}
            className="group flex items-center gap-2 text-sm text-gray-400 hover:text-orange-400 transition-colors mb-4"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Template <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-500">Library</span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Premium layouts for your next viral post.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-400 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search styles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all text-white"
              />
           </div>
           
           <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="appearance-none w-full pl-4 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none text-white cursor-pointer"
              >
                <option value="all">All Categories</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
           </div>
        </div>
      </div>

      {/* Upload Hero Action */}
      <GlassCard className="group border-dashed border-white/20 bg-gradient-to-r from-orange-500/5 to-purple-600/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-gradient-to-br from-orange-500 to-purple-600 rounded-2xl shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-500">
              <Upload size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Custom Upload <Sparkles size={18} className="text-orange-400" />
              </h3>
              <p className="text-gray-400 text-sm max-w-md">Drop your own branding or unique layout here. We'll handle the AI magic.</p>
            </div>
          </div>
          
          <label className="relative overflow-hidden px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-orange-50 transition-all cursor-pointer active:scale-95 shadow-xl">
            Choose File
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
          </label>
        </div>
        {uploadError && <p className="text-red-400 text-xs mt-3 text-center md:text-left">{uploadError}</p>}
      </GlassCard>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-2xl bg-white/5 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-20 text-center">
          <ImageIcon className="mx-auto text-gray-600 mb-4" size={48} />
          <p className="text-gray-400 text-lg">No templates match your criteria.</p>
          <button onClick={() => handleCategoryChange('all')} className="mt-4 text-orange-400 font-medium">Reset Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <GlassCard 
              key={template._id} 
              noPadding 
              onClick={() => handleTemplateSelect(template)}
              className="group flex flex-col h-full"
            >
              <div className="aspect-[4/5] overflow-hidden relative">
                <img
                  src={template.imageUrl}
                  alt={template.name}
                  className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="w-full py-2 bg-white text-black text-center rounded-lg font-bold text-sm shadow-xl flex items-center justify-center gap-2">
                    Use Layout <ChevronRight size={14} />
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="backdrop-blur-md bg-black/40 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-white px-2 py-1 rounded-md">
                    {template.category}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-white/[0.02]">
                <h3 className="text-white font-semibold truncate group-hover:text-orange-400 transition-colors">{template.name}</h3>
                <p className="text-gray-500 text-xs mt-1 line-clamp-1 italic">{template.description || 'Professional Layout'}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;