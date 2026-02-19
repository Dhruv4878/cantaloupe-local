"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export const RevenueChart = ({ data, theme = "dark" }) => {
  const isLight = theme === "light";
  const gridColor = isLight ? "#eee" : "#444";
  const axisColor = isLight ? "#666" : "#ccc";
  const tooltipBg = isLight ? "#fff" : "#333";
  const tooltipColor = isLight ? "#333" : "#fff";

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="_id" stroke={axisColor} />
          <YAxis stroke={axisColor} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: isLight ? "1px solid #ddd" : "none", boxShadow: isLight ? "0 2px 5px rgba(0,0,0,0.1)" : "none" }}
            itemStyle={{ color: tooltipColor }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="totalAmount"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            name="Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const UserDistributionChart = ({ freeUsers, paidUsers, theme = "dark" }) => {
  const isLight = theme === "light";
  const tooltipBg = isLight ? "#fff" : "#333";
  const tooltipColor = isLight ? "#333" : "#fff";

  const data = [
    { name: "Free Users", value: freeUsers },
    { name: "Paid Users", value: paidUsers },
  ];

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
             contentStyle={{ backgroundColor: tooltipBg, border: isLight ? "1px solid #ddd" : "none", boxShadow: isLight ? "0 2px 5px rgba(0,0,0,0.1)" : "none" }}
             itemStyle={{ color: tooltipColor }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
