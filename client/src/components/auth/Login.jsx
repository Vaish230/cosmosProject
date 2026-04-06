import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        },
      );

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setIsAuthenticated(true);
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Animated background circles */}
      <div
        style={{
          position: "absolute",
          top: "-160px",
          left: "-160px",
          width: "320px",
          height: "320px",
          background: "rgba(76, 175, 80, 0.2)",
          borderRadius: "50%",
          filter: "blur(80px)",
          animation: "pulse 3s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-160px",
          right: "-160px",
          width: "320px",
          height: "320px",
          background: "rgba(33, 150, 243, 0.2)",
          borderRadius: "50%",
          filter: "blur(80px)",
          animation: "pulse 3s ease-in-out infinite 1.5s",
        }}
      />

      {/* Login Card */}
      <div
        style={{
          position: "relative",
          background: "rgba(26, 26, 46, 0.8)",
          backdropFilter: "blur(16px)",
          borderRadius: "24px",
          padding: "32px",
          width: "384px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🌌</div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "white",
              marginBottom: "8px",
            }}
          >
            Welcome Back
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: "14px" }}>Enter the Cosmos</p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              color: "#F87171",
              padding: "12px",
              borderRadius: "12px",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                background: "#0A0A0F",
                border: "1px solid #2A2A3A",
                borderRadius: "12px",
                color: "white",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.3s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#4CAF50")}
              onBlur={(e) => (e.target.style.borderColor = "#2A2A3A")}
              required
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                background: "#0A0A0F",
                border: "1px solid #2A2A3A",
                borderRadius: "12px",
                color: "white",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.3s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#4CAF50")}
              onBlur={(e) => (e.target.style.borderColor = "#2A2A3A")}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)",
              color: "white",
              padding: "12px",
              borderRadius: "12px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s",
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
            }}
          >
            {loading ? "Logging in..." : "Enter Cosmos"}
          </button>
        </form>

        <p
          style={{
            color: "#9CA3AF",
            textAlign: "center",
            marginTop: "24px",
            fontSize: "14px",
          }}
        >
          New to Cosmos?{" "}
          <Link
            to="/signup"
            style={{ color: "#4CAF50", textDecoration: "none" }}
          >
            Create account
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default Login;
