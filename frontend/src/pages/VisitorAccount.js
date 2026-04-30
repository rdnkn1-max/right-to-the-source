import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function VisitorAccount() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!mounted) return;
        setUser(data?.user || null);
      } catch (err) {
        console.error("VISITOR ACCOUNT LOAD ERROR:", err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      navigate("/auth");
    } catch (err) {
      console.error("VISITOR LOGOUT ERROR:", err);
      alert("Could not log out right now.");
    }
  }

  function goToMyFinds() {
    navigate("/my-finds");
  }

  function goToAuth() {
    navigate("/auth");
  }

  function goToMap() {
    navigate("/map");
  }

  return (
    <div className="visitor-account-page" style={styles.page}>
      <style>{mobileCss}</style>
      <div className="visitor-account-shell" style={styles.shell}>
        <div className="visitor-account-hero" style={styles.heroCard}>
          <p style={styles.eyebrow}>Visitor Account</p>
          <h1 style={styles.title}>Your profile, follows, and future alerts live here.</h1>
          <p style={styles.text}>
            Keep track of the sellers you follow, jump back into My Finds fast,
            and get ready for notification settings when that feature goes live.
          </p>

          <div style={styles.heroBullets}>
            <div style={styles.heroBullet}>⭐ My Finds saved in one place</div>
            <div style={styles.heroBullet}>👤 Simple visitor account overview</div>
            <div style={styles.heroBullet}>🔔 Notification settings coming soon</div>
          </div>
        </div>

        <div className="visitor-account-card" style={styles.card}>
          {loading ? (
            <div style={styles.statusCard}>
              <p style={styles.statusText}>Loading your account…</p>
            </div>
          ) : user ? (
            <>
              <div style={styles.section}>
                <div style={styles.sectionEyebrow}>Logged-in account</div>
                <h2 style={styles.sectionTitle}>Visitor Profile</h2>
                <div style={styles.accountRow}>
                  <div style={styles.accountLabel}>Email</div>
                  <div style={styles.accountValue}>{user.email || "No email found"}</div>
                </div>
              </div>

              <div style={styles.section}>
                <div style={styles.sectionEyebrow}>Quick actions</div>
                <div style={styles.actionStack}>
                  <button type="button" style={styles.primaryButton} onClick={goToMyFinds}>
                    Open My Finds
                  </button>
                  <button type="button" style={styles.secondaryButton} onClick={goToMap}>
                    Explore Map
                  </button>
                  <button type="button" style={styles.ghostButton} onClick={handleLogout}>
                    Log Out
                  </button>
                </div>
              </div>

              <div style={styles.placeholderCard}>
                <div style={styles.sectionEyebrow}>Coming soon</div>
                <h3 style={styles.placeholderTitle}>Notification Settings</h3>
                <p style={styles.placeholderText}>
                  This is where visitor notification controls will live once alerts are ready.
                </p>
              </div>
            </>
          ) : (
            <>
              <div style={styles.section}>
                <div style={styles.sectionEyebrow}>Visitor account</div>
                <h2 style={styles.sectionTitle}>Log in to view your profile</h2>
                <p style={styles.sectionText}>
                  Sign in to see your account email, open My Finds, and manage your visitor-side settings.
                </p>
              </div>

              <div style={styles.actionStack}>
                <button type="button" style={styles.primaryButton} onClick={goToAuth}>
                  Log In or Sign Up
                </button>
                <button type="button" style={styles.secondaryButton} onClick={goToMap}>
                  Continue to Map
                </button>
              </div>

              <div style={styles.placeholderCard}>
                <div style={styles.sectionEyebrow}>Coming soon</div>
                <h3 style={styles.placeholderTitle}>Notification Settings</h3>
                <p style={styles.placeholderText}>
                  Once visitor alerts are added, you’ll manage them from this page.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #faf5ec 0%, #f3ebdf 45%, #ece2d4 100%)",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color: "#173d33",
  },
  shell: {
    maxWidth: "1080px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.02fr 0.98fr",
    gap: "22px",
    alignItems: "stretch",
  },
  heroCard: {
    background: "linear-gradient(180deg, #173d33 0%, #1f4b40 100%)",
    color: "#fff",
    borderRadius: "32px",
    padding: "32px",
    boxShadow: "0 24px 60px rgba(23,61,51,.22)",
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },
  eyebrow: {
    margin: 0,
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "rgba(255,255,255,0.72)",
    fontWeight: 900,
  },
  title: {
    margin: 0,
    fontSize: "clamp(34px, 4vw, 52px)",
    lineHeight: 0.98,
    letterSpacing: "-0.05em",
  },
  text: {
    margin: 0,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.7,
    fontSize: "16px",
  },
  heroBullets: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  heroBullet: {
    padding: "14px 16px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    fontWeight: 700,
  },
  card: {
    background: "rgba(255,255,255,0.92)",
    padding: "26px",
    borderRadius: "32px",
    width: "100%",
    boxShadow: "0 24px 60px rgba(0,0,0,0.08)",
    border: "1px solid rgba(125,108,90,0.14)",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  statusCard: {
    background: "#fffdf8",
    border: "1px solid #eadfce",
    borderRadius: "20px",
    padding: "18px",
  },
  statusText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#655d56",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  sectionEyebrow: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "#8a7b6d",
    fontWeight: 900,
  },
  sectionTitle: {
    margin: 0,
    fontSize: "30px",
    lineHeight: 1.02,
    letterSpacing: "-0.04em",
    color: "#102a21",
  },
  sectionText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.65,
    color: "#665f58",
  },
  accountRow: {
    padding: "16px 18px",
    borderRadius: "18px",
    border: "1px solid #e2d8cb",
    background: "#fffdf9",
  },
  accountLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "#8a7b6d",
    fontWeight: 900,
    marginBottom: "8px",
  },
  accountValue: {
    fontSize: "16px",
    fontWeight: 800,
    color: "#173d33",
    wordBreak: "break-word",
  },
  actionStack: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  primaryButton: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #173d33 0%, #224e42 100%)",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 16px 30px rgba(23,61,51,.16)",
  },
  secondaryButton: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#fff",
    color: "#173d33",
    border: "1px solid #ddd6cb",
    cursor: "pointer",
    fontWeight: 800,
  },
  ghostButton: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#f7f1e8",
    color: "#5f5146",
    border: "1px solid #e2d8cb",
    cursor: "pointer",
    fontWeight: 800,
  },
  placeholderCard: {
    padding: "18px",
    borderRadius: "22px",
    border: "1px solid #e2d8cb",
    background: "linear-gradient(180deg, #fffdf8 0%, #f9f3e8 100%)",
  },
  placeholderTitle: {
    margin: "0 0 8px",
    fontSize: "20px",
    color: "#173d33",
  },
  placeholderText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.65,
    color: "#665f58",
  },
};

const mobileCss = `
  @media (max-width: 767px) {
    .visitor-account-page {
      padding: 18px 14px calc(var(--safe-bottom) + var(--mobile-bottom-nav-height, 88px) + 28px) !important;
    }

    .visitor-account-shell {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
      max-width: 100% !important;
    }

    .visitor-account-hero,
    .visitor-account-card {
      padding: 22px 18px !important;
      border-radius: 28px !important;
    }
  }
`;
