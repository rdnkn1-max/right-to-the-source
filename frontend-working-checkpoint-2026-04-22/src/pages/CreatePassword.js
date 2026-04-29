import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function CreatePassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const businessId = searchParams.get("businessId");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [business, setBusiness] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadBusiness();
  }, [businessId]);

  async function loadBusiness() {
    try {
      setLoading(true);
      setMessage("");

      if (!businessId) {
        setMessage("Missing business ID.");
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single();

      if (error || !data) {
        setMessage("Business not found.");
        return;
      }

      setBusiness(data);
      setEmail(data.contact_email || data.email || "");
    } catch (err) {
      console.error("CreatePassword load error:", err);
      setMessage(err.message || "Could not load business.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!businessId) {
      setMessage("Missing business ID.");
      return;
    }

    if (!email.trim()) {
      setMessage("Email is required.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      let authUser = null;
      const cleanEmail = email.trim().toLowerCase();

      // 1. Try signup
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (signUpError) {
        const alreadyExists =
          signUpError.message?.toLowerCase().includes("already") ||
          signUpError.message?.toLowerCase().includes("registered") ||
          signUpError.message?.toLowerCase().includes("exists");

        if (!alreadyExists) {
          throw signUpError;
        }

        // 2. If exists → sign in
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (signInError) {
          throw new Error(
            "This email already exists. Use the correct password or reset it."
          );
        }

        authUser = signInData?.user || null;
      } else {
        authUser = signUpData?.user || null;

        // 3. Fix: sometimes no user returned
        if (!authUser?.id) {
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });

          if (signInError) {
            throw new Error(
              "Account created, but login failed. Try logging in."
            );
          }

          authUser = signInData?.user || null;
        }
      }

      if (!authUser?.id) {
        throw new Error("No user ID returned.");
      }

      // 4. Link user to business
      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          user_id: authUser.id,
          agreed_to_terms: true,
          agreed_at: new Date().toISOString(),
          status: "approved",
          contact_email: cleanEmail,
        })
        .eq("id", businessId);

      if (updateError) throw updateError;

      // 🔥 CHANGE IS HERE (IMPORTANT)
      navigate(`/payment-setup?businessId=${businessId}`);

    } catch (err) {
      console.error("CreatePassword submit error:", err);
      setMessage(err.message || "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.title}>Loading account setup...</h2>
          <p style={styles.subtle}>Getting your seller details ready.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>Approved Seller Setup</p>
        <h2 style={styles.title}>Create Your Password</h2>

        {business?.business_name ? (
          <p style={styles.subtle}>
            Finish setting up <strong>{business.business_name}</strong> so you can continue.
          </p>
        ) : (
          <p style={styles.subtle}>Finish setting up your seller account.</p>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />

          <label style={styles.label}>Create Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          <label style={styles.label}>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.input}
            required
          />

          {message ? <div style={styles.message}>{message}</div> : null}

          <button type="submit" style={styles.primaryButton}>
            {submitting ? "Creating Account..." : "Continue to Payment"}
          </button>
        </form>
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
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "24px",
    padding: "28px",
  },
  eyebrow: {
    fontSize: "11px",
    textTransform: "uppercase",
    color: "#8a6b4b",
    fontWeight: 800,
  },
  title: {
    fontSize: "28px",
    fontWeight: 800,
  },
  subtle: {
    fontSize: "14px",
    color: "#6e655f",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  label: {
    fontWeight: 700,
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
  },
  message: {
    color: "red",
    fontWeight: 700,
  },
  primaryButton: {
    marginTop: "10px",
    padding: "14px",
    background: "#173d33",
    color: "#fff",
    borderRadius: "999px",
    border: "none",
    fontWeight: 700,
  },
};