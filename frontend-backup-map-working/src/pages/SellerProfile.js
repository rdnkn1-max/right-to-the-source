import React from "react";
import { useParams } from "react-router-dom";

export default function SellerProfile() {
  const { sellerId } = useParams();

  return (
    <div
      style={{
        background: "#f3f4f6",
        minHeight: "100vh",
        padding: "32px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h1 style={{ margin: "0 0 6px 0", fontSize: "32px", color: "#111827" }}>
            North Coast Supply
          </h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "16px" }}>Orlando, FL</p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "24px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #e5e7eb",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#111827" }}>
              Products
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "16px",
              }}
            >
              <div
                style={{
                  border: "1px solid #ddd",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    height: "120px",
                    background: "#e5e7eb",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}
                />
                <strong>Waterproof Hat</strong>
                <p style={{ margin: "8px 0 0 0", color: "#6b7280" }}>$35</p>
              </div>

              <div
                style={{
                  border: "1px solid #ddd",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    height: "120px",
                    background: "#e5e7eb",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}
                />
                <strong>Rope Hat</strong>
                <p style={{ margin: "8px 0 0 0", color: "#6b7280" }}>$32</p>
              </div>

              <div
                style={{
                  border: "1px solid #ddd",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    height: "120px",
                    background: "#e5e7eb",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}
                />
                <strong>Sticker Pack</strong>
                <p style={{ margin: "8px 0 0 0", color: "#6b7280" }}>$12</p>
              </div>

              <div
                style={{
                  border: "1px solid #ddd",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    height: "120px",
                    background: "#e5e7eb",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}
                />
                <strong>Crewneck</strong>
                <p style={{ margin: "8px 0 0 0", color: "#6b7280" }}>$48</p>
              </div>
            </div>
          </div>

          <div>
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "20px",
                border: "1px solid #e5e7eb",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Details</h3>
              <p style={{ margin: "0 0 10px 0", color: "#4b5563" }}>Category: Apparel</p>
              <p style={{ margin: "0 0 10px 0", color: "#4b5563" }}>City: Orlando</p>
              <p style={{ margin: 0, color: "#4b5563" }}>Seller ID: {sellerId}</p>
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "20px",
                border: "1px solid #e5e7eb",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Contact</h3>
              <p style={{ margin: "0 0 10px 0", color: "#4b5563" }}>hello@example.com</p>
              <p style={{ margin: 0, color: "#4b5563" }}>(407) 555-0142</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
