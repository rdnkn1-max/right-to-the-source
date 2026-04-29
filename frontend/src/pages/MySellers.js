import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

function getCategoryEmoji(category) {
  const cat = (category || "").toLowerCase();

  if (
    cat.includes("apparel") ||
    cat.includes("clothing") ||
    cat.includes("hat") ||
    cat.includes("shirt") ||
    cat.includes("rdnkn")
  ) {
    return "🧢";
  }
  if (cat.includes("egg")) return "🥚";
  if (cat.includes("dairy")) return "🥛";
  if (cat.includes("milk")) return "🥛";
  if (cat.includes("butter")) return "🧈";
  if (cat.includes("goat")) return "🐐";
  if (cat.includes("beef")) return "🥩";
  if (cat.includes("chicken")) return "🐔";
  if (cat.includes("produce")) return "🥬";
  if (cat.includes("honey")) return "🍯";
  if (cat.includes("baked")) return "🍞";
  if (cat.includes("farm")) return "🏡";
  if (cat.includes("seafood")) return "🦐";

  return "📍";
}

export default function MySellers() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [followedSellers, setFollowedSellers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMyFinds();
  }, []);

  async function loadMyFinds() {
    try {
      setLoading(true);
      setError("");

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const user = userData?.user || null;
      setCurrentUser(user);

      if (!user) {
        setFollowedSellers([]);
        return;
      }

      const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (followsError) throw followsError;

      const businessIds = (follows || [])
        .map((f) => f.business_id)
        .filter(Boolean);

      if (businessIds.length === 0) {
        setFollowedSellers([]);
        return;
      }

      const { data: businesses, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .in("id", businessIds);

      if (businessError) throw businessError;

      const normalized = (follows || [])
        .map((follow) => ({
          followId: follow.id,
          createdAt: follow.created_at,
          business: (businesses || []).find((b) => b.id === follow.business_id),
        }))
        .filter((item) => item.business);

      setFollowedSellers(normalized);
    } catch (err) {
      console.error("Error loading My Finds:", err);
      setError(err.message || "Could not load your followed sellers.");
    } finally {
      setLoading(false);
    }
  }

  function openProfile(business) {
    if (!business?.id) return;
    navigate(`/seller-profile/${business.id}`);
  }

  function openMap(business) {
    if (!business?.id) return;

    if (
      business.latitude == null ||
      business.longitude == null ||
      !Number.isFinite(Number(business.latitude)) ||
      !Number.isFinite(Number(business.longitude))
    ) {
      alert("This seller does not have a pinned map location yet.");
      return;
    }

    navigate("/map", {
      state: {
        lat: Number(business.latitude),
        lng: Number(business.longitude),
        businessId: business.id,
        title: business.business_name,
      },
    });
  }

  function goToLogin() {
    navigate("/auth");
  }

  function goToSignUp() {
    navigate("/seller-auth");
  }

  function goExplore() {
    navigate("/map");
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f6f1e8",
      fontFamily: "Arial, sans-serif",
      padding: "24px",
      color: "#1f3b2f",
    },

    shell: {
      maxWidth: "1180px",
      margin: "0 auto",
    },

    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
      flexWrap: "wrap",
      marginBottom: "22px",
    },

    headerLeft: {
      maxWidth: "760px",
    },

    eyebrow: {
      margin: "0 0 8px 0",
      fontSize: "12px",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      fontWeight: 800,
      color: "#8a6b4b",
    },

    title: {
      margin: "0 0 10px 0",
      fontSize: "42px",
      fontWeight: 800,
      lineHeight: 1,
      color: "#1f1f1f",
    },

    text: {
      margin: 0,
      fontSize: "16px",
      lineHeight: 1.6,
      color: "#655d56",
      maxWidth: "720px",
    },

    headerActions: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },

    button: {
      padding: "8px 12px",
      borderRadius: "999px",
      border: "1px solid #d8d1c8",
      background: "#fffdf9",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "11px",
      color: "#2d2a27",
      boxShadow: "0 4px 10px rgba(0,0,0,0.03)",
    },

    primaryButton: {
      background: "#173d33",
      color: "#fff",
      border: "1px solid #173d33",
    },

    bigHeaderButton: {
      padding: "10px 16px",
      borderRadius: "999px",
      border: "1px solid #173d33",
      background: "#173d33",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "13px",
    },

    statusCard: {
      background: "#fffdf8",
      border: "1px solid #eadfce",
      borderRadius: "20px",
      padding: "18px",
      boxShadow: "0 12px 26px rgba(66,49,21,0.05)",
      marginBottom: "18px",
    },

    statusText: {
      margin: 0,
      fontSize: "14px",
      lineHeight: 1.6,
      color: "#655d56",
    },

    errorCard: {
      background: "#fff1f1",
      border: "1px solid #f0cccc",
      color: "#8c1f1f",
      padding: "14px 16px",
      borderRadius: "14px",
      marginBottom: "18px",
    },

    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "14px",
    },

    card: {
      background: "#fffdf8",
      border: "1px solid #eadfce",
      borderRadius: "18px",
      overflow: "hidden",
      boxShadow: "0 10px 24px rgba(66,49,21,0.05)",
      display: "flex",
      flexDirection: "row",
      alignItems: "stretch",
      padding: "12px",
      gap: "12px",
    },

    imageWrap: {
      width: "88px",
      height: "88px",
      minWidth: "88px",
      borderRadius: "14px",
      overflow: "hidden",
      background: "#f5f5f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid #eadfce",
    },

    image: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    },

    imageFallback: {
      fontSize: "34px",
    },

    cardBody: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
    },

    liveBadge: {
      display: "inline-block",
      alignSelf: "flex-start",
      fontSize: "10px",
      fontWeight: "900",
      color: "#146c43",
      background: "#dcf7e8",
      border: "1px solid #b9ebcc",
      padding: "4px 8px",
      borderRadius: "999px",
    },

    tag: {
      display: "inline-block",
      alignSelf: "flex-start",
      fontSize: "9px",
      fontWeight: "800",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "#8a6b4b",
      background: "#f5efe5",
      border: "1px solid #e7dccb",
      borderRadius: "999px",
      padding: "4px 7px",
    },

    cardTitle: {
      margin: 0,
      fontSize: "16px",
      fontWeight: "800",
      lineHeight: 1.15,
      color: "#1f1f1f",
    },

    meta: {
      margin: 0,
      fontSize: "12px",
      color: "#6f665f",
      fontWeight: "700",
      lineHeight: 1.4,
    },

    location: {
      margin: 0,
      fontSize: "12px",
      color: "#6f665f",
      fontWeight: "700",
      lineHeight: 1.4,
    },

    description: {
      margin: 0,
      fontSize: "12px",
      lineHeight: 1.45,
      color: "#655d56",
    },

    actionRow: {
      display: "flex",
      gap: "6px",
      marginTop: "4px",
      flexWrap: "wrap",
    },

    emptyWrap: {
      background: "#fffdf8",
      border: "1px solid #eadfce",
      borderRadius: "20px",
      padding: "24px",
      boxShadow: "0 12px 26px rgba(66,49,21,0.05)",
    },

    emptyTitle: {
      margin: "0 0 10px 0",
      fontSize: "24px",
      fontWeight: "800",
      color: "#1f1f1f",
    },

    emptyText: {
      margin: 0,
      fontSize: "15px",
      lineHeight: 1.7,
      color: "#655d56",
      maxWidth: "700px",
    },

    emptyActions: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginTop: "16px",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <p style={styles.eyebrow}>Your saved follows</p>
            <h1 style={styles.title}>My Finds</h1>
            <p style={styles.text}>
              The sellers you follow will show up here so you can get back to
              them fast, open their profile, or jump straight to their map
              location.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button style={styles.bigHeaderButton} onClick={goExplore}>
              Explore Map
            </button>
          </div>
        </div>

        {error ? <div style={styles.errorCard}>{error}</div> : null}

        {loading ? (
          <div style={styles.statusCard}>
            <p style={styles.statusText}>Loading your finds…</p>
          </div>
        ) : !currentUser ? (
          <div style={styles.emptyWrap}>
            <h2 style={styles.emptyTitle}>Log in to see your finds</h2>
            <p style={styles.emptyText}>
              Create a free visitor profile or log in to keep track of the
              sellers you follow and come back to them anytime.
            </p>

            <div style={styles.emptyActions}>
              <button
                style={{ ...styles.bigHeaderButton }}
                onClick={goToSignUp}
              >
                Sign Up
              </button>

              <button
                style={{
                  ...styles.bigHeaderButton,
                  background: "#fffdf9",
                  color: "#2d2a27",
                  border: "1px solid #d8d1c8",
                }}
                onClick={goToLogin}
              >
                Log In
              </button>
            </div>
          </div>
        ) : followedSellers.length === 0 ? (
          <div style={styles.emptyWrap}>
            <h2 style={styles.emptyTitle}>You have no finds yet</h2>
            <p style={styles.emptyText}>
              Start exploring the map and follow local sellers you want to keep
              track of. Once you follow them, they’ll show up here.
            </p>

            <div style={styles.emptyActions}>
              <button
                style={{ ...styles.bigHeaderButton }}
                onClick={goExplore}
              >
                Explore Map
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.grid}>
            {followedSellers.map(({ followId, business }) => {
              const emoji = getCategoryEmoji(business.category);
              const isLive = false;

              return (
                <div key={followId} style={styles.card}>
                  <div style={styles.imageWrap}>
                    {business.image_url ? (
                      <img
                        src={business.image_url}
                        alt={business.business_name}
                        style={styles.image}
                      />
                    ) : (
                      <div style={styles.imageFallback}>{emoji}</div>
                    )}
                  </div>

                  <div style={styles.cardBody}>
                    {isLive ? (
                      <div style={styles.liveBadge}>🔴 LIVE NOW</div>
                    ) : (
                      <div style={styles.tag}>Followed Seller</div>
                    )}

                    <h2 style={styles.cardTitle}>
                      {business.business_name || "Business"}
                    </h2>

                    <p style={styles.meta}>
                      {emoji} {business.category || "Local seller"}
                    </p>

                    {business.location ? (
                      <p style={styles.location}>📍 {business.location}</p>
                    ) : null}

                    <p style={styles.description}>
                      {business.description ||
                        "Open their profile or jump straight to their map location."}
                    </p>

                    <div style={styles.actionRow}>
                      <button
                        style={{ ...styles.button, ...styles.primaryButton }}
                        onClick={() => openProfile(business)}
                      >
                        View
                      </button>

                      <button
                        style={styles.button}
                        onClick={() => openMap(business)}
                      >
                        Map
                      </button>
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