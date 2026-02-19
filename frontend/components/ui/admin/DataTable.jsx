"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, Download } from "lucide-react";

export default function DataTable({ 
  columns, 
  data, 
  title, 
  searchPlaceholder = "Search...",
  onSearch,
  onRowClick,
  actions,
  // New props for server-side pagination & filtering
  manualPagination = false,
  totalItems = 0,
  itemsPerPage: itemsPerPageProp = 10,
  currentPage: currentPageProp = 1,
  onPageChange,
  filters = null,
  disableClientFilter = false
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [internalPage, setInternalPage] = useState(1);
  
  // Use either controlled or uncontrolled state
  const currentPage = manualPagination ? currentPageProp : internalPage;
  const itemsPerPage = itemsPerPageProp;
  const setCurrentPage = manualPagination ? onPageChange : setInternalPage;

  // Filter data based on search (only if NOT server-side/manual)
  const filteredData = (disableClientFilter || manualPagination) 
    ? data 
    : data.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );

  // Pagination logic
  // If manual, we assume data IS the current page data. 
  // If not manual, we slice the filteredData.
  const totalCount = manualPagination ? totalItems : filteredData.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  
  const startIndex = manualPagination ? (currentPage - 1) * itemsPerPage : (currentPage - 1) * itemsPerPage;
  const endIndex = manualPagination ? Math.min(startIndex + itemsPerPage, totalCount) : Math.min(startIndex + itemsPerPage, filteredData.length);
  
  const currentData = manualPagination ? data : filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setCurrentPage(1);
    if (onSearch) onSearch(term);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Table Header / Toolbar */}
      <div className="p-6 border-b border-gray-100 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between bg-gray-50/50">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredData.length} entries found
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 transition-all"
            />
          </div>
          
          <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
            {filters}
            {/* {!filters && (
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">Filter</span>
              </button>
            )} */}
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
            {actions}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentData.length > 0 ? (
              currentData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`
                    group transition-colors duration-150
                    ${onRowClick ? "cursor-pointer hover:bg-blue-50/50" : "hover:bg-gray-50"}
                  `}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-gray-100 p-3 rounded-full mb-3">
                      <Search className="text-gray-400" size={24} />
                    </div>
                    <p className="font-medium">No results found</p>
                    <p className="text-sm mt-1">Try adjusting your search filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
        <span className="text-sm text-gray-500">
          Showing <span className="font-medium">{Math.min(startIndex + 1, totalCount)}</span> to <span className="font-medium">{manualPagination ? Math.min(startIndex + data.length, totalCount) : Math.min(startIndex + itemsPerPage, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
        </span>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 bg-white text-black border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Simple pagination logic for display (showing first 5 or customized)
            // For production, a more robust pagination generator would be better
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`
                  w-8 h-8 rounded-lg text-sm font-medium transition-all
                  ${currentPage === pageNum 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                    : "text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 bg-white text-black border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
