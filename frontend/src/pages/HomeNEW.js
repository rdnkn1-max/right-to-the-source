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
              Farm fresh eggs, local beef, food trucks, pop-ups — the kind of
              stuff you usually only find if you hear about it. Now you don’t
              have to — it’s all happening around you.
            </p>

            <div style={styles.ctaRow}>
              <button style={styles.primaryLarge} onClick={() => navigate("/map")}>
                Explore What’s Nearby →
              </button>
              <button
                style={styles.secondaryLarge}
                onClick={() => navigate("/list-your-business")}
              >
                Get Found Locally
              </button>
            </div>

            <p style={styles.micro}>
              No searching. No guessing. Just what’s around you.
            </p>
          </div>

          <div style={styles.mapCard} onClick={() => navigate("/map")}>
            <div style={styles.mapHeader}>
              <div>
                <div>Live Local Map</div>
                <div style={styles.mapSubline}>Live updates from local sellers</div>
              </div>
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

              <div style={styles.mapFade} />
              <div style={styles.mapFloat}>Open the live map →</div>
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
              See what’s actually happening around you — not just what shows up
              online.
            </p>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>🔥</div>
            <h3>Find hidden gems</h3>
            <p>
              From roadside stands to pop-ups — the stuff you don’t find on big
              apps.
            </p>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>🤝</div>
            <h3>Go direct</h3>
            <p>
              No checkout. No middleman. Just go straight to the seller.
            </p>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.eyebrow}>What you can find</div>
          <h2>Most of the best local stuff isn’t online.</h2>
          <p>
            Most small businesses don’t have big marketing budgets — so people
            never find them. Right to the Source changes that.
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
              you. Not just listings — real things you can go get right now.
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
              sell. Show up where people are already looking.
            </p>
            <p style={styles.sellerSupportText}>
              Running ads alone is hard.
              <br />
              When local businesses promote together, everyone gets seen.
              <br />
              Your subscription helps power visibility in your area — including
              yours.
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
    fontFamily: "Arial, sans-serif",
    color: "#173d33",
  },
  header: {
    maxWidth: 1220,
    margin: "0 auto 38px",
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
    color: "rgba(255,255,255,0.7)",
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
    margin: "0 auto 32px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 32,
    alignItems: "center",
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
  },
  mapHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 900,
    marginBottom: 14,
    fontSize: 14,
  },
  livePill: {
    background: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    padding: "7px 11px",
    fontSize: 11,
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 8px 20px rgba(0,0,0,.12)",
  },
  mapSubline: {
    fontSize: 12,
    color: "rgba(255,255,255,0.74)",
    fontWeight: 700,
    marginTop: 4,
  },
  mapWrap: {
    height: 330,
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
  darkText: {
    color: "rgba(255,255,255,0.8)",
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
  h2 {
    font-size: clamp(28px, 3vw, 32px);
    margin: 8px 0 12px;
    letter-spacing: -0.045em;
    color: #112a22;
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

  .leaflet-container {
    font-family: Arial, sans-serif;
  }

  button {
    transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
  }

  button:hover {
    transform: translateY(-2px);
    opacity: .96;
  }

  @media (max-width: 850px) {
    .hero, .cards, .split {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }

    .hero {
      margin-bottom: 24px !important;
    }

    .hero button,
    .split button {
      width: 100%;
    }
  }
`;