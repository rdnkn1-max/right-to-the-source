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
      background: "#f6f1e8",
      minHeight: "100vh",
      padding: "22px",
      fontFamily: "Arial, sans-serif",
      color: "#1f3b2f",
    },

    shell: {
      maxWidth: "1480px",
      margin: "0 auto",
    },

    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "16px",
      marginBottom: "18px",
      flexWrap: "wrap",
    },

    brandWrap: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },

    eyebrow: {
      fontSize: "11px",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "#8a7b6d",
      fontWeight: "700",
    },

    brand: {
      fontWeight: "800",
      fontSize: "22px",
      letterSpacing: "-0.02em",
      lineHeight: 1,
    },

    nav: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      alignItems: "center",
    },

    button: {
      padding: "9px 15px",
      borderRadius: "999px",
      border: "1px solid #d8d1c8",
      background: "#fffdf9",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "12px",
      color: "#2d2a27",
      boxShadow: "0 6px 14px rgba(0,0,0,0.03)",
    },

    primary: {
      background: "#173d33",
      color: "#fff",
      border: "1px solid #173d33",
      boxShadow: "0 10px 18px rgba(23,61,51,0.14)",
    },

    statusPill: {
      padding: "7px 12px",
      borderRadius: "999px",
      background: "#edf5ef",
      border: "1px solid #d6e5da",
      color: "#173d33",
      fontSize: "11px",
      fontWeight: "700",
    },

    hero: {
      marginBottom: "18px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: "16px",
      flexWrap: "wrap",
    },

    heroLeft: {
      maxWidth: "760px",
    },

    heroTitle: {
      fontSize: "40px",
      fontWeight: "800",
      letterSpacing: "-0.04em",
      lineHeight: 0.98,
      margin: 0,
    },

    heroText: {
      marginTop: "10px",
      fontSize: "14px",
      lineHeight: 1.5,
      color: "#6f665f",
      maxWidth: "660px",
    },

    mainGrid: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.2fr) 470px",
      gap: "18px",
      alignItems: "start",
    },

    leftColumn: {
      display: "flex",
      flexDirection: "column",
      gap: "18px",
    },

    mapCard: {
      background: "#fffdf8",
      border: "1px solid #ddd5ca",
      borderRadius: "24px",
      padding: "16px",
      boxShadow: "0 14px 30px rgba(0,0,0,0.06)",
    },

    mapWrap: {
      height: "520px",
      borderRadius: "18px",
      overflow: "hidden",
      border: "1px solid #e2dbd2",
      background: "#f3eee6",
      position: "relative",
      cursor: "pointer",
    },

    mapButton: {
      position: "absolute",
      top: "14px",
      right: "14px",
      zIndex: 20,
      padding: "10px 14px",
      borderRadius: "999px",
      border: "1px solid #173d33",
      background: "#173d33",
      color: "#fff",
      fontWeight: "700",
      fontSize: "12px",
      cursor: "pointer",
      boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
    },

    previewViewport: {
      pointerEvents: "none",
      height: "100%",
      width: "100%",
      overflow: "hidden",
      position: "relative",
      borderRadius: "18px",
      zIndex: 0,
    },

    previewCanvas: {
      height: "100%",
      width: "100%",
    },

    mapOverlay: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(rgba(0,0,0,0.0), rgba(0,0,0,0.04))",
      borderRadius: "18px",
      pointerEvents: "none",
      zIndex: 1,
    },

    hintRow: {
      marginTop: "10px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    },

    hint: {
      fontSize: "12px",
      color: "#77706a",
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

    infoCard: {
      background: "#fffdf8",
      border: "1px solid #ddd5ca",
      borderRadius: "20px",
      padding: "20px",
      boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
    },

    cardEyebrow: {
      fontSize: "11px",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "#8a7b6d",
      fontWeight: "700",
      marginBottom: "10px",
    },

    cardTitle: {
      margin: "0 0 10px 0",
      fontSize: "22px",
      fontWeight: "800",
      color: "#1f3b2f",
      lineHeight: 1.15,
    },

    cardText: {
      margin: 0,
      fontSize: "14px",
      color: "#6f665f",
      lineHeight: 1.7,
    },

    sectionDivider: {
      marginTop: "18px",
      marginBottom: "10px",
      fontSize: "11px",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "#8a7b6d",
      fontWeight: "700",
    },

    chipsWrap: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginTop: "8px",
    },

    chip: {
      padding: "7px 11px",
      borderRadius: "999px",
      background: "#f1ede6",
      border: "1px solid #e3dbcf",
      fontSize: "12px",
      fontWeight: "700",
      color: "#3e3a36",
    },

    authCard: {
      background: "#fffdf8",
      border: "1px solid #ddd5ca",
      borderRadius: "20px",
      padding: "20px",
      boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
    },

    authGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "14px",
      marginTop: "8px",
    },

    authPanel: {
      border: "1px solid #e6ddd1",
      borderRadius: "16px",
      padding: "16px",
      background: "#fff",
    },

    authPanelTitle: {
      margin: "0 0 8px 0",
      fontSize: "16px",
      fontWeight: "800",
      color: "#1f3b2f",
    },

    authPanelText: {
      margin: 0,
      fontSize: "13px",
      color: "#6f665f",
      lineHeight: 1.6,
    },

    authButtons: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      marginTop: "14px",
    },

    featuredShell: {
      background: "#fffdf8",
      border: "1px solid #ddd5ca",
      borderRadius: "24px",
      padding: "16px",
      boxShadow: "0 14px 30px rgba(0,0,0,0.06)",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      minHeight: "100%",
    },

    featuredHeader: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      marginBottom: "2px",
    },

    featuredEyebrow: {
      fontSize: "11px",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "#8a7b6d",
      fontWeight: "700",
    },

    featuredTitle: {
      margin: 0,
      fontSize: "24px",
      fontWeight: "800",
      lineHeight: 1.1,
      color: "#1f3b2f",
    },

    featuredSubline: {
      margin: 0,
      fontSize: "12px",
      color: "#6f665f",
      lineHeight: 1.5,
    },

    featuredGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "10px",
    },

    featureCard: {
      border: "1px solid #e3dbcf",
      borderRadius: "16px",
      padding: "12px",
      background: "#fff",
      boxShadow: "0 8px 18px rgba(0,0,0,0.04)",
      minHeight: "120px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
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
      width: "32px",
      height: "32px",
      borderRadius: "10px",
      background: "#f1ede6",
      border: "1px solid #e3dbcf",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    },

    featureTop: {
      paddingRight: "40px",
    },

    featureTag: {
      fontSize: "9px",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "#8a7b6d",
      fontWeight: "700",
      marginBottom: "5px",
    },

    featureName: {
      margin: "0 0 4px 0",
      fontSize: "14px",
      fontWeight: "800",
      color: "#1f3b2f",
      lineHeight: 1.15,
    },

    featureSub: {
      margin: 0,
      fontSize: "11px",
      color: "#6f665f",
      fontWeight: "700",
      lineHeight: 1.3,
    },

    featureButtons: {
      display: "flex",
      gap: "6px",
      flexWrap: "wrap",
      marginTop: "10px",
    },

    miniPrimaryButton: {
      padding: "7px 12px",
      borderRadius: "999px",
      border: "1px solid #173d33",
      background: "#173d33",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "11px",
    },

    miniSecondaryButton: {
      padding: "7px 12px",
      borderRadius: "999px",
      border: "1px solid #d8d1c8",
      background: "#fffdf9",
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
              <button
                style={styles.button}
                onClick={() => navigate("/auth")}
              >
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
            <h1 style={styles.heroTitle}>Go right to the source.</h1>
            <div style={styles.heroText}>
              Open the map, see what is happening nearby, and tap straight into local
              businesses, booths, pop-ups, and live spots.
            </div>
          </div>
        </div>

        <div style={styles.mainGrid}>
          <div style={styles.leftColumn}>
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
                  Tap the map to explore what’s happening near you
                </div>

                <button
                  style={styles.tinyAction}
                  onClick={() => navigate("/map")}
                >
                  Open map page →
                </button>
              </div>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.cardEyebrow}>About the platform</div>
              <h2 style={styles.cardTitle}>What is Right to the Source?</h2>

              <p style={styles.cardText}>
                Right to the Source is built to help small businesses get seen and
                help buyers discover what is actually available around them. Instead
                of every seller trying to market alone, the platform brings local
                businesses together in one shared discovery system.
              </p>

              <div style={styles.sectionDivider}>What people can find here</div>

              <div style={styles.chipsWrap}>
                {findHereItems.map((item) => (
                  <div key={item} style={styles.chip}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.authCard}>
              <div style={styles.cardEyebrow}>Accounts and access</div>
              <h2 style={styles.cardTitle}>Follow sellers or list your business</h2>

              <div style={styles.authGrid}>
                <div style={styles.authPanel}>
                  <h3 style={styles.authPanelTitle}>Follow local sellers</h3>
                  <p style={styles.authPanelText}>
                    Create a free visitor profile to save the sellers you follow and
                    keep your My Finds list ready when you come back.
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
                  <h3 style={styles.authPanelTitle}>Own a business?</h3>
                  <p style={styles.authPanelText}>
                    Get listed so buyers nearby can find your products, live spots,
                    events, and business profile through the map and featured areas.
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
              <div style={styles.featuredEyebrow}>Location-based discovery</div>
              <h2 style={styles.featuredTitle}>Featured in this area</h2>
              <p style={styles.featuredSubline}>Updates as the map moves</p>
            </div>

            <div style={styles.featuredGrid}>
              {featuredItems.map((item) => (
                <div key={item.id} style={styles.featureCard}>
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