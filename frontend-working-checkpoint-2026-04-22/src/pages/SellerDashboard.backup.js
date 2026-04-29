import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const CATEGORY_OPTIONS = [
  "Fresh Eggs",
  "Fresh Dairy",
  "Butter",
  "Milk",
  "Goat Milk",
  "Beef",
  "Chicken",
  "Produce",
  "Honey",
  "Baked Goods",
  "Farm Stand",
  "Seafood",
  "Apparel",
];

const EVENT_TYPE_OPTIONS = [
  "popup",
  "booth",
  "market",
  "food_truck",
  "farm_stand",
];

const OPENCAGE_API_KEY = process.env.REACT_APP_OPENCAGE_API_KEY || "";

function formatDisplayDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString();
}

function formatDisplayDateTime(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString();
}

function getEventStatus(event) {
  const now = new Date();
  const start = event.start_time ? new Date(event.start_time) : null;
  const end = event.end_time ? new Date(event.end_time) : null;

  if (!event?.is_active) return "inactive";
  if (!start) return "scheduled";
  if (start && now < start) return "upcoming";
  if (start && end && now >= start && now <= end) return "live";
  if (start && end && now > end) return "completed";
  if (start && !end && now >= start) return "live";

  return "scheduled";
}

function toDatetimeLocalValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function SellerDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date());

  const [editMode, setEditMode] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");

  const [businessForm, setBusinessForm] = useState({
    business_name: "",
    description: "",
    category: "",
    location: "",
    image_url: "",
  });

  const [newImage, setNewImage] = useState(null);

  const [eventForm, setEventForm] = useState({
    title: "",
    type: "popup",
    address: "",
    city: "Merritt Island",
    state: "FL",
    zip: "",
    latitude: "",
    longitude: "",
    start_time: toDatetimeLocalValue(new Date()),
    end_time: toDatetimeLocalValue(new Date(Date.now() + 2 * 60 * 60 * 1000)),
    note: "",
    is_active: true,
  });

  const [creatingEvent, setCreatingEvent] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initDashboard() {
      try {
        setLoading(true);
        setMessage("");

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const user = userData?.user || null;

        if (!mounted) return;

        if (!user) {
          navigate("/seller-auth");
          return;
        }

        setCurrentUser(user);

        const { data: businessRows, error: businessError } = await supabase
          .from("businesses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (businessError) throw businessError;

        const latestBusiness = businessRows?.[0] || null;

        if (!mounted) return;

        setBusiness(latestBusiness);

        if (latestBusiness) {
          setBusinessForm({
            business_name: latestBusiness.business_name || "",
            description: latestBusiness.description || "",
            category: latestBusiness.category || "",
            location: latestBusiness.location || "",
            image_url: latestBusiness.image_url || "",
          });

          const { data: eventRows, error: eventError } = await supabase
            .from("seller_events")
            .select("*")
            .eq("business_id", latestBusiness.id)
            .order("start_time", { ascending: true });

          if (eventError) throw eventError;

          if (!mounted) return;
          setEvents(eventRows || []);
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error("Seller dashboard load error:", err);
        if (mounted) {
          setMessage(err.message || "Could not load seller dashboard.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initDashboard();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  function handleBusinessChange(field, value) {
    setBusinessForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleEventChange(field, value) {
    setEventForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function reloadEvents(businessId) {
    const { data: eventRows, error: eventError } = await supabase
      .from("seller_events")
      .select("*")
      .eq("business_id", businessId)
      .order("start_time", { ascending: true });

    if (eventError) throw eventError;

    setEvents(eventRows || []);
  }

  async function uploadBusinessImage() {
    if (!newImage || !currentUser) return businessForm.image_url || "";

    setUploadingImage(true);

    try {
      const fileExt = newImage.name.split(".").pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `business-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("business-images")
        .upload(filePath, newImage, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("business-images")
        .getPublicUrl(filePath);

      return data?.publicUrl || "";
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSaveBusiness() {
    if (!business) return;

    setSavingBusiness(true);
    setMessage("");

    try {
      let nextImageUrl = businessForm.image_url || "";

      if (newImage) {
        nextImageUrl = await uploadBusinessImage();
      }

      const payload = {
        business_name: businessForm.business_name.trim(),
        description: businessForm.description.trim(),
        category: businessForm.category.trim(),
        location: businessForm.location.trim(),
        image_url: nextImageUrl,
      };

      const { data, error } = await supabase
        .from("businesses")
        .update(payload)
        .eq("id", business.id)
        .select()
        .single();

      if (error) throw error;

      setBusiness(data);
      setBusinessForm({
        business_name: data.business_name || "",
        description: data.description || "",
        category: data.category || "",
        location: data.location || "",
        image_url: data.image_url || "",
      });
      setNewImage(null);
      setEditMode(false);
      setMessage("Business profile updated.");
    } catch (err) {
      console.error("handleSaveBusiness error:", err);
      setMessage(err.message || "Could not save business profile.");
    } finally {
      setSavingBusiness(false);
    }
  }

  async function geocodeAddress() {
    const addressParts = [
      eventForm.address,
      eventForm.city,
      eventForm.state,
      eventForm.zip,
    ].filter(Boolean);

    const query = addressParts.join(", ").trim();

    if (!query) {
      setMessage("Add an address before geocoding.");
      return null;
    }

    if (!OPENCAGE_API_KEY) {
      setMessage("OpenCage key not found in environment.");
      return null;
    }

    setGeocoding(true);
    setMessage("");

    try {
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
        query
      )}&key=${encodeURIComponent(OPENCAGE_API_KEY)}&limit=1&no_annotations=1`;

      const response = await fetch(url);
      const json = await response.json();

      const result = json?.results?.[0];

      if (!result?.geometry) {
        setMessage("Could not geocode that address.");
        return null;
      }

      const lat = String(result.geometry.lat);
      const lng = String(result.geometry.lng);

      setEventForm((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));

      setMessage("Address geocoded successfully.");
      return {
        latitude: Number(lat),
        longitude: Number(lng),
      };
    } catch (err) {
      console.error("geocodeAddress error:", err);
      setMessage("Geocoding failed.");
      return null;
    } finally {
      setGeocoding(false);
    }
  }

  async function handleCreateEvent() {
    if (!business) return;

    setCreatingEvent(true);
    setMessage("");

    try {
      let latitude = eventForm.latitude ? Number(eventForm.latitude) : null;
      let longitude = eventForm.longitude ? Number(eventForm.longitude) : null;

      if (!latitude || !longitude) {
        const geocoded = await geocodeAddress();
        if (!geocoded) {
          setCreatingEvent(false);
          return;
        }

        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
      }

      const fullAddress = [
        eventForm.address,
        eventForm.city,
        eventForm.state,
        eventForm.zip,
      ]
        .filter(Boolean)
        .join(", ");

      const payload = {
        business_id: business.id,
        title: eventForm.title.trim(),
        type: eventForm.type,
        address: fullAddress,
        city: eventForm.city.trim(),
        state: eventForm.state.trim(),
        latitude,
        longitude,
        start_time: new Date(eventForm.start_time).toISOString(),
        end_time: eventForm.end_time
          ? new Date(eventForm.end_time).toISOString()
          : null,
        is_active: eventForm.is_active,
        note: eventForm.note.trim(),
      };

      const { error } = await supabase.from("seller_events").insert([payload]);

      if (error) throw error;

      await reloadEvents(business.id);

      setEventForm({
        title: "",
        type: "popup",
        address: "",
        city: "Merritt Island",
        state: "FL",
        zip: "",
        latitude: "",
        longitude: "",
        start_time: toDatetimeLocalValue(new Date()),
        end_time: toDatetimeLocalValue(new Date(Date.now() + 2 * 60 * 60 * 1000)),
        note: "",
        is_active: true,
      });

      setMessage("Event created successfully.");
    } catch (err) {
      console.error("handleCreateEvent error:", err);
      setMessage(err.message || "Could not create event.");
    } finally {
      setCreatingEvent(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/seller-auth");
  }

  const counts = useMemo(() => {
    const live = events.filter((event) => getEventStatus(event) === "live").length;
    const upcoming = events.filter((event) => getEventStatus(event) === "upcoming").length;
    const completed = events.filter((event) => getEventStatus(event) === "completed").length;

    return {
      live,
      upcoming,
      completed,
      total: events.length,
    };
  }, [events]);

  const selectedDayEvents = useMemo(() => {
    const selected = selectedDay.toDateString();

    return events.filter((event) => {
      if (!event.start_time) return false;
      return new Date(event.start_time).toDateString() === selected;
    });
  }, [events, selectedDay]);

  const currentMonth = selectedDay.getMonth();
  const currentYear = selectedDay.getFullYear();

  const monthLabel = selectedDay.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < startWeekday; i += 1) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarDays.push(new Date(currentYear, currentMonth, day));
  }

  function goToPreviousMonth() {
    setSelectedDay(new Date(currentYear, currentMonth - 1, 1));
  }

  function goToNextMonth() {
    setSelectedDay(new Date(currentYear, currentMonth + 1, 1));
  }

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>Loading seller dashboard...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.emptyCard}>
            <p style={styles.eyebrow}>Seller Dashboard</p>
            <h1 style={styles.title}>No business found yet</h1>
            <p style={styles.subtitle}>
              Create your business first, then you’ll be able to manage everything
              from your dashboard.
            </p>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => navigate("/list-your-business")}
            >
              Create Business
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.heroCard}>
          <div>
            <p style={styles.heroEyebrow}>The Source Seller Dashboard</p>
            <h1 style={styles.heroTitle}>
              {business.business_name || "Your Business"}
            </h1>
            <p style={styles.heroSubtitle}>
              Plan ahead, track events, and show people where you’re live.
            </p>
          </div>

          <div style={styles.heroActions}>
            <span
              style={{
                ...styles.statusPill,
                background:
                  business.status === "approved" ? "#edf7f1" : "#fff7e8",
                color: business.status === "approved" ? "#1f513f" : "#8a5a00",
                border:
                  business.status === "approved"
                    ? "1px solid #cfe7d8"
                    : "1px solid #ecd9a8",
              }}
            >
              {business.status || "pending"}
            </span>

            <button type="button" style={styles.secondaryButton} onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>

        {message ? (
          <div
            style={{
              ...styles.messageBox,
              color:
                message.toLowerCase().includes("success") ||
                message.toLowerCase().includes("updated")
                  ? "#1f513f"
                  : "#b42318",
              background:
                message.toLowerCase().includes("success") ||
                message.toLowerCase().includes("updated")
                  ? "#edf7f1"
                  : "#fff2f0",
              border:
                message.toLowerCase().includes("success") ||
                message.toLowerCase().includes("updated")
                  ? "1px solid #cfe7d8"
                  : "1px solid #f2c9c2",
            }}
          >
            {message}
          </div>
        ) : null}

        <div style={styles.topGrid}>
          <div style={styles.businessCard}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.cardEyebrow}>Business Profile</p>
                <h3 style={styles.cardTitle}>Edit your business info</h3>
              </div>

              <button
                type="button"
                style={editMode ? styles.secondaryButton : styles.primaryButtonSmall}
                onClick={() => {
                  if (editMode) {
                    setEditMode(false);
                    setNewImage(null);
                    setBusinessForm({
                      business_name: business.business_name || "",
                      description: business.description || "",
                      category: business.category || "",
                      location: business.location || "",
                      image_url: business.image_url || "",
                    });
                    setMessage("");
                  } else {
                    setEditMode(true);
                  }
                }}
              >
                {editMode ? "Cancel" : "Edit Business Info"}
              </button>
            </div>

            <div style={styles.businessProfileLayout}>
              <div style={styles.businessImageWrap}>
                {businessForm.image_url ? (
                  <img
                    src={businessForm.image_url}
                    alt={businessForm.business_name || "Business"}
                    style={styles.businessImage}
                  />
                ) : (
                  <div style={styles.businessImagePlaceholder}>No Image</div>
                )}
              </div>

              <div style={styles.businessDetails}>
                {editMode ? (
                  <>
                    <label style={styles.label}>Business name</label>
                    <input
                      style={styles.input}
                      value={businessForm.business_name}
                      onChange={(e) => handleBusinessChange("business_name", e.target.value)}
                    />

                    <label style={styles.label}>Category</label>
                    <select
                      style={styles.select}
                      value={businessForm.category}
                      onChange={(e) => handleBusinessChange("category", e.target.value)}
                    >
                      <option value="">Select a category</option>
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <label style={styles.label}>Location</label>
                    <input
                      style={styles.input}
                      value={businessForm.location}
                      onChange={(e) => handleBusinessChange("location", e.target.value)}
                    />

                    <label style={styles.label}>Description</label>
                    <textarea
                      style={styles.textarea}
                      value={businessForm.description}
                      onChange={(e) => handleBusinessChange("description", e.target.value)}
                    />

                    <label style={styles.label}>Replace photo/logo</label>
                    <label style={styles.uploadBox}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewImage(e.target.files?.[0] || null)}
                        style={{ display: "none" }}
                      />
                      <div style={styles.uploadInner}>
                        <div style={styles.uploadIcon}>📷</div>
                        <p style={styles.uploadTitle}>
                          {newImage ? newImage.name : "Choose a new image"}
                        </p>
                        <p style={styles.uploadText}>
                          Upload a logo, storefront, booth, or product photo
                        </p>
                      </div>
                    </label>

                    <div style={styles.inlineButtonRow}>
                      <button
                        type="button"
                        style={styles.primaryButton}
                        onClick={handleSaveBusiness}
                        disabled={savingBusiness || uploadingImage}
                      >
                        {savingBusiness || uploadingImage ? "Saving..." : "Save Business Info"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Business Name</span>
                      <span style={styles.infoValue}>{business.business_name || "—"}</span>
                    </div>

                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Category</span>
                      <span style={styles.infoValue}>{business.category || "—"}</span>
                    </div>

                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Location</span>
                      <span style={styles.infoValue}>{business.location || "—"}</span>
                    </div>

                    <div style={styles.infoBlock}>
                      <span style={styles.infoLabel}>Description</span>
                      <p style={styles.infoParagraph}>{business.description || "—"}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={styles.statsColumn}>
            <div style={styles.statsCard}>
              <h3 style={styles.cardTitle}>Event Progress Tracker</h3>
              <div style={styles.metricBox}>Live Now: {counts.live}</div>
              <div style={styles.metricBox}>Upcoming: {counts.upcoming}</div>
              <div style={styles.metricBox}>Completed: {counts.completed}</div>
              <div style={styles.metricBox}>Total Events: {counts.total}</div>
            </div>

            <div style={styles.statsCard}>
              <h3 style={styles.cardTitle}>Selected Day</h3>
              <p style={styles.smallMuted}>{formatDisplayDate(selectedDay)}</p>

              {selectedDayEvents.length === 0 ? (
                <p style={styles.smallMuted}>No events on this day yet.</p>
              ) : (
                selectedDayEvents.map((event) => (
                  <div key={event.id} style={styles.selectedEventCard}>
                    <div style={styles.selectedEventTop}>
                      <strong>{event.title || "Untitled Event"}</strong>
                      <span
                        style={{
                          ...styles.miniStatusPill,
                          background:
                            getEventStatus(event) === "live" ? "#edf7f1" : "#f5f5f5",
                          color:
                            getEventStatus(event) === "live" ? "#1f513f" : "#666666",
                        }}
                      >
                        {getEventStatus(event)}
                      </span>
                    </div>

                    <p style={styles.eventLine}>Type: {event.type || "—"}</p>
                    <p style={styles.eventLine}>Location: {event.address || event.city || "—"}</p>
                    <p style={styles.eventLine}>Starts: {formatDisplayDateTime(event.start_time)}</p>
                    <p style={styles.eventLine}>Ends: {formatDisplayDateTime(event.end_time)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={styles.bottomGrid}>
          <div style={styles.calendarCard}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.cardTitle}>Event Calendar</h3>
                <p style={styles.smallMuted}>
                  Click any day to see what’s booked there.
                </p>
              </div>

              <div style={styles.calendarNav}>
                <button type="button" style={styles.calendarArrow} onClick={goToPreviousMonth}>
                  ←
                </button>
                <strong>{monthLabel}</strong>
                <button type="button" style={styles.calendarArrow} onClick={goToNextMonth}>
                  →
                </button>
              </div>
            </div>

            <div style={styles.weekRow}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} style={styles.weekCell}>
                  {day}
                </div>
              ))}
            </div>

            <div style={styles.calendarGrid}>
              {calendarDays.map((dateObj, index) => {
                if (!dateObj) return <div key={`blank-${index}`} style={styles.blankDay} />;

                const isSelected = dateObj.toDateString() === selectedDay.toDateString();

                const dayEvents = events.filter((event) => {
                  if (!event.start_time) return false;
                  return new Date(event.start_time).toDateString() === dateObj.toDateString();
                });

                const hasLive = dayEvents.some((event) => getEventStatus(event) === "live");

                return (
                  <button
                    key={dateObj.toISOString()}
                    type="button"
                    style={{
                      ...styles.dayCell,
                      ...(isSelected ? styles.dayCellSelected : {}),
                    }}
                    onClick={() => setSelectedDay(dateObj)}
                  >
                    <div style={styles.dayNumberRow}>
                      <span>{dateObj.getDate()}</span>
                      {isSelected ? <span style={styles.todayTag}>Selected</span> : null}
                    </div>

                    <div style={styles.dayEventsWrap}>
                      {dayEvents.slice(0, 2).map((event) => (
                        <div key={event.id} style={styles.dayEventChip}>
                          {hasLive ? "🟢" : "•"} {event.title || "Event"}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.eventFormCard}>
            <h3 style={styles.cardTitle}>Create Live Event</h3>
            <p style={styles.smallMuted}>
              Add your exact event address so your business can appear on the map.
            </p>

            <div style={styles.formStack}>
              <label style={styles.label}>Event title</label>
              <input
                style={styles.input}
                value={eventForm.title}
                onChange={(e) => handleEventChange("title", e.target.value)}
                placeholder="Ex. RDNKN Booth"
              />

              <label style={styles.label}>Type</label>
              <select
                style={styles.select}
                value={eventForm.type}
                onChange={(e) => handleEventChange("type", e.target.value)}
              >
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <label style={styles.label}>Street address</label>
              <input
                style={styles.input}
                value={eventForm.address}
                onChange={(e) => handleEventChange("address", e.target.value)}
                placeholder="Ex. 123 Main St"
              />

              <div style={styles.twoCol}>
                <div>
                  <label style={styles.label}>City</label>
                  <input
                    style={styles.input}
                    value={eventForm.city}
                    onChange={(e) => handleEventChange("city", e.target.value)}
                  />
                </div>

                <div>
                  <label style={styles.label}>State</label>
                  <input
                    style={styles.input}
                    value={eventForm.state}
                    onChange={(e) => handleEventChange("state", e.target.value)}
                  />
                </div>
              </div>

              <label style={styles.label}>ZIP</label>
              <input
                style={styles.input}
                value={eventForm.zip}
                onChange={(e) => handleEventChange("zip", e.target.value)}
                placeholder="Ex. 32953"
              />

              <div style={styles.twoCol}>
                <div>
                  <label style={styles.label}>Latitude</label>
                  <input
                    style={styles.input}
                    value={eventForm.latitude}
                    onChange={(e) => handleEventChange("latitude", e.target.value)}
                    placeholder="Auto-filled by geocode"
                  />
                </div>

                <div>
                  <label style={styles.label}>Longitude</label>
                  <input
                    style={styles.input}
                    value={eventForm.longitude}
                    onChange={(e) => handleEventChange("longitude", e.target.value)}
                    placeholder="Auto-filled by geocode"
                  />
                </div>
              </div>

              <div style={styles.inlineButtonRow}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={geocodeAddress}
                  disabled={geocoding}
                >
                  {geocoding ? "Geocoding..." : "Geocode Address"}
                </button>
              </div>

              <div style={styles.twoCol}>
                <div>
                  <label style={styles.label}>Start time</label>
                  <input
                    type="datetime-local"
                    style={styles.input}
                    value={eventForm.start_time}
                    onChange={(e) => handleEventChange("start_time", e.target.value)}
                  />
                </div>

                <div>
                  <label style={styles.label}>End time</label>
                  <input
                    type="datetime-local"
                    style={styles.input}
                    value={eventForm.end_time}
                    onChange={(e) => handleEventChange("end_time", e.target.value)}
                  />
                </div>
              </div>

              <label style={styles.label}>Event note</label>
              <textarea
                style={styles.textareaSmall}
                value={eventForm.note}
                onChange={(e) => handleEventChange("note", e.target.value)}
                placeholder="Anything people should know?"
              />

              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={eventForm.is_active}
                  onChange={(e) => handleEventChange("is_active", e.target.checked)}
                />
                <span>Mark event active</span>
              </label>

              <div style={styles.inlineButtonRow}>
                <button
                  type="button"
                  style={styles.primaryButton}
                  onClick={handleCreateEvent}
                  disabled={creatingEvent || geocoding}
                >
                  {creatingEvent ? "Creating Event..." : "Create Event"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.quickSection}>
          <div style={styles.quickCard}>
            <h3 style={styles.cardTitle}>Quick Snapshot</h3>

            {business.image_url ? (
              <img
                src={business.image_url}
                alt={business.business_name || "Business"}
                style={styles.snapshotImage}
              />
            ) : (
              <div style={styles.snapshotPlaceholder}>No image yet</div>
            )}

            <div style={{ marginTop: "12px" }}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Status</span>
                <span style={styles.infoValue}>{business.status || "pending"}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Category</span>
                <span style={styles.infoValue}>{business.category || "—"}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Location</span>
                <span style={styles.infoValue}>{business.location || "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f1e8",
    padding: "26px 18px 42px",
    fontFamily: "Arial, sans-serif",
    color: "#1f1f1f",
  },
  shell: {
    maxWidth: "1400px",
    margin: "0 auto",
  },
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f6f1e8",
    fontFamily: "Arial, sans-serif",
  },
  loadingCard: {
    padding: "20px 24px",
    borderRadius: "18px",
    background: "#fffdfa",
    border: "1px solid #eadfce",
    boxShadow: "0 12px 26px rgba(66,49,21,0.06)",
    color: "#655d56",
    fontSize: "14px",
  },
  emptyCard: {
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 18px 38px rgba(66,49,21,0.05)",
  },
  heroCard: {
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "24px",
    padding: "20px 22px",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
    boxShadow: "0 18px 38px rgba(66,49,21,0.05)",
  },
  heroEyebrow: {
    margin: "0 0 4px 0",
    fontSize: "11px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#8a6b4b",
    fontWeight: 800,
  },
  heroTitle: {
    margin: "0 0 6px 0",
    fontSize: "18px",
    fontWeight: 800,
  },
  heroSubtitle: {
    margin: 0,
    color: "#6e655f",
    fontSize: "13px",
  },
  heroActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  statusPill: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 0.8fr",
    gap: "16px",
    marginBottom: "16px",
    alignItems: "start",
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1.25fr 0.75fr",
    gap: "16px",
    alignItems: "start",
  },
  quickSection: {
    marginTop: "16px",
  },
  businessCard: {
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 16px 36px rgba(66,49,21,0.05)",
  },
  statsColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  statsCard: {
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 16px 36px rgba(66,49,21,0.05)",
  },
  calendarCard: {
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 16px 36px rgba(66,49,21,0.05)",
  },
  eventFormCard: {
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 16px 36px rgba(66,49,21,0.05)",
  },
  quickCard: {
    background: "#fffdfa",
    border: "1px solid #e6dccf",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 16px 36px rgba(66,49,21,0.05)",
    maxWidth: "420px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: "14px",
  },
  cardEyebrow: {
    margin: "0 0 4px 0",
    fontSize: "11px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#8a6b4b",
    fontWeight: 800,
  },
  cardTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 800,
  },
  businessProfileLayout: {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gap: "18px",
    alignItems: "start",
  },
  businessImageWrap: {
    width: "100%",
  },
  businessImage: {
    width: "100%",
    height: "220px",
    objectFit: "cover",
    borderRadius: "18px",
    border: "1px solid #e6dccf",
    background: "#f3eee7",
  },
  businessImagePlaceholder: {
    height: "220px",
    borderRadius: "18px",
    border: "1px solid #e6dccf",
    background: "#f3eee7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#7c736c",
    fontWeight: 700,
  },
  businessDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  formStack: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "12px",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    padding: "10px 0",
    borderBottom: "1px solid #efe5d8",
  },
  infoBlock: {
    paddingTop: "10px",
  },
  infoLabel: {
    fontSize: "12px",
    fontWeight: 800,
    color: "#7a7169",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  infoValue: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#222",
    textAlign: "right",
  },
  infoParagraph: {
    margin: "8px 0 0 0",
    color: "#5f5750",
    lineHeight: 1.6,
    fontSize: "14px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#3a3632",
    marginTop: "2px",
  },
  input: {
    width: "100%",
    padding: "14px 14px",
    borderRadius: "14px",
    border: "1px solid #ddd3c6",
    background: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "14px 14px",
    borderRadius: "14px",
    border: "1px solid #ddd3c6",
    background: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
  },
  textarea: {
    width: "100%",
    minHeight: "120px",
    padding: "14px 14px",
    borderRadius: "14px",
    border: "1px solid #ddd3c6",
    background: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
  },
  textareaSmall: {
    width: "100%",
    minHeight: "90px",
    padding: "14px 14px",
    borderRadius: "14px",
    border: "1px solid #ddd3c6",
    background: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
  },
  uploadBox: {
    display: "block",
    cursor: "pointer",
  },
  uploadInner: {
    border: "1.5px dashed #cdbfae",
    borderRadius: "18px",
    background: "#faf7f2",
    padding: "18px 14px",
    textAlign: "center",
  },
  uploadIcon: {
    fontSize: "24px",
    marginBottom: "8px",
  },
  uploadTitle: {
    margin: "0 0 4px 0",
    fontSize: "14px",
    fontWeight: 800,
  },
  uploadText: {
    margin: 0,
    fontSize: "12px",
    color: "#7a7169",
    lineHeight: 1.5,
  },
  inlineButtonRow: {
    display: "flex",
    justifyContent: "flex-start",
    gap: "10px",
    marginTop: "8px",
    flexWrap: "wrap",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: 700,
    color: "#3a3632",
    marginTop: "2px",
  },
  metricBox: {
    border: "1px solid #e6dccf",
    borderRadius: "14px",
    padding: "12px 14px",
    fontWeight: 700,
    marginTop: "10px",
    background: "#fff",
  },
  selectedEventCard: {
    border: "1px solid #e6dccf",
    borderRadius: "16px",
    padding: "12px",
    background: "#fff",
    marginTop: "10px",
  },
  selectedEventTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    alignItems: "center",
    marginBottom: "8px",
  },
  miniStatusPill: {
    padding: "5px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 800,
    textTransform: "capitalize",
  },
  eventLine: {
    margin: "4px 0",
    color: "#605852",
    fontSize: "13px",
  },
  smallMuted: {
    margin: "6px 0 0 0",
    fontSize: "13px",
    color: "#7a7169",
  },
  calendarNav: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  calendarArrow: {
    width: "32px",
    height: "32px",
    borderRadius: "999px",
    border: "1px solid #ddd3c6",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  weekRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
    marginTop: "10px",
    marginBottom: "8px",
  },
  weekCell: {
    fontSize: "12px",
    color: "#7a7169",
    fontWeight: 700,
    textAlign: "center",
    padding: "6px 0",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
  },
  blankDay: {
    minHeight: "92px",
  },
  dayCell: {
    minHeight: "92px",
    borderRadius: "16px",
    border: "1px solid #e6dccf",
    background: "#fff",
    padding: "8px",
    textAlign: "left",
    cursor: "pointer",
  },
  dayCellSelected: {
    border: "2px solid #173d33",
    boxShadow: "0 8px 18px rgba(23,61,51,0.10)",
  },
  dayNumberRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    fontSize: "12px",
    fontWeight: 700,
  },
  todayTag: {
    fontSize: "10px",
    background: "#edf7f1",
    color: "#1f513f",
    borderRadius: "999px",
    padding: "3px 6px",
  },
  dayEventsWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  dayEventChip: {
    fontSize: "10px",
    background: "#f4f1eb",
    color: "#4d463f",
    padding: "4px 6px",
    borderRadius: "8px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  snapshotImage: {
    width: "100%",
    height: "180px",
    objectFit: "cover",
    borderRadius: "18px",
    border: "1px solid #e6dccf",
    background: "#f3eee7",
  },
  snapshotPlaceholder: {
    height: "180px",
    borderRadius: "18px",
    border: "1px solid #e6dccf",
    background: "#f3eee7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#7c736c",
    fontWeight: 700,
  },
  eyebrow: {
    margin: "0 0 4px 0",
    fontSize: "11px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 800,
    color: "#8a6b4b",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "42px",
    fontWeight: 800,
    lineHeight: 1,
  },
  subtitle: {
    margin: 0,
    maxWidth: "700px",
    fontSize: "15px",
    lineHeight: 1.6,
    color: "#6e655f",
  },
  secondaryButton: {
    padding: "10px 14px",
    borderRadius: "999px",
    border: "1px solid #d8cec1",
    background: "#ffffff",
    color: "#2c2a27",
    fontWeight: 700,
    cursor: "pointer",
  },
  primaryButton: {
    padding: "12px 18px",
    borderRadius: "999px",
    border: "none",
    background: "#173d33",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 18px rgba(23,61,51,0.15)",
  },
  primaryButtonSmall: {
    padding: "10px 14px",
    borderRadius: "999px",
    border: "none",
    background: "#173d33",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 18px rgba(23,61,51,0.15)",
  },
  messageBox: {
    marginBottom: "16px",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "13px",
    fontWeight: 700,
  },
};