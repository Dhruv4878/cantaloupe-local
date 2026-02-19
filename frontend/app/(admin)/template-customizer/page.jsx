'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import TemplateCustomizer from '@/components/Contentgenerate/TemplateCustomizer';
import { ArrowLeft } from 'lucide-react';

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

export default function TemplateCustomizerPage() {
  const router = useRouter();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get template data from sessionStorage
    if (typeof window !== 'undefined') {
      try {
        const templateData = sessionStorage.getItem('selectedTemplate');
        if (templateData) {
          const parsedTemplate = JSON.parse(templateData);
          setTemplate(parsedTemplate);
        } else {
          setError('No template selected');
        }
      } catch (err) {
        console.error('Error parsing template data:', err);
        setError('Invalid template data');
      }
    }
    
    setLoading(false);
  }, []);

  const handleBack = () => {
    // Clear the stored template data when going back
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('selectedTemplate');
    }
    router.push('/generate-templates');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Loading template...</div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <GlassCard className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Template Not Found</h1>
          <p className="text-gray-300 mb-6">{error || 'The requested template could not be loaded.'}</p>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-orange-400 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/20 transition-all"
          >
            <ArrowLeft size={18} />
            Back to Templates
          </button>
        </GlassCard>
      </div>
    );
  }

  return <TemplateCustomizer template={template} onBack={handleBack} />;
}