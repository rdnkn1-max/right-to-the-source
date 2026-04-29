import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AddProduct() {
  const navigate = useNavigate();
  const { sellerId } = useParams();

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const uploadProductImage = async () => {
    if (!image) return "";

    const fileExt = image.name.split(".").pop();
    const fileName = `product-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("business-images")
      .upload(fileName, image);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("business-images")
      .getPublicUrl(fileName);

    return data?.publicUrl || "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      let imageUrl = "";

      if (image) {
        imageUrl = await uploadProductImage();
      }

      const { error } = await supabase.from("products").insert([
        {
          business_id: sellerId,
          name: form.name.trim(),
          price: form.price.trim(),
          description: form.description.trim(),
          image_url: imageUrl,
        },
      ]);

      if (error) throw error;

      setMessage("Product added successfully!");

      setTimeout(() => {
        navigate(`/seller/${sellerId}`);
      }, 800);
    } catch (err) {
      console.error("Error adding product:", err);
      setMessage(err.message || "Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f3f4f6",
      padding: "40px 20px",
      fontFamily: "Arial, sans-serif",
    },
    container: {
      maxWidth: "560px",
      margin: "0 auto",
      background: "#fff",
      borderRadius: "18px",
      padding: "24px",
      border: "1px solid #e5e7eb",
      boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
    },
    title: {
      margin: "0 0 8px 0",
      fontSize: "28px",
      fontWeight: "800",
      color: "#111827",
    },
    subtitle: {
      margin: "0 0 20px 0",
      color: "#6b7280",
      fontSize: "14px",
    },
    label: {
      display: "block",
      marginBottom: "6px",
      fontWeight: "700",
      fontSize: "13px",
      color: "#111827",
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "12px",
      border: "1px solid #d1d5db",
      marginBottom: "14px",
      boxSizing: "border-box",
    },
    textarea: {
      width: "100%",
      minHeight: "100px",
      padding: "12px 14px",
      borderRadius: "12px",
      border: "1px solid #d1d5db",
      marginBottom: "14px",
      boxSizing: "border-box",
      resize: "vertical",
      fontFamily: "inherit",
    },
    button: {
      width: "100%",
      background: "#111827",
      color: "#fff",
      border: "none",
      borderRadius: "12px",
      padding: "13px 16px",
      fontWeight: "700",
      cursor: "pointer",
      marginTop: "8px",
    },
    message: {
      marginTop: "14px",
      fontSize: "14px",
      color: "#374151",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Add Product</h1>
        <p style={styles.subtitle}>
          Add a product to this business profile.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Product Name</label>
          <input
            style={styles.input}
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />

          <label style={styles.label}>Price</label>
          <input
            style={styles.input}
            type="text"
            value={form.price}
            onChange={(e) => handleChange("price", e.target.value)}
            placeholder="$35"
          />

          <label style={styles.label}>Description</label>
          <textarea
            style={styles.textarea}
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />

          <label style={styles.label}>Product Image</label>
          <input
            style={styles.input}
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Product"}
          </button>
        </form>

        {message ? <div style={styles.message}>{message}</div> : null}
      </div>
    </div>
  );
}