import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setProduct(data);

    if (data?.business_id) {
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", data.business_id)
        .single();

      if (!businessError) {
        setBusiness(businessData);
      }
    }
  }

  if (!product) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Back
        </button>

        <div style={styles.card}>
          <div style={styles.imagePanel}>
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name || "Product"}
                style={styles.image}
              />
            ) : (
              <div style={styles.noImage}>No image available</div>
            )}
          </div>

          <div style={styles.infoPanel}>
            <div style={styles.badge}>Featured Product</div>

            <h1 style={styles.title}>{product.name}</h1>

            <p style={styles.price}>${product.price}</p>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Description</h3>
              <p style={styles.description}>
                {product.description || "No description available yet."}
              </p>
            </div>

            {business && (
              <div style={styles.sellerBox}>
                <h3 style={styles.sectionTitle}>Seller</h3>
                <p style={styles.sellerName}>
                  {business.business_name || business.name}
                </p>
                <p style={styles.sellerLocation}>{business.location}</p>

                <button
                  onClick={() => navigate(`/seller/${business.id}`)}
                  style={styles.sellerButton}
                >
                  View Seller
                </button>
              </div>
            )}
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
      "linear-gradient(135deg, #f7f1e8 0%, #efe6d7 45%, #f6f4ef 100%)",
    padding: "40px 20px",
    fontFamily: "Arial, sans-serif",
  },
  wrapper: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  backButton: {
    backgroundColor: "#2f4f4f",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: "700",
    marginBottom: "20px",
  },
  card: {
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: "30px",
    backgroundColor: "#fffdf9",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.10)",
  },
  imagePanel: {
    minHeight: "520px",
    backgroundColor: "#e9dfcf",
    borderRadius: "20px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  noImage: {
    color: "#6b6b6b",
    fontSize: "18px",
  },
  infoPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    paddingTop: "6px",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#8b5e3c",
    color: "#fff",
    borderRadius: "999px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "0.5px",
  },
  title: {
    margin: 0,
    fontSize: "42px",
    lineHeight: 1.1,
    color: "#1f1f1f",
  },
  price: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "800",
    color: "#a23e2a",
  },
  section: {
    backgroundColor: "#f5eee4",
    padding: "18px",
    borderRadius: "16px",
  },
  sectionTitle: {
    margin: "0 0 10px 0",
    fontSize: "16px",
    color: "#5c4630",
  },
  description: {
    margin: 0,
    lineHeight: 1.7,
    color: "#333",
    fontSize: "15px",
  },
  sellerBox: {
    backgroundColor: "#e8f0ec",
    padding: "18px",
    borderRadius: "16px",
    border: "1px solid #d4e3db",
  },
  sellerName: {
    margin: "0 0 6px 0",
    fontSize: "22px",
    fontWeight: "800",
    color: "#1d352d",
  },
  sellerLocation: {
    margin: "0 0 16px 0",
    color: "#4f655f",
    fontSize: "15px",
  },
  sellerButton: {
    backgroundColor: "#1d352d",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: "700",
  },
};
