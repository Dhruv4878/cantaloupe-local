"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileText, 
  BarChart3, 
  Settings,
  X
} from "lucide-react";

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  const menuItems = [
    { label: "Dashboard", path: "/super-admin/dashboard", icon: LayoutDashboard },
     { label: "Analytics", path: "/super-admin/analytics", icon: BarChart3 },
    { label: "Users", path: "/super-admin/users", icon: Users },
    { label: "Plans", path: "/super-admin/plans", icon: CreditCard },
    { label: "Templates", path: "/super-admin/templates", icon: FileText },
   ,
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0f1115] border-r border-[#1f2937] text-white transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static md:h-screen
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#1f2937]">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Super Admin
            </h2>
            <button 
              onClick={onClose}
              className="md:hidden p-1 hover:bg-[#1f2937] rounded-md transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => onClose?.()} // Close sidebar on mobile nav
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActive 
                      ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                      : "text-gray-400 hover:text-white hover:bg-[#1f2937]/50"
                    }
                  `}
                >
                  <Icon 
                    size={20} 
                    className={`
                      transition-colors duration-200
                      ${isActive ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300"}
                    `} 
                  />
                  <span className="font-medium tracking-wide">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer User Info (Optional) */}
          <div className="p-4 border-t border-[#1f2937]">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                SA
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Administrator</p>
                <p className="text-xs text-gray-500 truncate">System Control</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
