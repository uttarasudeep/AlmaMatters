import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./loginpage.css";
import { loginUnified, sendOtp, verifyOtp } from "./api";

function Field({ label, name, type = "text", placeholder, value, onChange, required, disabled }) {
  return (
    <div className="field-group">
      <label htmlFor={name} className="field-label">
        {label}{required && <span className="required-star"> *</span>}
      </label>
      <input
        id={name} name={name} type={type}
        placeholder={placeholder || label}
        value={value} onChange={onChange}
        disabled={disabled}
        className="field-input"
        autoComplete={type === "password" ? "current-password" : "off"}
      />
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password tab
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // OTP tab
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");

  const clearError = () => setError("");

  const handlePasswordLogin = async () => {
    if (!username.trim()) { setError("Please enter your username."); return; }
    if (!password.trim()) { setError("Please enter your password."); return; }
    setLoading(true); clearError();
    try {
      const user = await loginUnified(username, password);
      sessionStorage.setItem("currentUser", JSON.stringify({
        type: user.type,
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        username: user.username
      }));
      navigate("/home");
    } catch (e) {
      setError(e?.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email.trim()) { setError("Please enter your email."); return; }
    setLoading(true); clearError();
    try {
      await sendOtp(email);
      setOtpSent(true);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!enteredOtp.trim()) { setError("Please enter OTP."); return; }
    setLoading(true); clearError();
    try {
      const user = await verifyOtp(email, enteredOtp);
      sessionStorage.setItem("currentUser", JSON.stringify({
        type: user.type,
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        username: user.username
      }));
      navigate("/home"); // ← FIXED: now redirects to home, not profile
    } catch (e) {
      setError(e?.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Sign in to your AlmaMatters account</p>

        <div className="tab-switcher">
          <button
            className={`tab-btn${tab === "password" ? " active" : ""}`}
            onClick={() => { setTab("password"); clearError(); setOtpSent(false); }}
          >
            🔑 Username & Password
          </button>
          <button
            className={`tab-btn${tab === "otp" ? " active" : ""}`}
            onClick={() => { setTab("otp"); clearError(); setOtpSent(false); }}
          >
            📧 Email OTP
          </button>
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}

        {tab === "password" && (
          <div className="tab-body">
            <Field label="Username" name="username" required
              placeholder="Your username"
              value={username} onChange={e => { setUsername(e.target.value); clearError(); }} />
            <Field label="Password" name="password" type="password" required
              placeholder="Your password"
              value={password} onChange={e => { setPassword(e.target.value); clearError(); }} />
            <button className="btn-primary" onClick={handlePasswordLogin} disabled={loading}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </div>
        )}

        {tab === "otp" && (
          <div className="tab-body">
            {!otpSent ? (
              <>
                <Field label="Registered Email" name="email" type="email" required
                  placeholder="you@example.com"
                  value={email} onChange={e => { setEmail(e.target.value); clearError(); }} />
                <button className="btn-primary" onClick={handleSendOtp} disabled={loading}>
                  {loading ? "Sending…" : "Get OTP →"}
                </button>
              </>
            ) : (
              <>
                <p className="otp-step-label">Enter the 6-digit OTP sent to your email:</p>
                <Field label="OTP" name="otp" required
                  placeholder="6-digit OTP"
                  value={enteredOtp} onChange={e => { setEnteredOtp(e.target.value); clearError(); }} />
                <button className="btn-primary" onClick={handleVerifyOtp} disabled={loading}>
                  {loading ? "Verifying…" : "Verify & Sign In →"}
                </button>
                <button className="btn-link" onClick={() => { setOtpSent(false); setEnteredOtp(""); clearError(); }}>
                  ← Use a different email
                </button>
              </>
            )}
          </div>
        )}

        <p className="login-footer">
          Don't have an account?{" "}
          <button className="btn-link" onClick={() => navigate("/signup")}>Sign Up</button>
        </p>
      </div>
    </div>
  );
}