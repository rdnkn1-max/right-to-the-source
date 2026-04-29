import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function SellerAuth() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let mounted = true;

    const checkHashForRecovery = async () => {
      const hash = window.location.hash || "";

      if (
        hash.includes("type=recovery") ||
        hash.includes("access_token=") ||
        hash.includes("refresh_token=")
      ) {
        if (mounted) {
          setIsRecoveryMode(true);
          setMessage("Enter your new password below.");
        }
      }
    };

    checkHashForRecovery();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
        setMessage("Enter your new password below.");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleForgotPassword = async () => {
    setMessage("");
    const email = form.email.trim().toLowerCase();

    if (!email) {
      setMessage("Enter your email first.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/seller-auth",
      });

      if (error) throw error;

      setMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setMessage(err.message || "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.password || !form.confirmPassword) {
      setMessage("Please enter and confirm your new password.");
      return;
    }

    if (form.password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: form.password,
      });

      if (error) throw error;

      setMessage("Password updated! You can log in now.");
      setIsRecoveryMode(false);
      setIsLogin(true);
      setForm((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));

      window.history.replaceState({}, document.title, "/seller-auth");
    } catch (err) {
      setMessage(err.message || "Could not update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const name = form.name.trim();

    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    if (!isLogin) {
      if (!name) {
        setMessage("Please enter your name.");
        return;
      }

      if (password.length < 6) {
        setMessage("Password must be at least 6 characters.");
        return;
      }

      if (password !== form.confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        navigate("/seller-dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role: "seller",
            },
          },
        });

        if (error) throw error;

        setMessage(
          "Account created! If email confirmation is on, check your email first. Then come back and log in."
        );

        setIsLogin(true);
        setForm({
          name: "",
          email,
          password: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      setMessage(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.leftContent}>
          <h1 style={styles.logo}>The Source</h1>
          <h2 style={styles.headline}>Get your business discovered locally.</h2>
          <p style={styles.subtext}>
            Join vendors, pop-ups, food trucks, and small businesses getting
            real exposure in their area.
          </p>
          <div style={styles.benefits}>
            <div>📍 Show up on the live map</div>
            <div>🔥 Get discovered near you</div>
            <div>🚀 Grow without ads or noise</div>
          </div>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            {isRecoveryMode
              ? "Set New Password"
              : isLogin
              ? "Vendor Login"
              : "Create Vendor Account"}
          </h2>

          {isRecoveryMode ? (
            <form onSubmit={handleUpdatePassword} style={styles.form}>
              <input
                placeholder="New Password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                style={styles.input}
                required
              />

              <input
                placeholder="Confirm New Password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                style={styles.input}
                required
              />

              {message ? <div style={styles.message}>{message}</div> : null}

              <button type="submit" style={styles.primaryBtn} disabled={loading}>
                {loading ? "Please wait..." : "Update Password"}
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} style={styles.form}>
                {!isLogin && (
                  <input
                    placeholder="Your Name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    style={styles.input}
                    required
                  />
                )}

                <input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  style={styles.input}
                  required
                />

                <input
                  placeholder="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  style={styles.input}
                  required
                />

                {isLogin && (
                  <div style={styles.forgotWrap}>
                    <span style={styles.forgotLink} onClick={handleForgotPassword}>
                      Forgot Password?
                    </span>
                  </div>
                )}

                {!isLogin && (
                  <input
                    placeholder="Confirm Password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    style={styles.input}
                    required
                  />
                )}

                {message ? <div style={styles.message}>{message}</div> : null}

                <button
                  type="submit"
                  style={styles.primaryBtn}
                  disabled={loading}
                >
                  {loading
                    ? "Please wait..."
                    : isLogin
                    ? "Login"
                    : "Create Account"}
                </button>
              </form>

              <div style={styles.switch}>
                {isLogin ? "New here?" : "Already have an account?"}
                <span
                  style={styles.switchLink}
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setMessage("");
                  }}
                >
                  {isLogin ? " Create one" : " Login"}
                </span>
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
    display: "flex",
    minHeight: "100vh",
    background: "#f6f4ef",
    fontFamily: "Arial, sans-serif",
  },
  left: {
    flex: 1,
    padding: "60px",
    display: "flex",
    alignItems: "center",
  },
  leftContent: {
    maxWidth: "500px",
  },
  logo: {
    fontSize: "22px",
    marginBottom: "30px",
    color: "#1f513f",
    fontWeight: "bold",
  },
  headline: {
    fontSize: "42px",
    marginBottom: "20px",
    color: "#1e1e1e",
    lineHeight: 1.1,
  },
  subtext: {
    fontSize: "16px",
    color: "#555",
    marginBottom: "30px",
    lineHeight: 1.6,
  },
  benefits: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    fontSize: "15px",
    color: "#2f2f2f",
  },
  right: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px",
  },
  card: {
    background: "white",
    padding: "40px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  },
  cardTitle: {
    marginBottom: "20px",
    color: "#1e1e1e",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
  },
  forgotWrap: {
    marginTop: "-4px",
    marginBottom: "2px",
    textAlign: "right",
  },
  forgotLink: {
    color: "#1f513f",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },
  message: {
    padding: "10px 12px",
    borderRadius: "8px",
    background: "#f2f6f3",
    color: "#1f513f",
    fontSize: "14px",
    border: "1px solid #d8e6dc",
  },
  primaryBtn: {
    marginTop: "10px",
    padding: "12px",
    background: "#1f513f",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },
  switch: {
    marginTop: "20px",
    fontSize: "14px",
    textAlign: "center",
    color: "#444",
  },
  switchLink: {
    color: "#1f513f",
    cursor: "pointer",
    fontWeight: "bold",
    marginLeft: "5px",
  },
};