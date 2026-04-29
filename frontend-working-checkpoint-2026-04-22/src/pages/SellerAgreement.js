import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function SellerAgreement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlBusinessId = searchParams.get("businessId");

  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadBusiness();
    // eslint-disable-next-line
  }, []);

  async function loadBusiness() {
    try {
      setLoading(true);
      setErrorMessage("");

      let idToUse = urlBusinessId;
      let businessData = null;

      if (!idToUse) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Missing business access link.");
        }

        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error || !data) {
          throw new Error("Business not found.");
        }

        idToUse = data.id;
        businessData = data;
      } else {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", idToUse)
          .single();

        if (error || !data) {
          throw new Error("Business not found.");
        }

        businessData = data;
      }

      setBusinessId(idToUse);
      setBusiness(businessData);

      if (businessData?.agreed_to_terms) {
        navigate(`/create-password?businessId=${idToUse}`);
        return;
      }
    } catch (err) {
      console.error("SellerAgreement load error:", err);
      setErrorMessage(err.message || "Could not load agreement.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAgree() {
    if (!checked) {
      setErrorMessage("You must agree to continue.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const { error } = await supabase
        .from("businesses")
        .update({
          agreed_to_terms: true,
          agreed_at: new Date().toISOString(),
        })
        .eq("id", businessId);

      if (error) throw error;

      navigate(`/create-password?businessId=${businessId}`);
    } catch (err) {
      console.error("SellerAgreement save error:", err);
      setErrorMessage(err.message || "Could not save agreement.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>Loading seller agreement...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.hero}>
          <p style={styles.eyebrow}>Approved Seller Setup</p>
          <h1 style={styles.title}>One last step before you go live</h1>
          <p style={styles.subtitle}>
            Review and accept the seller agreement to continue to your account setup.
          </p>
        </div>

        <div style={styles.grid}>
          <div style={styles.statusCard}>
            <p style={styles.cardEyebrow}>Seller Status</p>
            <h2 style={styles.statusTitle}>
              {business?.business_name || "Your Business"}
            </h2>

            <div style={styles.approvedBadge}>Approved</div>

            <div style={styles.meaningBox}>
              <h3 style={styles.meaningTitle}>What this means</h3>

              <div style={styles.pointRow}>
                <span style={styles.pointIconGreen}>✔</span>
                <div>
                  <p style={styles.pointHeading}>You’ve been approved</p>
                  <p style={styles.pointText}>
                    Your business passed review and is ready for seller access.
                  </p>
                </div>
              </div>

              <div style={styles.pointRow}>
                <span style={styles.pointIconDark}>•</span>
                <div>
                  <p style={styles.pointHeading}>You can manage your presence</p>
                  <p style={styles.pointText}>
                    After this agreement, you’ll continue to account setup and then access your seller tools.
                  </p>
                </div>
              </div>

              <div style={styles.pointRow}>
                <span style={styles.pointIconDark}>•</span>
                <div>
                  <p style={styles.pointHeading}>This protects the platform</p>
                  <p style={styles.pointText}>
                    The agreement keeps Right to the Source clean, trusted, and clear for everyone using it.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.agreementCard}>
            <p style={styles.cardEyebrow}>Seller Agreement</p>
            <h2 style={styles.agreementTitle}>
              Right to the Source Seller Agreement
            </h2>

            <div style={styles.scrollBox}>
              <p style={styles.agreementText}>
                Right to the Source is not liable for disputes, damages, losses,
                injuries, failed transactions, product issues, or customer complaints
                arising from interactions between sellers and users.
              </p>

              <p style={styles.sectionHeader}>1. Accurate Business Information</p>
              <p style={styles.agreementText}>
                You agree to provide truthful, current, and complete information
                about your business, products, services, and contact details.
              </p>

              <p style={styles.sectionHeader}>2. Seller Responsibility</p>
              <p style={styles.agreementText}>
                You are fully responsible for the items, products, services, pricing,
                descriptions, safety, legality, and fulfillment connected to your
                business listing.
              </p>

              <p style={styles.sectionHeader}>3. Platform Role</p>
              <p style={styles.agreementText}>
                Right to the Source is a discovery platform. We help people find
                local businesses, products, pop-ups, and vendors. We do not process
                fulfillment, guarantee transactions, or verify every claim made by sellers.
              </p>

              <p style={styles.sectionHeader}>4. Good Conduct</p>
              <p style={styles.agreementText}>
                Sellers must act professionally, honestly, and in a way that supports
                trust and local community use of the platform.
              </p>

              <p style={styles.sectionHeader}>5. Right to Remove</p>
              <p style={styles.agreementText}>
                We may remove or restrict access to any seller or listing at our
                discretion, including for inaccurate information, policy violations,
                unsafe conduct, abuse, or legal concerns.
              </p>

              <p style={styles.sectionHeader}>6. Acceptance</p>
              <p style={styles.agreementText}>
                By continuing, you confirm that you have read, understood, and agreed
                to these seller terms.
              </p>
            </div>

            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <span style={styles.checkboxText}>
                I have read and agree to the Right to the Source seller terms.
              </span>
            </label>

            {errorMessage ? (
              <div style={styles.errorBox}>{errorMessage}</div>
            ) : null}

            <button
              onClick={handleAgree}
              disabled={saving}
              style={styles.primaryButton}
            >
              {saving ? "Saving..." : "Agree & Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f1e8",
    fontFamily: "Arial, sans-serif",
    color: "#1f1f1f",
    padding: "32px 18px 48px",
  },
  shell: {
    maxWidth: "1240px",
    margin: "0 auto",
  },
  hero: {
    marginBottom: "18px",
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
    margin: "0 0 8px 0",
    fontSize: "28px",
    fontWeight: 800,
    lineHeight: 1.1,
  },
  subtitle: {
    margin: 0,
    color: "#6e655f",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "0.9fr 1.1fr",
    gap: "18px",
    alignItems: "start",
  },
  statusCard: {
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 14px 30px rgba(66,49,21,0.05)",
  },
  agreementCard: {
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 14px 30px rgba(66,49,21,0.05)",
  },
  cardEyebrow: {
    margin: "0 0 6px 0",
    fontSize: "11px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#8a6b4b",
    fontWeight: 800,
  },
  statusTitle: {
    margin: "0 0 12px 0",
    fontSize: "18px",
    fontWeight: 800,
  },
  approvedBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#edf7f1",
    border: "1px solid #cfe7d8",
    color: "#1f513f",
    fontSize: "12px",
    fontWeight: 800,
    marginBottom: "16px",
  },
  meaningBox: {
    border: "1px solid #e8ddd2",
    borderRadius: "18px",
    background: "#faf7f2",
    padding: "16px",
  },
  meaningTitle: {
    margin: "0 0 14px 0",
    fontSize: "15px",
    fontWeight: 800,
  },
  pointRow: {
    display: "grid",
    gridTemplateColumns: "26px 1fr",
    gap: "10px",
    alignItems: "start",
    marginBottom: "14px",
  },
  pointIconGreen: {
    width: "26px",
    height: "26px",
    borderRadius: "999px",
    background: "#173d33",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 800,
  },
  pointIconDark: {
    width: "26px",
    height: "26px",
    borderRadius: "999px",
    background: "#26443b",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 800,
  },
  pointHeading: {
    margin: "2px 0 3px 0",
    fontSize: "14px",
    fontWeight: 800,
  },
  pointText: {
    margin: 0,
    fontSize: "12px",
    color: "#6e655f",
    lineHeight: 1.6,
  },
  agreementTitle: {
    margin: "0 0 14px 0",
    fontSize: "16px",
    fontWeight: 800,
  },
  scrollBox: {
    border: "1px solid #e8ddd2",
    borderRadius: "16px",
    background: "#faf7f2",
    padding: "14px",
    maxHeight: "330px",
    overflowY: "auto",
    marginBottom: "14px",
  },
  sectionHeader: {
    margin: "14px 0 6px 0",
    fontSize: "13px",
    fontWeight: 800,
    color: "#2d2b28",
  },
  agreementText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.7,
    color: "#5c554f",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "14px",
    fontSize: "13px",
    color: "#2d2b28",
  },
  checkboxText: {
    lineHeight: 1.5,
    fontWeight: 700,
  },
  errorBox: {
    marginBottom: "12px",
    borderRadius: "14px",
    padding: "12px 14px",
    background: "#fff2f0",
    border: "1px solid #f2c9c2",
    color: "#b42318",
    fontSize: "13px",
    fontWeight: 700,
  },
  primaryButton: {
    width: "100%",
    padding: "14px 18px",
    background: "#173d33",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 10px 18px rgba(23,61,51,0.15)",
  },
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f6f1e8",
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
};