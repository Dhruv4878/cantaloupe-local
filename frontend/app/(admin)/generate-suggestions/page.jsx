'use client';

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`p-8 rounded-3xl relative overflow-hidden text-white ${className}`}
    style={{
      background: "rgba(255, 255, 255, 0.03)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
    }}
  >
    {children}
  </div>
);

export default function GenerateSuggestionsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <GlassCard className="text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-400 to-purple-600 flex items-center justify-center">
            <span className="text-3xl">🚀</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Smart Suggestions
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-600"> Coming Soon</span>
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
            We're working on an intelligent system that will analyze your brand, trending topics, and audience engagement to provide personalized content suggestions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="text-2xl mb-3">🎯</div>
            <h3 className="font-semibold mb-2">Trend Analysis</h3>
            <p className="text-sm text-gray-400">AI-powered analysis of current trends in your industry</p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="text-2xl mb-3">🎨</div>
            <h3 className="font-semibold mb-2">Brand Matching</h3>
            <p className="text-sm text-gray-400">Content suggestions that align with your brand voice</p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">Auto Suggestions</h3>
            <p className="text-sm text-gray-400">Automated content ideas based on your preferences</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Go Back
          </button>
          <button 
            onClick={() => window.location.href = '/generate-templates'}
            className="px-6 py-3 bg-gradient-to-r from-orange-400 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/20 transition-all"
          >
            Try Templates Instead
          </button>
        </div>
      </GlassCard>
    </div>
  );
}