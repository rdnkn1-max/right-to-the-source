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
    if (businessId) {
      loadBusiness();
    } else {
      setLoading(false);
      setMessage("Missing business.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  async function loadBusiness() {
    try {
      setLoading(true);
      setMessage("");

      const cleanBusinessId = businessId?.trim();

      if (!cleanBusinessId) {
        setMessage("Missing business.");
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", cleanBusinessId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        console.warn("Business not found yet on PaymentSetup.");
        setBusiness(null);
        setMessage("Missing business.");
        return;
      }

      if (!data.agreed_to_terms) {
        navigate(`/seller-agreement?businessId=${data.id}`);
        return;
      }

      setBusiness(data);

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
  const isSubscriptionActive = business?.subscription_status === "active";

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>Loading payment setup...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.backgroundGlowOne} />
      <div style={styles.backgroundGlowTwo} />

      <div style={styles.shell}>
        <div style={styles.heroCard}>
          <div style={styles.heroLeft}>
            <p style={styles.eyebrow}>Seller Activation</p>
            <h1 style={styles.title}>Complete billing to unlock your dashboard</h1>
            <p style={styles.subtitle}>
              You’re almost in. Choose the payment method that works best for your
              business and finish activation for The Source.
            </p>
            <p style={styles.trustText}>
              🔒 Secure checkout powered by Stripe • Cancel anytime • No hidden fees
            </p>
          </div>

          <div style={styles.heroRight}>
            <span style={styles.statusPill}>{billingLabel}</span>
            <div style={styles.heroMiniCard}>
              <p style={styles.heroMiniLabel}>Activation progress</p>
              <div style={styles.progressTrack}>
                <div style={styles.progressFill} />
              </div>
              <p style={styles.heroMiniText}>Final step before your seller dashboard opens.</p>
            </div>
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
              <div style={styles.featureChip}>✓ Dashboard unlock</div>
              <div style={styles.featureChip}>✓ Billing tracked</div>
              <div style={styles.featureChip}>✓ Seller access activated</div>
            </div>

            <div style={styles.nextBox}>
              <p style={styles.nextTitle}>What happens next?</p>
              <p style={styles.nextText}>
                Once billing is complete, your dashboard unlocks so you can manage
                your business profile, products, events, and local discovery presence.
              </p>
            </div>
          </div>

          <div style={styles.choicesCard}>
            <div style={styles.choicesHeader}>
              <div>
                <p style={styles.cardEyebrow}>Choose Payment Method</p>
                <h3 style={styles.cardTitleLarge}>
                  Pick the best option for your business
                </h3>
                <p style={styles.cardText}>
                  Card is the fastest standard checkout. Bank transfer gives you the
                  lower monthly price.
                </p>
              </div>
            </div>

            <div style={styles.planGrid}>
              <div style={styles.planCardDark}>
                <div style={styles.planTop}>
                  <span style={styles.planBadgeDark}>Fastest</span>
                  <h4 style={styles.planTitleDark}>Pay with Card</h4>
                  <p style={styles.planPriceDark}>$15.99/month</p>
                </div>

                <div style={styles.planFeaturesDark}>
                  <div style={styles.planFeatureDark}>✓ Instant checkout flow</div>
                  <div style={styles.planFeatureDark}>✓ Simple card billing</div>
                  <div style={styles.planFeatureDark}>✓ Best for quick activation</div>
                </div>

                {!isSubscriptionActive ? (
                  <button
                    type="button"
                    style={styles.cardButton}
                    onClick={() => handleStartCheckout("card")}
                    disabled={!!startingCheckout}
                  >
                    {startingCheckout === "card" ? "Opening Checkout..." : "Pay with Card"}
                  </button>
                ) : null}
              </div>

              <div style={styles.planCardGreen}>
                <div style={styles.planTop}>
                  <span style={styles.planBadgeGreen}>Best Value</span>
                  <h4 style={styles.planTitleGreen}>Pay with Bank</h4>
                  <p style={styles.planPriceGreen}>$14.99/month</p>
                </div>

                <div style={styles.planFeatures}>
                  <div style={styles.planFeature}>✓ Lower monthly cost</div>
                  <div style={styles.planFeature}>✓ ACH / bank setup</div>
                  <div style={styles.planFeature}>✓ Good for long-term billing</div>
                </div>

                {!isSubscriptionActive ? (
                  <button
                    type="button"
                    style={styles.bankButton}
                    onClick={() => handleStartCheckout("ach")}
                    disabled={!!startingCheckout}
                  >
                    {startingCheckout === "ach" ? "Opening Checkout..." : "Pay with Bank"}
                  </button>
                ) : null}
              </div>
            </div>

            <div style={styles.reassuranceGrid}>
              <div style={styles.reassuranceItem}>
                <strong>Secure setup</strong>
                <span>Handled through Stripe checkout.</span>
              </div>
              <div style={styles.reassuranceItem}>
                <strong>Simple activation</strong>
                <span>Finish billing, then manage your seller tools.</span>
              </div>
              <div style={styles.reassuranceItem}>
                <strong>Built local</strong>
                <span>Made to help nearby buyers discover you.</span>
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
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top left, #efe2d1 0%, transparent 34%), linear-gradient(180deg, #f4efe7 0%, #f7f3ec 40%, #fbf8f3 100%)",
    padding: "40px 20px 60px",
    fontFamily: "Arial, sans-serif",
    color: "#1f1f1f",
  },
  backgroundGlowOne: {
    position: "absolute",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    background: "rgba(23, 61, 51, 0.08)",
    top: "80px",
    right: "-120px",
    filter: "blur(6px)",
    pointerEvents: "none",
  },
  backgroundGlowTwo: {
    position: "absolute",
    width: "280px",
    height: "280px",
    borderRadius: "999px",
    background: "rgba(138, 107, 75, 0.10)",
    bottom: "-120px",
    left: "-90px",
    filter: "blur(6px)",
    pointerEvents: "none",
  },
  shell: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1240px",
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
    background: "rgba(255, 253, 250, 0.96)",
    border: "1px solid #e6dccf",
    borderRadius: "32px",
    padding: "34px",
    marginBottom: "22px",
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
    alignItems: "center",
    flexWrap: "wrap",
    boxShadow: "0 24px 60px rgba(66,49,21,0.09)",
  },
  heroLeft: {
    maxWidth: "760px",
  },
  heroRight: {
    minWidth: "240px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "stretch",
  },
  eyebrow: {
    margin: "0 0 7px 0",
    fontSize: "11px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 900,
    color: "#8a6b4b",
  },
  title: {
    margin: "0 0 12px 0",
    fontSize: "44px",
    fontWeight: 900,
    lineHeight: 1.02,
    letterSpacing: "-0.04em",
  },
  subtitle: {
    margin: 0,
    fontSize: "16px",
    lineHeight: 1.7,
    color: "#6e655f",
    maxWidth: "720px",
  },
  trustText: {
    margin: "12px 0 0 0",
    fontSize: "13px",
    color: "#594f47",
    fontWeight: 800,
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 16px",
    borderRadius: "999px",
    border: "1px solid #d8cec1",
    background: "#ffffff",
    color: "#2c2a27",
    fontWeight: 900,
    fontSize: "12px",
    boxShadow: "0 10px 20px rgba(66,49,21,0.06)",
  },
  heroMiniCard: {
    borderRadius: "20px",
    border: "1px solid #e8ddd2",
    background: "#faf7f2",
    padding: "14px",
  },
  heroMiniLabel: {
    margin: "0 0 10px 0",
    fontSize: "11px",
    color: "#8a6b4b",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 900,
  },
  progressTrack: {
    width: "100%",
    height: "8px",
    borderRadius: "999px",
    background: "#e8ddd2",
    overflow: "hidden",
    marginBottom: "9px",
  },
  progressFill: {
    width: "86%",
    height: "100%",
    borderRadius: "999px",
    background: "#173d33",
  },
  heroMiniText: {
    margin: 0,
    fontSize: "12px",
    color: "#6e655f",
    lineHeight: 1.45,
    fontWeight: 700,
  },
  messageBox: {
    marginBottom: "18px",
    borderRadius: "16px",
    padding: "13px 15px",
    fontSize: "13px",
    fontWeight: 800,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "0.86fr 1.14fr",
    gap: "22px",
    alignItems: "stretch",
  },
  summaryCard: {
    background: "rgba(255, 253, 250, 0.97)",
    border: "1px solid #e6dccf",
    borderRadius: "32px",
    padding: "28px",
    boxShadow: "0 24px 60px rgba(66,49,21,0.09)",
  },
  choicesCard: {
    background: "rgba(255, 253, 250, 0.97)",
    border: "1px solid #e6dccf",
    borderRadius: "32px",
    padding: "28px",
    boxShadow: "0 24px 60px rgba(66,49,21,0.09)",
  },
  choicesHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
  },
  cardEyebrow: {
    margin: "0 0 7px 0",
    fontSize: "11px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#8a6b4b",
    fontWeight: 900,
  },
  cardTitle: {
    margin: "0 0 14px 0",
    fontSize: "25px",
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },
  cardTitleLarge: {
    margin: "0 0 9px 0",
    fontSize: "30px",
    fontWeight: 900,
    letterSpacing: "-0.035em",
  },
  cardText: {
    margin: "0 0 20px 0",
    color: "#6d645d",
    fontSize: "14px",
    lineHeight: 1.65,
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
    padding: "13px 0",
    borderBottom: "1px solid #efe5d8",
  },
  summaryLabel: {
    fontSize: "12px",
    fontWeight: 900,
    color: "#7a7169",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  summaryValue: {
    fontSize: "14px",
    fontWeight: 800,
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
    fontWeight: 800,
    color: "#4f473f",
  },
  nextBox: {
    marginTop: "18px",
    borderRadius: "20px",
    background: "#173d33",
    color: "#fff",
    padding: "18px",
    boxShadow: "0 16px 32px rgba(23,61,51,0.16)",
  },
  nextTitle: {
    margin: "0 0 7px 0",
    fontSize: "15px",
    fontWeight: 900,
  },
  nextText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.65,
    color: "rgba(255,255,255,0.82)",
    fontWeight: 600,
  },
  planGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
    marginTop: "20px",
  },
  planCardDark: {
    borderRadius: "28px",
    padding: "28px",
    background: "linear-gradient(135deg, #18212f 0%, #243247 100%)",
    color: "#fff",
    boxShadow: "0 28px 60px rgba(24,33,47,0.30)",
    transform: "scale(1.02)",
    border: "2px solid rgba(255,255,255,0.08)",
  },
  planCardGreen: {
    borderRadius: "28px",
    padding: "28px",
    background: "#ecfbf1",
    color: "#173d33",
    border: "1px solid #cfe7d8",
    boxShadow: "0 22px 45px rgba(23,61,51,0.11)",
  },
  planTop: {
    marginBottom: "20px",
  },
  planBadgeDark: {
    display: "inline-block",
    marginBottom: "12px",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#18212f",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  planBadgeGreen: {
    display: "inline-block",
    marginBottom: "12px",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#dff5e7",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  planTitleDark: {
    margin: "0 0 7px 0",
    fontSize: "27px",
    fontWeight: 900,
    letterSpacing: "-0.035em",
  },
  planTitleGreen: {
    margin: "0 0 7px 0",
    fontSize: "27px",
    fontWeight: 900,
    letterSpacing: "-0.035em",
  },
  planPriceDark: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 800,
    opacity: 0.96,
  },
  planPriceGreen: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 800,
    color: "#1f513f",
  },
  planFeatures: {
    display: "flex",
    flexDirection: "column",
    gap: "11px",
    marginBottom: "22px",
  },
  planFeaturesDark: {
    display: "flex",
    flexDirection: "column",
    gap: "11px",
    marginBottom: "22px",
    color: "rgba(255,255,255,0.9)",
  },
  planFeature: {
    fontSize: "14px",
    lineHeight: 1.5,
    fontWeight: 800,
  },
  planFeatureDark: {
    fontSize: "14px",
    lineHeight: 1.5,
    fontWeight: 800,
  },
  cardButton: {
    width: "100%",
    padding: "16px 20px",
    borderRadius: "999px",
    border: "none",
    background: "#ffffff",
    color: "#18212f",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: "15px",
    boxShadow: "0 14px 28px rgba(0,0,0,0.22)",
  },
  bankButton: {
    width: "100%",
    padding: "16px 20px",
    borderRadius: "999px",
    border: "none",
    background: "linear-gradient(135deg, #173d33 0%, #1f5a47 100%)",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: "15px",
    boxShadow: "0 14px 28px rgba(23,61,51,0.25)",
  },
  reassuranceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "12px",
    marginTop: "22px",
  },
  reassuranceItem: {
    borderRadius: "18px",
    border: "1px solid #e8ddd2",
    background: "#faf7f2",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    fontSize: "12px",
    color: "#6e655f",
    lineHeight: 1.4,
  },
  bottomActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "20px",
  },
  secondaryButton: {
    padding: "13px 20px",
    borderRadius: "999px",
    border: "1px solid #d8cec1",
    background: "#ffffff",
    color: "#2c2a27",
    fontWeight: 800,
    cursor: "pointer",
  },
};