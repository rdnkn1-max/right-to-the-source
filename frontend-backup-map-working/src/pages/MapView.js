import React, { useMemo, useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import sellers from "../data/sellers";
import "leaflet/dist/leaflet.css";

const categories = ["Apparel", "Pantry", "Poultry", "Beef", "Seafood"];

const categoryImages = {
  Apparel: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b",
  Pantry: "https://images.unsplash.com/photo-1506806732259-39c2d0268443",
  Poultry: "https://images.unsplash.com/photo-1589927986089-35812388d1f4",
  Beef: "https://images.unsplash.com/photo-1604908177522-429c43f3b6e3",
  Seafood: "https://images.unsplash.com/photo-1504674900247-0877df9cc836"
};

const getIcon = (category) => {
  const icons = {
    Beef: "🐄",
    Poultry: "🐔",
    Seafood: "🐟",
    Apparel: "👕",
    Pantry: "🥫"
  };

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 42px;
        height: 42px;
        border-radius: 999px;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.28);
      ">
        ${icons[category] || "📍"}
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -18]
  });
};

function FlyToSeller({ seller }) {
  const map = useMap();

  useEffect(() => {
    if (seller) {
      map.flyTo([seller.lat, seller.lng], 12, { duration: 1.2 });
    }
  }, [seller, map]);

  return null;
}

export default function MapView() {
  const navigate = useNavigate();
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState([]);

  const toggleCategory = (cat) => {
    setActiveCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };

  const filteredSellers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return sellers.filter((seller) => {
      const matchesSearch =
        !term ||
        seller.name.toLowerCase().includes(term) ||
        seller.category.toLowerCase().includes(term) ||
        (seller.city && seller.city.toLowerCase().includes(term));

      const matchesCategory =
        activeCategories.length === 0 ||
        activeCategories.includes(seller.category);

      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategories]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f7f7f7" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={[28.35, -80.7]}
          zoom={10}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredSellers.map((seller) => (
            <Marker
              key={seller.id}
              position={[seller.lat, seller.lng]}
              icon={getIcon(seller.category)}
              eventHandlers={{
                click: () => setSelectedSeller(seller)
              }}
            >
              <Popup>
                <div style={{ width: "190px" }}>
                  <img
                    src={seller.image}
                    alt={seller.name}
                    style={{
                      width: "100%",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "8px"
                    }}
                  />

                  <h4 style={{ margin: "0 0 6px 0", fontSize: "16px" }}>
                    {seller.name}
                  </h4>

                  <p
                    style={{
                      margin: "0 0 10px 0",
                      color: "#666",
                      fontSize: "13px"
                    }}
                  >
                    {seller.category}
                  </p>

                  <button
                    onClick={() => navigate(`/seller/${seller.id}`)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#111",
                      color: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    View Profile
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          <FlyToSeller seller={selectedSeller} />
        </MapContainer>

        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            display: "flex",
            gap: "10px",
            zIndex: 1000,
            flexWrap: "wrap",
            maxWidth: "540px"
          }}
        >
          {categories.map((cat) => {
            const active = activeCategories.includes(cat);

            return (
              <div
                key={cat}
                onClick={() => toggleCategory(cat)}
                style={{
                  width: "100px",
                  height: "60px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  cursor: "pointer",
                  position: "relative",
                  border: active
                    ? "3px solid #111"
                    : "1px solid rgba(255,255,255,0.75)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  transform: active ? "scale(1.04)" : "scale(1)",
                  transition: "all 0.2s ease"
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${categoryImages[cat]})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: active
                      ? "rgba(0,0,0,0.45)"
                      : "rgba(0,0,0,0.28)"
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    left: "8px",
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: "13px",
                    textShadow: "0 1px 3px rgba(0,0,0,0.5)"
                  }}
                >
                  {cat}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            background: "#111",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: "8px",
            zIndex: 1000,
            fontSize: "14px"
          }}
        >
          {filteredSellers.length} local spots found
        </div>
      </div>

      <div
        style={{
          width: "350px",
          background: "#f7f7f7",
          padding: "20px",
          overflowY: "auto",
          borderLeft: "1px solid #e5e5e5"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Seller Results</h2>

        <input
          placeholder="Search seller or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxSizing: "border-box"
          }}
        />

        {filteredSellers.length === 0 ? (
          <div
            style={{
              background: "#fff",
              padding: "14px",
              borderRadius: "10px",
              color: "#666"
            }}
          >
            No matching sellers found.
          </div>
        ) : (
          filteredSellers.map((seller) => (
            <div
              key={seller.id}
              onClick={() => setSelectedSeller(seller)}
              style={{
                background: "#fff",
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "10px",
                cursor: "pointer",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
              }}
            >
              <h3 style={{ margin: "0 0 6px 0", fontSize: "18px" }}>
                {seller.name}
              </h3>

              <p style={{ margin: "0 0 10px 0", color: "#777" }}>
                {seller.category}
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/seller/${seller.id}`);
                }}
                style={{
                  padding: "7px 10px",
                  fontSize: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  background: "#fff",
                  cursor: "pointer"
                }}
              >
                View Profile
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}