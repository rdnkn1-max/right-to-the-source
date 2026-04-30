import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function VisitorAuth() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleAuth() {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return alert(error.message);

      navigate("/map");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return alert(error.message);

      alert("Account created! You can now log in.");
      setIsLogin(true);
    }
  }

  return (
    <div className="visitor-auth-page" style={styles.container}>
      <style>{mobileCss}</style>
      <div className="visitor-auth-shell" style={styles.shell}>
        <div className="visitor-auth-hero app-animate-card" style={styles.heroPanel}>
          <div style={styles.eyebrow}>Profile</div>
          <h1 style={styles.heroTitle}>Your favorites, follows, and local finds live here.</h1>
          <p style={styles.heroText}>
            Log in to save sellers, revisit places you liked, and jump back into the
            map without starting over.
          </p>

          <div style={styles.heroList}>
            <div style={styles.heroListItem}>⭐ Save sellers you want to revisit</div>
            <div style={styles.heroListItem}>📍 Jump back into nearby discovery fast</div>
            <div style={styles.heroListItem}>🔔 Stay ready for what’s live around you</div>
          </div>
        </div>

        <div className="visitor-auth-card app-animate-card app-animate-card--delay-1" style={styles.card}>
          <div className="visitor-auth-segmented" style={styles.segmentedRow}>
            <button
              type="button"
              style={{ ...styles.segmentedButton, ...(isLogin ? styles.segmentedButtonActive : {}) }}
              onClick={() => setIsLogin(true)}
            >
              Log In
            </button>
            <button
              type="button"
              style={{ ...styles.segmentedButton, ...(!isLogin ? styles.segmentedButtonActive : {}) }}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          <div style={styles.cardHeader}>
            <div style={styles.cardEyebrow}>{isLogin ? "Welcome back" : "Create your account"}</div>
            <h2 style={styles.cardTitle}>{isLogin ? "Pick up where you left off" : "Save your local discoveries"}</h2>
            <p style={styles.cardText}>
              {isLogin
                ? "Log in to open your profile and get back to the sellers you care about."
                : "Create a free account so you can save and revisit your favorite sellers."}
            </p>
          </div>

          <input
            style={styles.input}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="visitor-auth-primary" style={styles.button} onClick={handleAuth}>
            {isLogin ? "Log In" : "Create Account"}
          </button>

          <button type="button" className="visitor-auth-secondary" style={styles.secondaryButton} onClick={() => navigate("/map")}>
            Continue to Map
          </button>

          <p style={styles.switch}>
            {isLogin ? "Need an account?" : "Already have one?"}
            <span onClick={() => setIsLogin(!isLogin)} style={styles.link}>
              {isLogin ? " Sign up" : " Log in"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #faf5ec 0%, #f3ebdf 45%, #ece2d4 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
  },
  shell: {
    width: "100%",
    maxWidth: "1040px",
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: "22px",
    alignItems: "stretch",
  },
  heroPanel: {
    background: "linear-gradient(180deg, #173d33 0%, #1f4b40 100%)",
    color: "#fff",
    borderRadius: "32px",
    padding: "32px",
    boxShadow: "0 24px 60px rgba(23,61,51,.22)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "22px",
  },
  eyebrow: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "rgba(255,255,255,0.72)",
    fontWeight: 900,
  },
  heroTitle: {
    margin: 0,
    fontSize: "clamp(34px, 4vw, 52px)",
    lineHeight: 0.98,
    letterSpacing: "-0.05em",
  },
  heroText: {
    margin: 0,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.7,
    fontSize: "16px",
    maxWidth: "520px",
  },
  heroList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  heroListItem: {
    padding: "14px 16px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    fontWeight: 700,
    color: "#fff",
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
  },
  segmentedRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    padding: "6px",
    borderRadius: "18px",
    background: "#f2ece2",
    marginBottom: "20px",
  },
  segmentedButton: {
    border: "none",
    background: "transparent",
    color: "#75695f",
    padding: "12px 14px",
    borderRadius: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  segmentedButtonActive: {
    background: "#fff",
    color: "#173d33",
    boxShadow: "0 8px 18px rgba(23,61,51,.08)",
  },
  cardHeader: {
    marginBottom: "8px",
  },
  cardEyebrow: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "#8a7b6d",
    fontWeight: 900,
    marginBottom: "10px",
  },
  cardTitle: {
    margin: "0 0 8px",
    fontSize: "30px",
    lineHeight: 1.02,
    letterSpacing: "-0.04em",
    color: "#102a21",
  },
  cardText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.65,
    color: "#665f58",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    marginTop: "12px",
    borderRadius: "14px",
    border: "1px solid #ddd6cb",
    background: "#fffdf9",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    marginTop: "16px",
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
    marginTop: "10px",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#fff",
    color: "#173d33",
    border: "1px solid #ddd6cb",
    cursor: "pointer",
    fontWeight: 800,
  },
  switch: {
    marginTop: "16px",
    fontSize: "14px",
    color: "#6d635b",
    textAlign: "center",
  },
  link: {
    color: "#173d33",
    cursor: "pointer",
    marginLeft: "5px",
    fontWeight: 800,
  },
};

const mobileCss = `
  @media (max-width: 767px) {
    .visitor-auth-page {
      align-items: flex-start !important;
      padding: 18px 14px calc(var(--safe-bottom) + var(--mobile-bottom-nav-height, 88px) + 28px) !important;
    }

    .visitor-auth-shell {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
      max-width: 100% !important;
    }

    .visitor-auth-hero,
    .visitor-auth-card {
      padding: 22px 18px !important;
      border-radius: 28px !important;
    }

    .visitor-auth-segmented {
      margin-bottom: 22px !important;
    }

    .visitor-auth-card input {
      min-height: 58px !important;
      padding: 17px 18px !important;
      font-size: 16px !important;
      border-radius: 16px !important;
      margin-top: 14px !important;
    }

    .visitor-auth-primary,
    .visitor-auth-secondary {
      width: 100%;
      min-height: 56px;
      border-radius: 16px !important;
      margin-top: 14px !important;
    }
  }
`;
