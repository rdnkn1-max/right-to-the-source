import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TransitionOverlay from "../components/TransitionOverlay";
import MapView from "./MapView";
import { supabase } from "../supabaseClient";

const CATEGORY_ROUTE_KEYS = {
  "Fresh Eggs": "fresh_eggs",
  "Food Trucks": "food_truck",
  "Farm Stands": "farm_stand",
  Honey: "honey",
  Produce: "produce",
  Seafood: "seafood",
  "Local Beef": "beef",
  Markets: "market",
  "Pop-Ups": "popup",
  Apparel: "apparel",
};

function milesBetween(lat1, lng1, lat2, lng2) {
  if (
    lat1 == null ||
    lng1 == null ||
    lat2 == null ||
    lng2 == null ||
    Number.isNaN(lat1) ||
    Number.isNaN(lng1) ||
    Number.isNaN(lat2) ||
    Number.isNaN(lng2)
  ) {
    return null;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getCategoryEmoji(category) {
  const cat = `${category || ""}`.toLowerCase();

  if (cat.includes("apparel") || cat.includes("clothing") || cat.includes("hat")) {
    return "🧢";
  }
  if (cat.includes("egg")) return "🥚";
  if (cat.includes("dairy") || cat.includes("milk")) return "🥛";
  if (cat.includes("butter")) return "🧈";
  if (cat.includes("goat")) return "🐐";
  if (cat.includes("beef")) return "🥩";
  if (cat.includes("chicken")) return "🐔";
  if (cat.includes("produce")) return "🥬";
  if (cat.includes("honey")) return "🍯";
  if (cat.includes("baked")) return "🍞";
  if (cat.includes("farm")) return "🏡";
  if (cat.includes("seafood")) return "🦐";
  if (cat.includes("market")) return "🌾";
  return "📍";
}

export default function HomeNEW() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [transitionState, setTransitionState] = useState({
    visible: false,
    categoryKey: "",
    categoryLabel: "",
  });

  const categories = [
    "Fresh Eggs",
    "Food Trucks",
    "Farm Stands",
    "Honey",
    "Produce",
    "Seafood",
    "Local Beef",
    "Markets",
    "Pop-Ups",
    "Apparel",
  ];

  useEffect(() => {
    loadBusinesses();

    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 120000,
      }
    );
  }, []);

  async function loadBusinesses() {
    try {
      setLoadingNearby(true);

      const { data, error } = await supabase
        .from("businesses")
        .select("id, business_name, category, description, image_url, location, latitude, longitude")
        .eq("status", "approved")
        .order("business_name", { ascending: true })
        .limit(12);

      if (error) throw error;

      const normalized = (data || []).map((business) => ({
        ...business,
        latitude:
          business.latitude != null && Number.isFinite(Number(business.latitude))
            ? Number(business.latitude)
            : null,
        longitude:
          business.longitude != null && Number.isFinite(Number(business.longitude))
            ? Number(business.longitude)
            : null,
      }));

      setBusinesses(normalized);
    } catch (error) {
      console.error("Error loading home businesses:", error);
      setBusinesses([]);
    } finally {
      setLoadingNearby(false);
    }
  }

  const nearbyNow = useMemo(() => {
    const ranked = businesses
      .map((business) => ({
        ...business,
        distance:
          userLocation && business.latitude != null && business.longitude != null
            ? milesBetween(
                userLocation.latitude,
                userLocation.longitude,
                business.latitude,
                business.longitude
              )
            : null,
      }))
      .sort((a, b) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });

    return ranked.slice(0, 5);
  }, [businesses, userLocation]);

  const featuredBusiness = nearbyNow[0] || null;
  const remainingNearby = nearbyNow.slice(1, 5);

  function openBusinessOnMap(business) {
    if (
      business?.latitude == null ||
      business?.longitude == null ||
      !Number.isFinite(Number(business.latitude)) ||
      !Number.isFinite(Number(business.longitude))
    ) {
      navigate("/map");
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

  function triggerPlaceholderSound(soundKey) {
    window.dispatchEvent(
      new CustomEvent("right-to-the-source:transition-sound", {
        detail: { soundKey },
      })
    );
  }

  function handleCategoryDiscovery(categoryLabel) {
    const categoryKey = CATEGORY_ROUTE_KEYS[categoryLabel] || "";

    setTransitionState({
      visible: true,
      categoryKey,
      categoryLabel,
    });
  }

  function handleTransitionComplete() {
    const nextState = transitionState;

    setTransitionState({
      visible: false,
      categoryKey: "",
      categoryLabel: "",
    });

    navigate("/map", {
      state: {
        selectedCategoryKey: nextState.categoryKey || null,
        selectedCategoryLabel: nextState.categoryLabel || null,
      },
    });
  }

  return (
    <div style={styles.page}>
      <style>{css}</style>
      <TransitionOverlay
        visible={transitionState.visible}
        label={`Opening ${transitionState.categoryLabel || "nearby"}`}
        soundKey="category-hop"
        onTriggerSound={triggerPlaceholderSound}
        onComplete={handleTransitionComplete}
      />

      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Live local discovery</div>
          <div style={styles.logo}>Right to the Source</div>
        </div>

        <nav style={styles.nav}>
          <button style={styles.navBtn} onClick={() => navigate("/my-finds")}>
            My Finds
          </button>
          <button style={styles.navBtn} onClick={() => navigate("/auth")}>
            Profile
          </button>
          <button style={styles.navBtn} onClick={() => navigate("/seller-auth")}>
            Seller Login
          </button>
          <button
            style={styles.primaryBtn}
            onClick={() => navigate("/list-your-business")}
          >
            List Your Business
          </button>
        </nav>
      </header>

      <main>
        <section className="hero" style={styles.hero}>
          <div className="app-animate-card" style={styles.heroTextBox}>
            <div style={styles.badge}>Launching locally</div>

            <h1 style={styles.title}>Find what’s nearby right now.</h1>

            <p style={styles.subtitle}>
              Fresh eggs, local beef, food trucks, pop-ups, markets, and hidden gems
              you usually only find by word of mouth. Now the map brings it all
              together.
            </p>

            <div style={styles.ctaRow}>
              <button style={styles.primaryLarge} onClick={() => navigate("/map")}>
                Open Full Map
              </button>
              <button
                style={styles.secondaryLarge}
                onClick={() => navigate("/list-your-business")}
              >
                Get Found Locally
              </button>
            </div>

            <div style={styles.heroStats}>
              <div style={styles.heroStatCard}>
                <span style={styles.heroStatNumber}>{businesses.length || "—"}</span>
                <span style={styles.heroStatLabel}>Approved sellers</span>
              </div>
              <div style={styles.heroStatCard}>
                <span style={styles.heroStatNumber}>{nearbyNow.length || "—"}</span>
                <span style={styles.heroStatLabel}>Nearby to explore</span>
              </div>
            </div>

            <p style={styles.micro}>No searching. No guessing. Just what’s around you.</p>
          </div>

          <div className="app-animate-card app-animate-card--delay-1 homepage-map-card" style={styles.mapCard} onClick={() => navigate("/map")}>
            <div style={styles.mapHeader}>
              <div>
                <div>Live Discovery Map</div>
                <div style={styles.mapSubline}>The map is the main experience</div>
              </div>
              <span style={styles.livePill}>📍 Open nearby</span>
            </div>

            <div style={styles.mapWrap}>
              <MapView homepagePreview />
              <div style={styles.mapFade} />
              <div style={styles.mapFloat}>Open the full map</div>
            </div>

            <div style={styles.mapStats}>
              <span>🧭 Browse live + nearby</span>
              <span>⚡ Fast map-first flow</span>
            </div>
          </div>
        </section>

        <section style={styles.nearbySection}>
          <div style={styles.sectionHeaderRow}>
            <div>
              <div style={styles.eyebrow}>Nearby now</div>
              <h2 style={styles.sectionTitle}>Start with the featured pick</h2>
            </div>

            <button style={styles.primaryLarge} onClick={() => navigate("/map")}>
              Open Full Map
            </button>
          </div>

          <p style={styles.sectionCopy}>
            Lead with the featured seller, then keep scrolling for more nearby spots worth checking.
          </p>

          {loadingNearby ? (
            <div style={styles.featuredSkeletonCard} />
          ) : featuredBusiness ? (
            <div className="featured-hook-card app-animate-card app-animate-card--delay-1" style={styles.featuredHookCard}>
              <div style={styles.featuredHookLeft}>
                <div style={styles.featuredBadge}>⭐ Featured Seller</div>

                <div style={styles.featuredIdentityRow}>
                  <div style={styles.featuredEmojiWrap}>
                    {getCategoryEmoji(featuredBusiness.category)}
                  </div>

                  <div style={styles.featuredTitleWrap}>
                    <h3 className="featured-title" style={styles.featuredTitle}>
                      {featuredBusiness.business_name || "Featured seller"}
                    </h3>
                    <p style={styles.featuredSubline}>
                      {featuredBusiness.category || "Local business"}
                    </p>
                  </div>
                </div>

                <p style={styles.featuredDescription}>
                  {featuredBusiness.description ||
                    featuredBusiness.location ||
                    "Open this featured seller on the map and discover what’s happening nearby."}
                </p>

                <div style={styles.featuredMetaRow}>
                  <span style={styles.featuredMetaPill}>
                    {featuredBusiness.distance != null
                      ? `${featuredBusiness.distance.toFixed(1)} mi away`
                      : "Featured placement"}
                  </span>
                  <span style={styles.featuredMetaPill}>
                    {featuredBusiness.location || "Location coming soon"}
                  </span>
                </div>

                <div className="featured-action-row" style={styles.featuredActionRow}>
                  <button
                    style={styles.featuredPrimaryButton}
                    onClick={() => openBusinessOnMap(featuredBusiness)}
                  >
                    View on Map
                  </button>
                  <button
                    style={styles.featuredSecondaryButton}
                    onClick={() => navigate(`/seller-profile/${featuredBusiness.id}`)}
                  >
                    Open Seller
                  </button>
                  <button
                    style={styles.featuredGhostButton}
                    onClick={() => navigate("/map")}
                  >
                    Open Full Map
                  </button>
                </div>
              </div>

              <div className="featured-hook-right" style={styles.featuredHookRight}>
                <div className="featured-map-callout" style={styles.featuredMapCallout}>
                  <div style={styles.featuredMapEyebrow}>Map-first discovery</div>
                  <div style={styles.featuredMapTitle}>Use this seller as your jumping-off point.</div>
                  <p style={styles.featuredMapText}>
                    Start here, then fan out across the map to see who else is nearby.
                  </p>
                  <button
                    style={styles.featuredMapButton}
                    onClick={() => openBusinessOnMap(featuredBusiness)}
                  >
                    Open Nearby View
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="app-animate-card app-animate-card--delay-1" style={styles.emptyNearbyCard}>
              Local sellers will show up here as they’re added. In the meantime,
              jump into the full map and explore the live discovery view.
            </div>
          )}

          <div style={styles.nearbyGrid}>
            {loadingNearby ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} style={styles.skeletonCard} />
              ))
            ) : remainingNearby.length === 0 ? null : (
              remainingNearby.map((business) => (
                <div key={business.id} className="app-animate-card app-animate-card--delay-2" style={styles.nearbyCard}>
                  <div style={styles.nearbyCardTop}>
                    <div style={styles.nearbyIconWrap}>{getCategoryEmoji(business.category)}</div>
                    <div style={styles.nearbyTitleWrap}>
                      <div style={styles.nearbyTitle}>{business.business_name || "Local seller"}</div>
                      <div style={styles.nearbySubline}>{business.category || "Local business"}</div>
                    </div>
                    <div style={styles.nearbyDistance}>
                      {business.distance != null ? `${business.distance.toFixed(1)} mi` : "Nearby"}
                    </div>
                  </div>

                  <p style={styles.nearbyDescription}>
                    {business.description ||
                      business.location ||
                      "Tap through to see this seller on the map and discover what’s nearby."}
                  </p>

                  <div style={styles.nearbyMetaRow}>
                    <span style={styles.metaPill}>{business.location || "Location coming soon"}</span>
                    <span style={styles.metaPill}>{business.category || "Local"}</span>
                  </div>

                  <div style={styles.nearbyActionRow}>
                    <button style={styles.primaryMiniButton} onClick={() => openBusinessOnMap(business)}>
                      View on Map
                    </button>
                    <button
                      style={styles.secondaryMiniButton}
                      onClick={() => navigate(`/seller-profile/${business.id}`)}
                    >
                      Open Seller
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="cards" style={styles.cards}>
          <div className="app-animate-card app-animate-card--delay-1" style={styles.card}>
            <div style={styles.icon}>🧭</div>
            <h3>Discover what’s nearby</h3>
            <p>See what’s actually happening around you — not just what shows up online.</p>
          </div>

          <div className="app-animate-card app-animate-card--delay-2" style={styles.card}>
            <div style={styles.icon}>🔥</div>
            <h3>Find hidden gems</h3>
            <p>From roadside stands to pop-ups — the stuff you don’t find on big apps.</p>
          </div>

          <div className="app-animate-card app-animate-card--delay-3" style={styles.card}>
            <div style={styles.icon}>🤝</div>
            <h3>Go direct</h3>
            <p>No checkout. No middleman. Just go straight to the seller.</p>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.eyebrow}>What you can find</div>
          <h2 style={styles.sectionTitle}>Most of the best local stuff isn’t online.</h2>
          <p style={styles.sectionCopy}>
            Most small businesses don’t have big marketing budgets — so people never
            find them. Right to the Source changes that.
          </p>

          <div style={styles.chips}>
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className="home-category-chip app-pressable"
                style={styles.chip}
                onClick={() => handleCategoryDiscovery(item)}
              >
                <span style={styles.chipEmoji}>{getCategoryEmoji(item)}</span>
                <span>{item}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="split" style={styles.split}>
          <div style={styles.panel}>
            <div style={styles.eyebrow}>For shoppers</div>
            <h2 style={styles.sectionTitle}>See what’s actually available nearby.</h2>
            <p style={styles.sectionCopy}>
              Looking for farm fresh eggs, honey, food trucks, fresh seafood,
              markets, or local brands? Open the map and discover what’s around you.
              Not just listings — real things you can go get right now.
            </p>
            <button style={styles.primaryLarge} onClick={() => navigate("/map")}>
              Open Full Map
            </button>
          </div>

          <div style={styles.panelDark}>
            <div style={styles.eyebrowLight}>For sellers</div>
            <h2 style={styles.panelDarkTitle}>Get found by people already near you.</h2>
            <p style={styles.darkText}>
              No ads. No algorithms. Just real customers looking for what you sell.
              Show up where people are already looking.
            </p>
            <p style={styles.sellerSupportText}>
              Running ads alone is hard.
              <br />
              When local businesses promote together, everyone gets seen.
              <br />
              Your subscription helps power visibility in your area — including yours.
            </p>
            <button
              style={styles.whiteBtn}
              onClick={() => navigate("/list-your-business")}
            >
              Apply to List
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #faf5ec 0%, #f3ebdf 45%, #ece2d4 100%)",
    padding: "clamp(18px, 2.5vw, 28px)",
    paddingBottom: "clamp(28px, 4vw, 46px)",
    fontFamily: "Arial, sans-serif",
    color: "#173d33",
  },
  header: {
    maxWidth: 1220,
    margin: "0 auto 34px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "#8a7b6d",
    fontWeight: 900,
  },
  eyebrowLight: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "rgba(255,255,255,0.72)",
    fontWeight: 900,
  },
  logo: { fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em" },
  nav: { display: "flex", gap: 12, flexWrap: "wrap" },
  navBtn: {
    border: "1px solid rgba(125, 108, 90, 0.18)",
    background: "rgba(255,253,248,0.9)",
    borderRadius: 999,
    padding: "10px 15px",
    fontWeight: 800,
    color: "#24473b",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(70, 51, 35, 0.05)",
  },
  primaryBtn: {
    border: "1px solid #173d33",
    background: "linear-gradient(135deg, #173d33 0%, #224e42 100%)",
    color: "#fff",
    borderRadius: 999,
    padding: "11px 17px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(23,61,51,.18)",
  },
  hero: {
    maxWidth: 1220,
    margin: "0 auto 18px",
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: 28,
    alignItems: "stretch",
  },
  heroTextBox: {
    background: "linear-gradient(180deg, rgba(255,253,248,0.98) 0%, rgba(250,244,235,0.96) 100%)",
    border: "1px solid rgba(125, 108, 90, 0.16)",
    borderRadius: 32,
    padding: "clamp(28px, 4vw, 40px)",
    boxShadow: "0 24px 54px rgba(40,30,20,.08)",
  },
  badge: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "#8a7b6d",
    fontWeight: 900,
    marginBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: "clamp(40px, 5.5vw, 70px)",
    lineHeight: 0.94,
    letterSpacing: "-0.065em",
    fontWeight: 950,
    color: "#102a21",
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 1.65,
    color: "#665f58",
    marginTop: 20,
    maxWidth: 620,
  },
  ctaRow: { display: "flex", gap: 14, flexWrap: "wrap", marginTop: 28 },
  primaryLarge: {
    border: "1px solid #173d33",
    background: "linear-gradient(135deg, #173d33 0%, #224e42 100%)",
    color: "#fff",
    borderRadius: 999,
    padding: "14px 22px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 16px 30px rgba(23,61,51,.18)",
  },
  secondaryLarge: {
    border: "1px solid rgba(125, 108, 90, 0.18)",
    background: "rgba(255,255,255,0.88)",
    color: "#173d33",
    borderRadius: 999,
    padding: "14px 22px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(70, 51, 35, 0.05)",
  },
  heroStats: {
    marginTop: 24,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  heroStatCard: {
    minWidth: 148,
    padding: "14px 16px",
    borderRadius: 22,
    background: "rgba(255,255,255,0.78)",
    border: "1px solid rgba(125, 108, 90, 0.16)",
    boxShadow: "0 12px 24px rgba(70, 51, 35, 0.05)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  heroStatNumber: {
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    color: "#102a21",
  },
  heroStatLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#75695f",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  micro: {
    fontSize: 13,
    color: "#7d7065",
    fontWeight: 800,
    marginTop: 16,
    lineHeight: 1.6,
  },
  mapCard: {
    background: "linear-gradient(180deg, #173d33 0%, #1f4b40 100%)",
    color: "#fff",
    borderRadius: 32,
    padding: 18,
    boxShadow: "0 24px 54px rgba(23,61,51,.22)",
    border: "1px solid rgba(255,255,255,.08)",
    cursor: "pointer",
    minHeight: 520,
    display: "flex",
    flexDirection: "column",
  },
  mapHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 900,
    marginBottom: 14,
    fontSize: 14,
    gap: 12,
  },
  livePill: {
    background: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    padding: "7px 11px",
    fontSize: 11,
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 8px 20px rgba(0,0,0,.12)",
    whiteSpace: "nowrap",
  },
  mapSubline: {
    fontSize: 12,
    color: "rgba(255,255,255,0.74)",
    fontWeight: 700,
    marginTop: 4,
  },
  mapWrap: {
    flex: 1,
    minHeight: 340,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    border: "1px solid rgba(255,255,255,.2)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.08)",
  },
  mapFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 96,
    background: "linear-gradient(180deg, rgba(12,27,22,0) 0%, rgba(12,27,22,0.52) 100%)",
    pointerEvents: "none",
    zIndex: 9998,
  },
  mapFloat: {
    position: "absolute",
    left: "50%",
    bottom: 22,
    transform: "translateX(-50%)",
    background: "rgba(255,253,248,0.98)",
    color: "#173d33",
    borderRadius: 999,
    padding: "12px 22px",
    fontSize: 15,
    fontWeight: 700,
    boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
    border: "1px solid rgba(0,0,0,0.08)",
    zIndex: 9999,
    pointerEvents: "none",
    whiteSpace: "nowrap",
  },
  mapStats: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 14,
    fontSize: 13,
    fontWeight: 800,
    color: "rgba(255,255,255,.84)",
    gap: 12,
    flexWrap: "wrap",
  },
  nearbySection: {
    maxWidth: 1220,
    margin: "0 auto 30px",
    background: "linear-gradient(180deg, rgba(255,253,248,0.98) 0%, rgba(250,244,235,0.94) 100%)",
    border: "1px solid rgba(125, 108, 90, 0.14)",
    borderRadius: 30,
    padding: 28,
    boxShadow: "0 18px 36px rgba(0,0,0,.04)",
  },
  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  sectionTitle: {
    margin: "8px 0 12px",
    fontSize: "clamp(28px, 3vw, 32px)",
    letterSpacing: "-0.045em",
    color: "#112a22",
  },
  sectionCopy: {
    lineHeight: 1.68,
    color: "#665f58",
    marginTop: 0,
  },
  featuredHookCard: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.25fr) minmax(280px, 0.75fr)",
    gap: 20,
    marginTop: 20,
    marginBottom: 18,
    padding: 22,
    borderRadius: 30,
    background: "linear-gradient(135deg, rgba(23,61,51,0.98) 0%, rgba(36,78,66,0.94) 55%, rgba(246,211,101,0.34) 100%)",
    border: "1px solid rgba(23,61,51,0.08)",
    boxShadow: "0 24px 54px rgba(23,61,51,0.18)",
    color: "#fff",
    overflow: "hidden",
    position: "relative",
    alignItems: "start",
  },
  featuredHookLeft: {
    position: "relative",
    zIndex: 1,
  },
  featuredHookRight: {
    display: "flex",
    alignItems: "flex-start",
  },
  featuredBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 14px",
    borderRadius: 999,
    background: "linear-gradient(135deg, #f6d365 0%, #f8e08b 100%)",
    color: "#173d33",
    fontWeight: 900,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    boxShadow: "0 12px 28px rgba(10,16,13,0.16)",
  },
  featuredIdentityRow: {
    display: "flex",
    gap: 16,
    alignItems: "center",
    marginTop: 18,
  },
  featuredEmojiWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 34,
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
    flexShrink: 0,
  },
  featuredTitleWrap: {
    minWidth: 0,
  },
  featuredTitle: {
    margin: 0,
    fontSize: "clamp(28px, 4vw, 42px)",
    lineHeight: 0.98,
    letterSpacing: "-0.05em",
    color: "#fff",
  },
  featuredSubline: {
    margin: "8px 0 0",
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    fontWeight: 700,
  },
  featuredDescription: {
    margin: "18px 0 0",
    maxWidth: 620,
    fontSize: 16,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.86)",
  },
  featuredMetaRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 18,
  },
  featuredMetaPill: {
    borderRadius: 999,
    padding: "9px 12px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 12,
  },
  featuredActionRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 22,
  },
  featuredPrimaryButton: {
    border: "none",
    background: "#fff",
    color: "#173d33",
    borderRadius: 999,
    padding: "14px 18px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(10,16,13,0.18)",
  },
  featuredSecondaryButton: {
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: 999,
    padding: "14px 18px",
    fontWeight: 800,
    cursor: "pointer",
  },
  featuredGhostButton: {
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "#fff",
    borderRadius: 999,
    padding: "14px 18px",
    fontWeight: 800,
    cursor: "pointer",
  },
  featuredMapCallout: {
    width: "100%",
    borderRadius: 24,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.16)",
    padding: 20,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  featuredMapEyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "rgba(255,255,255,0.74)",
    fontWeight: 800,
  },
  featuredMapTitle: {
    marginTop: 12,
    fontSize: 24,
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
  featuredMapText: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.65,
  },
  featuredMapButton: {
    alignSelf: "flex-start",
    marginTop: 18,
    border: "none",
    background: "linear-gradient(135deg, #f6d365 0%, #f8e08b 100%)",
    color: "#173d33",
    borderRadius: 999,
    padding: "13px 16px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(10,16,13,0.16)",
  },
  featuredSkeletonCard: {
    marginTop: 20,
    marginBottom: 18,
    minHeight: 260,
    borderRadius: 30,
    background: "linear-gradient(90deg, rgba(245,238,228,0.96) 25%, rgba(255,255,255,0.95) 50%, rgba(245,238,228,0.96) 75%)",
    backgroundSize: "200% 100%",
    animation: "homeShimmer 1.2s ease-in-out infinite",
    border: "1px solid rgba(125, 108, 90, 0.1)",
  },
  nearbyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginTop: 8,
  },
  nearbyCard: {
    background: "rgba(255,255,255,0.9)",
    borderRadius: 22,
    border: "1px solid rgba(125, 108, 90, 0.14)",
    padding: 16,
    boxShadow: "0 14px 28px rgba(70, 51, 35, 0.05)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  nearbyCardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  nearbyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#edf5ef",
    border: "1px solid #dbe6de",
    fontSize: 20,
    flexShrink: 0,
  },
  nearbyTitleWrap: { flex: 1, minWidth: 0 },
  nearbyTitle: {
    fontSize: 16,
    fontWeight: 900,
    lineHeight: 1.2,
    color: "#0f281f",
  },
  nearbySubline: {
    fontSize: 12,
    color: "#7c7067",
    marginTop: 4,
    fontWeight: 700,
  },
  nearbyDistance: {
    fontSize: 12,
    color: "#6d8076",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  nearbyDescription: {
    margin: 0,
    color: "#665f58",
    lineHeight: 1.58,
    fontSize: 14,
    minHeight: 66,
  },
  nearbyMetaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  metaPill: {
    borderRadius: 999,
    padding: "7px 10px",
    background: "#f2ece2",
    border: "1px solid #e3dbcf",
    color: "#675e56",
    fontSize: 12,
    fontWeight: 700,
  },
  nearbyActionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: "auto",
  },
  primaryMiniButton: {
    border: "1px solid #173d33",
    background: "linear-gradient(135deg, #173d33 0%, #224e42 100%)",
    color: "#fff",
    borderRadius: 999,
    padding: "11px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryMiniButton: {
    border: "1px solid rgba(125, 108, 90, 0.18)",
    background: "#fff",
    color: "#173d33",
    borderRadius: 999,
    padding: "11px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  skeletonCard: {
    borderRadius: 22,
    minHeight: 212,
    background: "linear-gradient(90deg, rgba(245,238,228,0.96) 25%, rgba(255,255,255,0.95) 50%, rgba(245,238,228,0.96) 75%)",
    backgroundSize: "200% 100%",
    animation: "homeShimmer 1.2s ease-in-out infinite",
    border: "1px solid rgba(125, 108, 90, 0.1)",
  },
  emptyNearbyCard: {
    gridColumn: "1 / -1",
    borderRadius: 24,
    background: "#fff",
    border: "1px solid rgba(125, 108, 90, 0.14)",
    padding: 22,
    color: "#665f58",
    lineHeight: 1.7,
  },
  cards: {
    maxWidth: 1220,
    margin: "0 auto 30px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 18,
  },
  card: {
    background: "linear-gradient(180deg, rgba(255,253,248,0.98) 0%, rgba(250,244,235,0.94) 100%)",
    border: "1px solid rgba(125, 108, 90, 0.14)",
    borderRadius: 24,
    padding: 26,
    boxShadow: "0 18px 36px rgba(0,0,0,.05)",
  },
  icon: { fontSize: 30, marginBottom: 14 },
  section: {
    maxWidth: 1220,
    margin: "0 auto 30px",
    background: "#fffdf8",
    border: "1px solid rgba(125, 108, 90, 0.14)",
    borderRadius: 30,
    padding: 32,
    boxShadow: "0 18px 36px rgba(0,0,0,.04)",
  },
  chips: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 },
  chip: {
    padding: "9px 13px",
    borderRadius: 999,
    background: "#f1ede6",
    border: "1px solid #e3dbcf",
    fontWeight: 850,
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    color: "#173d33",
    boxShadow: "0 8px 16px rgba(70, 51, 35, 0.04)",
  },
  chipEmoji: {
    fontSize: 15,
    lineHeight: 1,
  },
  split: {
    maxWidth: 1220,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 18,
  },
  panel: {
    background: "linear-gradient(180deg, rgba(255,253,248,0.98) 0%, rgba(250,244,235,0.94) 100%)",
    border: "1px solid rgba(125, 108, 90, 0.14)",
    borderRadius: 30,
    padding: 32,
    boxShadow: "0 18px 36px rgba(0,0,0,.04)",
  },
  panelDark: {
    background: "linear-gradient(180deg, #173d33 0%, #1f4b40 100%)",
    color: "#fff",
    borderRadius: 30,
    padding: 32,
    boxShadow: "0 24px 50px rgba(23,61,51,.2)",
  },
  panelDarkTitle: {
    margin: "8px 0 12px",
    fontSize: "clamp(28px, 3vw, 32px)",
    letterSpacing: "-0.045em",
    color: "#fff",
  },
  darkText: {
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.68,
  },
  sellerSupportText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.86)",
    lineHeight: 1.48,
    marginTop: 12,
  },
  whiteBtn: {
    border: 0,
    background: "#fff",
    color: "#173d33",
    borderRadius: 999,
    padding: "14px 22px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 12px 22px rgba(0,0,0,.12)",
  },
};

