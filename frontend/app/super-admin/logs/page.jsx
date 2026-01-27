"use client";

import { useEffect, useState } from "react";

export default function SuperAdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${apiUrl}/super-admin/logs`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Failed to load logs");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Logs fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return <div>Loading logs...</div>;
  }

  return (
    <div style={{ color: "#111" }}>
      <h1
        style={{
          fontSize: "1.8rem",
          fontWeight: "600",
          marginBottom: "20px",
          color: "#111",
        }}
      >
        System Logs
      </h1>

      <div
        style={{
          maxHeight: "70vh",
          overflowY: "auto",
          padding: "20px",
          background: "#fff",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.08)",
        }}
      >
        {logs.length === 0 ? (
          <p>No logs found.</p>
        ) : (
          logs.map((log, index) => {
            const bg = getLogColor(log.type);

            return (
              <div
                key={index}
                style={{
                  padding: "12px",
                  marginBottom: "12px",
                  borderRadius: "8px",
                  background: bg,
                  color: "#111",
                }}
              >
                <div style={{ fontWeight: "600" }}>
                  {log.type.toUpperCase()}
                </div>

                <div style={{ marginTop: "5px" }}>{log.message}</div>

                <div
                  style={{ marginTop: "8px", fontSize: "0.8rem", opacity: 0.6 }}
                >
                  {formatTimestamp(log.timestamp)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ----------------
// Helper Functions
// ----------------

function getLogColor(type) {
  switch (type) {
    case "error":
      return "#ffe4e6"; // light red
    case "warning":
      return "#fff8e1"; // light yellow
    case "info":
    default:
      return "#e8f5e9"; // light green
  }
}

function formatTimestamp(ts) {
  if (!ts) return "N/A";
  return new Date(ts).toLocaleString();
}
