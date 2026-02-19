"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Filter, Loader2, Image as ImageIcon, X } from 'lucide-react';
import axios from 'axios';

const TemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    imageUrl: '',
    description: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const categories = [
    'Quotes & Motivation',
    'Business & Corporate', 
    'Product & Promotion',
    'Offers & Sales',
    'Festivals',
    'Educational',
    'Testimonials',
    'Personal Brand',
    'Real Estate',
    'Hospitality',
    'Healthcare',
    'Events'
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/templates`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      if (error.response?.status === 401) {
        setError('Authentication required');
      } else {
        setError('Failed to fetch templates');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/upload/template-image`,
        formData,
        { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (response.data.success) return response.data.imageUrl;
      throw new Error(response.data.message || 'Upload failed');
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      let imageUrl = formData.imageUrl;
      if (imageFile) imageUrl = await uploadImage();

      const templateData = { ...formData, imageUrl };
      const url = editingTemplate 
        ? `${process.env.NEXT_PUBLIC_API_URL}/super-admin/templates/${editingTemplate._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/super-admin/templates`;
      
      const method = editingTemplate ? 'put' : 'post';
      
      const response = await axios[method](url, templateData, { withCredentials: true });

      if (response.data.success) {
        fetchTemplates();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setError(error.message || 'Error saving template');
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      imageUrl: template.imageUrl,
      description: template.description || ''
    });
    setImagePreview(template.imageUrl);
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (templateId) => {
    if (!confirm('Delete this template?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/templates/${templateId}`, {
        withCredentials: true
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete template');
    }
  };

  const handleToggleStatus = async (templateId) => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/templates/${templateId}/toggle-status`,
        {},
        { withCredentials: true }
      );
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', category: '', imageUrl: '', description: '' });
    setEditingTemplate(null);
    setImageFile(null);
    setImagePreview('');
    setShowModal(false);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Library</h1>
          <p className="text-sm text-gray-500">Manage and organize design templates</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} />
          <span>Add Template</span>
        </button>
      </div>

      {error && !error.includes('Authentication') && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter size={18} className="text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <ImageIcon className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium">No templates found</p>
          <p className="text-sm text-gray-400">Try adjusting filters or add a new one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <div 
              key={template._id} 
              className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Image Area */}
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                <img
                  src={template.imageUrl}
                  alt={template.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                />
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                   <span className={`px-2 py-1 text-xs font-bold rounded-full backdrop-blur-md ${template.isActive ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                    {template.isActive ? 'Active' : 'Hidden'}
                   </span>
                </div>
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                  <button 
                    onClick={() => handleEdit(template)}
                    className="p-2 bg-white text-gray-700 rounded-full hover:bg-blue-600 hover:text-white transition-colors shadow-lg"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(template._id)}
                    className="p-2 bg-white text-gray-700 rounded-full hover:bg-purple-600 hover:text-white transition-colors shadow-lg"
                    title={template.isActive ? 'Hide' : 'Show'}
                  >
                    {template.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button 
                    onClick={() => handleDelete(template._id)}
                    className="p-2 bg-white text-gray-700 rounded-full hover:bg-red-600 hover:text-white transition-colors shadow-lg"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-1" title={template.name}>
                    {template.name}
                  </h3>
                </div>
                <div className="mb-3">
                   <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-md">
                    {template.category}
                  </span>
                </div>
                {template.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mt-auto">
                    {template.description}
                  </p>
                )}
                <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-400 flex justify-between items-center">
                  <span>Added {new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </h2>
              <button 
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Template Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g. Summer Sale Banner"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Visual</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors">
                  {imagePreview ? (
                    <div className="relative inline-block group">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="h-40 object-contain rounded-lg shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(''); setFormData({...formData, imageUrl: ''}); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <ImageIcon className="mx-auto text-gray-300 mb-2" size={32} />
                      <label className="block">
                        <span className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md cursor-pointer hover:bg-blue-700 transition-colors">
                          Browse Files
                        </span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                      <p className="text-xs text-gray-400 mt-2">or paste URL below</p>
                    </div>
                  )}
                </div>
              </div>

              {!imageFile && (
                <div>
                   <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    placeholder="https://example.com/image.png"
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  placeholder="Details about usage..."
                />
              </div>
            </form>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
              <button 
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={uploading}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all"
              >
                {uploading && <Loader2 className="animate-spin" size={16} />}
                {editingTemplate ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManagement;