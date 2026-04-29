import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function getEventStatus(event) {
  const now = new Date();
  const start = event.start_time ? new Date(event.start_time) : null;
  const end = event.end_time ? new Date(event.end_time) : null;

  if (!event.is_active) return "inactive";
  if (!start) return "scheduled";
  if (start && now < start) return "upcoming";
  if (start && end && now >= start && now <= end) return "live";
  if (start && end && now > end) return "completed";
  if (start && !end && now >= start) return "live";

  return "scheduled";
}

function statusStyles(status) {
  if (status === "live") {
    return {
      color: "#146c43",
      bg: "#dcf7e8",
      border: "#b9ebcc",
    };
  }

  if (status === "upcoming") {
    return {
      color: "#9a6700",
      bg: "#fff3d8",
      border: "#f1dfac",
    };
  }

  if (status === "completed") {
    return {
      color: "#686868",
      bg: "#ececec",
      border: "#dddddd",
    };
  }

  if (status === "inactive") {
    return {
      color: "#9b1c1c",
      bg: "#fce0e0",
      border: "#f2c5c5",
    };
  }

  return {
    color: "#234d7d",
    bg: "#e7eef8",
    border: "#cfdbef",
  };
}

function getFallbackEmoji(category) {
  const text = `${category || ""}`.toLowerCase();

  if (
    text.includes("apparel") ||
    text.includes("clothing") ||
    text.includes("shirt") ||
    text.includes("hat") ||
    text.includes("rdnkn")
  ) {
    return "🧢";
  }

  if (text.includes("egg")) return "🥚";
  if (text.includes("dairy")) return "🥛";
  if (text.includes("butter")) return "🧈";
  if (text.includes("milk")) return "🥛";
  if (text.includes("goat")) return "🐐";
  if (text.includes("beef")) return "🥩";
  if (text.includes("chicken")) return "🐔";
  if (text.includes("produce")) return "🥬";
  if (text.includes("honey")) return "🍯";
  if (text.includes("baked")) return "🍞";
  if (text.includes("farm")) return "🏡";
  if (text.includes("seafood")) return "🦐";

  return "📍";
}

function normalizeUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function formatPhone(phone) {
  if (!phone) return "";
  return phone;
}

function fieldOrEmpty(value) {
  return value && `${value}`.trim() ? `${value}`.trim() : "";
}

export default function SellerProfile() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState(null);
  const [events, setEvents] = useState([]);
  const [viewerUser, setViewerUser] = useState(null);
  const [error, setError] = useState("");
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [id]);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user || null;
      setViewerUser(currentUser);

      let businessQuery = supabase.from("businesses").select("*");

      if (id) {
        businessQuery = businessQuery.eq("id", id).maybeSingle();
      } else if (currentUser?.id) {
        businessQuery = businessQuery.eq("user_id", currentUser.id).maybeSingle();
      } else {
        setError("No seller ID provided.");
        setLoading(false);
        return;
      }

      const { data: businessData, error: businessError } = await businessQuery;

      if (businessError) throw businessError;

      if (!businessData) {
        setBusiness(null);
        setEvents([]);
        setLoading(false);
        return;
      }

      setBusiness(businessData);

      const { data: eventData, error: eventError } = await supabase
        .from("seller_events")
        .select("*")
        .eq("business_id", businessData.id)
        .order("start_time", { ascending: true });

      if (eventError) throw eventError;

      const normalizedEvents = (eventData || []).map((event) => ({
        ...event,
        computedStatus: getEventStatus(event),
      }));

      setEvents(normalizedEvents);
    } catch (err) {
      console.error("SELLER PROFILE LOAD ERROR:", err);
      setError(err.message || "Could not load seller profile.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFollow(businessId, businessName = "this seller") {
    try {
      setFollowLoading(true);

      if (!businessId) {
        alert("Missing business ID.");
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        navigate("/auth");
        return;
      }

      const { data: existingFollow, error: checkError } = await supabase
        .from("follows")
        .select("id")
        .eq("user_id", userData.user.id)
        .eq("business_id", businessId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingFollow) {
        alert(`You already follow ${businessName}.`);
        return;
      }

      const { error: insertError } = await supabase.from("follows").insert([
        {
          user_id: userData.user.id,
          business_id: businessId,
        },
      ]);

      if (insertError) throw insertError;

      alert(`Followed ${businessName}!`);
    } catch (err) {
      console.error("PROFILE FOLLOW ERROR:", err);
      alert(err.message || "Could not follow seller.");
    } finally {
      setFollowLoading(false);
    }
  }

  const isOwner = useMemo(() => {
    if (!viewerUser || !business) return false;
    return business.user_id === viewerUser.id;
  }, [viewerUser, business]);

  const liveEvents = useMemo(
    () => events.filter((event) => event.computedStatus === "live"),
    [events]
  );
  const upcomingEvents = useMemo(
    () => events.filter((event) => event.computedStatus === "upcoming"),
    [events]
  );
  const completedEvents = useMemo(
    () => events.filter((event) => event.computedStatus === "completed"),
    [events]
  );

  const primaryMapPoint = useMemo(() => {
    const liveWithCoords = liveEvents.find(
      (event) =>
        event.latitude != null &&
        event.longitude != null &&
        Number.isFinite(Number(event.latitude)) &&
        Number.isFinite(Number(event.longitude))
    );

    if (liveWithCoords) {
      return {
        lat: Number(liveWithCoords.latitude),
        lng: Number(liveWithCoords.longitude),
        title: liveWithCoords.title || business?.business_name || "Business",
      };
    }

    const upcomingWithCoords = upcomingEvents.find(
      (event) =>
        event.latitude != null &&
        event.longitude != null &&
        Number.isFinite(Number(event.latitude)) &&
        Number.isFinite(Number(event.longitude))
    );

    if (upcomingWithCoords) {
      return {
        lat: Number(upcomingWithCoords.latitude),
        lng: Number(upcomingWithCoords.longitude),
        title: upcomingWithCoords.title || business?.business_name || "Business",
      };
    }

    if (
      business?.latitude != null &&
      business?.longitude != null &&
      Number.isFinite(Number(business.latitude)) &&
      Number.isFinite(Number(business.longitude))
    ) {
      return {
        lat: Number(business.latitude),
        lng: Number(business.longitude),
        title: business.business_name || "Business",
      };
    }

    return null;
  }, [business, liveEvents, upcomingEvents]);

  function goToMapFocused() {
    if (!business) {
      navigate("/map");
      return;
    }

    if (primaryMapPoint) {
      navigate("/map", {
        state: {
          lat: primaryMapPoint.lat,
          lng: primaryMapPoint.lng,
          businessId: business.id,
          title: primaryMapPoint.title,
        },
      });
      return;
    }

    navigate("/map", {
      state: {
        businessId: business.id,
        title: business.business_name || "Business",
      },
    });
  }

  const fallbackEmoji = getFallbackEmoji(business?.category);

  const phone = fieldOrEmpty(
    business?.phone ||
      business?.phone_number ||
      business?.contact_phone
  );

  const email = fieldOrEmpty(
    business?.email ||
      business?.contact_email
  );

  const website = fieldOrEmpty(
    business?.website ||
      business?.website_url
  );

  const instagram = fieldOrEmpty(
    business?.instagram ||
      business?.instagram_url
  );

  const facebook = fieldOrEmpty(
    business?.facebook ||
      business?.facebook_url
  );

  const tiktok = fieldOrEmpty(
    business?.tiktok ||
      business?.tiktok_url
  );

  const specialties = [
    business?.category || "",
    business?.specialty || "",
    business?.specialties || "",
    business?.product_focus || "",
  ]
    .filter(Boolean)
    .join(", ");

  const featuredProducts = [
    {
      id: 1,
      name: "Featured Item One",
      subtitle: "Top seller item",
      emoji: business?.category?.toLowerCase().includes("apparel") ? "🧢" : "📦",
    },
    {
      id: 2,
      name: "Featured Item Two",
      subtitle: "Customer favorite",
      emoji: business?.category?.toLowerCase().includes("apparel") ? "👕" : "⭐",
    },
    {
      id: 3,
      name: "Featured Item Three",
      subtitle: "Popular local pick",
      emoji: business?.category?.toLowerCase().includes("apparel") ? "🔥" : "🛍️",
    },
  ];

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f6f1e8",
      padding: "28px 20px 40px",
      fontFamily: "Arial, sans-serif",
      color: "#1f3b2f",
    },
    container: {
      maxWidth: "1220px",
      margin: "0 auto",
    },
    topActions: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginBottom: "18px",
    },
    pillButton: {
      padding: "10px 14px",
      borderRadius: "999px",
      border: "1px solid #d9e0d7",
      background: "#fffdf8",
      color: "#173d33",
      fontWeight: "bold",
      cursor: "pointer",
    },
    hero: {
      background: "#fffdf8",
      border: "1px solid #d9e0d7",
      borderRadius: "30px",
      overflow: "hidden",
      boxShadow: "0 16px 36px rgba(31,59,47,0.07)",
      marginBottom: "18px",
    },
    heroMediaWrap: {
      position: "relative",
      height: "350px",
      background:
        "linear-gradient(135deg, rgba(31,59,47,0.14), rgba(194,156,73,0.18))",
    },
    heroImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    },
    heroFallback: {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "90px",
      background:
        "linear-gradient(135deg, #e9f1eb 0%, #f8f0de 45%, #ece7db 100%)",
    },
    heroOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.34) 100%)",
    },
    heroBadgeRow: {
      position: "absolute",
      top: "18px",
      left: "18px",
      right: "18px",
      display: "flex",
      justifyContent: "space-between",
      gap: "10px",
      flexWrap: "wrap",
      zIndex: 2,
    },
    heroBadge: {
      display: "inline-block",
      padding: "8px 12px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.92)",
      color: "#173d33",
      fontWeight: "bold",
      fontSize: "0.84rem",
      border: "1px solid rgba(23,61,51,0.08)",
      backdropFilter: "blur(4px)",
    },
    heroBody: {
      padding: "24px",
    },
    eyebrow: {
      margin: "0 0 8px",
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      fontSize: "0.72rem",
      color: "#6d8076",
      fontWeight: "bold",
    },
    titleRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: "16px",
      flexWrap: "wrap",
      alignItems: "flex-start",
    },
    title: {
      margin: "0 0 8px",
      fontSize: "2.6rem",
      lineHeight: 1,
    },
    categoryPill: {
      display: "inline-block",
      padding: "6px 12px",
      borderRadius: "999px",
      background: "#edf5ef",
      color: "#1f3b2f",
      fontWeight: "bold",
      fontSize: "0.86rem",
      marginBottom: "12px",
    },
    description: {
      margin: "0 0 14px",
      color: "#60766b",
      lineHeight: 1.6,
      fontSize: "1rem",
      maxWidth: "860px",
    },
    titleButtons: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      alignItems: "center",
    },
    primaryButton: {
      padding: "11px 16px",
      background: "#173d33",
      color: "#fff",
      borderRadius: "999px",
      border: "none",
      fontWeight: "bold",
      cursor: "pointer",
      boxShadow: "0 10px 20px rgba(23, 61, 51, 0.16)",
    },
    secondaryButton: {
      padding: "11px 16px",
      background: "#fff",
      color: "#173d33",
      borderRadius: "999px",
      border: "1px solid #d9e0d7",
      fontWeight: "bold",
      cursor: "pointer",
    },
    infoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "12px",
      marginTop: "14px",
    },
    infoCard: {
      background: "#fff",
      border: "1px solid #d9e0d7",
      borderRadius: "18px",
      padding: "14px",
    },
    infoLabel: {
      fontSize: "0.76rem",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "#6d8076",
      fontWeight: "bold",
      marginBottom: "6px",
    },
    infoValue: {
      fontSize: "0.98rem",
      color: "#1f3b2f",
      lineHeight: 1.5,
      wordBreak: "break-word",
    },
    section: {
      background: "#fffdf8",
      border: "1px solid #d9e0d7",
      borderRadius: "24px",
      padding: "18px",
      boxShadow: "0 16px 36px rgba(31,59,47,0.07)",
      marginBottom: "18px",
    },
    sectionTitle: {
      margin: "0 0 12px",
      fontSize: "1.25rem",
    },
    sectionSubtext: {
      margin: "0 0 14px",
      color: "#60766b",
      lineHeight: 1.6,
      fontSize: "0.95rem",
    },
    statsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
      gap: "12px",
    },
    statCard: {
      background: "#fff",
      border: "1px solid #d9e0d7",
      borderRadius: "18px",
      padding: "14px",
    },
    statLabel: {
      fontSize: "0.8rem",
      color: "#6d8076",
      fontWeight: "bold",
      marginBottom: "6px",
    },
    statValue: {
      fontSize: "1.8rem",
      fontWeight: "bold",
      color: "#1f3b2f",
    },
    richGrid: {
      display: "grid",
      gridTemplateColumns: "1.15fr 0.85fr",
      gap: "18px",
      alignItems: "start",
    },
    stack: {
      display: "flex",
      flexDirection: "column",
      gap: "18px",
    },
    aboutCard: {
      background: "#fff",
      border: "1px solid #d9e0d7",
      borderRadius: "16px",
      padding: "14px",
      marginTop: "10px",
    },
    aboutTitle: {
      fontWeight: "bold",
      marginBottom: "6px",
    },
    aboutText: {
      color: "#60766b",
      fontSize: "0.95rem",
      lineHeight: 1.6,
    },
    contactGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
      gap: "12px",
    },
    contactCard: {
      background: "#fff",
      border: "1px solid #d9e0d7",
      borderRadius: "16px",
      padding: "14px",
    },
    contactTitle: {
      fontWeight: "bold",
      marginBottom: "6px",
      fontSize: "0.95rem",
    },
    contactValue: {
      color: "#60766b",
      lineHeight: 1.5,
      fontSize: "0.92rem",
      wordBreak: "break-word",
    },
    socialGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: "10px",
    },
    socialCard: {
      background: "#fff",
      border: "1px solid #d9e0d7",
      borderRadius: "14px",
      padding: "12px",
    },
    socialLabel: {
      fontWeight: "bold",
      marginBottom: "4px",
      fontSize: "0.88rem",
    },
    socialLink: {
      color: "#173d33",
      textDecoration: "none",
      fontWeight: "bold",
      fontSize: "0.88rem",
      wordBreak: "break-word",
    },
    socialEmpty: {
      color: "#8a8a8a",
      fontSize: "0.86rem",
    },
    highlightList: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "12px",
    },
    highlightCard: {
      background: "#fff",
      border: "1px solid #d9e0d7",
      borderRadius: "16px",
      padding: "14px",
    },
    highlightEmoji: {
      fontSize: "24px",
      marginBottom: "8px",
    },
    highlightTitle: {
      fontWeight: "bold",
      marginBottom: "4px",
      fontSize: "0.94rem",
    },
    highlightText: {
      fontSize: "0.88rem",
      color: "#60766b",
      lineHeight: 1.5,
    },
    productGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
      gap: "12px",
    },
    productCard: {
      background: "#fff",
      border: "1px solid #d9e0d7",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 10px 24px rgba(31,59,47,0.04)",
    },
    productImage: {
      height: "120px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "32px",
      backgroundImage:
        "linear-gradient(135deg, #edf5ef 0%, #f8f0de 50%, #f0ebe1 100%)",
    },
    productBody: {
      padding: "10px",
    },
    productName: {
      fontWeight: "bold",
      fontSize: "0.92rem",
      marginBottom: "4px",
    },
    productSubtitle: {
      fontSize: "0.82rem",
      color: "#60766b",
    },
    locationCallout: {
      padding: "12px",
      borderRadius: "12px",
      fontWeight: "bold",
      marginBottom: "10px",
    },
    eventList: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "12px",
    },
    eventCard: {
      background: "#fff",
      border: "1px solid #d9e0d7",
      borderRadius: "18px",
      padding: "16px",
      boxShadow: "0 10px 24px rgba(31,59,47,0.04)",
    },
    badge: {
      display: "inline-block",
      padding: "5px 10px",
      borderRadius: "999px",
      fontWeight: "bold",
      fontSize: "0.78rem",
      textTransform: "capitalize",
      marginBottom: "8px",
      border: "1px solid transparent",
    },
    liveBurst: {
      display: "inline-block",
      padding: "6px 12px",
      borderRadius: "999px",
      background: "#dcf7e8",
      color: "#146c43",
      fontWeight: "bold",
      fontSize: "0.82rem",
      marginBottom: "8px",
      marginRight: "8px",
      border: "1px solid #b9ebcc",
    },
    eventTitle: {
      fontWeight: "bold",
      fontSize: "1.08rem",
      marginBottom: "6px",
    },
    eventMeta: {
      color: "#60766b",
      fontSize: "0.92rem",
      lineHeight: 1.65,
    },
    empty: {
      color: "#60766b",
      fontSize: "0.96rem",
    },
    loading: {
      padding: "40px",
      textAlign: "center",
      color: "#60766b",
      fontWeight: "bold",
    },
    error: {
      background: "#fff1f1",
      border: "1px solid #f0cccc",
      color: "#8c1f1f",
      padding: "12px 14px",
      borderRadius: "14px",
      marginBottom: "16px",
    },
  };

  if (loading) {
    return <div style={styles.loading}>Loading seller profile…</div>;
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.topActions}>
            <button type="button" style={styles.pillButton} onClick={goToMapFocused}>
              ← Back to Map
            </button>
          </div>
          <div style={styles.error}>{error}</div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.topActions}>
            <button type="button" style={styles.pillButton} onClick={() => navigate("/map")}>
              ← Back to Map
            </button>
          </div>

          <div style={styles.section}>
            <h1 style={{ marginTop: 0 }}>No business found</h1>
            <p style={styles.empty}>
              We couldn’t find a business for this seller profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topActions}>
          <button type="button" style={styles.pillButton} onClick={goToMapFocused}>
            ← Back to Map
          </button>

          <button type="button" style={styles.pillButton} onClick={goToMapFocused}>
            View on Map
          </button>

          {isOwner ? (
            <button
              type="button"
              style={styles.pillButton}
              onClick={() => navigate("/seller-dashboard")}
            >
              Seller Dashboard
            </button>
          ) : null}
        </div>

        <div style={styles.hero}>
          <div style={styles.heroMediaWrap}>
            {business.image_url ? (
              <img
                src={business.image_url}
                alt={business.business_name}
                style={styles.heroImage}
              />
            ) : (
              <div style={styles.heroFallback}>{fallbackEmoji}</div>
            )}

            <div style={styles.heroOverlay} />

            <div style={styles.heroBadgeRow}>
              <div style={styles.heroBadge}>Seller Profile</div>
              <div style={styles.heroBadge}>{business.status || "approved"}</div>
            </div>
          </div>

          <div style={styles.heroBody}>
            <p style={styles.eyebrow}>Seller profile</p>

            <div style={styles.titleRow}>
              <div>
                <h1 style={styles.title}>{business.business_name || "Business"}</h1>

                <div style={styles.categoryPill}>
                  {business.category || "Local business"}
                </div>

                <p style={styles.description}>
                  {business.description || "This seller has not added a description yet."}
                </p>

                <div style={styles.aboutCard}>
                  <div style={styles.aboutTitle}>About this seller</div>
                  <div style={styles.aboutText}>
                    {business.business_name} is a local {business.category || "business"} based in{" "}
                    {business.location || "your area"}. Follow them to stay updated when they go live,
                    set up at a booth, or pop up near you.
                  </div>
                </div>
              </div>

              <div style={styles.titleButtons}>
                {!isOwner ? (
                  <button
                    type="button"
                    onClick={() => handleFollow(business.id, business.business_name)}
                    disabled={followLoading}
                    style={{
                      ...styles.primaryButton,
                      opacity: followLoading ? 0.7 : 1,
                    }}
                  >
                    {followLoading ? "Following..." : "⭐ Follow"}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={goToMapFocused}
                  style={styles.secondaryButton}
                >
                  View on Map
                </button>
              </div>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Location</div>
                <div style={styles.infoValue}>{business.location || "Location coming soon"}</div>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Status</div>
                <div style={styles.infoValue}>{business.status || "—"}</div>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Business ID</div>
                <div style={styles.infoValue}>{business.id}</div>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Owner View</div>
                <div style={styles.infoValue}>{isOwner ? "Yes" : "No"}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.richGrid}>
          <div style={styles.stack}>
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Activity snapshot</h2>

              <div style={styles.statsRow}>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Live Now</div>
                  <div style={styles.statValue}>{liveEvents.length}</div>
                </div>

                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Upcoming</div>
                  <div style={styles.statValue}>{upcomingEvents.length}</div>
                </div>

                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Completed</div>
                  <div style={styles.statValue}>{completedEvents.length}</div>
                </div>

                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Total Events</div>
                  <div style={styles.statValue}>{events.length}</div>
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Featured Products</h2>
              <p style={styles.sectionSubtext}>
                Placeholder showcase for now. Later you can replace these with real products.
              </p>

              <div style={styles.productGrid}>
                {featuredProducts.map((product) => (
                  <div key={product.id} style={styles.productCard}>
                    <div style={styles.productImage}>{product.emoji}</div>

                    <div style={styles.productBody}>
                      <div style={styles.productName}>{product.name}</div>
                      <div style={styles.productSubtitle}>{product.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Where to find them</h2>

              {liveEvents.length > 0 ? (
                <div
                  style={{
                    ...styles.locationCallout,
                    background: "#dcf7e8",
                    border: "1px solid #b9ebcc",
                    color: "#146c43",
                  }}
                >
                  🔴 LIVE NOW near you
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div
                  style={{
                    ...styles.locationCallout,
                    background: "#fff3d8",
                    border: "1px solid #f1dfac",
                    color: "#9a6700",
                  }}
                >
                  📅 Next event coming up
                </div>
              ) : (
                <div
                  style={{
                    ...styles.locationCallout,
                    background: "#ececec",
                    border: "1px solid #dddddd",
                    color: "#686868",
                  }}
                >
                  No events scheduled yet
                </div>
              )}

              <div style={{ marginTop: "10px", color: "#60766b", lineHeight: 1.6 }}>
                {business.location || "Location coming soon"}
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Seller events</h2>

              {events.length === 0 ? (
                <div style={styles.empty}>No events posted yet.</div>
              ) : (
                <div style={styles.eventList}>
                  {events.map((event) => {
                    const visual = statusStyles(event.computedStatus);

                    return (
                      <div key={event.id} style={styles.eventCard}>
                        {event.computedStatus === "live" ? (
                          <div style={styles.liveBurst}>🔴 LIVE NOW</div>
                        ) : null}

                        <div
                          style={{
                            ...styles.badge,
                            background: visual.bg,
                            color: visual.color,
                            borderColor: visual.border,
                          }}
                        >
                          {event.computedStatus}
                        </div>

                        <div style={styles.eventTitle}>{event.title || "Untitled Event"}</div>

                        <div style={styles.eventMeta}>
                          <div><strong>Type:</strong> {event.type || "—"}</div>
                          <div><strong>Starts:</strong> {formatDateTime(event.start_time)}</div>
                          <div><strong>Ends:</strong> {formatDateTime(event.end_time)}</div>
                          <div>
                            <strong>Address:</strong>{" "}
                            {[event.address, event.city, event.state].filter(Boolean).join(", ") || "—"}
                          </div>
                          {event.note ? <div><strong>Note:</strong> {event.note}</div> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={styles.stack}>
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Contact & connect</h2>
              <p style={styles.sectionSubtext}>
                These fields will feel much better once you add real seller details.
              </p>

              <div style={styles.contactGrid}>
                <div style={styles.contactCard}>
                  <div style={styles.contactTitle}>Phone</div>
                  <div style={styles.contactValue}>
                    {phone ? formatPhone(phone) : "Phone number not added yet"}
                  </div>
                </div>

                <div style={styles.contactCard}>
                  <div style={styles.contactTitle}>Email</div>
                  <div style={styles.contactValue}>
                    {email || "Email not added yet"}
                  </div>
                </div>

                <div style={styles.contactCard}>
                  <div style={styles.contactTitle}>Website</div>
                  <div style={styles.contactValue}>
                    {website ? (
                      <a
                        href={normalizeUrl(website)}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.socialLink}
                      >
                        Visit website
                      </a>
                    ) : (
                      "Website not added yet"
                    )}
                  </div>
                </div>

                <div style={styles.contactCard}>
                  <div style={styles.contactTitle}>Home Base</div>
                  <div style={styles.contactValue}>
                    {business.location || "Location coming soon"}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Socials</h2>

              <div style={styles.socialGrid}>
                <div style={styles.socialCard}>
                  <div style={styles.socialLabel}>Instagram</div>
                  {instagram ? (
                    <a
                      href={normalizeUrl(instagram)}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.socialLink}
                    >
                      Open Instagram
                    </a>
                  ) : (
                    <div style={styles.socialEmpty}>Not added yet</div>
                  )}
                </div>

                <div style={styles.socialCard}>
                  <div style={styles.socialLabel}>Facebook</div>
                  {facebook ? (
                    <a
                      href={normalizeUrl(facebook)}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.socialLink}
                    >
                      Open Facebook
                    </a>
                  ) : (
                    <div style={styles.socialEmpty}>Not added yet</div>
                  )}
                </div>

                <div style={styles.socialCard}>
                  <div style={styles.socialLabel}>TikTok</div>
                  {tiktok ? (
                    <a
                      href={normalizeUrl(tiktok)}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.socialLink}
                    >
                      Open TikTok
                    </a>
                  ) : (
                    <div style={styles.socialEmpty}>Not added yet</div>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Seller highlights</h2>

              <div style={styles.highlightList}>
                <div style={styles.highlightCard}>
                  <div style={styles.highlightEmoji}>{fallbackEmoji}</div>
                  <div style={styles.highlightTitle}>What they sell</div>
                  <div style={styles.highlightText}>
                    {business.category || "Local products and offerings"}
                  </div>
                </div>

                <div style={styles.highlightCard}>
                  <div style={styles.highlightEmoji}>📍</div>
                  <div style={styles.highlightTitle}>Where they’re based</div>
                  <div style={styles.highlightText}>
                    {business.location || "Location coming soon"}
                  </div>
                </div>

                <div style={styles.highlightCard}>
                  <div style={styles.highlightEmoji}>⭐</div>
                  <div style={styles.highlightTitle}>Specialties</div>
                  <div style={styles.highlightText}>
                    {specialties || "Specialties can be added later"}
                  </div>
                </div>

                <div style={styles.highlightCard}>
                  <div style={styles.highlightEmoji}>🗓️</div>
                  <div style={styles.highlightTitle}>Activity level</div>
                  <div style={styles.highlightText}>
                    {events.length > 0
                      ? `${events.length} total event${events.length === 1 ? "" : "s"} on profile`
                      : "No events posted yet"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}