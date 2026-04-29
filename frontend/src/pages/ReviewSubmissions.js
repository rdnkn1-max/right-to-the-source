import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function normalizeLink(url, type = "website") {
  if (!url) return null;

  let safeUrl = String(url).trim();
  if (!safeUrl) return null;

  if (type === "instagram") {
    safeUrl = safeUrl.replace(/^@/, "").trim();
    if (!safeUrl) return null;

    if (!safeUrl.startsWith("http://") && !safeUrl.startsWith("https://")) {
      safeUrl = `https://instagram.com/${safeUrl}`;
    }
  } else if (type === "facebook") {
    safeUrl = safeUrl.replace(/^@/, "").trim();
    if (!safeUrl) return null;

    if (!safeUrl.startsWith("http://") && !safeUrl.startsWith("https://")) {
      safeUrl = `https://${safeUrl}`;
    }
  } else {
    if (!safeUrl.startsWith("http://") && !safeUrl.startsWith("https://")) {
      safeUrl = `https://${safeUrl}`;
    }
  }

  return safeUrl;
}

function renderLink(url, label, type = "website") {
  const safeUrl = normalizeLink(url, type);
  if (!safeUrl) return "—";

  return (
    <a href={safeUrl} target="_blank" rel="noreferrer" style={styles.link}>
      {label}
    </a>
  );
}

