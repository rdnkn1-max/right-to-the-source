import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "./MapView";
import { supabase } from "../supabaseClient";

export default function HomeNEW() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;

      if (error) {
        console.error("Error loading user:", error.message);
        setCurrentUser(null);
        return;
      }

      setCurrentUser(data?.user || null);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const featuredItems = [
    {
      id: "rdnkn",
      businessId: "rdnkn",
      tag: "Featured Brand",
      title: "RDNKN",
      subtitle: "Apparel • Hats • Lifestyle",
      badgeIcon: "🧢",
      lat: 28.3517,
      lng: -80.6867,
      profilePath: "/seller-profile/rdnkn",
    },
    {
      id: "eggs",
      businessId: "eggs-farm",
      tag: "Buyer Favorite",
      title: "Farm Fresh Eggs",
      subtitle: "Fresh local food",
      badgeIcon: "🥚",
      lat: 28.3921,
      lng: -80.7012,
      profilePath: "/seller-profile/eggs-farm",
    },
    {
      id: "honey",
      businessId: "local-honey",
      tag: "Featured Seller",
      title: "Local Honey",
      subtitle: "Jars • Small batch",
      badgeIcon: "🍯",
      lat: 28.3654,
      lng: -80.6742,
      profilePath: "/seller-profile/local-honey",
    },
    {
      id: "produce",
      businessId: "fresh-produce",
      tag: "Featured Seller",
      title: "Fresh Produce",
      subtitle: "Vegetables • Fruit",
      badgeIcon: "🥬",
      lat: 28.3775,
      lng: -80.7192,
      profilePath: "/seller-profile/fresh-produce",
    },
    {
      id: "dairy",
      businessId: "fresh-dairy",
      tag: "Featured Seller",
      title: "Fresh Dairy",
      subtitle: "Milk • Butter • Local",
      badgeIcon: "🥛",
      lat: 28.4018,
      lng: -80.6843,
      profilePath: "/seller-profile/fresh-dairy",
    },
    {
      id: "beef",
      businessId: "local-beef",
      tag: "Featured Seller",
      title: "Local Beef",
      subtitle: "Farm direct",
      badgeIcon: "🥩",
      lat: 28.3389,
      lng: -80.6951,
      profilePath: "/seller-profile/local-beef",
    },
    {
      id: "popup",
      businessId: "popup-booths",
      tag: "Featured Event",
      title: "Pop-Up Booths",
      subtitle: "Markets • Weekends",
      badgeIcon: "🎪",
      lat: 28.4105,
      lng: -80.6988,
      profilePath: "/seller-profile/popup-booths",
    },
    {
      id: "apparel",
      businessId: "local-apparel",
      tag: "Featured Seller",
      title: "Local Apparel",
      subtitle: "Brands • Merch • Gear",
      badgeIcon: "👕",
      lat: 28.3578,
      lng: -80.7077,
      profilePath: "/seller-profile/local-apparel",
    },
    {
      id: "chicken",
      businessId: "local-chicken",
      tag: "Featured Seller",
      title: "Local Chicken",
      subtitle: "Farm fresh",
      badgeIcon: "🐔",
      lat: 28.3876,
      lng: -80.6674,
      profilePath: "/seller-profile/local-chicken",
    },
    {
      id: "seafood",
      businessId: "fresh-seafood",
      tag: "Featured Seller",
      title: "Fresh Seafood",
      subtitle: "Coastal catch",
      badgeIcon: "🦐",
      lat: 28.4204,
      lng: -80.6112,
      profilePath: "/seller-profile/fresh-seafood",
    },
    {
      id: "markets",
      businessId: "markets",
      tag: "Featured Event",
      title: "Markets",
      subtitle: "Weekend local finds",
      badgeIcon: "🌾",
      lat: 28.3709,
      lng: -80.6904,
      profilePath: "/seller-profile/markets",
    },
    {
      id: "bakery",
      businessId: "baked-goods",
      tag: "Featured Seller",
      title: "Baked Goods",
      subtitle: "Fresh baked local",
      badgeIcon: "🍞",
      lat: 28.3448,
      lng: -80.6759,
      profilePath: "/seller-profile/baked-goods",
    },
  ];

  const findHereItems = [
    "Food Trucks",
    "Farm Stands",
    "Fresh Eggs",
    "Honey",
    "Produce",
    "Fresh Dairy",
    "Butter",
    "Local Beef",
    "Pop-Ups",
    "Booths",
    "Apparel",
    "Markets",
  ];

  function openFeaturedMap(item) {
    navigate("/map", {
      state: {
        lat: item.lat,
        lng: item.lng,
        businessId: item.businessId,
        title: item.title,
      },
    });
  }

  function openFeaturedProfile(item) {
    navigate(item.profilePath);
  }

  function handleMySellersClick() {
    if (currentUser) {
      navigate("/my-sellers");
      return;
    }

    navigate("/auth");
  }

  const styles = {
    page: {
      background:
        "radial-gradient(circle at top, #faf4ea 0%, #f1e6d7 42%, #e8dccb 100%)",
      minHeight: "100vh",
      padding: "30px 24px 56px",
      fontFamily: "Arial, sans-serif",
      color: "#163229",
    },

    shell: {
      maxWidth: "1560px",
      margin: "0 auto",
      position: "relative",
    },

    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "18px",
      marginBottom: "30px",
      flexWrap: "wrap",
    },

    brandWrap: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },

    eyebrow: {
      fontSize: "10px",
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "#8b735e",
      fontWeight: "700",
    },

    brand: {
      fontWeight: "800",
      fontSize: "24px",
      letterSpacing: "-0.03em",
      lineHeight: 1,
    },

    nav: {
      display: "flex",
      gap: "12px",
      flexWrap: "wrap",
      alignItems: "center",
    },

    button: {
      padding: "10px 16px",
      borderRadius: "999px",
      border: "1px solid rgba(95, 74, 54, 0.14)",
      background: "rgba(255, 251, 245, 0.9)",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "12px",
      color: "#2d2a27",
      boxShadow: "0 10px 24px rgba(68, 49, 32, 0.06)",
      backdropFilter: "blur(8px)",
      transition: "transform 180ms ease, box-shadow 180ms ease",
    },

    primary: {
      padding: "12px 20px",
      fontSize: "13px",
      background: "linear-gradient(135deg, #16382f 0%, #204d40 100%)",
      color: "#fff",
      border: "1px solid #16382f",
      boxShadow: "0 18px 30px rgba(22, 56, 47, 0.22)",
    },

    heroSecondaryButton: {
      padding: "12px 20px",
      fontSize: "13px",
      background: "rgba(255, 251, 245, 0.92)",
      border: "1px solid rgba(95, 74, 54, 0.14)",
      boxShadow: "0 12px 24px rgba(68, 49, 32, 0.06)",
    },

    statusPill: {
      padding: "8px 13px",
      borderRadius: "999px",
      background: "rgba(255, 250, 244, 0.9)",
      border: "1px solid rgba(95, 74, 54, 0.12)",
      color: "#173d33",
      fontSize: "11px",
      fontWeight: "700",
      boxShadow: "0 10px 22px rgba(68, 49, 32, 0.05)",
    },

    hero: {
      marginBottom: "34px",
      padding: "52px 44px 46px",
      borderRadius: "36px",
      background:
        "linear-gradient(135deg, rgba(255,250,244,0.98) 0%, rgba(248,239,227,0.96) 55%, rgba(239,229,214,0.92) 100%)",
      border: "1px solid rgba(108, 83, 58, 0.1)",
      boxShadow: "0 30px 72px rgba(84, 60, 38, 0.08)",
    },

    heroLeft: {
      maxWidth: "860px",
    },

    heroLabel: {
      fontSize: "11px",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: "#856e59",
      fontWeight: "800",
      marginBottom: "18px",
    },

    heroTitle: {
      fontSize: "64px",
      fontWeight: "900",
      letterSpacing: "-0.06em",
      lineHeight: 0.94,
      margin: 0,
      maxWidth: "800px",
      color: "#10261f",
    },

    heroText: {
      marginTop: "22px",
      fontSize: "18px",
      lineHeight: 1.72,
      color: "#564a42",
      maxWidth: "760px",
    },

    heroActions: {
      display: "flex",
      gap: "12px",
      flexWrap: "wrap",
      marginTop: "28px",
    },

    mainGrid: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.2fr) 490px",
      gap: "28px",
      alignItems: "start",
    },

    leftColumn: {
      display: "flex",
      flexDirection: "column",
      gap: "28px",
    },

    infoCard: {
      background:
        "linear-gradient(180deg, rgba(255,251,245,0.98) 0%, rgba(249,241,231,0.95) 100%)",
      border: "1px solid rgba(108, 83, 58, 0.1)",
      borderRadius: "26px",
      padding: "30px",
      boxShadow: "0 22px 42px rgba(84, 60, 38, 0.06)",
    },

    cardEyebrow: {
      fontSize: "10px",
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "#8b735e",
      fontWeight: "700",
      marginBottom: "12px",
    },

    cardTitle: {
      margin: "0 0 14px 0",
      fontSize: "32px",
      fontWeight: "800",
      color: "#112a22",
      lineHeight: 1.04,
    },

    cardText: {
      margin: 0,
      fontSize: "15px",
      color: "#62574d",
      lineHeight: 1.85,
      maxWidth: "62ch",
    },

    sectionDivider: {
      marginTop: "28px",
      marginBottom: "14px",
      fontSize: "10px",
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "#8b735e",
      fontWeight: "700",
    },

    chipsWrap: {
      display: "flex",
      flexWrap: "wrap",
      gap: "12px",
      marginTop: "12px",
      maxWidth: "760px",
    },

    chip: {
      padding: "10px 14px",
      borderRadius: "999px",
      background: "rgba(255, 248, 240, 0.95)",
      border: "1px solid rgba(130, 103, 78, 0.12)",
      fontSize: "12px",
      fontWeight: "700",
      color: "#3e342c",
      boxShadow: "0 8px 18px rgba(83, 60, 38, 0.04)",
    },

    howCardWrap: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },

    howGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "16px",
    },

    howCard: {
      background: "rgba(255, 251, 245, 0.96)",
      border: "1px solid rgba(108, 83, 58, 0.1)",
      borderRadius: "24px",
      padding: "24px",
      boxShadow: "0 20px 38px rgba(84, 60, 38, 0.05)",
      minHeight: "180px",
    },

    howNumber: {
      width: "34px",
      height: "34px",
      borderRadius: "999px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(23, 61, 51, 0.08)",
      color: "#173d33",
      fontSize: "12px",
      fontWeight: "800",
      marginBottom: "16px",
    },

    howTitle: {
      margin: "0 0 10px 0",
      fontSize: "20px",
      fontWeight: "800",
      color: "#112a22",
      lineHeight: 1.15,
    },

    howText: {
      margin: 0,
      fontSize: "14px",
      lineHeight: 1.7,
      color: "#62574d",
      maxWidth: "28ch",
    },

    mapSection: {
      display: "flex",
      flexDirection: "column",
      gap: "14px",
    },

    mapCard: {
      background: "rgba(255, 251, 245, 0.97)",
      border: "1px solid rgba(108, 83, 58, 0.1)",
      borderRadius: "30px",
      padding: "22px",
      boxShadow: "0 28px 56px rgba(84, 60, 38, 0.08)",
    },

    mapWrap: {
      height: "520px",
      borderRadius: "24px",
      overflow: "hidden",
      border: "1px solid rgba(108, 83, 58, 0.1)",
      background: "#f3eee6",
      position: "relative",
      cursor: "pointer",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
    },

    mapButton: {
      position: "absolute",
      top: "18px",
      right: "18px",
      zIndex: 20,
      padding: "12px 18px",
      borderRadius: "999px",
      border: "1px solid #173d33",
      background: "rgba(23, 61, 51, 0.96)",
      color: "#fff",
      fontWeight: "700",
      fontSize: "12px",
      cursor: "pointer",
      boxShadow: "0 18px 30px rgba(17, 39, 33, 0.26)",
    },

    previewViewport: {
      pointerEvents: "none",
      height: "100%",
      width: "100%",
      overflow: "hidden",
      position: "relative",
      borderRadius: "24px",
      zIndex: 0,
    },

    previewCanvas: {
      height: "100%",
      width: "100%",
    },

    mapOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(12, 25, 22, 0.02) 0%, rgba(12, 25, 22, 0.14) 100%)",
      borderRadius: "24px",
      pointerEvents: "none",
      zIndex: 1,
    },

    hintRow: {
      marginTop: "18px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "14px",
      flexWrap: "wrap",
    },

    hint: {
      fontSize: "13px",
      color: "#4d433b",
      fontWeight: "800",
      lineHeight: 1.4,
    },

    tinyAction: {
      fontSize: "12px",
      color: "#173d33",
      fontWeight: "700",
      cursor: "pointer",
      background: "transparent",
      border: "none",
      padding: 0,
    },

    authCard: {
      background: "rgba(255, 251, 245, 0.97)",
      border: "1px solid rgba(108, 83, 58, 0.1)",
      borderRadius: "26px",
      padding: "28px",
      boxShadow: "0 22px 42px rgba(84, 60, 38, 0.06)",
    },

    authGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "18px",
      marginTop: "12px",
    },

    authPanel: {
      border: "1px solid rgba(108, 83, 58, 0.1)",
      borderRadius: "22px",
      padding: "20px",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,245,237,0.92) 100%)",
      boxShadow: "0 16px 28px rgba(84, 60, 38, 0.05)",
    },

    authPanelTitle: {
      margin: "0 0 10px 0",
      fontSize: "19px",
      fontWeight: "800",
      color: "#173229",
    },

    authPanelText: {
      margin: 0,
      fontSize: "14px",
      color: "#62574d",
      lineHeight: 1.7,
      maxWidth: "34ch",
    },

    authButtons: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginTop: "20px",
    },

    featuredShell: {
      background:
        "linear-gradient(180deg, rgba(20,47,39,0.98) 0%, rgba(26,59,49,0.98) 100%)",
      border: "1px solid rgba(18, 47, 39, 0.3)",
      borderRadius: "30px",
      padding: "22px",
      boxShadow: "0 28px 60px rgba(18, 47, 39, 0.22)",
      display: "flex",
      flexDirection: "column",
      gap: "18px",
      minHeight: "100%",
      position: "sticky",
      top: "24px",
    },

    featuredHeader: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      marginBottom: "4px",
    },

    featuredEyebrow: {
      fontSize: "10px",
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "rgba(235, 225, 212, 0.72)",
      fontWeight: "700",
    },

    featuredTitle: {
      margin: 0,
      fontSize: "30px",
      fontWeight: "800",
      lineHeight: 1.02,
      color: "#fff9f2",
    },

    featuredSubline: {
      margin: 0,
      fontSize: "13px",
      color: "rgba(235, 225, 212, 0.82)",
      lineHeight: 1.65,
      maxWidth: "34ch",
    },

    featuredGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
      alignContent: "start",
      maxHeight: "calc(100vh - 250px)",
      overflowY: "auto",
      paddingRight: "4px",
    },

    featureCard: {
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "20px",
      padding: "16px",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(247,240,231,0.94) 100%)",
      boxShadow: "0 18px 28px rgba(0,0,0,0.12)",
      minHeight: "146px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      transition: "transform 180ms ease, box-shadow 180ms ease",
    },

    featureCardInner: {
      position: "relative",
      height: "100%",
      display: "flex",
      flexDirection: "column",
    },

    featureCornerIcon: {
      position: "absolute",
      top: "0",
      right: "0",
      width: "38px",
      height: "38px",
      borderRadius: "12px",
      background: "rgba(247, 238, 227, 0.95)",
      border: "1px solid rgba(130, 103, 78, 0.12)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "17px",
      boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
    },

    featureTop: {
      paddingRight: "50px",
    },

    featureTag: {
      fontSize: "9px",
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "#8b735e",
      fontWeight: "700",
      marginBottom: "8px",
    },

    featureName: {
      margin: "0 0 6px 0",
      fontSize: "16px",
      fontWeight: "800",
      color: "#173229",
      lineHeight: 1.15,
    },

    featureSub: {
      margin: 0,
      fontSize: "11px",
      color: "#62574d",
      fontWeight: "700",
      lineHeight: 1.45,
    },

    featureButtons: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      marginTop: "14px",
    },

    miniPrimaryButton: {
      padding: "8px 12px",
      borderRadius: "999px",
      border: "1px solid #173d33",
      background: "linear-gradient(135deg, #16382f 0%, #204d40 100%)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "11px",
      boxShadow: "0 10px 18px rgba(22, 56, 47, 0.18)",
    },

    miniSecondaryButton: {
      padding: "8px 12px",
      borderRadius: "999px",
      border: "1px solid rgba(130, 103, 78, 0.14)",
      background: "rgba(255, 252, 247, 0.96)",
      color: "#173d33",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "11px",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div style={styles.brandWrap}>
            <div style={styles.eyebrow}>Live local discovery</div>
            <div style={styles.brand}>Right to the Source</div>
          </div>

          <div style={styles.nav}>
            {currentUser ? (
              <div style={styles.statusPill}>Logged in</div>
            ) : (
              <div style={styles.statusPill}>Not logged in</div>
            )}

            <button style={styles.button} onClick={handleMySellersClick}>
              My Finds
            </button>

            {!currentUser ? (
              <button style={styles.button} onClick={() => navigate("/auth")}>
                Visitor Login
              </button>
            ) : null}

            <button
              style={styles.button}
              onClick={() => navigate("/seller-auth")}
            >
              Seller Login
            </button>

            <button
              style={{ ...styles.button, ...styles.primary }}
              onClick={() => navigate("/list-your-business")}
            >
              List Your Business
            </button>
          </div>
        </div>

        <div style={styles.hero}>
          <div style={styles.heroLeft}>
            <div style={styles.heroLabel}>LIVE LOCAL DISCOVERY</div>
            <h1 style={styles.heroTitle}>
              Local stuff you didn’t know you could get.
            </h1>
            <div style={styles.heroText}>
              Most of the best local food, pop-ups, farm stands, and small brands
              aren’t easy to find. Right to the Source puts them all in one place
              so you can go straight to them.
            </div>

            <div style={styles.heroActions}>
              <button
                style={{ ...styles.button, ...styles.primary }}
                onClick={() => navigate("/map")}
              >
                Explore Local
              </button>

              <button
                style={{ ...styles.button, ...styles.heroSecondaryButton }}
                onClick={() => navigate("/list-your-business")}
              >
                List Your Business
              </button>
            </div>
          </div>
        </div>

        <div style={styles.mainGrid}>
          <div style={styles.leftColumn}>
            <div style={styles.infoCard}>
              <div style={styles.cardEyebrow}>Why this exists</div>
              <h2 style={styles.cardTitle}>
                Most of the best local stuff isn’t online.
              </h2>

              <p style={styles.cardText}>
                Small businesses are scattered across Facebook posts, Instagram
                stories, roadside signs, and word of mouth. Right to the Source
                brings them together so people nearby can actually find them.
              </p>

              <div style={styles.sectionDivider}>What people are finding here</div>

              <div style={styles.chipsWrap}>
                {findHereItems.map((item) => (
                  <div key={item} style={styles.chip}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.howCardWrap}>
              <div style={styles.cardEyebrow}>How it works</div>
              <div style={styles.howGrid}>
                <div style={styles.howCard}>
                  <div style={styles.howNumber}>01</div>
                  <h3 style={styles.howTitle}>Discover what’s nearby</h3>
                  <p style={styles.howText}>
                    See local sellers, food, and events happening around you right
                    now.
                  </p>
                </div>

                <div style={styles.howCard}>
                  <div style={styles.howNumber}>02</div>
                  <h3 style={styles.howTitle}>Find hidden gems</h3>
                  <p style={styles.howText}>
                    From farm stands to pop-ups — the kind of stuff you don’t find
                    on big apps.
                  </p>
                </div>

                <div style={styles.howCard}>
                  <div style={styles.howNumber}>03</div>
                  <h3 style={styles.howTitle}>Go straight to the source</h3>
                  <p style={styles.howText}>
                    No middleman. No checkout. Just go directly to the seller.
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.mapSection}>
              <div style={styles.cardEyebrow}>Live map preview</div>
              <h2 style={styles.cardTitle}>
                See what’s happening near you right now
              </h2>

              <div style={styles.mapCard}>
                <div style={styles.mapWrap} onClick={() => navigate("/map")}>
                  <button
                    style={styles.mapButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/map");
                    }}
                  >
                    Open Map
                  </button>

                  <div style={styles.previewViewport}>
                    <div style={styles.previewCanvas}>
                      <MapView homepagePreview />
                    </div>
                  </div>

                  <div style={styles.mapOverlay} />
                </div>

                <div style={styles.hintRow}>
                  <div style={styles.hint}>
                    See what’s actually happening nearby — right now.
                  </div>

                  <button
                    style={styles.tinyAction}
                    onClick={() => navigate("/map")}
                  >
                    Open map page →
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.authCard}>
              <div style={styles.cardEyebrow}>Buyers and sellers</div>
              <h2 style={styles.cardTitle}>Built for discovery on both sides.</h2>

              <div style={styles.authGrid}>
                <div style={styles.authPanel}>
                  <h3 style={styles.authPanelTitle}>Save local spots you love</h3>
                  <p style={styles.authPanelText}>
                    Follow your favorite sellers and keep track of where to go back
                    to.
                  </p>

                  <div style={styles.authButtons}>
                    {!currentUser ? (
                      <>
                        <button
                          style={{ ...styles.button, ...styles.primary }}
                          onClick={() => navigate("/auth")}
                        >
                          Sign Up
                        </button>

                        <button
                          style={styles.button}
                          onClick={() => navigate("/auth")}
                        >
                          Log In
                        </button>
                      </>
                    ) : (
                      <button
                        style={{ ...styles.button, ...styles.primary }}
                        onClick={() => navigate("/my-sellers")}
                      >
                        Go to My Finds
                      </button>
                    )}
                  </div>
                </div>

                <div style={styles.authPanel}>
                  <h3 style={styles.authPanelTitle}>Own a local business?</h3>
                  <p style={styles.authPanelText}>
                    Show up on the map and get discovered by people nearby.
                  </p>

                  <div style={styles.authButtons}>
                    <button
                      style={styles.button}
                      onClick={() => navigate("/seller-auth")}
                    >
                      Seller Login
                    </button>

                    <button
                      style={{ ...styles.button, ...styles.primary }}
                      onClick={() => navigate("/list-your-business")}
                    >
                      List Your Business
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.featuredShell}>
            <div style={styles.featuredHeader}>
              <div style={styles.featuredEyebrow}>Featured nearby</div>
              <h2 style={styles.featuredTitle}>Browse what’s around you</h2>
              <p style={styles.featuredSubline}>
                Real local businesses. Real products. Happening now.
              </p>
            </div>

            <div style={styles.featuredGrid}>
              {featuredItems.map((item) => (
                <div
                  key={item.id}
                  style={styles.featureCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow =
                      "0 28px 40px rgba(0,0,0,0.16)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px)";
                    e.currentTarget.style.boxShadow =
                      "0 18px 28px rgba(0,0,0,0.12)";
                  }}
                >
                  <div style={styles.featureCardInner}>
                    <div style={styles.featureCornerIcon}>{item.badgeIcon}</div>

                    <div style={styles.featureTop}>
                      <div style={styles.featureTag}>{item.tag}</div>
                      <h3 style={styles.featureName}>{item.title}</h3>
                      <p style={styles.featureSub}>{item.subtitle}</p>
                    </div>

                    <div style={styles.featureButtons}>
                      <button
                        style={styles.miniPrimaryButton}
                        onClick={() => openFeaturedProfile(item)}
                      >
                        View
                      </button>

                      <button
                        style={styles.miniSecondaryButton}
                        onClick={() => openFeaturedMap(item)}
                      >
                        Map
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
