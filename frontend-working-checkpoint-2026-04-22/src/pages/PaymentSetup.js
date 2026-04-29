import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const BILLING_API_URL = "http://localhost:4242/api/billing/create-checkout-session";

function getBillingStateLabel(business) {
  if (!business) return "Not set up";
  if (business.payment_override) return "Manual override active";
  if (business.subscription_status === "active") return "Active";
  if (business.subscription_status === "pending_payment") return "Pending payment";
  if (business.subscription_status === "pending") return "Pending";
  if (business.subscription_status === "suspended") return "Suspended";
  if (business.payment_status === "past_due") return "Past due";
  if (business.payment_status === "failed") return "Payment failed";
  return "Not subscribed";
}

export default function PaymentSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const businessId = searchParams.get("businessId");
  const canceled = searchParams.get("canceled");

  const [loading, setLoading] = useState(true);
  const [startingCheckout, setStartingCheckout] = useState("");
  const [business, setBusiness] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadBusiness() {
    try {
      setLoading(true);
      setMessage("");

      let businessData = null;

      if (businessId) {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", businessId)
          .single();

        if (error || !data) throw new Error("Business not found");
        businessData = data;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("User not logged in");

        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error || !data) throw new Error("Business not found");
        businessData = data;
      }

      if (!businessData.agreed_to_terms) {
        navigate(`/seller-agreement?businessId=${businessData.id}`);
        return;
      }

      setBusiness(businessData);

      if (canceled === "true") {
        setMessage("Payment was canceled. You can try again below.");
      }
    } catch (err) {
      console.error("PaymentSetup load error:", err);
      setMessage(err.message || "Could not load payment setup.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartCheckout(paymentType) {
    try {
      setStartingCheckout(paymentType);
      setMessage("");

      if (!business?.id) {
        setMessage("Missing business.");
        return;
      }

      const email = business?.contact_email || business?.email || "";

      if (!email) {
        setMessage("No business email found.");
        return;
      }

      const response = await fetch(BILLING_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: business.id,
          email,
          paymentType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not start payment setup.");
      }

      if (!data?.url) {
        throw new Error("Checkout URL not returned.");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("PaymentSetup checkout error:", err);
      setMessage(err.message || "Could not start payment setup.");
    } finally {
      setStartingCheckout("");
    }
  }

  const billingLabel = useMemo(() => getBillingStateLabel(business), [business]);

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>Loading payment setup...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.heroCard}>
          <div style={styles.heroLeft}>
            <p style={styles.eyebrow}>Seller Activation</p>
            <h1 style={styles.title}>Complete billing to unlock your dashboard</h1>
            <p style={styles.subtitle}>
              You’re almost in. Choose the payment method that works best for your
              business and finish activation for The Source.
            </p>
          </div>

          <div style={styles.heroBadgeWrap}>
            <span style={styles.statusPill}>{billingLabel}</span>
          </div>
        </div>

        {message ? (
          <div
            style={{
              ...styles.messageBox,
              color:
                message.toLowerCase().includes("canceled") ||
                message.toLowerCase().includes("try again")
                  ? "#8a5a00"
                  : "#b42318",
              background:
                message.toLowerCase().includes("canceled") ||
                message.toLowerCase().includes("try again")
                  ? "#fff7e8"
                  : "#fff2f0",
              border:
                message.toLowerCase().includes("canceled") ||
                message.toLowerCase().includes("try again")
                  ? "1px solid #ecd9a8"
                  : "1px solid #f2c9c2",
            }}
          >
            {message}
          </div>
        ) : null}

        <div style={styles.mainGrid}>
          <div style={styles.summaryCard}>
            <p style={styles.cardEyebrow}>Business Summary</p>
            <h3 style={styles.cardTitle}>
              {business?.business_name || "Your Business"}
            </h3>

            <div style={styles.summaryRows}>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Business</span>
                <span style={styles.summaryValue}>
                  {business?.business_name || "—"}
                </span>
              </div>

              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Category</span>
                <span style={styles.summaryValue}>{business?.category || "—"}</span>
              </div>

              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Location</span>
                <span style={styles.summaryValue}>{business?.location || "—"}</span>
              </div>

              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Contact</span>
                <span style={styles.summaryValue}>
                  {business?.contact_email || business?.email || "—"}
                </span>
              </div>

              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Agreement</span>
                <span style={styles.summaryValue}>
                  {business?.agreed_to_terms ? "Signed" : "Not signed"}
                </span>
              </div>

              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Current Billing</span>
                <span style={styles.summaryValue}>{billingLabel}</span>
              </div>
            </div>

            <div style={styles.summaryFoot}>
              <div style={styles.featureChip}>Dashboard unlock</div>
              <div style={styles.featureChip}>Billing tracked</div>
              <div style={styles.featureChip}>Seller access activated</div>
            </div>
          </div>

          <div style={styles.choicesCard}>
            <p style={styles.cardEyebrow}>Choose Payment Method</p>
            <h3 style={styles.cardTitleLarge}>Pick the best option for your business</h3>
            <p style={styles.cardText}>
              Card is the fastest standard checkout. Bank transfer gives you the
              lower monthly price.
            </p>

            <div style={styles.planGrid}>
              <div style={styles.planCardDark}>
                <div style={styles.planTop}>
                  <span style={styles.planBadgeDark}>Fastest</span>
                  <h4 style={styles.planTitleDark}>Pay with Card</h4>
                  <p style={styles.planPriceDark}>$15.99/month</p>
                </div>

                <div style={styles.planFeatures}>
                  <div style={styles.planFeature}>Instant checkout flow</div>
                  <div style={styles.planFeature}>Simple card billing</div>
                  <div style={styles.planFeature}>Best for quick activation</div>
                </div>

                <button
                  type="button"
                  style={styles.cardButton}
                  onClick={() => handleStartCheckout("card")}
                  disabled={!!startingCheckout}
                >
                  {startingCheckout === "card" ? "Opening Checkout..." : "Pay with Card"}
                </button>
              </div>

              <div style={styles.planCardGreen}>
                <div style={styles.planTop}>
                  <span style={styles.planBadgeGreen}>Best Value</span>
                  <h4 style={styles.planTitleGreen}>Pay with Bank</h4>
                  <p style={styles.planPriceGreen}>$14.99/month</p>
                </div>

                <div style={styles.planFeatures}>
                  <div style={styles.planFeature}>Lower monthly cost</div>
                  <div style={styles.planFeature}>ACH / bank setup</div>
                  <div style={styles.planFeature}>Good for long-term billing</div>
                </div>

                <button
                  type="button"
                  style={styles.bankButton}
                  onClick={() => handleStartCheckout("ach")}
                  disabled={!!startingCheckout}
                >
                  {startingCheckout === "ach" ? "Opening Checkout..." : "Pay with Bank"}
                </button>
              </div>
            </div>

            <div style={styles.bottomActions}>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() =>
                  navigate(
                    business?.id
                      ? `/seller-agreement?businessId=${business.id}`
                      : "/seller-agreement"
                  )
                }
              >
                Back to Agreement
              </button>

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() =>
                  navigate(
                    business?.id
                      ? `/seller-dashboard?businessId=${business.id}`
                      : "/seller-dashboard"
                  )
                }
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f4efe7 0%, #f7f3ec 26%, #fbf8f3 100%)",
    padding: "32px 18px 48px",
    fontFamily: "Arial, sans-serif",
    color: "#1f1f1f",
  },
  shell: {
    maxWidth: "1220px",
    margin: "0 auto",
  },
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(180deg, #f4efe7 0%, #f7f3ec 26%, #fbf8f3 100%)",
    fontFamily: "Arial, sans-serif",
  },
  loadingCard: {
    padding: "20px 24px",
    borderRadius: "18px",
    background: "#fffdfa",
    border: "1px solid #eadfce",
    boxShadow: "0 12px 26px rgba(66,49,21,0.06)",
    color: "#655d56",
    fontSize: "14px",
  },
  heroCard: {
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "28px",
    padding: "26px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    boxShadow: "0 18px 38px rgba(66,49,21,0.05)",
  },
  heroLeft: {
    maxWidth: "760px",
  },
  eyebrow: {
    margin: "0 0 6px 0",
    fontSize: "11px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 800,
    color: "#8a6b4b",
  },
  title: {
    margin: "0 0 10px 0",
    fontSize: "40px",
    fontWeight: 800,
    lineHeight: 1.02,
  },
  subtitle: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.7,
    color: "#6e655f",
    maxWidth: "700px",
  },
  heroBadgeWrap: {
    display: "flex",
    alignItems: "center",
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "11px 14px",
    borderRadius: "999px",
    border: "1px solid #d8cec1",
    background: "#ffffff",
    color: "#2c2a27",
    fontWeight: 800,
    fontSize: "12px",
    boxShadow: "0 10px 18px rgba(66,49,21,0.04)",
  },
  messageBox: {
    marginBottom: "18px",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "13px",
    fontWeight: 700,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "0.88fr 1.12fr",
    gap: "18px",
    alignItems: "start",
  },
  summaryCard: {
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 18px 38px rgba(66,49,21,0.05)",
  },
  choicesCard: {
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 18px 38px rgba(66,49,21,0.05)",
  },
  cardEyebrow: {
    margin: "0 0 6px 0",
    fontSize: "11px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#8a6b4b",
    fontWeight: 800,
  },
  cardTitle: {
    margin: "0 0 12px 0",
    fontSize: "24px",
    fontWeight: 800,
  },
  cardTitleLarge: {
    margin: "0 0 8px 0",
    fontSize: "28px",
    fontWeight: 800,
  },
  cardText: {
    margin: "0 0 18px 0",
    color: "#6d645d",
    fontSize: "14px",
    lineHeight: 1.6,
    maxWidth: "680px",
  },
  summaryRows: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    marginTop: "8px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid #efe5d8",
  },
  summaryLabel: {
    fontSize: "12px",
    fontWeight: 800,
    color: "#7a7169",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  summaryValue: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#222",
    textAlign: "right",
    maxWidth: "60%",
    wordBreak: "break-word",
  },
  summaryFoot: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "18px",
  },
  featureChip: {
    padding: "10px 12px",
    borderRadius: "999px",
    background: "#f6f1e8",
    border: "1px solid #e6dccf",
    fontSize: "12px",
    fontWeight: 700,
    color: "#4f473f",
  },
  planGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginTop: "18px",
  },
  planCardDark: {
    borderRadius: "24px",
    padding: "22px",
    background: "#18212f",
    color: "#fff",
    boxShadow: "0 18px 34px rgba(24,33,47,0.18)",
  },
  planCardGreen: {
    borderRadius: "24px",
    padding: "22px",
    background: "#ecfbf1",
    color: "#173d33",
    border: "1px solid #cfe7d8",
    boxShadow: "0 18px 34px rgba(23,61,51,0.08)",
  },
  planTop: {
    marginBottom: "18px",
  },
  planBadgeDark: {
    display: "inline-block",
    marginBottom: "10px",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.12)",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  planBadgeGreen: {
    display: "inline-block",
    marginBottom: "10px",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#dff5e7",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  planTitleDark: {
    margin: "0 0 6px 0",
    fontSize: "24px",
    fontWeight: 800,
  },
  planTitleGreen: {
    margin: "0 0 6px 0",
    fontSize: "24px",
    fontWeight: 800,
  },
  planPriceDark: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 700,
    opacity: 0.95,
  },
  planPriceGreen: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 700,
    color: "#1f513f",
  },
  planFeatures: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
  },
  planFeature: {
    fontSize: "14px",
    lineHeight: 1.5,
    fontWeight: 600,
  },
  cardButton: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "999px",
    border: "none",
    background: "#ffffff",
    color: "#18212f",
    fontWeight: 800,
    cursor: "pointer",
  },
  bankButton: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "999px",
    border: "none",
    background: "#173d33",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 22px rgba(23,61,51,0.16)",
  },
  bottomActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "18px",
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