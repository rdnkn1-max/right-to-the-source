import React from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function HomeNEW() {
  const navigate = useNavigate();

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

  return (
    <div style={styles.page}>
      <style>{css}</style>

      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Live local discovery</div>
          <div style={styles.logo}>Right to the Source</div>
        </div>

        <nav style={styles.nav}>
          <button style={styles.navBtn} onClick={() => navigate("/my-sellers")}>
            My Finds
          </button>
          <button style={styles.navBtn} onClick={() => navigate("/auth")}>
            Visitor Login
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
          <div style={styles.heroTextBox}>
            <div style={styles.badge}>Launching locally</div>

            <h1 style={styles.title}>
              Local stuff you didn’t know you could get.
            </h1>

            <p style={styles.subtitle}>
              Farm fresh eggs, local beef, food trucks, pop-ups, and stuff you
              didn’t even know was around you — all happening right now.
            </p>

            <div style={styles.ctaRow}>
              <button style={styles.primaryLarge} onClick={() => navigate("/map")}>
                Explore What’s Nearby
              </button>
              <button
                style={styles.secondaryLarge}
                onClick={() => navigate("/list-your-business")}
              >
                List Your Business
              </button>
            </div>

            <p style={styles.micro}>
              📍 Fresh eggs down the road. Food trucks around the corner. Go
              right to the source.
            </p>
          </div>

          <div style={styles.mapCard} onClick={() => navigate("/map")}>
            <div style={styles.mapHeader}>
              <span>Live Local Map</span>
              <span style={styles.livePill}>🔥 Happening now</span>
            </div>

            <div style={styles.mapWrap}>
              <MapContainer
                center={[28.357, -80.65]}
                zoom={11}
                scrollWheelZoom={false}
                dragging={false}
                doubleClickZoom={false}
                zoomControl={false}
                attributionControl={false}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <CircleMarker
                  center={[28.357, -80.686]}
                  radius={10}
                  pathOptions={{
                    color: "#173d33",
                    fillColor: "#f6d365",
                    fillOpacity: 1,
                  }}
                >
                  <Popup>Fresh Eggs</Popup>
                </CircleMarker>

                <CircleMarker
                  center={[28.392, -80.608]}
                  radius={10}
                  pathOptions={{
                    color: "#173d33",
                    fillColor: "#ff5f45",
                    fillOpacity: 1,
                  }}
                >
                  <Popup>Food Truck Live</Popup>
                </CircleMarker>

                <CircleMarker
                  center={[28.321, -80.72]}
                  radius={10}
                  pathOptions={{
                    color: "#173d33",
                    fillColor: "#7bc89c",
                    fillOpacity: 1,
                  }}
                >
                  <Popup>Local Honey</Popup>
                </CircleMarker>
              </MapContainer>

              <div style={styles.mapFloat}>Tap to explore nearby sellers →</div>
            </div>

            <div style={styles.mapStats}>
              <span>📍 Sellers nearby</span>
              <span>🔴 Live now</span>
            </div>
          </div>
        </section>

        <section className="cards" style={styles.cards}>
          <div style={styles.card}>
            <div style={styles.icon}>🧭</div>
            <h3>Discover what’s nearby</h3>
            <p>
              See what’s happening around you right now — markets, pop-ups, food,
              and more.
            </p>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>🔥</div>
            <h3>Find hidden gems</h3>
            <p>
              Fresh eggs, local beef, handmade goods, food trucks — stuff you
              won’t find online.
            </p>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>🤝</div>
            <h3>Go direct</h3>
            <p>
              No checkout. No shipping. No middleman. Just connect straight with
              the seller.
            </p>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.eyebrow}>What you can find</div>
          <h2>Most of the best local stuff isn’t online.</h2>
          <p>
            Small businesses don’t have big marketing budgets — so people never
            find them. Right to the Source changes that.
          </p>

          <div style={styles.chips}>
            {categories.map((item) => (
              <span key={item} style={styles.chip}>
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="split" style={styles.split}>
          <div style={styles.panel}>
            <div style={styles.eyebrow}>For shoppers</div>
            <h2>See what’s actually available nearby.</h2>
            <p>
              Looking for farm fresh eggs, honey, food trucks, fresh seafood,
              markets, or local brands? Open the map and discover what’s around
              you.
            </p>
            <button style={styles.primaryLarge} onClick={() => navigate("/map")}>
              Explore the Map
            </button>
          </div>

          <div style={styles.panelDark}>
            <div style={styles.eyebrowLight}>For sellers</div>
            <h2>Get found by people already near you.</h2>
            <p style={styles.darkText}>
              No ads. No algorithms. Just real customers looking for what you
              sell.
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
    background: "#f6f1e8",
    padding: "22px",
    fontFamily: "Arial, sans-serif",
    color: "#173d33",
  },
  header: {
    maxWidth: 1180,
    margin: "0 auto 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
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
    color: "rgba(255,255,255,0.7)",
    fontWeight: 900,
  },
  logo: { fontSize: 22, fontWeight: 900 },
  nav: { display: "flex", gap: 10, flexWrap: "wrap" },
  navBtn: {
    border: "1px solid #ddd5ca",
    background: "#fffdf8",
    borderRadius: 999,
    padding: "9px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  primaryBtn: {
    border: 0,
    background: "#173d33",
    color: "#fff",
    borderRadius: 999,
    padding: "10px 16px",
    fontWeight: 900,
    cursor: "pointer",
  },
  hero: {
    maxWidth: 1180,
    margin: "0 auto 28px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 28,
    alignItems: "center",
  },
  heroTextBox: {
    background: "#fffdf8",
    border: "1px solid #ddd5ca",
    borderRadius: 30,
    padding: 34,
    boxShadow: "0 18px 42px rgba(0,0,0,.07)",
  },
  badge: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "#8a7b6d",
    fontWeight: 900,
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: "clamp(38px, 5.5vw, 68px)",
    lineHeight: 0.95,
    letterSpacing: "-0.06em",
    fontWeight: 950,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 1.5,
    color: "#665f58",
    marginTop: 18,
  },
  ctaRow: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 },
  primaryLarge: {
    border: 0,
    background: "#173d33",
    color: "#fff",
    borderRadius: 999,
    padding: "13px 20px",
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryLarge: {
    border: "1px solid #ddd5ca",
    background: "#fff",
    color: "#173d33",
    borderRadius: 999,
    padding: "13px 20px",
    fontWeight: 900,
    cursor: "pointer",
  },
  micro: {
    fontSize: 13,
    color: "#8a7b6d",
    fontWeight: 800,
    marginTop: 14,
  },
  mapCard: {
    background: "#173d33",
    color: "#fff",
    borderRadius: 30,
    padding: 16,
    boxShadow: "0 22px 50px rgba(23,61,51,.22)",
    cursor: "pointer",
  },
  mapHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 900,
    marginBottom: 12,
  },
  livePill: {
    background: "#2f6f5e",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 11,
  },
  mapWrap: {
    height: 330,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
    border: "1px solid rgba(255,255,255,.2)",
  },
  mapFloat: {
    position: "absolute",
    left: 14,
    bottom: 14,
    background: "#fffdf8",
    color: "#173d33",
    borderRadius: 999,
    padding: "9px 13px",
    fontSize: 12,
    fontWeight: 900,
    boxShadow: "0 10px 20px rgba(0,0,0,.18)",
  },
  mapStats: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 12,
    fontSize: 13,
    fontWeight: 800,
  },
  cards: {
    maxWidth: 1180,
    margin: "0 auto 28px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  card: {
    background: "#fffdf8",
    border: "1px solid #ddd5ca",
    borderRadius: 22,
    padding: 22,
    boxShadow: "0 12px 30px rgba(0,0,0,.05)",
  },
  icon: { fontSize: 28, marginBottom: 12 },
  section: {
    maxWidth: 1180,
    margin: "0 auto 28px",
    background: "#fffdf8",
    border: "1px solid #ddd5ca",
    borderRadius: 28,
    padding: 28,
  },
  chips: { display: "flex", flexWrap: "wrap", gap: 9, marginTop: 18 },
  chip: {
    padding: "9px 13px",
    borderRadius: 999,
    background: "#f1ede6",
    border: "1px solid #e3dbcf",
    fontWeight: 850,
    fontSize: 13,
  },
  split: {
    maxWidth: 1180,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  panel: {
    background: "#fffdf8",
    border: "1px solid #ddd5ca",
    borderRadius: 28,
    padding: 30,
  },
  panelDark: {
    background: "#173d33",
    color: "#fff",
    borderRadius: 28,
    padding: 30,
  },
  darkText: {
    color: "rgba(255,255,255,0.78)",
  },
  whiteBtn: {
    border: 0,
    background: "#fff",
    color: "#173d33",
    borderRadius: 999,
    padding: "13px 20px",
    fontWeight: 900,
    cursor: "pointer",
  },
};

const css = `
  h2 {
    font-size: 30px;
    margin: 8px 0 10px;
    letter-spacing: -0.04em;
  }

  h3 {
    margin: 0 0 8px;
  }

  p {
    line-height: 1.6;
    color: #665f58;
  }

  .leaflet-container {
    font-family: Arial, sans-serif;
  }

  button {
    transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
  }

  button:hover {
    transform: translateY(-1px);
    opacity: .94;
  }

  @media (max-width: 850px) {
    .hero, .cards, .split {
      grid-template-columns: 1fr !important;
    }
  }
`;