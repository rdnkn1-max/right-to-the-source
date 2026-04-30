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
const HAPPENING_NOW_PRIMARY = "#22C55E";
const HAPPENING_NOW_GLOW = "rgba(34, 197, 94, 0.35)";
const HAPPENING_NOW_SOFT = "rgba(34, 197, 94, 0.14)";
const HAPPENING_NOW_TEXT = "#166534";
const HAPPENING_NOW_BORDER = "rgba(34, 197, 94, 0.68)";
const CURRENTLY_AT_PRIMARY = "#FBD9A7";
const CURRENTLY_AT_SOFT = "rgba(251, 217, 167, 0.18)";
const CURRENTLY_AT_BORDER = "rgba(251, 217, 167, 0.7)";
const CURRENTLY_AT_TEXT = "#7c4a03";

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

function markerLocationKey(businessId, latitude, longitude) {
  if (!businessId || latitude == null || longitude == null) return null;

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return `${businessId}:${lat.toFixed(6)}:${lng.toFixed(6)}`;
}

function eventStatusStyle(status) {
  if (status === "live") {
    return {
      color: HAPPENING_NOW_TEXT,
      fill: HAPPENING_NOW_PRIMARY,
      soft: HAPPENING_NOW_SOFT,
      border: HAPPENING_NOW_BORDER,
      glow: HAPPENING_NOW_GLOW,
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
      <div class="map-pin${isLive ? " map-pin--active" : ""}" style="--pin-background:${background}; --pin-border:${border}; --pin-glow:${HAPPENING_NOW_GLOW};">
        ${isLive ? '<div class="map-pin__pulse"></div>' : ""}
        <div class="map-pin__body">${emoji}</div>
        <div class="map-pin__tip map-pin__tip--outer"></div>
        <div class="map-pin__tip map-pin__tip--inner"></div>
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
  const routeSelectedCategoryKey = location.state?.selectedCategoryKey || null;
  const routeSelectedCategoryLabel = location.state?.selectedCategoryLabel || null;

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

  useEffect(() => {
    if (!routeSelectedCategoryKey) {
      return;
    }

    const allKeys = allCategories.map((c) => c.key);

    if (!allKeys.includes(routeSelectedCategoryKey)) {
      return;
    }

    setSelectedView("all");
    setSelectedCategories([routeSelectedCategoryKey]);
  }, [routeSelectedCategoryKey, allCategories]);

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
        subtitle: event.businesses?.category || event.type || "Pop-Up At",
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

  const liveEventMarkerKeys = useMemo(() => {
    return new Set(
      filteredEvents
        .filter(
          (event) =>
            event.computedStatus === "live" && event.latitude != null && event.longitude != null
        )
        .map((event) =>
          markerLocationKey(
            event.business_id || event.businesses?.id,
            event.latitude,
            event.longitude
          )
        )
        .filter(Boolean)
    );
  }, [filteredEvents]);

  const activeCategoryLabel = useMemo(() => {
    if (selectedCategories.length !== 1) {
      return null;
    }

    const matchedCategory = allCategories.find((item) => item.key === selectedCategories[0]);
    return matchedCategory?.label || routeSelectedCategoryLabel || null;
  }, [selectedCategories, allCategories, routeSelectedCategoryLabel]);

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
      background: "linear-gradient(180deg, #f8f3ea 0%, #f4ede2 55%, #efe6d8 100%)",
      padding: "22px 16px 28px",
      fontFamily: "Arial, sans-serif",
      color: "#1f3b2f",
      position: "relative",
    },
    container: {
      maxWidth: "1480px",
      margin: "0 auto",
    },
    headerWrap: {
      marginBottom: "18px",
    },
    eyebrow: {
      margin: "0 0 6px",
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      fontSize: "0.72rem",
      color: "#6d8076",
      fontWeight: "bold",
    },
    headingRow: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "10px",
      flexWrap: "wrap",
    },
    heading: {
      margin: 0,
      fontSize: "2.45rem",
      lineHeight: 1.02,
      fontWeight: "700",
      color: "#18362b",
    },
    liveIndicator: {
      width: "8px",
      height: "8px",
      borderRadius: "999px",
      background: HAPPENING_NOW_PRIMARY,
      boxShadow: `0 0 0 6px ${HAPPENING_NOW_SOFT}`,
      animation: "mapHappeningPulse 1.8s ease-in-out infinite",
      flexShrink: 0,
    },
    subheading: {
      margin: 0,
      color: "#60766b",
      maxWidth: "780px",
      lineHeight: 1.6,
    },
    topBar: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
      marginTop: "18px",
      marginBottom: "16px",
      alignItems: "center",
    },
    topStatusActions: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      flexWrap: "wrap",
    },
    statChips: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },
    topPillBase: {
      height: "36px",
      padding: "0 14px",
      borderRadius: "999px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "13px",
      fontWeight: 600,
      lineHeight: 1,
      whiteSpace: "nowrap",
    },
    statChip: {
      background: "rgba(255,253,248,0.92)",
      border: "1px solid rgba(31,59,47,0.08)",
      boxShadow: "0 10px 22px rgba(31,59,47,0.06)",
      backdropFilter: "blur(10px)",
    },
    sellersNearbyChip: {
      background: "rgba(255, 249, 240, 0.96)",
      border: "1px solid rgba(145, 120, 90, 0.18)",
      color: "#6b5845",
      boxShadow: "0 8px 18px rgba(107, 88, 69, 0.06)",
    },
    comingUpChip: {
      background: "rgba(232, 239, 245, 0.96)",
      border: "1px solid rgba(128, 150, 170, 0.26)",
      color: "#4f6476",
      boxShadow: "0 8px 18px rgba(79, 100, 118, 0.07)",
    },
    happeningNowChip: {
      background: HAPPENING_NOW_SOFT,
      border: `1px solid ${HAPPENING_NOW_BORDER}`,
      color: HAPPENING_NOW_TEXT,
      boxShadow: "none",
    },
    categoryContextPill: {
      display: "inline-flex",
      alignItems: "center",
      padding: "10px 14px",
      borderRadius: "999px",
      marginBottom: "12px",
      background: "rgba(23,61,51,0.08)",
      border: "1px solid rgba(23,61,51,0.08)",
      color: "#173d33",
      fontSize: "0.88rem",
      fontWeight: "800",
      boxShadow: "0 8px 18px rgba(31,59,47,0.05)",
    },
    mainStatusRow: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginTop: "24px",
      marginBottom: "14px",
    },
    statusButton: {
      border: "1px solid rgba(0,0,0,0.06)",
      background: "rgba(255,253,248,0.96)",
      color: "#1f3b2f",
      cursor: "pointer",
      boxShadow: "0 6px 14px rgba(31,59,47,0.04)",
    },
    statusButtonActive: {
      background: "#1f3b2f",
      color: "#fff",
      borderColor: "#1f3b2f",
      boxShadow: "0 10px 20px rgba(31,59,47,0.16)",
    },
    currentlyAtButton: {
      border: `1px solid ${CURRENTLY_AT_BORDER}`,
      background: CURRENTLY_AT_SOFT,
      color: CURRENTLY_AT_TEXT,
      cursor: "pointer",
      boxShadow: "0 8px 18px rgba(124, 74, 3, 0.06)",
      backdropFilter: "blur(10px)",
    },
    currentlyAtButtonActive: {
      background: "rgba(251, 217, 167, 0.28)",
      border: `1px solid ${CURRENTLY_AT_BORDER}`,
      color: CURRENTLY_AT_TEXT,
      boxShadow: "none",
    },
    categoryScrollerWrap: {
      background: "rgba(255,253,248,0.96)",
      border: "1px solid rgba(31,59,47,0.08)",
      borderRadius: "24px",
      padding: "14px",
      marginBottom: "18px",
      boxShadow: "0 12px 28px rgba(31,59,47,0.06)",
      backdropFilter: "blur(12px)",
    },
    categoryBarTop: {
      display: "flex",
      justifyContent: "space-between",
      gap: "10px",
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: "12px",
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
      border: "1px solid rgba(0,0,0,0.06)",
      background: "#fff",
      color: "#1f3b2f",
      borderRadius: "999px",
      padding: "8px 12px",
      fontWeight: "bold",
      fontSize: "0.8rem",
      cursor: "pointer",
      boxShadow: "0 6px 14px rgba(31,59,47,0.04)",
    },
    categoryScroller: {
      display: "flex",
      gap: "10px",
      overflowX: "auto",
      paddingBottom: "6px",
      scrollSnapType: "x mandatory",
    },
    categoryChip: {
      flex: "0 0 auto",
      minWidth: "100px",
      height: "44px",
      border: "1px solid rgba(0,0,0,0.06)",
      background: "rgba(252,249,244,0.98)",
      borderRadius: "999px",
      padding: "0 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: "6px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "12px",
      opacity: 0.82,
      boxShadow: "0 6px 14px rgba(31,59,47,0.04)",
      scrollSnapAlign: "start",
      whiteSpace: "nowrap",
    },
    categoryChipActive: {
      background: "#1f3b2f",
      color: "#fff",
      borderColor: "#1f3b2f",
      boxShadow: "0 10px 22px rgba(31,59,47,0.18)",
      opacity: 1,
    },
    layout: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) 330px",
      gap: "18px",
      alignItems: "start",
    },
    mapWrap: {
      background: "rgba(255,253,248,0.96)",
      border: "1px solid rgba(31,59,47,0.08)",
      borderRadius: "28px",
      padding: "12px",
      boxShadow: "0 18px 40px rgba(31,59,47,0.08)",
      backdropFilter: "blur(12px)",
    },
    mapInner: {
      overflow: "hidden",
      borderRadius: "22px",
      height: "78vh",
      minHeight: "680px",
      boxShadow: "0 12px 28px rgba(0,0,0,0.1)",
    },
    sidePanel: {
      background: "rgba(255,253,248,0.96)",
      border: "1px solid rgba(31,59,47,0.08)",
      borderRadius: "28px",
      padding: "16px",
      height: "78vh",
      minHeight: "680px",
      overflow: "hidden",
      boxShadow: "0 18px 40px rgba(31,59,47,0.08)",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      backdropFilter: "blur(12px)",
    },
    sectionBlock: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      minHeight: 0,
      background: "rgba(255,255,255,0.58)",
      border: "1px solid rgba(31,59,47,0.06)",
      borderRadius: "16px",
      padding: "14px",
      boxShadow: "0 8px 22px rgba(31,59,47,0.04)",
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
      border: "1px solid rgba(0,0,0,0.06)",
      background: "#fff",
      color: "#1f3b2f",
      borderRadius: "999px",
      padding: "6px 10px",
      fontWeight: "700",
      fontSize: "0.74rem",
      cursor: "pointer",
      boxShadow: "0 6px 12px rgba(31,59,47,0.04)",
    },
    sectionScroller: {
      maxHeight: "190px",
      overflowY: "auto",
      paddingRight: "4px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      minHeight: 0,
    },
    sectionScrollerTall: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      paddingRight: "4px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },
    mobileSheetHandle: {
      width: "42px",
      height: "5px",
      borderRadius: "999px",
      background: "rgba(31,59,47,0.18)",
      alignSelf: "center",
    },
    mobileSheetTitle: {
      fontSize: "0.96rem",
      fontWeight: "800",
      color: "#1f3b2f",
      textAlign: "center",
    },
    mobileSheetSub: {
      fontSize: "0.78rem",
      color: "#60766b",
      textAlign: "center",
    },
    mobileSheetSection: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      marginBottom: "14px",
    },
    compactCard: {
      border: "1px solid rgba(31,59,47,0.08)",
      borderRadius: "16px",
      padding: "12px 12px 11px",
      background: "rgba(255,255,255,0.92)",
      boxShadow: "0 8px 18px rgba(31,59,47,0.05)",
      transition: "transform 0.18s ease, box-shadow 0.18s ease",
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
    compactIconLive: {
      background: HAPPENING_NOW_SOFT,
      border: `1px solid ${HAPPENING_NOW_PRIMARY}`,
      boxShadow: `0 0 0 6px rgba(34, 197, 94, 0.12)`,
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
    happeningNowBadge: {
      background: HAPPENING_NOW_SOFT,
      color: HAPPENING_NOW_TEXT,
      border: `1px solid ${HAPPENING_NOW_BORDER}`,
      boxShadow: "none",
    },
    currentlyAtButton: {
      borderRadius: "999px",
      background: CURRENTLY_AT_SOFT,
      border: `1px solid ${CURRENTLY_AT_BORDER}`,
      color: CURRENTLY_AT_TEXT,
      padding: "11px 15px",
      fontWeight: "bold",
      fontSize: "0.86rem",
      boxShadow: "none",
      cursor: "pointer",
    },
    currentlyAtButtonActive: {
      background: CURRENTLY_AT_PRIMARY,
      borderColor: CURRENTLY_AT_BORDER,
      color: CURRENTLY_AT_TEXT,
      boxShadow: "none",
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
      minHeight: "100vh",
      padding: "40px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      color: "#60766b",
      background: "linear-gradient(180deg, #f8f3ea 0%, #f4ede2 55%, #efe6d8 100%)",
      fontSize: "1rem",
      fontWeight: "700",
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
    popupCard: {
      width: "min(260px, 72vw)",
      color: "#1f3b2f",
    },
    popupStatusRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginBottom: "10px",
    },
    popupStatusChip: {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: "999px",
      padding: "5px 10px",
      fontSize: "0.72rem",
      fontWeight: "800",
      lineHeight: 1,
    },
    popupHappeningNowChip: {
      background: HAPPENING_NOW_SOFT,
      color: HAPPENING_NOW_TEXT,
      border: `1px solid ${HAPPENING_NOW_BORDER}`,
    },
    popupCurrentlyAtChip: {
      background: CURRENTLY_AT_SOFT,
      color: CURRENTLY_AT_TEXT,
      border: `1px solid ${CURRENTLY_AT_BORDER}`,
    },
    popupHeader: {
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      marginBottom: "10px",
    },
    popupIcon: {
      width: "36px",
      height: "36px",
      borderRadius: "999px",
      background: "#edf5ef",
      border: "1px solid #d9e0d7",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      flexShrink: 0,
    },
    popupTitleWrap: {
      minWidth: 0,
      flex: 1,
    },
    popupTitle: {
      margin: 0,
      fontSize: "1rem",
      fontWeight: "800",
      lineHeight: 1.2,
      color: "#1f3b2f",
    },
    popupEventTitle: {
      margin: 0,
      fontSize: "1.12rem",
      fontWeight: "900",
      lineHeight: 1.18,
      color: "#14281f",
    },
    popupBusinessName: {
      margin: "6px 0 0",
      fontSize: "0.8rem",
      color: "#60766b",
      lineHeight: 1.35,
      fontWeight: "700",
    },
    popupSubtitle: {
      margin: "3px 0 0",
      fontSize: "0.82rem",
      color: "#60766b",
      lineHeight: 1.4,
    },
    popupLocation: {
      marginTop: "10px",
      padding: "10px 12px",
      borderRadius: "14px",
      background: "rgba(248, 243, 234, 0.78)",
      border: "1px solid rgba(31,59,47,0.08)",
      color: "#41584d",
      fontSize: "0.86rem",
      lineHeight: 1.45,
    },
    popupDetailList: {
      marginTop: "10px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    popupDetailRow: {
      fontSize: "0.82rem",
      color: "#60766b",
      lineHeight: 1.4,
    },
    popupDetailLabel: {
      color: "#1f3b2f",
      fontWeight: "700",
      marginRight: "6px",
    },
    popupNote: {
      marginTop: "10px",
      fontSize: "0.84rem",
      color: "#41584d",
      lineHeight: 1.45,
    },
    popupActionRow: {
      marginTop: "12px",
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    },
    popupPrimaryAction: {
      padding: "9px 14px",
      background: "#173d33",
      color: "#ffffff",
      border: "none",
      borderRadius: "999px",
      fontWeight: "800",
      fontSize: "0.82rem",
      cursor: "pointer",
    },
    popupSecondaryAction: {
      padding: "9px 14px",
      background: "#fff",
      color: "#173d33",
      border: "1px solid #d9e0d7",
      borderRadius: "999px",
      fontWeight: "800",
      fontSize: "0.82rem",
      cursor: "pointer",
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
    return <div style={styles.loadingBox}>Loading the live discovery map…</div>;
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
                  border: visual.border || visual.color,
                  isLive: event.computedStatus === "live",
                })}
              />
            );
          })}

        {filteredBusinesses
          .filter((business) => {
            if (business.latitude == null || business.longitude == null) return false;

            const markerKey = markerLocationKey(business.id, business.latitude, business.longitude);
            return !markerKey || !liveEventMarkerKeys.has(markerKey);
          })
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
                  isLive: false,
                })}
              />
            );
          })}
      </MapContainer>
    );
  }

  const mapViewCss = `
    @keyframes livePulse {
      0% {
        transform: translateX(-50%) scale(0.8);
        opacity: 0.6;
      }
      70% {
        transform: translateX(-50%) scale(1.8);
        opacity: 0;
      }
      100% {
        transform: translateX(-50%) scale(1.8);
        opacity: 0;
      }
    }

    .map-pin {
      position: relative;
      width: 38px;
      height: 52px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }

    .map-pin__pulse {
      content: "";
      position: absolute;
      top: 0;
      left: 50%;
      width: 34px;
      height: 34px;
      transform: translateX(-50%) scale(0.8);
      border-radius: 50%;
      background: rgba(34, 197, 94, 0.35);
      border: none;
      z-index: 0;
      animation: livePulse 2s ease-out infinite;
      pointer-events: none;
      will-change: transform, opacity;
    }

    .map-pin__body {
      position: relative;
      width: 34px;
      height: 34px;
      flex-shrink: 0;
      border-radius: 999px;
      background: var(--pin-background);
      border: 3px solid var(--pin-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      box-shadow: 0 8px 18px rgba(0,0,0,0.20);
      z-index: 2;
      transition: transform 180ms ease-in-out;
    }

    .map-pin__tip {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
    }

    .map-pin__tip--outer {
      top: 28px;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 14px solid var(--pin-border);
      z-index: 1;
    }

    .map-pin__tip--inner {
      top: 27px;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 11px solid var(--pin-background);
      z-index: 2;
    }

    @keyframes mapSheetUp {
      from { opacity: 0; transform: translateY(18px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes mapFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .mapview-compact-card:hover {
      transform: translateY(-1px) scale(1.01);
      box-shadow: 0 14px 26px rgba(31,59,47,0.08);
    }

    .mapview-compact-card {
      animation: app-card-enter 280ms var(--app-ease) both;
      transition: transform var(--app-transition-fast) var(--app-ease),
        box-shadow var(--app-transition-fast) var(--app-ease),
        background-color var(--app-transition-fast) var(--app-ease);
    }

    @media (max-width: 1024px) {
      .mapview-layout {
        grid-template-columns: 1fr !important;
      }
    }

    .mapview-mobile-sheet {
      display: none;
    }

    .mapview-mobile-controls {
      display: none;
    }

    .mapview-mobile-filter-overlay {
      display: none;
    }

    @media (max-width: 768px) {
      .mapview-status-row,
      .mapview-desktop-filters {
        display: none !important;
      }

      .mapview-mobile-controls {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 14px;
      }

      .mapview-mobile-control-button {
        height: 36px;
        min-height: 36px;
        border-radius: 999px;
        border: 1px solid rgba(31,59,47,0.1);
        background: rgba(255, 252, 246, 0.98);
        color: #1f3b2f;
        padding: 0 14px;
        font-size: 13px;
        font-weight: 600;
        line-height: 1;
        white-space: nowrap;
        box-shadow: 0 8px 18px rgba(31,59,47,0.08);
        transition: transform var(--app-transition-fast) var(--app-ease),
          box-shadow var(--app-transition-fast) var(--app-ease),
          background-color var(--app-transition-fast) var(--app-ease),
          color var(--app-transition-fast) var(--app-ease);
      }

      .mapview-mobile-control-button--filters {
        flex: 1;
        justify-content: space-between;
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }
+
+      .mapview-mobile-control-button__label {
+        display: inline-flex;
+        align-items: center;
+        min-width: 0;
+      }
+
+      .mapview-mobile-control-button__badge {
+        display: inline-flex;
+        align-items: center;
+        justify-content: center;
+        min-width: 24px;
+        height: 24px;
+        padding: 0 8px;
+        border-radius: 999px;
+        background: rgba(31,59,47,0.08);
+        border: 1px solid rgba(31,59,47,0.08);
+        color: #173d33;
+        font-size: 12px;
+        font-weight: 700;
+        line-height: 1;
+        flex-shrink: 0;
+      }

      .mapview-mobile-control-button--live {
        min-width: 122px;
      }

      .mapview-mobile-control-button.is-active {
        background: ${HAPPENING_NOW_PRIMARY};
        color: ${HAPPENING_NOW_TEXT};
        border-color: ${HAPPENING_NOW_BORDER};
        box-shadow: 0 14px 28px ${HAPPENING_NOW_GLOW};
      }

      .mapview-mobile-control-button:active {
        transform: scale(0.98);
      }

      .mapview-sidebar {
        display: none !important;
      }

      .mapview-layout {
        grid-template-columns: 1fr !important;
      }

      .mapview-map-inner {
        height: calc(100vh - 290px) !important;
        min-height: 56vh !important;
      }

      .mapview-map-wrap {
        padding: 10px !important;
      }

      .mapview-filter-bar {
        position: sticky;
        top: calc(var(--safe-top) + 8px);
        z-index: 1200;
      }

      .mapview-mobile-sheet {
        display: block;
        position: fixed;
        left: 10px;
        right: 10px;
        bottom: calc(var(--safe-bottom) + var(--mobile-bottom-nav-height, 88px) + 8px);
        z-index: 1300;
        background: rgba(255, 253, 248, 0.98);
        border-radius: 22px;
        box-shadow: 0 -10px 28px rgba(0,0,0,0.12);
        border: 1px solid rgba(31,59,47,0.08);
        max-height: 48vh;
        overflow: hidden;
        backdrop-filter: blur(12px);
        animation: mapSheetUp 220ms var(--app-ease) both;
      }

      .mapview-mobile-filter-overlay {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(14, 22, 19, 0.34);
        z-index: 1690;
        animation: mapFadeIn 180ms ease both;
      }

      .mapview-mobile-filter-sheet {
        position: fixed;
        left: 10px;
        right: 10px;
        bottom: calc(var(--safe-bottom) + var(--mobile-bottom-nav-height, 88px) + 8px);
        z-index: 1700;
        border-radius: 24px;
        background: rgba(255,253,248,0.98);
        border: 1px solid rgba(31,59,47,0.08);
        box-shadow: 0 18px 42px rgba(0,0,0,0.18);
        overflow: hidden;
        backdrop-filter: blur(14px);
        animation: mapSheetUp 220ms var(--app-ease) both;
      }

      .mapview-mobile-filter-header {
        padding: 16px 16px 12px;
        border-bottom: 1px solid rgba(31,59,47,0.08);
      }

      .mapview-mobile-filter-body {
        max-height: calc(58vh - 82px);
        overflow-y: auto;
        padding: 16px;
      }

      .mapview-mobile-filter-actions {
        display: flex;
        gap: 10px;
        margin-top: 14px;
      }

      .mapview-mobile-filter-actions button {
        min-height: 48px;
        flex: 1;
      }

      .mapview-mobile-sheet summary {
        list-style: none;
        cursor: pointer;
        padding: 14px 18px 18px;
        min-height: 80px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8px;
      }

      .mapview-mobile-sheet summary::-webkit-details-marker {
        display: none;
      }

      .mapview-mobile-sheet-body {
        max-height: calc(48vh - 80px);
        overflow-y: auto;
        padding: 0 16px 16px;
      }

      .mapview-mobile-sheet .mapview-compact-card {
        margin-bottom: 12px;
      }

      .mapview-compact-card button {
        min-height: 40px;
        padding: 10px 14px !important;
      }
    }
  `;

  return (
    <div style={styles.page}>
      <style>{mapViewCss}</style>
      <div style={styles.container}>
        <div style={styles.headerWrap}>
          <p style={styles.eyebrow}>Local discovery map</p>
          <div style={styles.headingRow}>
            <h1 style={styles.heading}>What’s happening near you</h1>
            <span style={styles.liveIndicator} />
          </div>
          <p style={styles.subheading}>
            This is the main discovery experience — open the map, keep filters in
            view, and jump straight into what’s live and nearby.
          </p>
        </div>

        <div style={styles.topBar}>
          <div style={styles.statChips}>
            <div style={{ ...styles.topPillBase, ...styles.statChip, ...styles.sellersNearbyChip }}>
              Sellers nearby: {filteredBusinesses.length}
            </div>
            <div style={{ ...styles.topPillBase, ...styles.statChip, ...styles.happeningNowChip }}>
              Get It Now: {counts.live}
            </div>
            <div style={{ ...styles.topPillBase, ...styles.statChip, ...styles.comingUpChip }}>
              Coming up: {counts.upcoming}
            </div>
            <button
              type="button"
              onClick={() => setSelectedView((prev) => (prev === "live" ? "all" : "live"))}
              style={{
                ...styles.topPillBase,
                ...styles.currentlyAtButton,
                ...(selectedView === "live" ? styles.currentlyAtButtonActive : {}),
              }}
            >
              Pop-Up At
            </button>
          </div>
        </div>

        {activeCategoryLabel ? (
          <div style={styles.categoryContextPill}>Showing {activeCategoryLabel} near you</div>
        ) : null}

        <div className="mapview-mobile-controls">
          <button
            type="button"
            className="mapview-mobile-control-button mapview-mobile-control-button--filters"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <span className="mapview-mobile-control-button__label">Browse Categories</span>
            <span className="mapview-mobile-control-button__badge">{selectedCategories.length}</span>
          </button>
        </div>

        <div className="mapview-status-row" style={styles.mainStatusRow}>
          {[
            { key: "all", label: "All" },
            { key: "upcoming", label: "Upcoming" },
          ].map((item) => {
            const active = selectedView === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedView(item.key)}
                style={{
                  ...styles.topPillBase,
                  ...styles.statusButton,
                  ...(active ? styles.statusButtonActive : {}),
                  ...(active && item.key === "live" ? styles.happeningNowChip : {}),
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mapview-filter-bar mapview-desktop-filters" style={styles.categoryScrollerWrap}>
          <div style={styles.categoryBarTop}>
            <div style={styles.categoryBarTitle}>
              Refine the map without losing your place — tap a category to show or hide it.
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

        <div className="mapview-layout" style={styles.layout}>
          <div className="mapview-map-wrap" style={styles.mapWrap}>
            <div className="mapview-map-inner" style={styles.mapInner}>
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
                          border: visual.border || visual.color,
                          isLive: event.computedStatus === "live",
                        })}
                      >
                        <Popup>
                          <div style={styles.popupCard}>
                            <div style={styles.popupStatusRow}>
                              {event.computedStatus === "live" ? (
                                <div style={{ ...styles.popupStatusChip, ...styles.popupHappeningNowChip }}>
                                  Get It Now
                                </div>
                              ) : null}

                              {event.computedStatus === "live" ? (
                                <div style={{ ...styles.popupStatusChip, ...styles.popupCurrentlyAtChip }}>
                                  Pop-Up At
                                </div>
                              ) : null}
                            </div>

                            <div style={styles.popupHeader}>
                              <div style={styles.popupIcon}>{emoji}</div>
                              <div style={styles.popupTitleWrap}>
                                <h3 style={styles.popupEventTitle}>
                                  {event.computedStatus === "live"
                                    ? `Now at ${event.title || "Current Event"} 🔥`
                                    : event.title || "Current Event"}
                                </h3>
                                {event.businesses?.business_name ? (
                                  <p style={styles.popupBusinessName}>{event.businesses.business_name}</p>
                                ) : null}
                              </div>
                            </div>

                            {event.address || event.city || event.state ? (
                              <div style={styles.popupLocation}>
                                {event.address || [event.city, event.state].filter(Boolean).join(", ")}
                              </div>
                            ) : null}

                            <div style={styles.popupDetailList}>
                              <div style={styles.popupDetailRow}>
                                <span style={styles.popupDetailLabel}>Category</span>
                                {event.businesses?.category || "—"}
                              </div>
                              <div style={styles.popupDetailRow}>
                                <span style={styles.popupDetailLabel}>Type</span>
                                {event.type || "—"}
                              </div>
                              <div style={styles.popupDetailRow}>
                                <span style={styles.popupDetailLabel}>Starts</span>
                                {formatDateTime(event.start_time)}
                              </div>
                              <div style={styles.popupDetailRow}>
                                <span style={styles.popupDetailLabel}>Ends</span>
                                {formatDateTime(event.end_time)}
                              </div>
                            </div>

                            {event.note ? (
                              <div style={{ ...styles.popupNote, color: "#6b7f75", fontSize: "0.8rem" }}>{event.note}</div>
                            ) : null}

                            <div style={styles.popupActionRow}>
                              <button
                                type="button"
                                onClick={() => openSellerProfile(event.businesses?.id)}
                                style={styles.popupPrimaryAction}
                              >
                                View Profile
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
                                  ...styles.popupSecondaryAction,
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
                  .filter((business) => {
                    if (business.latitude == null || business.longitude == null) return false;

                    const markerKey = markerLocationKey(
                      business.id,
                      business.latitude,
                      business.longitude
                    );

                    return !markerKey || !liveEventMarkerKeys.has(markerKey);
                  })
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
                          isLive: false,
                        })}
                      >
                        <Popup>
                          <div style={styles.popupCard}>
                            <div style={styles.popupHeader}>
                              <div style={styles.popupIcon}>{emoji}</div>
                              <div style={styles.popupTitleWrap}>
                                <h3 style={styles.popupTitle}>
                                  {business.business_name || "Business"}
                                </h3>
                                <p style={styles.popupSubtitle}>
                                  {business.category || "Local business"}
                                </p>
                              </div>
                            </div>

                            {business.address || business.location ? (
                              <div style={styles.popupLocation}>
                                {business.address || business.location}
                              </div>
                            ) : null}

                            {business.description ? (
                              <div style={styles.popupNote}>{business.description}</div>
                            ) : null}

                            <div style={styles.popupActionRow}>
                              <button
                                type="button"
                                onClick={() => openSellerProfile(business.id)}
                                style={styles.popupPrimaryAction}
                              >
                                View Profile
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleFollow(business.id, business.business_name || "this seller")
                                }
                                disabled={followLoadingId === business.id}
                                style={{
                                  ...styles.popupSecondaryAction,
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

          <aside className="mapview-sidebar" style={styles.sidePanel}>
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
                      <div key={item.id} className="mapview-compact-card" style={styles.compactCard}>
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
                <h3 style={styles.sectionTitle}>✨ Get It Now</h3>
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
                      <div key={item.id} className="mapview-compact-card" style={styles.compactCard}>
                        <div
                          style={{
                            ...styles.badge,
                            ...styles.happeningNowBadge,
                          }}
                        >
                          Get It Now
                        </div>

                        <div style={styles.compactTop}>
                          <div style={styles.compactIdentity}>
                            <div style={{ ...styles.compactIcon, ...styles.compactIconLive }}>{item.icon}</div>

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
                      <div key={item.id} className="mapview-compact-card" style={styles.compactCard}>
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

        {mobileFiltersOpen ? (
          <>
            <div
              className="mapview-mobile-filter-overlay"
              onClick={() => setMobileFiltersOpen(false)}
            />

            <div className="mapview-mobile-filter-sheet">
              <div className="mapview-mobile-filter-header">
                <div style={styles.mobileSheetHandle} />
                <div style={{ ...styles.mobileSheetTitle, marginTop: 10 }}>Filters</div>
                <div style={{ ...styles.mobileSheetSub, marginTop: 4 }}>
                  Fine-tune what shows on the map without changing the underlying filter logic.
                </div>
              </div>

              <div className="mapview-mobile-filter-body">
                <div style={{ ...styles.mobileSheetSection, marginBottom: 18 }}>
                  <h3 style={styles.sectionTitle}>View</h3>

                  <div style={{ ...styles.mainStatusRow, marginTop: 0, marginBottom: 0 }}>
                    {[
                      { key: "all", label: "All" },
                      { key: "live", label: "Pop-Up At" },
                      { key: "upcoming", label: "Upcoming" },
                    ].map((item) => {
                      const active = selectedView === item.key;
                      return (
                        <button
                          key={`mobile-${item.key}`}
                          type="button"
                          onClick={() => setSelectedView(item.key)}
                          style={{
                            ...styles.topPillBase,
                            ...styles.statusButton,
                            flex: "1 1 calc(50% - 8px)",
                            ...(active ? styles.statusButtonActive : {}),
                          }}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={styles.mobileSheetSection}>
                  <h3 style={styles.sectionTitle}>Categories</h3>

                  <div style={{ ...styles.categoryScroller, flexWrap: "wrap", overflowX: "visible", paddingBottom: 0 }}>
                    {allCategories.map((cat) => {
                      const active = selectedCategories.includes(cat.key);

                      return (
                        <button
                          key={`mobile-filter-${cat.key}`}
                          type="button"
                          onClick={() => toggleCategory(cat.key)}
                          style={{
                            ...styles.categoryChip,
                            minWidth: "calc(50% - 6px)",
                            minHeight: "50px",
                            padding: "0 14px",
                            ...(active ? styles.categoryChipActive : {}),
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "14px" }}>{cat.emoji}</span>
                            <span style={{ textTransform: "capitalize" }}>{cat.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mapview-mobile-filter-actions">
                    <button type="button" onClick={turnAllCategoriesOn} style={styles.miniButton}>
                      Turn all on
                    </button>
                    <button type="button" onClick={clearAllCategories} style={styles.miniButton}>
                      Clear all
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    style={{ ...styles.primaryModalButton, width: "100%", marginTop: 14 }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}

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
