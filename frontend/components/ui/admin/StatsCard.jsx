"use client";

import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend = null, // { value: number, label: string, isPositive: boolean }
  description = null,
  loading = false,
  className = "" 
}) {
  return (
    <div className={`
      relative overflow-hidden p-6 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.1)] transition-all duration-300 group
      ${className}
    `}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-500" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-300 text-gray-500">
            {Icon ? <Icon size={24} /> : <div className="w-6 h-6" />}
          </div>
          
          {trend && (
            <div className={`
              flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
              ${trend.isPositive 
                ? "bg-green-100 text-green-700" 
                : trend.isPositive === false 
                  ? "bg-red-100 text-red-700" 
                  : "bg-gray-100 text-gray-600"
              }
            `}>
              {trend.isPositive ? <ArrowUpRight size={14} /> : trend.isPositive === false ? <ArrowDownRight size={14} /> : <Minus size={14} />}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
          {title}
        </h3>

        {loading ? (
          <div className="h-9 w-32 bg-gray-100 animate-pulse rounded-md" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 tracking-tight">
              {value}
            </span>
          </div>
        )}

        {description && (
          <p className="mt-2 text-xs text-gray-400 font-medium">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