const css = `
  @keyframes homeShimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  h3 {
    margin: 0 0 10px;
    color: #0f281f;
    letter-spacing: -0.02em;
  }

  p {
    line-height: 1.68;
    color: #665f58;
  }

  button {
    transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
  }

  button:hover {
    transform: translateY(-2px);
    opacity: .96;
  }

  .home-category-chip {
    transition: transform var(--app-transition-fast) var(--app-ease),
      box-shadow var(--app-transition-fast) var(--app-ease),
      background-color var(--app-transition-fast) var(--app-ease),
      border-color var(--app-transition-fast) var(--app-ease);
  }

  .home-category-chip:hover {
    background: #fff7eb;
    border-color: #d9ccb8;
    box-shadow: 0 12px 24px rgba(70, 51, 35, 0.08);
  }

  .home-category-chip:active {
    transform: scale(0.97);
  }

  @media (max-width: 850px) {
    .hero, .cards, .split {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }

    .hero button,
    .split button {
      width: 100%;
    }
  }

  @media (max-width: 920px) {
    .hero, .cards, .split {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 767px) {
    .hero, .cards, .split {
      grid-template-columns: 1fr !important;
    }

    .featured-hook-card {
      transition: transform var(--app-transition-base) var(--app-ease),
        box-shadow var(--app-transition-base) var(--app-ease),
        filter var(--app-transition-base) var(--app-ease);
    }

    .featured-hook-card:active {
      transform: scale(0.992);
    }

    .homepage-map-card {
      transition: transform var(--app-transition-base) var(--app-ease),
        box-shadow var(--app-transition-base) var(--app-ease);
    }

    .homepage-map-card:active {
      transform: scale(0.992);
    }

    .featured-action-row button,
    .featured-map-callout button {
      transition: transform var(--app-transition-fast) var(--app-ease),
        box-shadow var(--app-transition-fast) var(--app-ease),
        opacity var(--app-transition-fast) var(--app-ease);
    }

    .featured-action-row button:active,
    .featured-map-callout button:active {
      transform: scale(0.98);
    }

    .featured-hook-card {
      grid-template-columns: 1fr !important;
      align-items: start !important;
      gap: 14px !important;
      padding: 18px !important;
    }

    .featured-hook-right {
      align-items: flex-start !important;
    }

    .featured-map-callout {
      width: 100% !important;
      min-height: 0 !important;
    }

    .featured-title {
      max-width: 100%;
    }

    .featured-action-row {
      gap: 10px !important;
    }

    .featured-action-row button {
      width: 100%;
    }
  }
`;