export default function ReviewSubmissions() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("FETCH ERROR:", error);
        setErrorMessage("Could not load pending submissions.");
        setPending([]);
        return;
      }

      setPending(data || []);
    } catch (err) {
      console.error("FETCH FLOW ERROR:", err);
      setErrorMessage("Something went wrong while loading submissions.");
      setPending([]);
    } finally {
      setLoading(false);
    }
  }

  async function sendApprovalEmail(business) {
    const res = await fetch("http://localhost:4242/api/admin/send-approval-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: business.contact_email || business.email,
        businessName: business.business_name,
        businessId: business.id,
      }),
    });

    let data = {};
    try {
      data = await res.json();
    } catch (err) {
      console.error("EMAIL JSON ERROR:", err);
    }

    if (!res.ok) {
      throw new Error(data.error || "Approval email failed.");
    }

    return data;
  }

  async function approveBusiness(business) {
    try {
      setProcessingId(business.id);
      setMessage("");
      setErrorMessage("");

      const { error } = await supabase
        .from("businesses")
        .update({ status: "approved" })
        .eq("id", business.id);

      if (error) {
        console.error("APPROVE ERROR:", error);
        setErrorMessage("Error approving business.");
        return;
      }

      try {
        await sendApprovalEmail(business);
        setMessage(`${business.business_name} approved and email sent.`);
      } catch (emailErr) {
        console.error("EMAIL ERROR:", emailErr);
        setMessage(`${business.business_name} was approved, but email failed.`);
      }

      await fetchPending();
    } catch (err) {
      console.error("APPROVE FLOW ERROR:", err);
      setErrorMessage("Something went wrong during approval.");
    } finally {
      setProcessingId(null);
    }
  }

  async function rejectBusiness(business) {
    try {
      setProcessingId(business.id);
      setMessage("");
      setErrorMessage("");

      const { error } = await supabase
        .from("businesses")
        .update({ status: "rejected" })
        .eq("id", business.id);

      if (error) {
        console.error("REJECT ERROR:", error);
        setErrorMessage("Error rejecting business.");
        return;
      }

      setMessage(`${business.business_name} has been rejected.`);
      await fetchPending();
    } catch (err) {
      console.error("REJECT FLOW ERROR:", err);
      setErrorMessage("Something went wrong during rejection.");
    } finally {
      setProcessingId(null);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  function handleOpenAllLinks(biz) {
    const urls = [
      normalizeLink(biz.website, "website"),
      normalizeLink(biz.instagram, "instagram"),
      normalizeLink(biz.facebook, "facebook"),
    ].filter(Boolean);

    if (urls.length === 0) {
      setErrorMessage("No review links available for this business.");
      return;
    }

    urls.forEach((url) => {
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.hero}>
          <div>
            <p style={styles.eyebrow}>Admin Review</p>
            <h1 style={styles.pageTitle}>Review Business Submissions</h1>
            <p style={styles.pageSubtitle}>
              Approve or reject new sellers and review their details before they
              enter the platform.
            </p>
          </div>

          <div style={styles.counterCard}>
            <div style={styles.counterNumber}>{pending.length}</div>
            <div style={styles.counterLabel}>Pending</div>
          </div>
        </div>

        {message ? <div style={styles.successBox}>{message}</div> : null}
        {errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}

        {loading ? (
          <div style={styles.emptyCard}>Loading pending submissions...</div>
        ) : pending.length === 0 ? (
          <div style={styles.emptyCard}>No pending submissions.</div>
        ) : (
          <div style={styles.cardList}>
            {pending.map((biz) => {
              const isProcessing = processingId === biz.id;
              const websiteUrl = normalizeLink(biz.website, "website");
              const instagramUrl = normalizeLink(biz.instagram, "instagram");
              const facebookUrl = normalizeLink(biz.facebook, "facebook");

              return (
                <div key={biz.id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <div>
                      <p style={styles.cardEyebrow}>Business Submission</p>
                      <h2 style={styles.businessName}>
                        {biz.business_name || "Unnamed Business"}
                      </h2>

                      <div style={styles.pillRow}>
                        <span style={styles.pendingPill}>Pending</span>
                        {biz.category ? (
                          <span style={styles.softPill}>{biz.category}</span>
                        ) : null}
                        {biz.location ? (
                          <span style={styles.softPill}>{biz.location}</span>
                        ) : null}
                      </div>
                    </div>

                    <div style={styles.submittedBox}>
                      <div style={styles.submittedLabel}>Submitted</div>
                      <div style={styles.submittedValue}>
                        {formatDate(biz.created_at)}
                      </div>
                    </div>
                  </div>

                  <div style={styles.mainGrid}>
                    <div style={styles.leftColumn}>
                      <div style={styles.imageCard}>
                        {biz.image_url ? (
                          <a
                            href={biz.image_url}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.imageLink}
                          >
                            <img
                              src={biz.image_url}
                              alt={biz.business_name || "Business"}
                              style={styles.image}
                            />
                          </a>
                        ) : (
                          <div style={styles.imagePlaceholder}>No Image</div>
                        )}
                      </div>

                      <div style={styles.sectionCard}>
                        <h3 style={styles.sectionTitle}>Description</h3>
                        <p style={styles.bodyText}>
                          {biz.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div style={styles.rightColumn}>
                      <div style={styles.sectionCard}>
                        <h3 style={styles.sectionTitle}>Business Details</h3>

                        <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Business Name</span>
                          <span style={styles.infoValue}>
                            {biz.business_name || "—"}
                          </span>
                        </div>

                        <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Category</span>
                          <span style={styles.infoValue}>{biz.category || "—"}</span>
                        </div>

                        <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Location</span>
                          <span style={styles.infoValue}>{biz.location || "—"}</span>
                        </div>

                        <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Status</span>
                          <span style={styles.infoValue}>{biz.status || "—"}</span>
                        </div>
                      </div>

                      <div style={styles.sectionCard}>
                        <h3 style={styles.sectionTitle}>Contact</h3>

                        <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Email</span>
                          <span style={styles.infoValue}>
                            {biz.contact_email || biz.email || "—"}
                          </span>
                        </div>

                        <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Phone</span>
                          <span style={styles.infoValue}>
                            {biz.phone || biz.contact_phone || "—"}
                          </span>
                        </div>

                        <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Website</span>
                          <span style={styles.infoValue}>
                            {renderLink(biz.website, "Open", "website")}
                          </span>
                        </div>

                        <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Instagram</span>
                          <span style={styles.infoValue}>
                            {renderLink(biz.instagram, "View", "instagram")}
                          </span>
                        </div>

                        <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Facebook</span>
                          <span style={styles.infoValue}>
                            {renderLink(biz.facebook, "View", "facebook")}
                          </span>
                        </div>

                        <div style={styles.quickLinksRow}>
                          {websiteUrl ? (
                            <a
                              href={websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={styles.quickLinkPill}
                            >
                              Website
                            </a>
                          ) : null}

                          {instagramUrl ? (
                            <a
                              href={instagramUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={styles.quickLinkPill}
                            >
                              Instagram
                            </a>
                          ) : null}

                          {facebookUrl ? (
                            <a
                              href={facebookUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={styles.quickLinkPill}
                            >
                              Facebook
                            </a>
                          ) : null}
                        </div>
                      </div>

                      <div style={styles.sectionCard}>
                        <h3 style={styles.sectionTitle}>Review Actions</h3>
                        <p style={styles.bodyText}>
                          Approving this business sends them into the next seller
                          setup step.
                        </p>

                        <div style={styles.buttonRow}>
                          <button
                            onClick={() => approveBusiness(biz)}
                            disabled={isProcessing}
                            style={{
                              ...styles.approveButton,
                              opacity: isProcessing ? 0.8 : 1,
                              cursor: isProcessing ? "wait" : "pointer",
                            }}
                          >
                            {isProcessing ? "Processing..." : "Approve"}
                          </button>

                          <button
                            onClick={() => rejectBusiness(biz)}
                            disabled={isProcessing}
                            style={{
                              ...styles.rejectButton,
                              opacity: isProcessing ? 0.8 : 1,
                              cursor: isProcessing ? "wait" : "pointer",
                            }}
                          >
                            {isProcessing ? "Processing..." : "Reject"}
                          </button>

                          <button
                            onClick={() => handleOpenAllLinks(biz)}
                            disabled={isProcessing}
                            style={styles.openAllButton}
                          >
                            Open All Links
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f1e8",
    padding: "28px 18px 40px",
    fontFamily: "Arial, sans-serif",
    color: "#1f1f1f",
  },
  shell: {
    maxWidth: "1280px",
    margin: "0 auto",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  eyebrow: {
    margin: "0 0 6px 0",
    fontSize: "11px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#8a6b4b",
    fontWeight: 800,
  },
  pageTitle: {
    margin: "0 0 8px 0",
    fontSize: "38px",
    lineHeight: 1.05,
    fontWeight: 800,
  },
  pageSubtitle: {
    margin: 0,
    color: "#6e655f",
    fontSize: "15px",
    lineHeight: 1.6,
    maxWidth: "760px",
  },
  counterCard: {
    minWidth: "130px",
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "22px",
    padding: "18px",
    textAlign: "center",
    boxShadow: "0 16px 36px rgba(66,49,21,0.05)",
  },
  counterNumber: {
    fontSize: "34px",
    fontWeight: 800,
    color: "#173d33",
    lineHeight: 1,
    marginBottom: "6px",
  },
  counterLabel: {
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#7a7169",
  },
  successBox: {
    marginBottom: "16px",
    borderRadius: "14px",
    padding: "12px 14px",
    background: "#edf7f1",
    border: "1px solid #cfe7d8",
    color: "#1f513f",
    fontSize: "13px",
    fontWeight: 700,
  },
  errorBox: {
    marginBottom: "16px",
    borderRadius: "14px",
    padding: "12px 14px",
    background: "#fff2f0",
    border: "1px solid #f2c9c2",
    color: "#b42318",
    fontSize: "13px",
    fontWeight: 700,
  },
  emptyCard: {
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 18px 38px rgba(66,49,21,0.05)",
    fontSize: "15px",
    color: "#655d56",
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  card: {
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "26px",
    padding: "22px",
    boxShadow: "0 18px 38px rgba(66,49,21,0.05)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  cardEyebrow: {
    margin: "0 0 4px 0",
    fontSize: "11px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#8a6b4b",
    fontWeight: 800,
  },
  businessName: {
    margin: "0 0 8px 0",
    fontSize: "30px",
    lineHeight: 1.08,
    fontWeight: 800,
  },
  pillRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  pendingPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#fff7e8",
    color: "#8a5a00",
    border: "1px solid #ecd9a8",
    fontSize: "12px",
    fontWeight: 800,
  },
  softPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#f5f0e8",
    color: "#5e5448",
    border: "1px solid #e5d9cb",
    fontSize: "12px",
    fontWeight: 700,
  },
  submittedBox: {
    minWidth: "190px",
    background: "#faf7f2",
    border: "1px solid #e8ddd2",
    borderRadius: "18px",
    padding: "14px",
  },
  submittedLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "#8a6b4b",
    fontWeight: 800,
    marginBottom: "6px",
  },
  submittedValue: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#2c2a27",
    lineHeight: 1.5,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "0.9fr 1.1fr",
    gap: "18px",
    alignItems: "start",
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  imageCard: {
    background: "#faf8f4",
    border: "1px solid #e8ddd2",
    borderRadius: "20px",
    padding: "14px",
  },
  imageLink: {
    display: "block",
    textDecoration: "none",
  },
  image: {
    width: "100%",
    height: "260px",
    objectFit: "cover",
    borderRadius: "16px",
    border: "1px solid #e6dccf",
    background: "#f3eee7",
    cursor: "pointer",
  },
  imagePlaceholder: {
    height: "260px",
    borderRadius: "16px",
    border: "1px solid #e6dccf",
    background: "#f3eee7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#7c736c",
    fontWeight: 700,
  },
  sectionCard: {
    background: "#faf8f4",
    border: "1px solid #e8ddd2",
    borderRadius: "20px",
    padding: "16px",
  },
  sectionTitle: {
    margin: "0 0 12px 0",
    fontSize: "18px",
    fontWeight: 800,
  },
  bodyText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#4f4a45",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #e9dfd3",
  },
  infoLabel: {
    fontSize: "12px",
    fontWeight: 800,
    color: "#7a7169",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  infoValue: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#222",
    textAlign: "right",
    maxWidth: "65%",
    wordBreak: "break-word",
  },
  quickLinksRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "14px",
  },
  quickLinkPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#ffffff",
    border: "1px solid #dacec0",
    color: "#173d33",
    fontWeight: 800,
    fontSize: "12px",
    textDecoration: "none",
  },
  buttonRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "14px",
  },
  approveButton: {
    padding: "12px 18px",
    background: "#173d33",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    fontWeight: 800,
    fontSize: "14px",
    boxShadow: "0 10px 18px rgba(23,61,51,0.15)",
  },
  rejectButton: {
    padding: "12px 18px",
    background: "#b42318",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    fontWeight: 800,
    fontSize: "14px",
    boxShadow: "0 10px 18px rgba(180,35,24,0.15)",
  },
  openAllButton: {
    padding: "12px 18px",
    background: "#ffffff",
    color: "#173d33",
    border: "1px solid #d8cec1",
    borderRadius: "999px",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
  },
  link: {
    color: "#173d33",
    fontWeight: 700,
    textDecoration: "none",
  },
};