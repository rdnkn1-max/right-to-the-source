import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { pickPrimarySellerBusiness } from "../lib/sellerRouting";

const CATEGORY_OPTIONS = [
  "Fresh Eggs",
  "Fresh Dairy",
  "Butter",
  "Milk",
  "Goat Milk",
  "Beef",
  "Chicken",
  "Produce",
  "Honey",
  "Baked Goods",
  "Farm Stand",
  "Seafood",
  "Apparel",
  "Food Truck",
  "Coffee",
  "Crafts",
  "Other",
];

const BUSINESS_TYPE_OPTIONS = [
  "Storefront",
  "Farm Stand",
  "Food Truck",
  "Pop-Up",
  "Online Only",
  "Local Delivery",
  "Events Only",
  "Home-Based",
  "Other",
];

const CONTACT_METHOD_OPTIONS = ["Email", "Phone", "Instagram", "Facebook"];

const ADMIN_NOTIFY_API_URL = "http://localhost:4242/api/admin/new-submission-notify";

export default function ListYourBusiness() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    business_name: "",
    owner_name: "",
    contact_email: "",
    phone: "",
    website: "",
    instagram: "",
    facebook: "",
    category: "",
    business_type: "",
    description: "",
    what_they_sell: "",
    why_join: "",
    best_contact_method: "",
    permits_info: "",
    address: "",
    city: "Merritt Island",
    state: "FL",
    zip: "",
    location: "Merritt Island, FL",
    admin_notes: "",
  });

  const [image, setImage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const user = data?.session?.user || null;
        setCurrentUser(user);

        if (user) {
          const { data: businessRows, error: businessError } = await supabase
            .from("businesses")
            .select("id, status, user_id, created_at, updated_at")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });

          if (businessError) throw businessError;

          const existingBusiness = pickPrimarySellerBusiness(businessRows || []);

          if (existingBusiness?.status === "approved") {
            navigate("/seller-dashboard", { replace: true });
            return;
          }

          if (existingBusiness?.status === "pending") {
            navigate("/application-pending", { replace: true });
            return;
          }
        }

        if (user?.email) {
          setForm((prev) => ({
            ...prev,
            contact_email: prev.contact_email || user.email,
          }));
        }
      } catch (err) {
        console.error("Session load failed:", err);
        setCurrentUser(null);
      } finally {
        setCheckingUser(false);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setCurrentUser(user);
      setCheckingUser(false);

      if (user?.email) {
        setForm((prev) => ({
          ...prev,
          contact_email: prev.contact_email || user.email,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/seller-auth";
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/seller-auth");
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "city" || field === "state") {
        const city = field === "city" ? value : next.city;
        const state = field === "state" ? value : next.state;
        next.location = [city, state].filter(Boolean).join(", ");
      }

      return next;
    });
  };

  const uploadBusinessImage = async () => {
    if (!image) return "";

    const fileExt = image.name.split(".").pop();
    const safeExt = fileExt ? fileExt.toLowerCase() : "jpg";
    const fileName = `public-${Date.now()}.${safeExt}`;
    const filePath = `business-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("business-images")
      .upload(filePath, image);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("business-images")
      .getPublicUrl(filePath);

    return data?.publicUrl || "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      let imageUrl = "";

      if (image) {
        imageUrl = await uploadBusinessImage();
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in");
        return;
      }

      const payload = {
        user_id: currentUser?.id || null,
        email: currentUser?.email || form.contact_email.trim(),
        contact_email: form.contact_email.trim(),
        business_name: form.business_name.trim(),
        owner_name: form.owner_name.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        instagram: form.instagram.trim(),
        facebook: form.facebook.trim(),
        category: form.category.trim(),
        business_type: form.business_type.trim(),
        description: form.description.trim(),
        what_they_sell: form.what_they_sell.trim(),
        why_join: form.why_join.trim(),
        best_contact_method: form.best_contact_method.trim(),
        permits_info: form.permits_info.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim(),
        location: form.location.trim(),
        admin_notes: form.admin_notes.trim(),
        image_url: imageUrl,
        user_id: user.id,
        status: "pending",
      };

      console.log("INSERT PAYLOAD:", payload);

      const { data, error } = await supabase
        .from("businesses")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      try {
        await fetch(ADMIN_NOTIFY_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            businessName: data.business_name,
            contactEmail: data.contact_email || data.email,
            category: data.category,
            location: data.location,
            businessId: data.id,
          }),
        });
      } catch (notifyErr) {
        console.error("ADMIN NOTIFY ERROR:", notifyErr);
      }

      setMessage("Business submitted! Redirecting...");
      setTimeout(() => navigate("/application-pending"), 1000);
    } catch (err) {
      console.error("SUBMIT ERROR:", err);
      setMessage(err.message || "Submit failed.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>Checking your vendor account...</div>
      </div>
    );
  }

  return (
    <div className="listbiz-page" style={styles.page}>
      <style>{mobileCss}</style>
      <div className="listbiz-shell" style={styles.shell}>
        <div className="listbiz-top-row" style={styles.topRow}>
          <div>
            <p style={styles.eyebrow}>Vendor Setup</p>
            <h1 style={styles.title}>Tell us about your business</h1>
            <p style={styles.subtitle}>
              This is your intake form for review. The more solid the info, the
              easier it is to vet and approve the right businesses.
            </p>
          </div>

          <div className="listbiz-top-status" style={styles.topStatus}>
            <span style={styles.statusPill}>
              {currentUser ? `Logged in as ${currentUser.email}` : "Public submission"}
            </span>

            {currentUser ? (
              <button type="button" className="listbiz-secondary-button" style={styles.secondaryButton} onClick={handleLogout}>
                Log Out
              </button>
            ) : null}
          </div>
        </div>

        <div className="listbiz-layout" style={styles.layout}>
          <div className="listbiz-left-panel" style={styles.leftPanel}>
            <div className="listbiz-info-card app-animate-card" style={styles.infoCard}>
              <p style={styles.cardEyebrow}>How it works</p>
              <h3 style={styles.cardTitle}>This is your intake form</h3>
              <p style={styles.cardText}>
                Give enough information so the business can be properly reviewed,
                vetted, and approved. This is not just a simple signup page.
              </p>

              <div style={styles.steps}>
                <div style={styles.stepItem}>
                  <span style={styles.stepNumber}>1</span>
                  <div>
                    <p style={styles.stepTitle}>Business identity</p>
                    <p style={styles.stepText}>
                      Business name, owner, category, contact details, and links.
                    </p>
                  </div>
                </div>

                <div style={styles.stepItem}>
                  <span style={styles.stepNumber}>2</span>
                  <div>
                    <p style={styles.stepTitle}>Business details</p>
                    <p style={styles.stepText}>
                      What they sell, how they operate, and why they want in.
                    </p>
                  </div>
                </div>

                <div style={styles.stepItem}>
                  <span style={styles.stepNumber}>3</span>
                  <div>
                    <p style={styles.stepTitle}>Review and approval</p>
                    <p style={styles.stepText}>
                      Once approved, they can go live in the app.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="listbiz-info-card-soft app-animate-card app-animate-card--delay-1" style={styles.infoCardSoft}>
              <p style={styles.tipTitle}>Vetting tips</p>
              <ul style={styles.tipList}>
                <li>Get their real contact email and phone number.</li>
                <li>Instagram and website help verify legitimacy fast.</li>
                <li>Business type tells you how they actually operate.</li>
                <li>Address is useful when applicable, even if not public later.</li>
                <li>Why they want to join helps you filter fit and intent.</li>
              </ul>
            </div>
          </div>

          <div className="listbiz-form-card app-animate-card app-animate-card--delay-1" style={styles.formCard}>
            <form onSubmit={handleSubmit} style={styles.form} className="listbiz-form">
              <div className="listbiz-section" style={styles.section}>
                <p style={styles.sectionEyebrow}>Step 1</p>
                <h3 style={styles.sectionTitle}>Business identity</h3>

                <label style={styles.label}>Business name</label>
                <input
                  style={styles.input}
                  placeholder="Ex. RDNKN"
                  value={form.business_name}
                  onChange={(e) => handleChange("business_name", e.target.value)}
                  required
                />

                <label style={styles.label}>Owner name</label>
                <input
                  style={styles.input}
                  placeholder="Ex. Marc Harden"
                  value={form.owner_name}
                  onChange={(e) => handleChange("owner_name", e.target.value)}
                  required
                />

                <label style={styles.label}>Business contact email</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="Ex. hello@yourbusiness.com"
                  value={form.contact_email}
                  onChange={(e) => handleChange("contact_email", e.target.value)}
                  required
                />

                <label style={styles.label}>Phone number</label>
                <input
                  style={styles.input}
                  placeholder="Ex. 321-555-1234"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />

                <label style={styles.label}>Website</label>
                <input
                  style={styles.input}
                  placeholder="Ex. https://yourbusiness.com"
                  value={form.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                />

                <label style={styles.label}>Instagram</label>
                <input
                  style={styles.input}
                  placeholder="Ex. @rdnkn"
                  value={form.instagram}
                  onChange={(e) => handleChange("instagram", e.target.value)}
                />

                <label style={styles.label}>Facebook</label>
                <input
                  style={styles.input}
                  placeholder="Ex. facebook.com/yourbusiness"
                  value={form.facebook}
                  onChange={(e) => handleChange("facebook", e.target.value)}
                />
              </div>

              <div style={styles.divider} />

              <div className="listbiz-section" style={styles.section}>
                <p style={styles.sectionEyebrow}>Step 2</p>
                <h3 style={styles.sectionTitle}>Business details</h3>

                <label style={styles.label}>Category</label>
                <select
                  style={styles.select}
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <label style={styles.label}>Business type</label>
                <select
                  style={styles.select}
                  value={form.business_type}
                  onChange={(e) => handleChange("business_type", e.target.value)}
                  required
                >
                  <option value="">Select a business type</option>
                  {BUSINESS_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <label style={styles.label}>Short description</label>
                <textarea
                  style={styles.textarea}
                  placeholder="Tell people what your business is about."
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  required
                />

                <label style={styles.label}>What do you sell?</label>
                <textarea
                  style={styles.textareaSmall}
                  placeholder="Ex. apparel, hats, beef, eggs, baked goods, seafood, etc."
                  value={form.what_they_sell}
                  onChange={(e) => handleChange("what_they_sell", e.target.value)}
                  required
                />

                <label style={styles.label}>Why do you want to join The Source?</label>
                <textarea
                  style={styles.textareaSmall}
                  placeholder="Tell us why your business would be a good fit."
                  value={form.why_join}
                  onChange={(e) => handleChange("why_join", e.target.value)}
                  required
                />

                <label style={styles.label}>Best contact method</label>
                <select
                  style={styles.select}
                  value={form.best_contact_method}
                  onChange={(e) =>
                    handleChange("best_contact_method", e.target.value)
                  }
                >
                  <option value="">Select best contact method</option>
                  {CONTACT_METHOD_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <label style={styles.label}>Permits / licenses / notes if applicable</label>
                <textarea
                  style={styles.textareaSmall}
                  placeholder="Ex. food permit, cottage license, business registration, or leave blank"
                  value={form.permits_info}
                  onChange={(e) => handleChange("permits_info", e.target.value)}
                />
              </div>

              <div style={styles.divider} />

              <div className="listbiz-section" style={styles.section}>
                <p style={styles.sectionEyebrow}>Step 3</p>
                <h3 style={styles.sectionTitle}>Location and image</h3>

                <label style={styles.label}>Street address</label>
                <input
                  style={styles.input}
                  placeholder="Ex. 123 Main St"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />

                <div className="listbiz-row2" style={styles.row2}>
                  <div>
                    <label style={styles.label}>City</label>
                    <input
                      style={styles.input}
                      placeholder="Merritt Island"
                      value={form.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>State</label>
                    <input
                      style={styles.input}
                      placeholder="FL"
                      value={form.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                    />
                  </div>
                </div>

                <label style={styles.label}>ZIP</label>
                <input
                  style={styles.input}
                  placeholder="Ex. 32953"
                  value={form.zip}
                  onChange={(e) => handleChange("zip", e.target.value)}
                />

                <label style={styles.label}>Business photo or logo</label>
                <label style={styles.uploadBox}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    style={{ display: "none" }}
                  />

                  <div className="listbiz-upload-inner" style={styles.uploadInner}>
                    <div style={styles.uploadIcon}>📷</div>
                    <p style={styles.uploadTitle}>
                      {image ? image.name : "Upload a photo"}
                    </p>
                    <p style={styles.uploadText}>
                      Logo, product image, storefront, booth, or brand photo
                    </p>
                  </div>
                </label>
              </div>

              <div style={styles.divider} />

              <div className="listbiz-section" style={styles.section}>
                <p style={styles.sectionEyebrow}>Step 4</p>
                <h3 style={styles.sectionTitle}>Admin review note</h3>

                <label style={styles.label}>Anything else we should know?</label>
                <textarea
                  style={styles.textareaSmall}
                  placeholder="Optional extra note for review."
                  value={form.admin_notes}
                  onChange={(e) => handleChange("admin_notes", e.target.value)}
                />
              </div>

              <div className="listbiz-button-row" style={styles.buttonRow}>
                <button
                  type="button"
                  className="listbiz-secondary-button"
                  style={styles.secondaryButton}
                  onClick={() => navigate("/seller-auth")}
                >
                  Back
                </button>

                <button type="submit" className="listbiz-primary-button" style={styles.primaryButton} disabled={loading}>
                  {loading ? "Submitting..." : "Submit Business"}
                </button>
              </div>

              {message && (
                <div
                  style={{
                    ...styles.messageBox,
                    color:
                      message.toLowerCase().includes("submitted") ||
                      message.toLowerCase().includes("redirecting")
                        ? "#1f513f"
                        : "#b42318",
                    background:
                      message.toLowerCase().includes("submitted") ||
                      message.toLowerCase().includes("redirecting")
                        ? "#edf7f1"
                        : "#fff2f0",
                    border:
                      message.toLowerCase().includes("submitted") ||
                      message.toLowerCase().includes("redirecting")
                        ? "1px solid #cfe7d8"
                        : "1px solid #f2c9c2",
                  }}
                >
                  {message}
                </div>
              )}
            </form>
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
    fontFamily: "Arial, sans-serif",
    color: "#1f1f1f",
    padding: "28px 18px 50px",
  },
  shell: {
    maxWidth: "1280px",
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
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  eyebrow: {
    margin: "0 0 4px 0",
    fontSize: "11px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 800,
    color: "#8a6b4b",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "42px",
    fontWeight: 800,
    lineHeight: 1,
  },
  subtitle: {
    margin: 0,
    maxWidth: "700px",
    fontSize: "15px",
    lineHeight: 1.6,
    color: "#6e655f",
  },
  topStatus: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: "999px",
    border: "1px solid #ddd3c6",
    background: "#ffffff",
    color: "#2b2a28",
    fontSize: "12px",
    fontWeight: 700,
    boxShadow: "0 8px 18px rgba(66,49,21,0.04)",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "0.9fr 1.1fr",
    gap: "18px",
    alignItems: "start",
  },
  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  infoCard: {
    background: "#f8f5f0",
    border: "1px solid #e8ddd2",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 18px 38px rgba(66,49,21,0.05)",
  },
  infoCardSoft: {
    background: "#fffdfa",
    border: "1px solid #eadfce",
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "0 10px 22px rgba(66,49,21,0.04)",
  },
  cardEyebrow: {
    margin: "0 0 4px 0",
    fontSize: "11px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#8a6b4b",
    fontWeight: 800,
  },
  cardTitle: {
    margin: "0 0 8px 0",
    fontSize: "28px",
    fontWeight: 800,
  },
  cardText: {
    margin: "0 0 16px 0",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#6d645d",
  },
  steps: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  stepItem: {
    display: "grid",
    gridTemplateColumns: "40px 1fr",
    gap: "12px",
    alignItems: "start",
  },
  stepNumber: {
    width: "40px",
    height: "40px",
    borderRadius: "999px",
    background: "#173d33",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "14px",
    boxShadow: "0 8px 16px rgba(23,61,51,0.14)",
  },
  stepTitle: {
    margin: "2px 0 4px 0",
    fontSize: "15px",
    fontWeight: 800,
  },
  stepText: {
    margin: 0,
    fontSize: "13px",
    color: "#6d645d",
    lineHeight: 1.5,
  },
  tipTitle: {
    margin: "0 0 10px 0",
    fontSize: "16px",
    fontWeight: 800,
  },
  tipList: {
    margin: 0,
    paddingLeft: "18px",
    color: "#6d645d",
    fontSize: "13px",
    lineHeight: 1.7,
  },
  formCard: {
    background: "#fffdfa",
    border: "1px solid #e8ddd2",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 18px 38px rgba(66,49,21,0.05)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  sectionEyebrow: {
    margin: 0,
    fontSize: "11px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#8a6b4b",
    fontWeight: 800,
  },
  sectionTitle: {
    margin: "0 0 6px 0",
    fontSize: "24px",
    fontWeight: 800,
  },
  label: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#3a3632",
    marginTop: "2px",
  },
  input: {
    width: "100%",
    padding: "14px 14px",
    borderRadius: "14px",
    border: "1px solid #ddd3c6",
    background: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "14px 14px",
    borderRadius: "14px",
    border: "1px solid #ddd3c6",
    background: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
  },
  textarea: {
    width: "100%",
    minHeight: "130px",
    padding: "14px 14px",
    borderRadius: "14px",
    border: "1px solid #ddd3c6",
    background: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
  },
  textareaSmall: {
    width: "100%",
    minHeight: "95px",
    padding: "14px 14px",
    borderRadius: "14px",
    border: "1px solid #ddd3c6",
    background: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  uploadBox: {
    display: "block",
    cursor: "pointer",
  },
  uploadInner: {
    border: "1.5px dashed #cdbfae",
    borderRadius: "18px",
    background: "#faf7f2",
    padding: "24px 18px",
    textAlign: "center",
  },
  uploadIcon: {
    fontSize: "28px",
    marginBottom: "8px",
  },
  uploadTitle: {
    margin: "0 0 4px 0",
    fontSize: "15px",
    fontWeight: 800,
  },
  uploadText: {
    margin: 0,
    fontSize: "12px",
    color: "#7a7169",
    lineHeight: 1.5,
  },
  divider: {
    height: "1px",
    background: "#eee4d7",
    margin: "20px 0",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "22px",
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
  primaryButton: {
    padding: "12px 18px",
    borderRadius: "999px",
    border: "none",
    background: "#173d33",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 18px rgba(23,61,51,0.15)",
  },
  messageBox: {
    marginTop: "16px",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "13px",
    fontWeight: 700,
  },
};

const mobileCss = `
  @media (max-width: 767px) {
    .listbiz-page {
      padding: 20px 14px calc(var(--safe-bottom) + var(--mobile-bottom-nav-height, 88px) + 28px) !important;
    }

    .listbiz-top-row {
      gap: 18px !important;
      margin-bottom: 18px !important;
    }

    .listbiz-top-status {
      width: 100%;
      align-items: stretch !important;
    }

    .listbiz-layout {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }

    .listbiz-left-panel {
      gap: 16px !important;
    }

    .listbiz-info-card,
    .listbiz-info-card-soft,
    .listbiz-form-card {
      padding: 20px 16px !important;
      border-radius: 24px !important;
    }

    .listbiz-section {
      gap: 12px !important;
    }

    .listbiz-row2 {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }

    .listbiz-form input:not([type="file"]),
    .listbiz-form select,
    .listbiz-form textarea {
      min-height: 56px !important;
      padding: 16px 16px !important;
      font-size: 16px !important;
      border-radius: 16px !important;
    }

    .listbiz-form textarea {
      min-height: 132px !important;
    }

    .listbiz-upload-inner {
      padding: 28px 18px !important;
      border-radius: 20px !important;
    }

    .listbiz-button-row {
      flex-direction: column-reverse;
      align-items: stretch !important;
      gap: 12px !important;
      margin-top: 24px !important;
    }

    .listbiz-primary-button,
    .listbiz-secondary-button {
      width: 100%;
      min-height: 54px;
      border-radius: 16px !important;
      padding: 14px 16px !important;
      text-align: center;
    }
  }
`;
