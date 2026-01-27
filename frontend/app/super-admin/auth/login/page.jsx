"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/super-admin/auth/login`, {
        method: "POST",
        credentials: "include", // Allows cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Successful Login → Redirect
      router.push("/super-admin/dashboard");
    } catch (err) {
      setError("Network error. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "350px",
          background: "#fff",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 0 15px rgba(0,0,0,0.1)",
        }}
      >
        {/* Added color: "#000" here */}
        <h2
          style={{
            marginBottom: "20px",
            textAlign: "center",
            color: "#000",
          }}
        >
          Super Admin Login
        </h2>

        {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            color: "#000", // Added color black for typed text
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            color: "#000", // Added color black for typed text
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "#111",
            color: "#fff",
            fontWeight: "bold",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
