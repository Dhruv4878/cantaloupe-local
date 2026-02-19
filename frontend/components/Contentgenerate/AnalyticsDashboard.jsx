import React from 'react';
import { 
  BarChart, 
  Activity, 
  Clock, 
  Lightbulb, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

const AnalyticsDashboard = ({ analytics, metadata }) => {
  if (!analytics) return null;

  const { rating = 0, accuracy = 0, understanding = 0, tips = [] } = analytics;
  const processingTime = metadata?.processingTime ? (metadata.processingTime / 1000).toFixed(2) : 0;

  // Helper for circular progress
  const CircleProgress = ({ value, label, icon: Icon, color }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative flex items-center justify-center">
          {/* Background Circle */}
          <svg className="transform -rotate-90 w-24 h-24">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-white/10"
            />
            {/* Progress Circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`${color} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
            {value}%
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-white/80">
          <Icon size={14} className={color.replace('text-', 'text-opacity-80 ')} />
          {label}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="text-orange-400" size={20} />
        <h3 className="text-xl font-bold text-white">AI Generation Analytics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Overall Rating */}
        <CircleProgress 
          value={rating} 
          label="Overall Rating" 
          icon={BarChart} 
          color="text-purple-400" 
        />
        
        {/* Accuracy */}
        <CircleProgress 
          value={accuracy} 
          label="Prompt Accuracy" 
          icon={CheckCircle} 
          color="text-green-400" 
        />

        {/* Understanding */}
        <CircleProgress 
          value={understanding} 
          label="Context Grasp" 
          icon={Lightbulb} 
          color="text-blue-400" 
        />

        {/* Processing Time */}
        <div className="flex flex-col items-center justify-center gap-2 h-full">
            <div className="w-24 h-24 flex items-center justify-center bg-white/5 rounded-full border border-white/10">
                <span className="text-2xl font-bold text-white">{processingTime}s</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-white/80">
                <Clock size={14} className="text-orange-400" />
                Processing Time
            </div>
        </div>
      </div>

      {/* Tips Section */}
      {tips.length > 0 && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 mt-4">
          <div className="flex items-center gap-2 mb-3 text-white/90 font-semibold">
            <AlertCircle size={16} className="text-yellow-400" />
            <span>Smart Tips to Improve Next Time</span>
          </div>
          <ul className="space-y-2">
            {tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-yellow-400 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
