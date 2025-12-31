"use client";
import React from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MonthCalendar = ({
  calendarMap = {},
  currentMonth,
  onMonthChange,
  onDateClick,
  filters 
}) => {
  const viewDate = dayjs(currentMonth);
  const today = dayjs();

  const daysInMonth = viewDate.daysInMonth();
  const startWeekday = viewDate.startOf("month").day();

  const prevMonth = () =>
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const nextMonth = () =>
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  let cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <div className="bg-black/20 border border-white/10 rounded-2xl p-3 sm:p-4 select-none">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-white/10 transition">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-sm sm:text-base font-semibold tracking-wide text-white">
          {viewDate.format("MMMM YYYY")}
        </h2>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-white/10 transition">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 text-center text-[11px] sm:text-xs text-gray-400 mb-2">
        {weekdays.map((d) => <div key={d}>{d}</div>)}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((day, index) => {
          if (!day) return <div key={index} />;

          const dateKey = viewDate.date(day).format("YYYY-MM-DD");
          const data = calendarMap[dateKey] || { types: new Set(), items: [] };
          
          const isToday = today.date() === day && today.month() === viewDate.month() && today.year() === viewDate.year();
          
          // Check if any item in this day matches active filters
          const hasVisibleItems = data.items.some(item => filters[item.type]);

          // Dot Logic
          const showGenerated = filters.generated && data.types.has("generated");
          const showPublished = filters.published && data.types.has("published");
          const showScheduled = filters.scheduled && data.types.has("scheduled");
          const showFailed = filters.failed && data.types.has("failed");

          return (
            <div
              key={index}
              onClick={() => hasVisibleItems && onDateClick(dateKey, data.items)}
              className={`
                relative aspect-square rounded-xl
                flex flex-col items-center justify-center
                text-xs sm:text-sm transition
                ${hasVisibleItems ? "cursor-pointer hover:bg-white/10" : "opacity-50"}
                ${isToday ? "bg-white/10 font-bold border border-white/20" : "bg-transparent text-white/90"}
              `}
            >
              <span className={isToday ? "text-white" : ""}>{day}</span>

              {/* Dots Container */}
              <div className="flex gap-1 mt-1 absolute bottom-2 flex-wrap justify-center px-1">
                {showGenerated && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm" />}
                {showPublished && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />}
                {showScheduled && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-sm" />}
                {showFailed && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-sm" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthCalendar;