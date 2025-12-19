"use client";
import React, { useEffect, useState } from "react";

export default function Toast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const msg = sessionStorage.getItem("flashMessage");
    if (!msg) return;
    setMessage(msg);
    setVisible(true);
    sessionStorage.removeItem("flashMessage");
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-20 right-6 z-50">
      <div className="bg-emerald-600 text-white text-sm px-4 py-2 rounded shadow-lg">
        {message}
      </div>
    </div>
  );
}


