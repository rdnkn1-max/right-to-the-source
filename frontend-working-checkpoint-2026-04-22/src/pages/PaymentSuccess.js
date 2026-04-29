import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState("Verifying payment...");
  const [error, setError] = useState("");
  const [isAchPending, setIsAchPending] = useState(false);

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setError("Missing session ID.");
      setStatus("");
    }
    // eslint-disable-next-line
  }, []);

  async function verifyPayment() {
    try {
      setStatus("Checking Stripe...");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not logged in");
      }

      const res = await fetch("http://localhost:4242/api/billing/verify-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();
      console.log("VERIFY RESPONSE:", data);

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      const paymentType = data.payment_type || "card";

      // 💳 CARD ONLY: must be truly paid to unlock
      const isCardPaid =
        paymentType === "card" &&
        (data.payment_status === "paid" || data.paid === true);

      // 🏦 ACH: always treat initial return as pending
      const isAchFlow = paymentType === "ach";

      setStatus("Updating your account...");

      if (isAchFlow) {
        const { error: updateError } = await supabase
          .from("businesses")
          .update({
            payment_status: "pending",
            subscription_status: "pending",
            stripe_checkout_session_id: sessionId,
            stripe_customer_id: data.customer_id || null,
            stripe_subscription_id: data.subscription_id || null,
          })
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        setIsAchPending(true);
        setStatus("");
        return;
      }

      if (!isCardPaid) {
        throw new Error("Card payment not completed.");
      }

      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          payment_status: "paid",
          subscription_status: "active",
          stripe_checkout_session_id: sessionId,
          stripe_customer_id: data.customer_id || null,
          stripe_subscription_id: data.subscription_id || null,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setStatus("You're in! 🚀 Redirecting...");

      setTimeout(() => {
        navigate("/seller-dashboard");
      }, 1500);
    } catch (err) {
      console.error("PAYMENT SUCCESS ERROR:", err);
      setError(err.message || "Something went wrong.");
      setStatus("");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>Payment Complete</p>
        <h2 style={styles.title}>Subscription Started</h2>

        {!error && !isAchPending && (
          <>
            <p style={styles.subtle}>{status}</p>

            {sessionId && (
              <div style={styles.infoBox}>
                <strong>Session ID:</strong> {sessionId}
              </div>
            )}
          </>
        )}

        {isAchPending && (
          <>
            <p style={styles.subtle}>Payment processing (1–3 days)</p>

            <div style={styles.pendingBox}>
              Your bank payment setup was received successfully. Full seller access
              will unlock once Stripe confirms the payment.
            </div>

            <button
              onClick={() => navigate("/seller-auth")}
              style={styles.primaryButton}
            >
              Back to Sign In
            </button>
          </>
        )}

        {error && (
          <>
            <p style={{ ...styles.subtle, color: "red" }}>{error}</p>

            <button
              onClick={() => navigate("/seller-auth")}
              style={styles.primaryButton}
            >
              Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f1e8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "520px",
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 16px 36px rgba(66,49,21,0.05)",
  },
  eyebrow: {
    margin: "0 0 6px 0",
    fontSize: "11px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#8a6b4b",
    fontWeight: 800,
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "30px",
    fontWeight: 800,
    color: "#1f1f1f",
  },
  subtle: {
    margin: "0 0 18px 0",
    color: "#6e655f",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  infoBox: {
    background: "#faf7f2",
    border: "1px solid #e6dccf",
    borderRadius: "18px",
    padding: "16px",
    marginBottom: "18px",
    color: "#222",
    fontSize: "14px",
  },
  pendingBox: {
    marginBottom: "18px",
    background: "#fff9e8",
    border: "1px solid #f1de9e",
    borderRadius: "18px",
    padding: "16px",
    color: "#7a5d00",
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: 1.6,
  },
  primaryButton: {
    width: "100%",
    marginTop: "8px",
    padding: "14px 18px",
    background: "#173d33",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
  },
};