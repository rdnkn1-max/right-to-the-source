import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import sellers from "../data/sellers";

function getDistanceMiles(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 3958.8;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function HomeNEW() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("loading");

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("granted");
      },
      () => {
        setLocationStatus("denied");
      }
    );
  }, []);

  const categories = [
    "All",
    "Apparel",
    "Pantry & Spreadables",
    "Poultry & Eggs",
    "Beef",
    "Fish & Seafood",
  ];

  const sellersWithDistance = useMemo(() => {
    return sellers.map((seller) => {
      if (!userLocation) {
        return { ...seller, distanceMiles: null };
      }

      return {
        ...seller,
        distanceMiles: getDistanceMiles(
          userLocation.lat,
          userLocation.lng,
          seller.lat,
          seller.lng
        ),
      };
    });
  }, [userLocation]);

  const sortedByDistance = useMemo(() => {
    const copied = [...sellersWithDistance];

    copied.sort((a, b) => {
      if (a.distanceMiles == null && b.distanceMiles == null) return 0;
      if (a.distanceMiles == null) return 1;
      if (b.distanceMiles == null) return -1;
      return a.distanceMiles - b.distanceMiles;
    });

    return copied;
  }, [sellersWithDistance]);

  const fallbackLocalMix = useMemo(() => {
    return sellers.slice(0, 6);
  }, []);

  const nearYouItems = useMemo(() => {
    if (locationStatus === "granted") {
      return sortedByDistance.slice(0, 6);
    }
    return fallbackLocalMix;
  }, [locationStatus, sortedByDistance, fallbackLocalMix]);

  const farmNearYouItems = useMemo(() => {
    if (locationStatus === "granted") {
      return sortedByDistance
        .filter((item) => item.category !== "Apparel")
        .slice(0, 6);
    }

    return sellers
      .filter((item) => item.category !== "Apparel")
      .slice(0, 6);
  }, [locationStatus, sortedByDistance]);

  const featuredItems = useMemo(() => {
    const source =
      activeCategory === "All"
        ? sellersWithDistance.filter((item) => item.category === "Apparel")
        : sellersWithDistance.filter((item) => item.category === activeCategory);

    const copied = [...source];

    copied.sort((a, b) => {
      if (a.distanceMiles == null && b.distanceMiles == null) return 0;
      if (a.distanceMiles == null) return 1;
      if (b.distanceMiles == null) return -1;
      return a.distanceMiles - b.distanceMiles;
    });

    return copied.slice(0, 6);
  }, [activeCategory, sellersWithDistance]);

  const locationLabel =
    locationStatus === "granted"
      ? "Fresh local finds showing closest to you right now."
      : "A fresh local mix to get you started.";

  const nearYouTitle =
    locationStatus === "granted" ? "📍 Great Near You" : "✨ Fresh Finds";

  const nearYouSubtitle =
    locationStatus === "granted"
      ? "Vendors closest to you right now."
      : "A local-feeling mix of vendors, farms, and goods to explore.";

  return (
    <div
      style={{
        background: "#f7f7f7",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        color: "#111",
      }}
    >
      <div
        style={{
          padding: "18px 40px",
          borderBottom: "1px solid #e5e5e5",
          background: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>The Source</h2>
        <button
          onClick={() => navigate("/map")}
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Open Map
        </button>
      </div>

      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #eee",
          padding: "14px 40px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 16px",
                borderRadius: "999px",
                border: "1px solid #ddd",
                background: activeCategory === cat ? "#111" : "#fff",
                color: activeCategory === cat ? "#fff" : "#111",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: "36px 40px 24px",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "28px",
          alignItems: "center",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 10px 0",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#666",
            }}
          >
            A map-first local marketplace
          </p>

          <h1 style={{ margin: "0 0 14px 0", fontSize: "46px", lineHeight: 1.05 }}>
            Find real local vendors near you
          </h1>

          <p
            style={{
              margin: "0 0 18px 0",
              color: "#666",
              fontSize: "18px",
              maxWidth: "600px",
            }}
          >
            The Source helps people discover farms, pantry goods, seafood, apparel,
            and other local businesses through a map-first marketplace built for
            real communities.
          </p>

          <p
            style={{
              margin: "0 0 24px 0",
              color: "#666",
              fontSize: "16px",
              maxWidth: "600px",
            }}
          >
            {locationLabel}
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/map")}
              style={{
                padding: "14px 20px",
                borderRadius: "12px",
                border: "none",
                background: "#111",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "15px",
              }}
            >
              See what’s near me
            </button>

            <button
              onClick={() => navigate("/map")}
              style={{
                padding: "14px 20px",
                borderRadius: "12px",
                border: "1px solid #ddd",
                background: "#fff",
                color: "#111",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "15px",
              }}
            >
              Open Map
            </button>
          </div>
        </div>

        <div
          onClick={() => navigate("/map")}
          style={{
            background: "#fff",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: "0 6px 20px rgba(0,0,0,0.10)",
            cursor: "pointer",
            border: "1px solid #e5e5e5",
          }}
        >
          <div
            style={{
              position: "relative",
              height: "320px",
              backgroundImage:
                "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.35), rgba(0,0,0,0.05))",
              }}
            />

            <div
              style={{
                position: "absolute",
                top: "22%",
                left: "22%",
                width: "16px",
                height: "16px",
                borderRadius: "999px",
                background: "#111",
                border: "3px solid #fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "45%",
                left: "48%",
                width: "16px",
                height: "16px",
                borderRadius: "999px",
                background: "#111",
                border: "3px solid #fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "62%",
                left: "68%",
                width: "16px",
                height: "16px",
                borderRadius: "999px",
                background: "#111",
                border: "3px solid #fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                left: "16px",
                right: "16px",
                background: "rgba(255,255,255,0.95)",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
            >
              <strong style={{ display: "block", marginBottom: "4px" }}>
                Tap to explore vendors near you
              </strong>
              <span style={{ color: "#666", fontSize: "14px" }}>
                Click anywhere on this map preview to open the full map
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 40px 30px" }}>
        <h2 style={{ marginBottom: "8px" }}>{nearYouTitle}</h2>
        <p style={{ marginTop: 0, color: "#666" }}>{nearYouSubtitle}</p>

        <div style={{ display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "10px" }}>
          {nearYouItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/seller/${item.id}`)}
              style={{
                minWidth: "220px",
                cursor: "pointer",
                background: "#fff",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ padding: "12px" }}>
                <strong>{item.name}</strong>
                <p style={{ margin: "6px 0 0", color: "#666" }}>
                  {item.city}, {item.state}
                </p>
                <p style={{ margin: "6px 0 0", color: "#999", fontSize: "12px" }}>
                  {item.category}
                </p>
                {locationStatus === "granted" && item.distanceMiles != null && (
                  <p style={{ margin: "6px 0 0", color: "#999", fontSize: "12px" }}>
                    {Math.round(item.distanceMiles)} miles away
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 40px 30px" }}>
        <h2 style={{ marginBottom: "8px" }}>🌾 Farm Fresh Near You</h2>
        <p style={{ marginTop: 0, color: "#666" }}>
          Pantry goods, poultry, eggs, beef, fish, and fresh local food.
        </p>

        <div style={{ display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "10px" }}>
          {farmNearYouItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/seller/${item.id}`)}
              style={{
                minWidth: "220px",
                cursor: "pointer",
                background: "#fff",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ padding: "12px" }}>
                <strong>{item.name}</strong>
                <p style={{ margin: "6px 0 0", color: "#666" }}>
                  {item.city}, {item.state}
                </p>
                <p style={{ margin: "6px 0 0", color: "#999", fontSize: "12px" }}>
                  {item.category}
                </p>
                {locationStatus === "granted" && item.distanceMiles != null && (
                  <p style={{ margin: "6px 0 0", color: "#999", fontSize: "12px" }}>
                    {Math.round(item.distanceMiles)} miles away
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 40px 40px" }}>
        <h2 style={{ marginBottom: "12px" }}>
          {activeCategory === "All" ? "🧢 Featured Apparel" : `🔥 ${activeCategory}`}
        </h2>

        <div style={{ display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "10px" }}>
          {featuredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/seller/${item.id}`)}
              style={{
                minWidth: "220px",
                cursor: "pointer",
                background: "#fff",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ padding: "12px" }}>
                <strong>{item.name}</strong>
                <p style={{ margin: "6px 0 0", color: "#666" }}>
                  {item.city}, {item.state}
                </p>
                {locationStatus === "granted" && item.distanceMiles != null && (
                  <p style={{ margin: "6px 0 0", color: "#999", fontSize: "12px" }}>
                    {Math.round(item.distanceMiles)} miles away
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}