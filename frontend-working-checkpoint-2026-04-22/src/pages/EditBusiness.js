import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getApprovedSellerById,
  updateApprovedSeller,
  deleteApprovedSeller,
} from "../data/sellerStore";

const categoryOptions = ["Apparel", "Pantry", "Poultry", "Beef", "Seafood"];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ marginBottom: "8px", fontWeight: "700", fontSize: "14px" }}>
        {label}
      </div>
      <div>
        {React.cloneElement(children, {
          style: {
            width: "100%",
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid #d9d9d9",
            boxSizing: "border-box",
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
          },
        })}
      </div>
    </label>
  );
}

function SectionTitle({ title }) {
  return (
    <div style={{ margin: "24px 0 14px 0" }}>
      <h2 style={{ margin: 0, fontSize: "20px" }}>{title}</h2>
    </div>
  );
}

export default function EditBusiness() {
  const navigate = useNavigate();
  const { sellerId } = useParams();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const seller = getApprovedSellerById(sellerId);

    if (!seller) {
      setForm(null);
      return;
    }

    setForm({
      name: seller.name || "",
      ownerName: seller.ownerName || "",
      email: seller.email || "",
      phone: seller.phone || "",
      category: seller.category || "Apparel",
      city: seller.city || "",
      state: seller.state || "",
      description: seller.description || "",
      website: seller.website || "",
      instagram: seller.instagram || "",
      image: seller.image || "",
      lat: String(seller.lat ?? ""),
      lng: String(seller.lng ?? ""),
      featured: Boolean(seller.featured),
      productOne: seller.products?.[0] || "",
      productTwo: seller.products?.[1] || "",
      productThree: seller.products?.[2] || "",
    });
  }, [sellerId]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    try {
      setUploading(true);
      const dataUrl = await fileToDataUrl(file);
      updateField("image", dataUrl);
    } catch {
      alert("Could not read that image.");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    await handleFile(file);
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (!form) return;

    const required = [
      "name",
      "ownerName",
      "email",
      "category",
      "city",
      "state",
      "description",
      "lat",
      "lng",
    ];

    const missing = required.find((key) => !String(form[key]).trim());
    if (missing) {
      alert("Please fill in all required fields.");
      return;
    }

    const lat = Number(form.lat);
    const lng = Number(form.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      alert("Latitude and longitude must be valid numbers.");
      return;
    }

    updateApprovedSeller(sellerId, {
      name: form.name,
      ownerName: form.ownerName,
      email: form.email,
      phone: form.phone,
      category: form.category,
      city: form.city,
      state: form.state,
      description: form.description,
      website: form.website,
      instagram: form.instagram,
      image: form.image,
      lat,
      lng,
      featured: form.featured,
      products: [form.productOne, form.productTwo, form.productThree],
    });

    setSavedMessage("Business updated successfully.");
    setTimeout(() => setSavedMessage(""), 2500);
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this approved business? This cannot be undone.")) {
      return;
    }

    deleteApprovedSeller(sellerId);
    navigate("/review-submissions");
  };

  if (!form) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f7f7f7",
          padding: "40px 20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            background: "#fff",
            borderRadius: "18px",
            padding: "28px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.08)",
          }}
        >
          <h1 style={{ marginTop: 0 }}>Business not found</h1>
          <p style={{ color: "#666" }}>
            This approved business could not be found.
          </p>
          <button
            onClick={() => navigate("/review-submissions")}
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              border: "none",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "700",
            }}
          >
            Back to Review Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7f7",
        padding: "32px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "18px",
          boxShadow: "0 8px 28px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "24px 28px",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 6px 0" }}>Edit Business</h1>
            <p style={{ margin: 0, color: "#666" }}>
              Update an approved business and push changes live.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/review-submissions")}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Review Submissions
            </button>

            <button
              onClick={() => navigate(`/seller/${sellerId}`)}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "none",
                background: "#111",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              View Live Profile
            </button>
          </div>
        </div>

        {savedMessage && (
          <div
            style={{
              margin: "20px 28px 0",
              background: "#ecfff2",
              border: "1px solid #b7efc9",
              color: "#155724",
              borderRadius: "12px",
              padding: "14px 16px",
            }}
          >
            {savedMessage}
          </div>
        )}

        <form onSubmit={handleSave} style={{ padding: "28px" }}>
          <SectionTitle title="Business Basics" />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            <Field label="Business Name *">
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </Field>

            <Field label="Owner Name *">
              <input
                value={form.ownerName}
                onChange={(e) => updateField("ownerName", e.target.value)}
              />
            </Field>

            <Field label="Email *">
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </Field>

            <Field label="Phone">
              <input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </Field>

            <Field label="Category *">
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Website">
              <input
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
              />
            </Field>

            <Field label="Instagram">
              <input
                value={form.instagram}
                onChange={(e) => updateField("instagram", e.target.value)}
              />
            </Field>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                paddingTop: "30px",
                fontWeight: "700",
              }}
            >
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => updateField("featured", e.target.checked)}
              />
              Featured seller
            </label>
          </div>

          <div style={{ marginTop: "16px" }}>
            <Field label="Business Description *">
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </Field>
          </div>

          <SectionTitle title="Business Photo" />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: dragActive ? "2px solid #111" : "2px dashed #bbb",
              borderRadius: "18px",
              padding: "24px",
              background: dragActive ? "#f3f3f3" : "#fafafa",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                await handleFile(file);
              }}
            />

            {form.image ? (
              <div>
                <img
                  src={form.image}
                  alt="Business preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "260px",
                    objectFit: "cover",
                    borderRadius: "14px",
                    marginBottom: "14px",
                  }}
                />
                <div style={{ color: "#555", fontWeight: "600" }}>
                  Click or drop a new image to replace this one
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>
                  Drag & drop your business photo here
                </div>
                <div style={{ color: "#666", marginBottom: "10px" }}>
                  or click to upload
                </div>
              </div>
            )}

            {uploading && (
              <div style={{ marginTop: "12px", color: "#666" }}>
                Uploading image...
              </div>
            )}
          </div>

          <SectionTitle title="Location" />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            <Field label="City *">
              <input
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </Field>

            <Field label="State *">
              <input
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
              />
            </Field>

            <Field label="Latitude *">
              <input
                value={form.lat}
                onChange={(e) => updateField("lat", e.target.value)}
              />
            </Field>

            <Field label="Longitude *">
              <input
                value={form.lng}
                onChange={(e) => updateField("lng", e.target.value)}
              />
            </Field>
          </div>

          <SectionTitle title="Products" />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            <Field label="Product 1">
              <input
                value={form.productOne}
                onChange={(e) => updateField("productOne", e.target.value)}
              />
            </Field>

            <Field label="Product 2">
              <input
                value={form.productTwo}
                onChange={(e) => updateField("productTwo", e.target.value)}
              />
            </Field>

            <Field label="Product 3">
              <input
                value={form.productThree}
                onChange={(e) => updateField("productThree", e.target.value)}
              />
            </Field>
          </div>

          <div
            style={{
              marginTop: "24px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="submit"
              style={{
                padding: "14px 20px",
                borderRadius: "12px",
                border: "none",
                background: "#111",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "700",
              }}
            >
              Save Changes
            </button>

            <button
              type="button"
              onClick={() => navigate(`/seller/${sellerId}`)}
              style={{
                padding: "14px 20px",
                borderRadius: "12px",
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
                fontWeight: "700",
              }}
            >
              View Live Profile
            </button>

            <button
              type="button"
              onClick={handleDelete}
              style={{
                padding: "14px 20px",
                borderRadius: "12px",
                border: "1px solid #d9534f",
                background: "#fff",
                color: "#d9534f",
                cursor: "pointer",
                fontWeight: "700",
              }}
            >
              Delete Business
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}