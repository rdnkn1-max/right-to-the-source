import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Popup,
  Tooltip,
  Marker,
  useMap,
} from "react-leaflet";
import { useLocation, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabaseClient";

const DEFAULT_CENTER = [28.3886, -80.6969];
const SELLER_PROFILE_BASE = "/seller-profile";

const CATEGORY_PRESETS = [
  { key: "popup", label: "Pop-Ups", emoji: "🎪" },
  { key: "food_truck", label: "Food Trucks", emoji: "🚚" },
  { key: "booth", label: "Booths", emoji: "🛍️" },
  { key: "market", label: "Markets", emoji: "🌾" },
  { key: "fresh_eggs", label: "Fresh Eggs", emoji: "🥚" },
  { key: "fresh_dairy", label: "Fresh Dairy", emoji: "🥛" },
  { key: "butter", label: "Butter", emoji: "🧈" },
  { key: "milk", label: "Milk", emoji: "🥛" },
  { key: "goat_milk", label: "Goat Milk", emoji: "🐐" },
  { key: "beef", label: "Beef", emoji: "🥩" },
  { key: "chicken", label: "Chicken", emoji: "🐔" },
  { key: "produce", label: "Produce", emoji: "🥬" },
  { key: "honey", label: "Honey", emoji: "🍯" },
  { key: "baked_goods", label: "Baked Goods", emoji: "🍞" },
  { key: "farm_stand", label: "Farm Stand", emoji: "🏡" },
  { key: "seafood", label: "Seafood", emoji: "🦐" },
  { key: "apparel", label: "Apparel", emoji: "🧢" },
];

function ChangeMapView({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
}

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

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

function eventStatusStyle(status) {
  if (status === "live") {
    return {
      color: "#146c43",
      fill: "#dcf7e8",
      soft: "#edfdf4",
    };
  }

  if (status === "upcoming") {
    return {
      color: "#9a6700",
      fill: "#fff3d8",
      soft: "#fff9ee",
    };
  }

  if (status === "inactive") {
    return {
      color: "#9b1c1c",
      fill: "#fce0e0",
      soft: "#fff2f2",
    };
  }

  return {
    color: "#234d7d",
    fill: "#e7eef8",
    soft: "#f2f6fb",
  };
}

function businessStyle() {
  return {
    color: "#1f3b2f",
    fill: "#edf5ef",
    soft: "#edf5ef",
  };
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function normalizeCategory(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/\s+/g, "_");
}

function expandCategoryTokens(value) {
  const raw = (value || "").toLowerCase().trim();
  if (!raw) return [];

  const normalized = normalizeCategory(raw);
  const tokens = new Set([normalized]);

  if (raw.includes(",")) {
    raw
      .split(",")
      .map((part) => normalizeCategory(part))
      .filter(Boolean)
      .forEach((part) => tokens.add(part));
  }

  if (raw.includes("/")) {
    raw
      .split("/")
      .map((part) => normalizeCategory(part))
      .filter(Boolean)
      .forEach((part) => tokens.add(part));
  }

  if (raw.includes("fresh eggs") || raw.includes("eggs")) tokens.add("fresh_eggs");
  if (raw.includes("fresh dairy") || raw.includes("dairy")) tokens.add("fresh_dairy");
  if (raw.includes("butter")) tokens.add("butter");
  if (raw.includes("goat milk")) tokens.add("goat_milk");
  if (raw.includes("milk")) tokens.add("milk");
  if (raw.includes("beef")) tokens.add("beef");
  if (raw.includes("chicken")) tokens.add("chicken");
  if (raw.includes("produce")) tokens.add("produce");
  if (raw.includes("honey")) tokens.add("honey");

  if (raw.includes("baked goods") || raw.includes("bread") || raw.includes("baked")) {
    tokens.add("baked_goods");
  }

  if (raw.includes("farm stand")) tokens.add("farm_stand");
  if (raw.includes("seafood")) tokens.add("seafood");

  if (
    raw.includes("apparel") ||
    raw.includes("clothing") ||
    raw.includes("shirt") ||
    raw.includes("hat") ||
    raw.includes("rdnkn")
  ) {
    tokens.add("apparel");
  }

  if (raw.includes("food truck") || raw.includes("truck")) tokens.add("food_truck");
  if (raw.includes("pop-up") || raw.includes("popup")) tokens.add("popup");
  if (raw.includes("booth")) tokens.add("booth");
  if (raw.includes("market")) tokens.add("market");

  return Array.from(tokens);
}

function getCategoryIcon(category, type) {
  const categoryText = `${category || ""}`.toLowerCase().trim();
  const typeText = `${type || ""}`.toLowerCase().trim();

  if (
    categoryText.includes("apparel") ||
    categoryText.includes("clothing") ||
    categoryText.includes("shirt") ||
    categoryText.includes("hat") ||
    categoryText.includes("rdnkn")
  ) {
    return "🧢";
  }

  if (categoryText.includes("egg")) return "🥚";
  if (categoryText.includes("dairy")) return "🥛";
  if (categoryText.includes("butter")) return "🧈";
  if (categoryText.includes("goat milk")) return "🐐";
  if (categoryText.includes("milk")) return "🥛";
  if (categoryText.includes("beef")) return "🥩";
  if (categoryText.includes("chicken")) return "🐔";
  if (categoryText.includes("produce")) return "🥬";
  if (categoryText.includes("honey")) return "🍯";
  if (categoryText.includes("baked")) return "🍞";
  if (categoryText.includes("farm")) return "🏡";
  if (categoryText.includes("seafood")) return "🦐";

  if (typeText.includes("food")) return "🍔";
  if (typeText.includes("truck")) return "🚚";
  if (typeText.includes("popup")) return "🎪";
  if (typeText.includes("booth")) return "🛍️";
  if (typeText.includes("market")) return "🌾";

  return "📍";
}

function itemMatchesSelectedCategories(categoryValue, eventTypeValue, selectedCategories) {
  if (!selectedCategories || selectedCategories.length === 0) return false;

  const categoryTokens = expandCategoryTokens(categoryValue);
  const typeTokens = expandCategoryTokens(eventTypeValue);

  const identityTokens = categoryTokens.filter(
    (token) => !["popup", "food_truck", "booth", "market"].includes(token)
  );

  const fallbackTokens = identityTokens.length > 0 ? identityTokens : typeTokens;
  const combined = new Set(fallbackTokens);

  return selectedCategories.some((key) => combined.has(key));
}

function createPinIcon({ emoji, background, border, isLive = false }) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        position: relative;
        width: 38px;
        height: 52px;
        display: flex;
        align-items: flex-start;
        justify-content: center;
      ">
        ${
          isLive
            ? `<div style="
                position:absolute;
                top:-2px;
                left:50%;
                transform:translateX(-50%);
                width:26px;
                height:26px;
                border-radius:999px;
                background: rgba(20,108,67,0.18);
                box-shadow: 0 0 0 8px rgba(20,108,67,0.10);
              "></div>`
            : ""
        }
        <div style="
          position: relative;
          width: 34px;
          height: 34px;
          border-radius: 999px;
          background: ${background};
          border: 3px solid ${border};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          box-shadow: 0 8px 18px rgba(0,0,0,0.20);
          z-index: 2;
        ">
          ${emoji}
        </div>
        <div style="
          position:absolute;
          top:28px;
          left:50%;
          transform:translateX(-50%);
          width:0;
          height:0;
          border-left:8px solid transparent;
          border-right:8px solid transparent;
          border-top:14px solid ${border};
          z-index:1;
        "></div>
        <div style="
          position:absolute;
          top:27px;
          left:50%;
          transform:translateX(-50%);
          width:0;
          height:0;
          border-left:6px solid transparent;
          border-right:6px solid transparent;
          border-top:11px solid ${background};
          z-index:2;
        "></div>
      </div>
    `,
    iconSize: [38, 52],
    iconAnchor: [19, 48],
    popupAnchor: [0, -40],
    tooltipAnchor: [0, -38],
  });
}

export default function MapView({ homepagePreview = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  const routeLat =
    location.state?.lat != null && Number.isFinite(Number(location.state.lat))
      ? Number(location.state.lat)
      : null;

  const routeLng =
    location.state?.lng != null && Number.isFinite(Number(location.state.lng))
      ? Number(location.state.lng)
      : null;

  const routeBusinessId = location.state?.businessId || null;

  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [events, setEvents] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedView, setSelectedView] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState(
    CATEGORY_PRESETS.map((c) => c.key)
  );
  const [error, setError] = useState("");
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [pendingFollowBusinessName, setPendingFollowBusinessName] = useState("");
  const [followLoadingId, setFollowLoadingId] = useState(null);
  const [showFeatured, setShowFeatured] = useState(true);

  useEffect(() => {
    loadMapData();
    getUserLocation();
  }, []);

  function openSellerProfile(sellerId) {
    if (!sellerId) {
      alert("Missing seller ID.");
      return;
    }

    navigate(`${SELLER_PROFILE_BASE}/${sellerId}`);
  }

  async function loadMapData() {
    try {
      setLoading(true);
      setError("");

      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("status", "approved")
        .order("business_name", { ascending: true });

      if (businessError) throw businessError;

      const { data: eventData, error: eventError } = await supabase
        .from("seller_events")
        .select(
          `
          *,
          businesses!inner(
            id,
            business_name,
            category,
            image_url,
            location,
            status
          )
        `
        )
        .eq("businesses.status", "approved")
        .order("start_time", { ascending: true });

      if (eventError) throw eventError;

      const normalizedBusinesses = (businessData || []).map((business) => ({
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

      const normalizedEvents = (eventData || []).map((event) => ({
        ...event,
        latitude:
          event.latitude != null && Number.isFinite(Number(event.latitude))
            ? Number(event.latitude)
            : null,
        longitude:
          event.longitude != null && Number.isFinite(Number(event.longitude))
            ? Number(event.longitude)
            : null,
        computedStatus: getEventStatus(event),
      }));

      setBusinesses(normalizedBusinesses);
      setEvents(normalizedEvents);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not load map data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFollow(businessId, businessName = "this seller") {
    try {
      setFollowLoadingId(businessId);

      if (!businessId) {
        alert("Missing business ID.");
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        setPendingFollowBusinessName(businessName);
        setAuthPromptOpen(true);
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
        alert("You already follow this seller.");
        return;
      }

      const { error: insertError } = await supabase.from("follows").insert([
        {
          user_id: userData.user.id,
          business_id: businessId,
        },
      ]);

      if (insertError) throw insertError;

      alert("Followed!");
    } catch (err) {
      console.error("Follow error:", err);
      alert(err.message || "Could not follow seller.");
    } finally {
      setFollowLoadingId(null);
    }
  }

  function getUserLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (geoError) => {
        console.warn("Geolocation error:", geoError);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  const dynamicCategories = useMemo(() => {
    const businessCats = businesses
      .flatMap((b) => expandCategoryTokens(b.category))
      .filter(Boolean);

    const unique = Array.from(new Set([...businessCats])).filter(
      (cat) => !CATEGORY_PRESETS.some((preset) => preset.key === cat)
    );

    return unique.map((cat) => ({
      key: cat,
      label: cat.replaceAll("_", " "),
      emoji: getCategoryIcon(cat, ""),
    }));
  }, [businesses]);

  const allCategories = useMemo(
    () => [...CATEGORY_PRESETS, ...dynamicCategories],
    [dynamicCategories]
  );

  useEffect(() => {
    const allKeys = allCategories.map((c) => c.key);
    setSelectedCategories((prev) => Array.from(new Set([...prev, ...allKeys])));
  }, [allCategories]);

  function toggleCategory(key) {
    setSelectedCategories((prev) => {
      if (prev.includes(key)) {
        return prev.filter((item) => item !== key);
      }
      return [...prev, key];
    });
  }

  function turnAllCategoriesOn() {
    setSelectedCategories(allCategories.map((c) => c.key));
  }

  function clearAllCategories() {
    setSelectedCategories([]);
  }

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((business) =>
      itemMatchesSelectedCategories(business.category, null, selectedCategories)
    );
  }, [businesses, selectedCategories]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (event.computedStatus === "completed") return false;
      if (selectedView === "live" && event.computedStatus !== "live") return false;
      if (selectedView === "upcoming" && event.computedStatus !== "upcoming") return false;

      return itemMatchesSelectedCategories(
        event.businesses?.category,
        event.type,
        selectedCategories
      );
    });
  }, [events, selectedView, selectedCategories]);

  const liveNowItems = useMemo(() => {
    return filteredEvents
      .filter((event) => event.computedStatus === "live")
      .map((event) => {
        const distance =
          userLocation && event.latitude != null && event.longitude != null
            ? milesBetween(
                userLocation.latitude,
                userLocation.longitude,
                event.latitude,
                event.longitude
              )
            : null;

        return {
          id: `live-${event.id}`,
          icon: getCategoryIcon(event.businesses?.category, event.type),
          title: event.title || "Untitled Event",
          subtitle: event.businesses?.business_name || "Business",
          distance,
          raw: event,
        };
      })
      .sort((a, b) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });
  }, [filteredEvents, userLocation]);

  const featuredItems = useMemo(() => {
    const featuredBusinessIds = new Set();

    const fromLiveBusinesses = filteredEvents
      .filter((event) => event.computedStatus === "live" && event.businesses?.id)
      .map((event) => ({
        id: `featured-live-${event.businesses.id}`,
        businessId: event.businesses.id,
        icon: getCategoryIcon(event.businesses?.category, event.type),
        title: event.businesses?.business_name || event.title || "Business",
        subtitle: event.businesses?.category || event.type || "Live now",
        eventTitle: event.title || "",
        lat: event.latitude,
        lng: event.longitude,
      }));

    const uniqueLive = fromLiveBusinesses.filter((item) => {
      if (featuredBusinessIds.has(item.businessId)) return false;
      featuredBusinessIds.add(item.businessId);
      return true;
    });

    const fallbackBusinesses = filteredBusinesses
      .filter((business) => {
        if (!business?.id) return false;
        if (featuredBusinessIds.has(business.id)) return false;
        return true;
      })
      .map((business) => ({
        id: `featured-business-${business.id}`,
        businessId: business.id,
        icon: getCategoryIcon(business.category, ""),
        title: business.business_name || "Business",
        subtitle: business.category || "Local business",
        eventTitle: "",
        lat: business.latitude,
        lng: business.longitude,
      }));

    return [...uniqueLive, ...fallbackBusinesses].slice(0, 8);
  }, [filteredEvents, filteredBusinesses]);

  const nearbyBusinesses = useMemo(() => {
    const liveBusinessIds = new Set(
      liveNowItems
        .map((item) => item.raw?.businesses?.id)
        .filter(Boolean)
        .map((id) => `${id}`)
    );

    return filteredBusinesses
      .filter((business) => !liveBusinessIds.has(`${business.id}`))
      .map((business) => {
        const distance =
          userLocation && business.latitude != null && business.longitude != null
            ? milesBetween(
                userLocation.latitude,
                userLocation.longitude,
                business.latitude,
                business.longitude
              )
            : null;

        return {
          id: `nearby-business-${business.id}`,
          icon: getCategoryIcon(business.category, ""),
          title: business.business_name || "Business",
          subtitle: business.category || "Local business",
          distance,
          raw: business,
        };
      })
      .sort((a, b) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });
  }, [filteredBusinesses, liveNowItems, userLocation]);

  const mapCenter = useMemo(() => {
    if (routeLat != null && routeLng != null) {
      return [routeLat, routeLng];
    }

    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude];
    }

    const firstEvent = filteredEvents.find(
      (e) => e.latitude != null && e.longitude != null
    );
    if (firstEvent) return [firstEvent.latitude, firstEvent.longitude];

    const firstBusiness = filteredBusinesses.find(
      (b) => b.latitude != null && b.longitude != null
    );
    if (firstBusiness) return [firstBusiness.latitude, firstBusiness.longitude];

    return DEFAULT_CENTER;
  }, [routeLat, routeLng, userLocation, filteredEvents, filteredBusinesses]);

  const counts = useMemo(() => {
    return {
      live: events.filter((e) => e.computedStatus === "live").length,
      upcoming: events.filter((e) => e.computedStatus === "upcoming").length,
    };
  }, [events]);

  function focusItemOnMap(item) {
    if (!item) return;

    const nextLat =
      item.lat != null ? item.lat : item.raw?.latitude != null ? item.raw.latitude : null;
    const nextLng =
      item.lng != null ? item.lng : item.raw?.longitude != null ? item.raw.longitude : null;
    const nextBusinessId =
      item.businessId || item.raw?.business_id || item.raw?.businesses?.id || item.raw?.id;

    if (nextLat == null || nextLng == null) return;

    navigate("/map", {
      state: {
        lat: nextLat,
        lng: nextLng,
        businessId: nextBusinessId || null,
        title: item.title,
      },
    });
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f6f1e8",
      padding: "28px 20px 40px",
      fontFamily: "Arial, sans-serif",
      color: "#1f3b2f",
      position: "relative",
    },
    container: {
      maxWidth: "1480px",
      margin: "0 auto",
    },
    headerWrap: {
      marginBottom: "16px",
    },
    eyebrow: {
      margin: "0 0 6px",
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      fontSize: "0.72rem",
      color: "#6d8076",
      fontWeight: "bold",
    },
    heading: {
      margin: "0 0 8px",
      fontSize: "2.2rem",
      lineHeight: 1.05,
    },
    subheading: {
      margin: 0,
      color: "#60766b",
      maxWidth: "780px",
    },
    topBar: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
      marginTop: "16px",
      marginBottom: "16px",
    },
    statChips: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },
    statChip: {
      borderRadius: "999px",
      background: "#fffdf8",
      border: "1px solid #d9e0d7",
      padding: "10px 14px",
      fontWeight: "bold",
      fontSize: "0.86rem",
      boxShadow: "0 8px 18px rgba(31,59,47,0.06)",
    },
    mainStatusRow: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginBottom: "12px",
    },
    statusButton: {
      border: "1px solid #d2dbd0",
      background: "#fffdf8",
      color: "#1f3b2f",
      borderRadius: "999px",
      padding: "10px 14px",
      fontWeight: "bold",
      cursor: "pointer",
    },
    statusButtonActive: {
      background: "#1f3b2f",
      color: "#fff",
      borderColor: "#1f3b2f",
    },
    categoryScrollerWrap: {
      background: "#fffdf8",
      border: "1px solid #d9e0d7",
      borderRadius: "22px",
      padding: "12px",
      marginBottom: "18px",
      boxShadow: "0 10px 28px rgba(31,59,47,0.06)",
    },
    categoryBarTop: {
      display: "flex",
      justifyContent: "space-between",
      gap: "10px",
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: "10px",
    },
    categoryBarTitle: {
      fontSize: "0.92rem",
      color: "#60766b",
      fontWeight: "bold",
    },
    categoryBarActions: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    },
    miniButton: {
      border: "1px solid #d9e0d7",
      background: "#fff",
      color: "#1f3b2f",
      borderRadius: "999px",
      padding: "8px 12px",
      fontWeight: "bold",
      fontSize: "0.8rem",
      cursor: "pointer",
    },
    categoryScroller: {
      display: "flex",
      gap: "8px",
      overflowX: "auto",
      paddingBottom: "6px",
      scrollSnapType: "x mandatory",
    },
    categoryChip: {
      flex: "0 0 auto",
      minWidth: "100px",
      height: "40px",
      border: "1px solid #d9e0d7",
      background: "#fff",
      borderRadius: "12px",
      padding: "0 10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: "6px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "12px",
      opacity: 0.65,
      boxShadow: "0 4px 10px rgba(31,59,47,0.04)",
      scrollSnapAlign: "start",
      whiteSpace: "nowrap",
    },
    categoryChipActive: {
      background: "#edf5ef",
      borderColor: "#1f3b2f",
      boxShadow: "inset 0 0 0 1px #1f3b2f",
      opacity: 1,
    },
    layout: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) 330px",
      gap: "18px",
      alignItems: "start",
    },
    mapWrap: {
      background: "#fffdf8",
      border: "1px solid #d9e0d7",
      borderRadius: "24px",
      padding: "14px",
      boxShadow: "0 16px 36px rgba(31,59,47,0.07)",
    },
    mapInner: {
      overflow: "hidden",
      borderRadius: "18px",
      height: "74vh",
      minHeight: "640px",
    },
    sidePanel: {
      background: "#fffdf8",
      border: "1px solid #d9e0d7",
      borderRadius: "24px",
      padding: "14px",
      height: "74vh",
      minHeight: "640px",
      overflow: "hidden",
      boxShadow: "0 16px 36px rgba(31,59,47,0.07)",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    sectionBlock: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      minHeight: 0,
    },
    sectionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "8px",
      flexWrap: "wrap",
      marginBottom: "2px",
    },
    sectionTitle: {
      margin: 0,
      fontSize: "1rem",
      fontWeight: "800",
      color: "#1f3b2f",
    },
    sectionMiniButton: {
      border: "1px solid #d9e0d7",
      background: "#fff",
      color: "#1f3b2f",
      borderRadius: "999px",
      padding: "6px 10px",
      fontWeight: "700",
      fontSize: "0.74rem",
      cursor: "pointer",
    },
    sectionScroller: {
      maxHeight: "190px",
      overflowY: "auto",
      paddingRight: "4px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      minHeight: 0,
    },
    sectionScrollerTall: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      paddingRight: "4px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    compactCard: {
      border: "1px solid #d9e0d7",
      borderRadius: "16px",
      padding: "10px 10px 9px",
      background: "#fff",
      boxShadow: "0 8px 18px rgba(31,59,47,0.05)",
    },
    compactTop: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: "8px",
    },
    compactIdentity: {
      display: "flex",
      alignItems: "flex-start",
      gap: "8px",
      minWidth: 0,
      flex: 1,
    },
    compactIcon: {
      width: "30px",
      height: "30px",
      borderRadius: "999px",
      background: "#edf5ef",
      border: "1px solid #d9e0d7",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "15px",
      flexShrink: 0,
    },
    compactTitleWrap: {
      minWidth: 0,
      flex: 1,
    },
    compactTitle: {
      margin: "0 0 2px",
      fontSize: "0.92rem",
      fontWeight: "800",
      color: "#1f3b2f",
      lineHeight: 1.2,
    },
    compactSub: {
      margin: 0,
      fontSize: "0.76rem",
      color: "#60766b",
      lineHeight: 1.35,
    },
    distanceText: {
      fontSize: "0.75rem",
      color: "#60766b",
      whiteSpace: "nowrap",
      marginTop: "2px",
    },
    badge: {
      display: "inline-block",
      borderRadius: "999px",
      padding: "4px 8px",
      fontSize: "0.7rem",
      fontWeight: "800",
      marginBottom: "6px",
      textTransform: "capitalize",
    },
    compactActionRow: {
      marginTop: "8px",
      display: "flex",
      gap: "6px",
      flexWrap: "wrap",
    },
    smallPrimaryButton: {
      padding: "6px 10px",
      background: "#173d33",
      color: "#ffffff",
      border: "none",
      borderRadius: "999px",
      fontWeight: "700",
      fontSize: "0.74rem",
      cursor: "pointer",
    },
    smallSecondaryButton: {
      padding: "6px 10px",
      background: "#fff",
      color: "#173d33",
      border: "1px solid #d9e0d7",
      borderRadius: "999px",
      fontWeight: "700",
      fontSize: "0.74rem",
      cursor: "pointer",
    },
    loadingBox: {
      padding: "40px",
      textAlign: "center",
      color: "#60766b",
    },
    emptyState: {
      color: "#60766b",
      fontSize: "0.84rem",
      padding: "4px 2px",
    },
    actionRow: {
      marginTop: "10px",
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    },
    followButton: {
      padding: "8px 12px",
      background: "#173d33",
      color: "#ffffff",
      border: "none",
      borderRadius: "999px",
      fontWeight: "bold",
      cursor: "pointer",
    },
    openButton: {
      padding: "8px 12px",
      background: "#fff",
      color: "#173d33",
      border: "1px solid #d9e0d7",
      borderRadius: "999px",
      fontWeight: "bold",
      cursor: "pointer",
    },
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 18, 0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      zIndex: 4000,
    },
    modalCard: {
      width: "100%",
      maxWidth: "460px",
      background: "#fffdf8",
      border: "1px solid #d9e0d7",
      borderRadius: "28px",
      boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
      padding: "24px",
      color: "#1f3b2f",
    },
    modalEyebrow: {
      margin: "0 0 8px",
      fontSize: "0.72rem",
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      color: "#6d8076",
      fontWeight: "bold",
    },
    modalTitle: {
      margin: "0 0 10px",
      fontSize: "1.8rem",
      lineHeight: 1.05,
    },
    modalText: {
      margin: 0,
      color: "#60766b",
      lineHeight: 1.6,
      fontSize: "0.98rem",
    },
    modalBenefitList: {
      margin: "16px 0 0",
      paddingLeft: "18px",
      color: "#1f3b2f",
      lineHeight: 1.8,
      fontSize: "0.96rem",
    },
    modalButtonRow: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginTop: "22px",
    },
    primaryModalButton: {
      padding: "12px 18px",
      borderRadius: "999px",
      border: "none",
      background: "#173d33",
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
      boxShadow: "0 10px 20px rgba(23, 61, 51, 0.16)",
    },
    secondaryModalButton: {
      padding: "12px 18px",
      borderRadius: "999px",
      border: "1px solid #d9e0d7",
      background: "#fff",
      color: "#173d33",
      fontWeight: "bold",
      cursor: "pointer",
    },
  };

  if (loading) {
    return <div style={styles.loadingBox}>Loading map…</div>;
  }

  if (homepagePreview) {
    return (
      <MapContainer
        center={mapCenter}
        zoom={11}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <ChangeMapView center={mapCenter} zoom={11} />

        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation ? (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={createPinIcon({
              emoji: "📍",
              background: "#d9ecff",
              border: "#1565c0",
            })}
          />
        ) : null}

        {filteredEvents
          .filter((event) => event.latitude != null && event.longitude != null)
          .map((event) => {
            const visual = eventStatusStyle(event.computedStatus);
            const emoji = getCategoryIcon(event.businesses?.category, event.type);

            return (
              <Marker
                key={`preview-event-${event.id}`}
                position={[event.latitude, event.longitude]}
                icon={createPinIcon({
                  emoji,
                  background: visual.fill,
                  border: visual.color,
                  isLive: event.computedStatus === "live",
                })}
              />
            );
          })}

        {filteredBusinesses
          .filter((business) => business.latitude != null && business.longitude != null)
          .map((business) => {
            const emoji = getCategoryIcon(business.category, "");

            return (
              <Marker
                key={`preview-business-${business.id}`}
                position={[business.latitude, business.longitude]}
                icon={createPinIcon({
                  emoji,
                  background: "#edf5ef",
                  border: "#1f3b2f",
                })}
              />
            );
          })}
      </MapContainer>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerWrap}>
          <p style={styles.eyebrow}>Local discovery map</p>
          <h1 style={styles.heading}>What’s happening near you</h1>
          <p style={styles.subheading}>
            Browse live booths, pop-ups, food trucks, local businesses, and fresh
            local products near you.
          </p>
        </div>

        <div style={styles.topBar}>
          <div style={styles.statChips}>
            <div style={styles.statChip}>Businesses: {filteredBusinesses.length}</div>
            <div style={styles.statChip}>Live Now: {counts.live}</div>
            <div style={styles.statChip}>Upcoming: {counts.upcoming}</div>
          </div>
        </div>

        <div style={styles.mainStatusRow}>
          {[
            { key: "all", label: "All" },
            { key: "live", label: "Live Now" },
            { key: "upcoming", label: "Upcoming" },
          ].map((item) => {
            const active = selectedView === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedView(item.key)}
                style={{
                  ...styles.statusButton,
                  ...(active ? styles.statusButtonActive : {}),
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div style={styles.categoryScrollerWrap}>
          <div style={styles.categoryBarTop}>
            <div style={styles.categoryBarTitle}>
              All categories start on. Tap any one to remove it from the map.
            </div>

            <div style={styles.categoryBarActions}>
              <button type="button" onClick={turnAllCategoriesOn} style={styles.miniButton}>
                Turn all on
              </button>
              <button type="button" onClick={clearAllCategories} style={styles.miniButton}>
                Clear all
              </button>
            </div>
          </div>

          <div style={styles.categoryScroller}>
            {allCategories.map((cat) => {
              const active = selectedCategories.includes(cat.key);

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => toggleCategory(cat.key)}
                  style={{
                    ...styles.categoryChip,
                    ...(active ? styles.categoryChipActive : {}),
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontSize: "14px" }}>{cat.emoji}</span>
                    <span style={{ textTransform: "capitalize" }}>{cat.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <div
            style={{
              background: "#fff1f1",
              border: "1px solid #f0cccc",
              color: "#8c1f1f",
              padding: "12px 14px",
              borderRadius: "14px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        ) : null}

        <div style={styles.layout}>
          <div style={styles.mapWrap}>
            <div style={styles.mapInner}>
              <MapContainer
                center={mapCenter}
                zoom={routeLat != null && routeLng != null ? 13 : 11}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
              >
                <ChangeMapView
                  center={mapCenter}
                  zoom={routeLat != null && routeLng != null ? 13 : 11}
                />

                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {userLocation ? (
                  <Marker
                    position={[userLocation.latitude, userLocation.longitude]}
                    icon={createPinIcon({
                      emoji: "📍",
                      background: "#d9ecff",
                      border: "#1565c0",
                    })}
                  >
                    <Tooltip direction="top" offset={[0, -30]}>
                      You are here
                    </Tooltip>
                  </Marker>
                ) : null}

                {filteredEvents
                  .filter((event) => event.latitude != null && event.longitude != null)
                  .map((event) => {
                    const visual = eventStatusStyle(event.computedStatus);
                    const emoji = getCategoryIcon(event.businesses?.category, event.type);

                    return (
                      <Marker
                        key={`event-${event.id}`}
                        position={[event.latitude, event.longitude]}
                        icon={createPinIcon({
                          emoji,
                          background: visual.fill,
                          border: visual.color,
                          isLive: event.computedStatus === "live",
                        })}
                      >
                        <Popup>
                          <div style={{ minWidth: "250px" }}>
                            <div
                              style={{
                                display: "inline-block",
                                marginBottom: "8px",
                                padding: "4px 10px",
                                borderRadius: "999px",
                                background: visual.soft,
                                color: visual.color,
                                fontWeight: "bold",
                                textTransform: "capitalize",
                                fontSize: "0.78rem",
                              }}
                            >
                              {event.computedStatus}
                            </div>

                            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                              {emoji} {event.title}
                            </div>

                            <div style={{ marginBottom: "4px" }}>
                              {event.businesses?.business_name}
                            </div>

                            <div style={{ color: "#60766b", fontSize: "0.9rem" }}>
                              Category: {event.businesses?.category || "—"}
                            </div>

                            <div style={{ color: "#60766b", fontSize: "0.9rem" }}>
                              Event Type: {event.type || "—"}
                            </div>

                            <div style={{ color: "#60766b", fontSize: "0.9rem", marginTop: "6px" }}>
                              {event.address || event.city || "Location coming soon"}
                            </div>

                            <div
                              style={{
                                color: "#60766b",
                                fontSize: "0.9rem",
                                marginTop: "6px",
                              }}
                            >
                              Starts: {formatDateTime(event.start_time)}
                            </div>

                            <div style={{ color: "#60766b", fontSize: "0.9rem" }}>
                              Ends: {formatDateTime(event.end_time)}
                            </div>

                            {event.note ? (
                              <div style={{ marginTop: "8px", fontSize: "0.9rem" }}>
                                {event.note}
                              </div>
                            ) : null}

                            <div style={styles.actionRow}>
                              <button
                                type="button"
                                onClick={() => openSellerProfile(event.businesses?.id)}
                                style={styles.openButton}
                              >
                                Open
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleFollow(
                                    event.business_id,
                                    event.businesses?.business_name || event.title || "this seller"
                                  )
                                }
                                disabled={followLoadingId === event.business_id}
                                style={{
                                  ...styles.followButton,
                                  opacity: followLoadingId === event.business_id ? 0.7 : 1,
                                }}
                              >
                                {followLoadingId === event.business_id ? "Following..." : "⭐ Follow"}
                              </button>
                            </div>
                          </div>
                        </Popup>

                        <Tooltip direction="top" offset={[0, -30]}>
                          {emoji} {event.title}
                        </Tooltip>
                      </Marker>
                    );
                  })}

                {filteredBusinesses
                  .filter((business) => business.latitude != null && business.longitude != null)
                  .map((business) => {
                    const emoji = getCategoryIcon(business.category, "");
                    const isTargeted =
                      routeBusinessId != null && `${business.id}` === `${routeBusinessId}`;

                    return (
                      <Marker
                        key={`business-${business.id}`}
                        position={[business.latitude, business.longitude]}
                        icon={createPinIcon({
                          emoji,
                          background: isTargeted ? "#fff3d8" : "#edf5ef",
                          border: isTargeted ? "#9a6700" : "#1f3b2f",
                          isLive: isTargeted,
                        })}
                      >
                        <Popup>
                          <div style={{ minWidth: "220px" }}>
                            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                              {emoji} {business.business_name}
                            </div>

                            <div style={{ color: "#60766b", marginBottom: "6px" }}>
                              {business.category || "Local business"}
                            </div>

                            {business.location ? (
                              <div style={{ color: "#60766b", fontSize: "0.9rem" }}>
                                {business.location}
                              </div>
                            ) : null}

                            {business.description ? (
                              <div style={{ marginTop: "8px", fontSize: "0.9rem" }}>
                                {business.description}
                              </div>
                            ) : null}

                            <div style={styles.actionRow}>
                              <button
                                type="button"
                                onClick={() => openSellerProfile(business.id)}
                                style={styles.openButton}
                              >
                                Open
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleFollow(business.id, business.business_name || "this seller")
                                }
                                disabled={followLoadingId === business.id}
                                style={{
                                  ...styles.followButton,
                                  opacity: followLoadingId === business.id ? 0.7 : 1,
                                }}
                              >
                                {followLoadingId === business.id ? "Following..." : "⭐ Follow"}
                              </button>
                            </div>
                          </div>
                        </Popup>

                        <Tooltip direction="top" offset={[0, -30]}>
                          {emoji} {business.business_name}
                        </Tooltip>
                      </Marker>
                    );
                  })}
              </MapContainer>
            </div>
          </div>

          <aside style={styles.sidePanel}>
            <div style={styles.sectionBlock}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>⭐ Featured in this area</h3>
                <button
                  type="button"
                  style={styles.sectionMiniButton}
                  onClick={() => setShowFeatured((prev) => !prev)}
                >
                  {showFeatured ? "Hide" : "Show"}
                </button>
              </div>

              {showFeatured ? (
                <div style={styles.sectionScroller}>
                  {featuredItems.length === 0 ? (
                    <div style={styles.emptyState}>No featured items right now.</div>
                  ) : (
                    featuredItems.map((item) => (
                      <div key={item.id} style={styles.compactCard}>
                        <div style={styles.compactTop}>
                          <div style={styles.compactIdentity}>
                            <div style={styles.compactIcon}>{item.icon}</div>

                            <div style={styles.compactTitleWrap}>
                              <p style={styles.compactTitle}>{item.title}</p>
                              <p style={styles.compactSub}>{item.subtitle}</p>
                              {item.eventTitle ? (
                                <p style={{ ...styles.compactSub, marginTop: "2px" }}>
                                  {item.eventTitle}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div style={styles.compactActionRow}>
                          <button
                            type="button"
                            style={styles.smallPrimaryButton}
                            onClick={() => openSellerProfile(item.businessId)}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            style={styles.smallSecondaryButton}
                            onClick={() => focusItemOnMap(item)}
                          >
                            Map
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            <div style={styles.sectionBlock}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>🔴 Live now</h3>
              </div>

              <div style={styles.sectionScroller}>
                {liveNowItems.length === 0 ? (
                  <div style={styles.emptyState}>Nothing live right now.</div>
                ) : (
                  liveNowItems.map((item) => {
                    const visual = eventStatusStyle("live");
                    const sellerId = item.raw?.businesses?.id;
                    const sellerName = item.raw?.businesses?.business_name || item.title;

                    return (
                      <div key={item.id} style={styles.compactCard}>
                        <div
                          style={{
                            ...styles.badge,
                            background: visual.fill,
                            color: visual.color,
                          }}
                        >
                          live
                        </div>

                        <div style={styles.compactTop}>
                          <div style={styles.compactIdentity}>
                            <div style={styles.compactIcon}>{item.icon}</div>

                            <div style={styles.compactTitleWrap}>
                              <p style={styles.compactTitle}>{item.title}</p>
                              <p style={styles.compactSub}>{item.subtitle}</p>
                            </div>
                          </div>

                          <div style={styles.distanceText}>
                            {item.distance != null ? `${item.distance.toFixed(1)} mi` : "—"}
                          </div>
                        </div>

                        <div style={styles.compactActionRow}>
                          <button
                            type="button"
                            style={styles.smallSecondaryButton}
                            onClick={() => openSellerProfile(sellerId)}
                          >
                            Open
                          </button>

                          <button
                            type="button"
                            onClick={() => handleFollow(item.raw?.business_id, sellerName)}
                            disabled={followLoadingId === item.raw?.business_id}
                            style={{
                              ...styles.smallPrimaryButton,
                              opacity: followLoadingId === item.raw?.business_id ? 0.7 : 1,
                            }}
                          >
                            {followLoadingId === item.raw?.business_id ? "Following..." : "Follow"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ ...styles.sectionBlock, flex: 1 }}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>📍 Nearby businesses</h3>
              </div>

              <div style={styles.sectionScrollerTall}>
                {nearbyBusinesses.length === 0 ? (
                  <div style={styles.emptyState}>No nearby businesses match right now.</div>
                ) : (
                  nearbyBusinesses.map((item) => {
                    const sellerId = item.raw?.id;
                    const sellerName = item.raw?.business_name || item.title;

                    return (
                      <div key={item.id} style={styles.compactCard}>
                        <div style={styles.compactTop}>
                          <div style={styles.compactIdentity}>
                            <div style={styles.compactIcon}>{item.icon}</div>

                            <div style={styles.compactTitleWrap}>
                              <p style={styles.compactTitle}>{item.title}</p>
                              <p style={styles.compactSub}>{item.subtitle}</p>
                            </div>
                          </div>

                          <div style={styles.distanceText}>
                            {item.distance != null ? `${item.distance.toFixed(1)} mi` : "—"}
                          </div>
                        </div>

                        <div style={styles.compactActionRow}>
                          <button
                            type="button"
                            style={styles.smallSecondaryButton}
                            onClick={() => openSellerProfile(sellerId)}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            style={styles.smallPrimaryButton}
                            onClick={() => focusItemOnMap(item)}
                          >
                            Map
                          </button>

                          <button
                            type="button"
                            onClick={() => handleFollow(sellerId, sellerName)}
                            disabled={followLoadingId === sellerId}
                            style={{
                              ...styles.smallSecondaryButton,
                              opacity: followLoadingId === sellerId ? 0.7 : 1,
                            }}
                          >
                            {followLoadingId === sellerId ? "Following..." : "Follow"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {authPromptOpen ? (
        <div style={styles.modalOverlay} onClick={() => setAuthPromptOpen(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <p style={styles.modalEyebrow}>Create a free account</p>
            <h2 style={styles.modalTitle}>
              Follow {pendingFollowBusinessName || "local sellers"}
            </h2>
            <p style={styles.modalText}>
              Sign up or log in to follow sellers, keep track of your favorites,
              and get notified when they go live near you.
            </p>

            <ul style={styles.modalBenefitList}>
              <li>⭐ Follow local businesses you care about</li>
              <li>📍 See where your favorites are live</li>
              <li>🔔 Get alerts when they pop up nearby</li>
            </ul>

            <div style={styles.modalButtonRow}>
              <button
                type="button"
                style={styles.primaryModalButton}
                onClick={() => navigate("/seller-auth")}
              >
                Create Account
              </button>

              <button
                type="button"
                style={styles.secondaryModalButton}
                onClick={() => navigate("/auth")}
              >
                Log In
              </button>

              <button
                type="button"
                style={styles.secondaryModalButton}
                onClick={() => setAuthPromptOpen(false)}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}