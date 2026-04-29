import React from "react";
import { useNavigate } from "react-router-dom";

export default function ApplicationPending() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.badge}>APPLICATION RECEIVED</div>

        <h1 style={styles.title}>🎉 Your business has been submitted!</h1>

        <p style={styles.subtitle}>
          Thanks for applying to join The Source. Your business is now in review.
        </p>

        <div style={styles.infoBox}>
          <p style={styles.infoLine}>
            ✅ Your application was submitted successfully
          </p>
          <p style={styles.infoLine}>
            ⏳ We’ll review it before it goes live
          </p>
          <p style={styles.infoLine}>
            📍 Once approved, you’ll be able to access your seller dashboard
          </p>
        </div>

        <div style={styles.buttonRow}>
          <button
            type="button"
            style={styles.primaryButton}
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => navigate("/seller-auth")}
          >
            Seller Login
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f6f1e8",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "700px",
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "24px",
    padding: "40px 32px",
    boxShadow: "0 18px 38px rgba(66,49,21,0.06)",
    textAlign: "center",
  },
  badge: {
    display: "inline-block",
    marginBottom: "14px",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#edf7f1",
    color: "#1f513f",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.12em",
  },
  title: {
    margin: "0 0 12px 0",
    fontSize: "38px",
    lineHeight: 1.1,
    color: "#222",
  },
  subtitle: {
    margin: "0 auto 22px auto",
    maxWidth: "560px",
    fontSize: "16px",
    lineHeight: 1.6,
    color: "#655d56",
  },
  infoBox: {
    textAlign: "left",
    background: "#faf7f2",
    border: "1px solid #eadfce",
    borderRadius: "18px",
    padding: "18px 18px",
    marginBottom: "24px",
  },
  infoLine: {
    margin: "8px 0",
    fontSize: "15px",
    color: "#3d3935",
    lineHeight: 1.5,
  },
  buttonRow: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "12px 18px",
    borderRadius: "999px",
    border: "none",
    background: "#173d33",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 18px rgba(23,61,51,0.15)",
  },
  secondaryButton: {
    padding: "12px 18px",
    borderRadius: "999px",
    border: "1px solid #d8cec1",
    background: "#ffffff",
    color: "#2c2a27",
    fontWeight: 700,
    cursor: "pointer",
  },
};