import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [message, setMessage] = useState("Processing your payment...");
  const [error, setError] = useState("");

  useEffect(() => {
    const verify = async () => {
      const sessionId = searchParams.get("session_id");
      const urlBusinessId = searchParams.get("businessId");

      if (!sessionId) {
        setError("Missing Stripe session ID.");
        setMessage("Payment could not be verified.");
        return;
      }

      try {
        setMessage("Verifying your Stripe payment...");

        const res = await fetch("http://localhost:4242/api/billing/verify-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();

        console.log("VERIFY RESULT:", data);

        if (!res.ok) {
          throw new Error(data?.error || "Verify session failed.");
        }

        const businessId =
          urlBusinessId ||
          data.businessId ||
          data.business_id ||
          null;

        if (!businessId) {
          throw new Error("Missing business ID after payment.");
        }

        if (data.paid || data.status === "complete" || data.payment_status === "paid") {
          setMessage("Payment confirmed. Opening your dashboard...");

          setTimeout(() => {
            navigate(`/seller-dashboard?businessId=${businessId}`, {
              replace: true,
            });
          }, 800);

          return;
        }

        setError("Stripe did not mark this payment as paid yet.");
        setMessage("Payment is still processing.");
      } catch (err) {
        console.error("PAYMENT SUCCESS VERIFY ERROR:", err);
        setError(err.message || "Something went wrong verifying payment.");
        setMessage("Payment verification needs attention.");
      }
    };

    verify();
  }, [navigate, searchParams]);

  const businessId =
    searchParams.get("businessId") ||
    searchParams.get("business_id") ||
    "";

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>Seller Activation</p>
        <h1 style={styles.title}>{message}</h1>

        <p style={styles.text}>
          Please wait while we confirm your subscription and unlock your seller dashboard.
        </p>

        {error ? (
          <div style={styles.errorBox}>
            <strong>Issue:</strong> {error}
          </div>
        ) : (
          <div style={styles.loadingBox}>Checking Stripe session...</div>
        )}

        {businessId ? (
          <button
            style={styles.button}
            onClick={() => navigate(`/seller-dashboard?businessId=${businessId}`)}
          >
            Go to Dashboard
          </button>
        ) : null}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5efe6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#fffdf8",
    border: "1px solid #e7ddcf",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
  },
  eyebrow: {
    margin: 0,
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#8a6b4b",
    fontWeight: 800,
  },
  title: {
    margin: "8px 0 10px",
    fontSize: 30,
    lineHeight: 1.1,
    color: "#1d1d1d",
  },
  text: {
    color: "#6d645d",
    lineHeight: 1.5,
  },
  loadingBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    background: "#eef7f1",
    color: "#164331",
    fontWeight: 700,
  },
  errorBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    background: "#fff2f0",
    color: "#9f2a1d",
    fontWeight: 700,
  },
  button: {
    marginTop: 18,
    width: "100%",
    padding: "14px 18px",
    borderRadius: 999,
    border: "none",
    background: "#173d33",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
};