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
  "Food Truck",
  "Coffee",
  "Crafts",
  "Other",
];

const BUSINESS_TYPE_OPTIONS = [
  "Storefront",
  "Farm Stand",
  "Food Truck",
  "Pop-Up",
  "Online Only",
  "Local Delivery",
  "Events Only",
  "Home-Based",
  "Other",
];

const CONTACT_METHOD_OPTIONS = ["Email", "Phone", "Instagram", "Facebook"];

const EVENT_TYPE_OPTIONS = ["popup", "booth", "market", "food_truck", "farm_stand"];

const OPENCAGE_API_KEY = process.env.REACT_APP_OPENCAGE_API_KEY || "";
const BILLING_API_URL =
  "http://localhost:4242/api/billing/create-checkout-session";
const BILLING_STATUS_API_URL =
  "http://localhost:4242/api/billing/check-subscription-status";
const ACTIVATION_EMAIL_API_URL =
  "http://localhost:4242/api/billing/send-activation-email";

function formatDisplayDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString();
}

function formatDisplayDateTime(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString();
}

function isOver7Days(startTime, endTime) {
  if (!startTime || !endTime) return false;
  const start = new Date(startTime);
  const end = new Date(endTime);
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return end.getTime() - start.getTime() > sevenDaysMs;
}

function isDateInEventRange(dateObj, event) {
  if (!dateObj || !event?.start_time) return false;

  const dayStart = new Date(dateObj);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(dateObj);
  dayEnd.setHours(23, 59, 59, 999);

  const eventStart = new Date(event.start_time);
  const eventEnd = event.end_time ? new Date(event.end_time) : eventStart;

  return eventStart <= dayEnd && eventEnd >= dayStart;
}

function getEventStatus(event) {
  const now = new Date();
  const start = event?.start_time ? new Date(event.start_time) : null;
  const end = event?.end_time ? new Date(event.end_time) : null;

  if (!event?.is_active) return "inactive";
  if (!start) return "scheduled";
  if (start && now < start) return "upcoming";

  const exceeds7Days =
    start && end ? isOver7Days(event.start_time, event.end_time) : false;

  if (start && end && now >= start && now <= end && !exceeds7Days) return "live";
  if (start && end && now > end) return "completed";
  if (start && !end && now >= start) return "live";

  return "scheduled";
}

function toDatetimeLocalValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getBillingLabel(business) {
  if (!business) return "Not set up";
  if (business.payment_override) return "Manual override active";
  if (business.subscription_status === "active") return "Active";
  if (business.subscription_status === "pending_payment") return "Pending payment";
  if (business.subscription_status === "pending") return "Pending";
  if (business.subscription_status === "suspended") return "Suspended";
  if (business.payment_status === "past_due") return "Past due";
  if (business.payment_status === "failed") return "Payment failed";
  return "Not subscribed";
}

function getVisibilityLabel(business) {
  if (!business) return "Unknown";
  if (business.status !== "approved") return "Pending approval";
  if (!business.agreed_to_terms) return "Needs agreement";
  if (business.payment_override || business.subscription_status === "active") {
    return "Live in seller system";
  }
  return "Billing needed";
}

function getProfileCompletion(business) {
  if (!business) return 0;

  const fields = [
    business.business_name,
    business.category,
    business.description,
    business.image_url,
    business.website,
    business.phone,
    business.instagram,
    business.facebook,
    business.business_type,
    business.what_they_sell,
    business.location,
    business.contact_email || business.email,
    business.latitude,
    business.longitude,
    business.featured_product_1_name,
    business.featured_product_2_name,
    business.featured_product_3_name,
  ];

  const filled = fields.filter((value) => String(value || "").trim() !== "").length;
  return Math.round((filled / fields.length) * 100);
}

async function geocodeRawAddress(addressParts) {
  const query = addressParts.filter(Boolean).join(", ").trim();

  if (!query) {
    return { latitude: null, longitude: null, error: "Add an address first." };
  }

  if (!OPENCAGE_API_KEY) {
    return {
      latitude: null,
      longitude: null,
      error: "OpenCage key not found in environment.",
    };
  }

  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
      query
    )}&key=${encodeURIComponent(OPENCAGE_API_KEY)}&limit=1&no_annotations=1`;

    const response = await fetch(url);
    const json = await response.json();
    const result = json?.results?.[0];

    if (!result?.geometry) {
      return {
        latitude: null,
        longitude: null,
        error: "Could not geocode that address.",
      };
    }

    return {
      latitude: Number(result.geometry.lat),
      longitude: Number(result.geometry.lng),
      error: null,
    };
  } catch (err) {
    console.error("geocodeRawAddress error:", err);
    return {
      latitude: null,
      longitude: null,
      error: "Geocoding failed.",
    };
  }
}

function makeBusinessForm(data) {
  return {
    business_name: data?.business_name || "",
    description: data?.description || "",
    category: data?.category || "",
    location: data?.location || "",
    image_url: data?.image_url || "",
    website: data?.website || "",
    phone: data?.phone || "",
    instagram: data?.instagram || "",
    facebook: data?.facebook || "",
    business_type: data?.business_type || "",
    what_they_sell: data?.what_they_sell || "",
    best_contact_method: data?.best_contact_method || "",
    permits_info: data?.permits_info || "",
    contact_email: data?.contact_email || data?.email || "",
    address: data?.address || "",
    city: data?.city || "",
    state: data?.state || "",
    zip: data?.zip || "",
    featured_product_1_name: data?.featured_product_1_name || "",
    featured_product_1_description: data?.featured_product_1_description || "",
    featured_product_1_image_url: data?.featured_product_1_image_url || "",
    featured_product_2_name: data?.featured_product_2_name || "",
    featured_product_2_description: data?.featured_product_2_description || "",
    featured_product_2_image_url: data?.featured_product_2_image_url || "",
    featured_product_3_name: data?.featured_product_3_name || "",
    featured_product_3_description: data?.featured_product_3_description || "",
    featured_product_3_image_url: data?.featured_product_3_image_url || "",
  };
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
  const [startingCheckout, setStartingCheckout] = useState(false);

  const [businessForm, setBusinessForm] = useState(makeBusinessForm(null));
  const [newImage, setNewImage] = useState(null);
  const [featuredImages, setFeaturedImages] = useState({
    f1: null,
    f2: null,
    f3: null,
  });

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

        console.log("AUTH USER ID:", user?.id);

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

        console.log("BUSINESS ROWS:", businessRows);
        console.log("BUSINESS ERROR:", businessError);

        if (businessError) throw businessError;

        const latestBusiness = businessRows?.[0] || null;

        if (!mounted) return;

        if (!latestBusiness) {
          setBusiness(null);
          setEvents([]);
          return;
        }

        if (latestBusiness.status === "pending") {
          navigate("/application-pending");
          return;
        }

        if (latestBusiness.status === "approved" && !latestBusiness.agreed_to_terms) {
          navigate("/seller-agreement");
          return;
        }

        let resolvedBusiness = latestBusiness;

        const hasAccess =
          resolvedBusiness.payment_override ||
          resolvedBusiness.subscription_status === "active";

        if (!hasAccess) {
          try {
            const statusResponse = await fetch(BILLING_STATUS_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ businessId: resolvedBusiness.id }),
            });

            const statusData = await statusResponse.json();

            if (statusResponse.ok && statusData?.unlocked) {
              const { data: updatedBusiness, error: updateError } = await supabase
                .from("businesses")
                .update({
                  payment_status: statusData.payment_status || "paid",
                  subscription_status: statusData.subscription_status || "active",
                  stripe_customer_id:
                    statusData.customer_id ||
                    resolvedBusiness.stripe_customer_id ||
                    null,
                  stripe_subscription_id:
                    statusData.subscription_id ||
                    resolvedBusiness.stripe_subscription_id ||
                    null,
                })
                .eq("id", resolvedBusiness.id)
                .select()
                .maybeSingle();

              if (updateError) throw updateError;
              if (updatedBusiness) resolvedBusiness = updatedBusiness;

              if (!resolvedBusiness.activation_email_sent) {
                const recipientEmail =
                  user.email ||
                  resolvedBusiness.contact_email ||
                  resolvedBusiness.email ||
                  "";

                if (recipientEmail) {
                  try {
                    const emailResponse = await fetch(ACTIVATION_EMAIL_API_URL, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        to: recipientEmail,
                        businessName: resolvedBusiness.business_name || "",
                      }),
                    });

                    if (emailResponse.ok) {
                      const { data: flaggedBusiness } = await supabase
                        .from("businesses")
                        .update({ activation_email_sent: true })
                        .eq("id", resolvedBusiness.id)
                        .select()
                        .maybeSingle();

                      if (flaggedBusiness) resolvedBusiness = flaggedBusiness;
                    }
                  } catch (emailErr) {
                    console.error("Activation email error:", emailErr);
                  }
                }
              }

              if (mounted) setMessage("Payment confirmed. Dashboard unlocked.");
            } else {
              navigate(`/payment-setup?businessId=${resolvedBusiness.id}`);
              return;
            }
          } catch (statusErr) {
            console.error("Auto-unlock check error:", statusErr);
            navigate(`/payment-setup?businessId=${resolvedBusiness.id}`);
            return;
          }
        }

        setBusiness(resolvedBusiness);
        setBusinessForm(makeBusinessForm(resolvedBusiness));

        const { data: eventRows, error: eventError } = await supabase
          .from("seller_events")
          .select("*")
          .eq("business_id", resolvedBusiness.id)
          .order("start_time", { ascending: true });

        if (eventError) throw eventError;

        if (!mounted) return;
        setEvents(eventRows || []);
      } catch (err) {
        console.error("Seller dashboard load error:", err);
        if (mounted) setMessage(err.message || "Could not load seller dashboard.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initDashboard();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  function handleBusinessChange(field, value) {
    setBusinessForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "city" || field === "state") {
        const city = field === "city" ? value : next.city;
        const state = field === "state" ? value : next.state;
        next.location = [city, state].filter(Boolean).join(", ");
      }

      return next;
    });
  }

  function handleEventChange(field, value) {
    setEventForm((prev) => ({ ...prev, [field]: value }));
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
      const fileExt = newImage.name.split(".").pop() || "jpg";
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `business-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("business-images")
        .upload(filePath, newImage, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("business-images").getPublicUrl(filePath);

      return data?.publicUrl || "";
    } finally {
      setUploadingImage(false);
    }
  }

  async function uploadFeaturedImage(file, slot) {
    if (!file || !currentUser) return "";

    setUploadingImage(true);

    try {
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${currentUser.id}-${slot}-${Date.now()}.${fileExt}`;
      const filePath = `featured/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("business-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("business-images").getPublicUrl(filePath);

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
      let nextFeaturedProduct1ImageUrl =
        businessForm.featured_product_1_image_url || business.featured_product_1_image_url || "";
      let nextFeaturedProduct2ImageUrl =
        businessForm.featured_product_2_image_url || business.featured_product_2_image_url || "";
      let nextFeaturedProduct3ImageUrl =
        businessForm.featured_product_3_image_url || business.featured_product_3_image_url || "";

      if (newImage) {
        nextImageUrl = await uploadBusinessImage();
      }

      if (featuredImages.f1) {
        nextFeaturedProduct1ImageUrl = await uploadFeaturedImage(featuredImages.f1, "f1");
      }

      if (featuredImages.f2) {
        nextFeaturedProduct2ImageUrl = await uploadFeaturedImage(featuredImages.f2, "f2");
      }

      if (featuredImages.f3) {
        nextFeaturedProduct3ImageUrl = await uploadFeaturedImage(featuredImages.f3, "f3");
      }

      const addressParts = [
        businessForm.address.trim(),
        businessForm.city.trim(),
        businessForm.state.trim(),
        businessForm.zip.trim(),
      ];

      let nextLatitude =
        business.latitude != null && Number.isFinite(Number(business.latitude))
          ? Number(business.latitude)
          : null;

      let nextLongitude =
        business.longitude != null && Number.isFinite(Number(business.longitude))
          ? Number(business.longitude)
          : null;

      const hasAddress = addressParts.filter(Boolean).length > 0;

      if (hasAddress) {
        const geo = await geocodeRawAddress(addressParts);

        if (!geo.error && geo.latitude != null && geo.longitude != null) {
          nextLatitude = geo.latitude;
          nextLongitude = geo.longitude;
        } else if (geo.error) {
          console.warn("Business geocode warning:", geo.error);
        }
      }

      const payload = {
        business_name: businessForm.business_name.trim(),
        description: businessForm.description.trim(),
        category: businessForm.category.trim(),
        location:
          businessForm.location.trim() ||
          [businessForm.city.trim(), businessForm.state.trim()].filter(Boolean).join(", "),
        image_url: nextImageUrl,
        website: businessForm.website.trim(),
        phone: businessForm.phone.trim(),
        instagram: businessForm.instagram.trim(),
        facebook: businessForm.facebook.trim(),
        business_type: businessForm.business_type.trim(),
        what_they_sell: businessForm.what_they_sell.trim(),
        best_contact_method: businessForm.best_contact_method.trim(),
        permits_info: businessForm.permits_info.trim(),
        contact_email: businessForm.contact_email.trim(),
        address: businessForm.address.trim(),
        city: businessForm.city.trim(),
        state: businessForm.state.trim(),
        zip: businessForm.zip.trim(),
        latitude: nextLatitude,
        longitude: nextLongitude,
        featured_product_1_name: businessForm.featured_product_1_name.trim(),
        featured_product_1_description:
          businessForm.featured_product_1_description.trim(),
        featured_product_1_image_url: nextFeaturedProduct1ImageUrl,
        featured_product_2_name: businessForm.featured_product_2_name.trim(),
        featured_product_2_description:
          businessForm.featured_product_2_description.trim(),
        featured_product_2_image_url: nextFeaturedProduct2ImageUrl,
        featured_product_3_name: businessForm.featured_product_3_name.trim(),
        featured_product_3_description:
          businessForm.featured_product_3_description.trim(),
        featured_product_3_image_url: nextFeaturedProduct3ImageUrl,
      };

      const { data, error } = await supabase
        .from("businesses")
        .update(payload)
        .eq("id", business.id)
        .select()
        .maybeSingle();

      if (error) throw error;

      const savedBusiness = data || { ...business, ...payload };

      setBusiness(savedBusiness);
      setBusinessForm(makeBusinessForm(savedBusiness));
      setNewImage(null);
      setFeaturedImages({ f1: null, f2: null, f3: null });
      setEditMode(false);
      setMessage("Business profile updated and featured products saved.");
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

    if (addressParts.length === 0) {
      setMessage("Add an address before geocoding.");
      return null;
    }

    setGeocoding(true);
    setMessage("");

    try {
      const geo = await geocodeRawAddress(addressParts);

      if (geo.error || geo.latitude == null || geo.longitude == null) {
        setMessage(geo.error || "Could not geocode that address.");
        return null;
      }

      setEventForm((prev) => ({
        ...prev,
        latitude: String(geo.latitude),
        longitude: String(geo.longitude),
      }));

      setMessage("Address geocoded successfully.");

      return {
        latitude: geo.latitude,
        longitude: geo.longitude,
      };
    } finally {
      setGeocoding(false);
    }
  }

  async function handleCreateEvent() {
    if (!business) return;

    setCreatingEvent(true);
    setMessage("");

    try {
      const start = new Date(eventForm.start_time);
      const end = eventForm.end_time ? new Date(eventForm.end_time) : null;

      if (!eventForm.title.trim()) {
        setMessage("Please add an event title.");
        return;
      }

      if (!eventForm.start_time || !eventForm.end_time) {
        setMessage("Please add both a start time and an end time.");
        return;
      }

      if (end && end <= start) {
        setMessage("End time must be after start time.");
        return;
      }

      if (end && isOver7Days(eventForm.start_time, eventForm.end_time)) {
        setMessage("Events cannot be longer than 7 days.");
        return;
      }

      let latitude = eventForm.latitude ? Number(eventForm.latitude) : null;
      let longitude = eventForm.longitude ? Number(eventForm.longitude) : null;

      if (!latitude || !longitude) {
        const geocoded = await geocodeAddress();
        if (!geocoded) return;

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
        end_time: eventForm.end_time ? new Date(eventForm.end_time).toISOString() : null,
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
      console.error("Event error:", err);

      if (err.message?.includes("seller_events_max_7_days")) {
        setMessage("Events cannot be longer than 7 days.");
      } else {
        setMessage(err.message || "Could not create event.");
      }
    } finally {
      setCreatingEvent(false);
    }
  }

  async function handleStartCheckout(paymentType) {
    if (!business?.id) {
      setMessage("No business found for billing.");
      return;
    }

    if (!currentUser?.email) {
      setMessage("No seller email found for checkout.");
      return;
    }

    setStartingCheckout(true);
    setMessage("");

    try {
      const response = await fetch(BILLING_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          email: currentUser.email,
          paymentType,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Could not start checkout.");
      if (!data.url) throw new Error("Stripe checkout URL not returned.");

      window.location.href = data.url;
    } catch (err) {
      console.error("handleStartCheckout error:", err);
      setMessage(err.message || "Could not start billing checkout.");
    } finally {
      setStartingCheckout(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      window.location.href = "/seller-auth";
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/seller-auth");
    }
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
    return events.filter((event) => isDateInEventRange(selectedDay, event));
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

  const billingLabel = getBillingLabel(business);
  const visibilityLabel = getVisibilityLabel(business);
  const profileCompletion = getProfileCompletion(business);

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
            <h1 style={styles.emptyTitle}>No business found yet</h1>
            <p style={styles.subtitle}>
              Create your business first, then you’ll be able to manage everything
              from your dashboard.
            </p>

            <div style={styles.inlineButtonRow}>
              <button
                type="button"
                style={styles.primaryButton}
                onClick={() => navigate("/list-your-business")}
              >
                Create Business
              </button>

              <button type="button" style={styles.secondaryButton} onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const successMessage =
    message.toLowerCase().includes("success") ||
    message.toLowerCase().includes("updated") ||
    message.toLowerCase().includes("confirmed") ||
    message.toLowerCase().includes("unlocked") ||
    message.toLowerCase().includes("created") ||
    message.toLowerCase().includes("saved");

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.heroCard}>
          <div style={styles.heroLeft}>
            <p style={styles.heroEyebrow}>Right to the Source Seller Dashboard</p>
            <h1 style={styles.heroTitle}>{business.business_name || "Your Business"}</h1>
            <p style={styles.heroSubtitle}>
              Manage your profile, billing, map visibility, and live events from one clean dashboard.
            </p>

            <div style={styles.heroMetaRow}>
              <span
                style={{
                  ...styles.statusPill,
                  background: business.status === "approved" ? "#ecfdf3" : "#fffbeb",
                  color: business.status === "approved" ? "#027a48" : "#92400e",
                  border:
                    business.status === "approved"
                      ? "1px solid #bbf7d0"
                      : "1px solid #fde68a",
                }}
              >
                {business.status || "pending"}
              </span>

              <span style={styles.softPill}>Visibility: {visibilityLabel}</span>
              <span style={styles.softPill}>Profile {profileCompletion}% complete</span>
              <span style={styles.softPill}>
                Map: {business.latitude && business.longitude ? "Pinned" : "Needs location"}
              </span>
            </div>
          </div>

          <div style={styles.heroActions}>
            <button type="button" style={styles.secondaryButton} onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>

        <div style={styles.quickActionsBar}>
          <div>
            <p style={styles.quickActionsTitle}>Quick Actions</p>
            <p style={styles.quickActionsText}>Jump straight into the work that keeps your seller profile live.</p>
          </div>

          <div style={styles.quickActionsButtons}>
            <button
              type="button"
              style={styles.primaryButtonSmall}
              onClick={() => {
                setEditMode(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Edit Profile
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() =>
                document.getElementById("create-event-card")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
            >
              Create Event
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => {
                setEditMode(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
                setMessage("Open Location & Admin Details to update your map address.");
              }}
            >
              Fix Map Location
            </button>
          </div>
        </div>

        {message ? (
          <div
            style={{
              ...styles.messageBox,
              color: successMessage ? "#027a48" : "#b42318",
              background: successMessage ? "#ecfdf3" : "#fff2f0",
              border: successMessage ? "1px solid #bbf7d0" : "1px solid #f2c9c2",
            }}
          >
            {message}
          </div>
        ) : null}

        <div style={styles.statsStrip}>
          <Stat label="Live Now" value={counts.live} />
          <Stat label="Upcoming" value={counts.upcoming} />
          <Stat label="Completed" value={counts.completed} />
          <Stat label="Total Events" value={counts.total} />
        </div>

        <div style={styles.topGrid}>
          <div style={styles.businessCard}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.cardEyebrow}>Business Profile</p>
                <h3 style={styles.cardTitle}>Manage your public business presence</h3>
              </div>

              <button
                type="button"
                style={editMode ? styles.secondaryButton : styles.primaryButtonSmall}
                onClick={() => {
                  if (editMode) {
                    setEditMode(false);
                    setNewImage(null);
                    setBusinessForm(makeBusinessForm(business));
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
              <div style={styles.businessImageColumn}>
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

                <div style={styles.completionCard}>
                  <div style={styles.completionTop}>
                    <span style={styles.completionLabel}>Profile completion</span>
                    <strong style={styles.completionPercent}>{profileCompletion}%</strong>
                  </div>
                  <div style={styles.completionBarTrack}>
                    <div
                      style={{
                        ...styles.completionBarFill,
                        width: `${profileCompletion}%`,
                      }}
                    />
                  </div>
                  <p style={styles.completionText}>
                    Complete profiles look more trustworthy and perform better on the map.
                  </p>
                </div>
              </div>

              <div style={styles.businessDetails}>
                {editMode ? (
                  <>
                    <div style={styles.sectionBlock}>
                      <h4 style={styles.subsectionTitle}>Core Profile</h4>

                      <label style={styles.label}>Business name</label>
                      <input
                        style={styles.input}
                        value={businessForm.business_name}
                        onChange={(e) =>
                          handleBusinessChange("business_name", e.target.value)
                        }
                      />

                      <div style={styles.twoCol}>
                        <div>
                          <label style={styles.label}>Category</label>
                          <select
                            style={styles.select}
                            value={businessForm.category}
                            onChange={(e) =>
                              handleBusinessChange("category", e.target.value)
                            }
                          >
                            <option value="">Select a category</option>
                            {CATEGORY_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={styles.label}>Business type</label>
                          <select
                            style={styles.select}
                            value={businessForm.business_type}
                            onChange={(e) =>
                              handleBusinessChange("business_type", e.target.value)
                            }
                          >
                            <option value="">Select a business type</option>
                            {BUSINESS_TYPE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <label style={styles.label}>Location label</label>
                      <input
                        style={styles.input}
                        value={businessForm.location}
                        onChange={(e) => handleBusinessChange("location", e.target.value)}
                        placeholder="Ex. Merritt Island, FL"
                      />

                      <label style={styles.label}>Description</label>
                      <textarea
                        style={styles.textarea}
                        value={businessForm.description}
                        onChange={(e) =>
                          handleBusinessChange("description", e.target.value)
                        }
                      />

                      <label style={styles.label}>What do you sell?</label>
                      <textarea
                        style={styles.textareaSmall}
                        value={businessForm.what_they_sell}
                        onChange={(e) =>
                          handleBusinessChange("what_they_sell", e.target.value)
                        }
                      />
                    </div>

                    <div style={styles.sectionDivider} />

                    <div style={styles.sectionBlock}>
                      <h4 style={styles.subsectionTitle}>Featured Products</h4>
                      <p style={styles.ruleText}>
                        These show on the public seller profile. Use them for best sellers,
                        seasonal items, or anything you want customers to notice first.
                      </p>

                      <style>{`
                        .featured-products-grid {
                          display: grid;
                          grid-template-columns: repeat(3, minmax(220px, 1fr));
                          gap: 28px;
                          align-items: stretch;
                          padding: 14px;
                          border-radius: 28px;
                          background: #edf1f5;
                        }
                        .featured-product-card {
                          min-height: 100%;
                          display: flex;
                          flex-direction: column;
                          gap: 18px;
                          border: 1px solid #cfd8e3;
                          border-radius: 24px;
                          padding: 24px;
                          background: #ffffff;
                          box-shadow: 0 22px 50px rgba(15,23,42,0.14), 0 8px 20px rgba(15,23,42,0.06);
                          box-sizing: border-box;
                          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
                        }
                        .featured-product-card:hover {
                          transform: translateY(-6px);
                          border-color: #b8c5d4;
                          box-shadow: 0 30px 64px rgba(15,23,42,0.18), 0 12px 26px rgba(15,23,42,0.10);
                        }
                        .featured-product-meta-label {
                          font-size: 12px;
                          font-weight: 900;
                          color: #0f172a;
                          text-transform: uppercase;
                          letter-spacing: 0.1em;
                        }
                        .featured-product-image-box {
                          height: 190px;
                          border-radius: 18px;
                          border: 1px solid #c7d2de;
                          background: #eef2f6;
                          overflow: hidden;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          box-shadow: inset 0 1px 0 rgba(255,255,255,0.85), inset 0 0 0 1px rgba(15,23,42,0.03);
                        }
                        .featured-product-placeholder {
                          color: #6b7280;
                          font-size: 13px;
                          font-weight: 700;
                          text-align: center;
                          padding: 16px;
                          line-height: 1.5;
                        }
                        .featured-field-wrap {
                          display: flex;
                          flex-direction: column;
                          gap: 10px;
                        }
                        .featured-field-label {
                          font-size: 11px;
                          font-weight: 800;
                          color: #94a3b8;
                          text-transform: uppercase;
                          letter-spacing: 0.07em;
                        }
                        .featured-upload-button {
                          display: inline-flex;
                          align-items: center;
                          justify-content: center;
                          width: 100%;
                          padding: 14px 18px;
                          border-radius: 999px;
                          background: #0f172a;
                          color: #ffffff;
                          font-size: 14px;
                          font-weight: 800;
                          cursor: pointer;
                          box-sizing: border-box;
                          box-shadow: 0 12px 24px rgba(15,23,42,0.22);
                          transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
                        }
                        .featured-upload-button:hover {
                          background: #1e293b;
                          transform: translateY(-2px) scale(1.01);
                          box-shadow: 0 18px 32px rgba(15,23,42,0.26);
                        }
                        .featured-name-input {
                          font-weight: 800;
                          color: #0f172a;
                        }
                        .featured-description {
                          min-height: 132px !important;
                          line-height: 1.65;
                          color: #334155;
                        }
                        @media (max-width: 980px) {
                          .featured-products-grid {
                            grid-template-columns: 1fr;
                          }
                        }
                      `}</style>

                      <div className="featured-products-grid">
                        <div className="featured-product-card">
                          <div className="featured-product-meta-label">Product 1</div>
                          <div className="featured-product-image-box">
                            {featuredImages.f1 ? (
                              <img
                                src={URL.createObjectURL(featuredImages.f1)}
                                alt={businessForm.featured_product_1_name || "Featured product 1"}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                            ) : businessForm.featured_product_1_image_url || business?.featured_product_1_image_url ? (
                              <img
                                src={
                                  businessForm.featured_product_1_image_url ||
                                  business?.featured_product_1_image_url
                                }
                                alt={businessForm.featured_product_1_name || "Featured product 1"}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                            ) : (
                              <div className="featured-product-placeholder">
                                No image uploaded yet
                              </div>
                            )}
                          </div>

                          <div className="featured-field-wrap">
                            <label className="featured-field-label">Photo</label>
                            <label className="featured-upload-button">
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={(e) =>
                                  setFeaturedImages((prev) => ({
                                    ...prev,
                                    f1: e.target.files?.[0] || null,
                                  }))
                                }
                              />
                              {featuredImages.f1?.name || "Choose Photo"}
                            </label>
                          </div>

                          <div className="featured-field-wrap">
                            <label className="featured-field-label">Featured product 1 name</label>
                            <input
                              style={styles.input}
                              className="featured-name-input"
                              value={businessForm.featured_product_1_name}
                              onChange={(e) =>
                                handleBusinessChange("featured_product_1_name", e.target.value)
                              }
                              placeholder="Ex. Farm Fresh Eggs"
                            />
                          </div>

                          <div className="featured-field-wrap" style={{ flex: 1 }}>
                            <label className="featured-field-label">
                              Featured product 1 description
                            </label>
                            <textarea
                              style={{ ...styles.textareaSmall, flex: 1 }}
                              className="featured-description"
                              value={businessForm.featured_product_1_description}
                              onChange={(e) =>
                                handleBusinessChange(
                                  "featured_product_1_description",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="featured-product-card">
                          <div className="featured-product-meta-label">Product 2</div>
                          <div className="featured-product-image-box">
                            {featuredImages.f2 ? (
                              <img
                                src={URL.createObjectURL(featuredImages.f2)}
                                alt={businessForm.featured_product_2_name || "Featured product 2"}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                            ) : businessForm.featured_product_2_image_url || business?.featured_product_2_image_url ? (
                              <img
                                src={
                                  businessForm.featured_product_2_image_url ||
                                  business?.featured_product_2_image_url
                                }
                                alt={businessForm.featured_product_2_name || "Featured product 2"}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                            ) : (
                              <div className="featured-product-placeholder">
                                No image uploaded yet
                              </div>
                            )}
                          </div>

                          <div className="featured-field-wrap">
                            <label className="featured-field-label">Photo</label>
                            <label className="featured-upload-button">
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={(e) =>
                                  setFeaturedImages((prev) => ({
                                    ...prev,
                                    f2: e.target.files?.[0] || null,
                                  }))
                                }
                              />
                              {featuredImages.f2?.name || "Choose Photo"}
                            </label>
                          </div>

                          <div className="featured-field-wrap">
                            <label className="featured-field-label">Featured product 2 name</label>
                            <input
                              style={styles.input}
                              className="featured-name-input"
                              value={businessForm.featured_product_2_name}
                              onChange={(e) =>
                                handleBusinessChange("featured_product_2_name", e.target.value)
                              }
                            />
                          </div>

                          <div className="featured-field-wrap" style={{ flex: 1 }}>
                            <label className="featured-field-label">
                              Featured product 2 description
                            </label>
                            <textarea
                              style={{ ...styles.textareaSmall, flex: 1 }}
                              className="featured-description"
                              value={businessForm.featured_product_2_description}
                              onChange={(e) =>
                                handleBusinessChange(
                                  "featured_product_2_description",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="featured-product-card">
                          <div className="featured-product-meta-label">Product 3</div>
                          <div className="featured-product-image-box">
                            {featuredImages.f3 ? (
                              <img
                                src={URL.createObjectURL(featuredImages.f3)}
                                alt={businessForm.featured_product_3_name || "Featured product 3"}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                            ) : businessForm.featured_product_3_image_url || business?.featured_product_3_image_url ? (
                              <img
                                src={
                                  businessForm.featured_product_3_image_url ||
                                  business?.featured_product_3_image_url
                                }
                                alt={businessForm.featured_product_3_name || "Featured product 3"}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                            ) : (
                              <div className="featured-product-placeholder">
                                No image uploaded yet
                              </div>
                            )}
                          </div>

                          <div className="featured-field-wrap">
                            <label className="featured-field-label">Photo</label>
                            <label className="featured-upload-button">
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={(e) =>
                                  setFeaturedImages((prev) => ({
                                    ...prev,
                                    f3: e.target.files?.[0] || null,
                                  }))
                                }
                              />
                              {featuredImages.f3?.name || "Choose Photo"}
                            </label>
                          </div>

                          <div className="featured-field-wrap">
                            <label className="featured-field-label">Featured product 3 name</label>
                            <input
                              style={styles.input}
                              className="featured-name-input"
                              value={businessForm.featured_product_3_name}
                              onChange={(e) =>
                                handleBusinessChange("featured_product_3_name", e.target.value)
                              }
                            />
                          </div>

                          <div className="featured-field-wrap" style={{ flex: 1 }}>
                            <label className="featured-field-label">
                              Featured product 3 description
                            </label>
                            <textarea
                              style={{ ...styles.textareaSmall, flex: 1 }}
                              className="featured-description"
                              value={businessForm.featured_product_3_description}
                              onChange={(e) =>
                                handleBusinessChange(
                                  "featured_product_3_description",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={styles.sectionDivider} />

                    <div style={styles.sectionBlock}>
                      <h4 style={styles.subsectionTitle}>Contact & Links</h4>

                      <label style={styles.label}>Business contact email</label>
                      <input
                        style={styles.input}
                        value={businessForm.contact_email}
                        onChange={(e) =>
                          handleBusinessChange("contact_email", e.target.value)
                        }
                      />

                      <div style={styles.twoCol}>
                        <div>
                          <label style={styles.label}>Phone</label>
                          <input
                            style={styles.input}
                            value={businessForm.phone}
                            onChange={(e) => handleBusinessChange("phone", e.target.value)}
                          />
                        </div>

                        <div>
                          <label style={styles.label}>Best contact method</label>
                          <select
                            style={styles.select}
                            value={businessForm.best_contact_method}
                            onChange={(e) =>
                              handleBusinessChange(
                                "best_contact_method",
                                e.target.value
                              )
                            }
                          >
                            <option value="">Select best contact method</option>
                            {CONTACT_METHOD_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <label style={styles.label}>Website</label>
                      <input
                        style={styles.input}
                        value={businessForm.website}
                        onChange={(e) => handleBusinessChange("website", e.target.value)}
                      />

                      <div style={styles.twoCol}>
                        <div>
                          <label style={styles.label}>Instagram</label>
                          <input
                            style={styles.input}
                            value={businessForm.instagram}
                            onChange={(e) =>
                              handleBusinessChange("instagram", e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <label style={styles.label}>Facebook</label>
                          <input
                            style={styles.input}
                            value={businessForm.facebook}
                            onChange={(e) =>
                              handleBusinessChange("facebook", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div style={styles.sectionDivider} />

                    <div style={styles.sectionBlock}>
                      <h4 style={styles.subsectionTitle}>Location & Admin Details</h4>

                      <label style={styles.label}>Street address</label>
                      <input
                        style={styles.input}
                        value={businessForm.address}
                        onChange={(e) => handleBusinessChange("address", e.target.value)}
                      />

                      <div style={styles.threeCol}>
                        <div>
                          <label style={styles.label}>City</label>
                          <input
                            style={styles.input}
                            value={businessForm.city}
                            onChange={(e) => handleBusinessChange("city", e.target.value)}
                          />
                        </div>

                        <div>
                          <label style={styles.label}>State</label>
                          <input
                            style={styles.input}
                            value={businessForm.state}
                            onChange={(e) => handleBusinessChange("state", e.target.value)}
                          />
                        </div>

                        <div>
                          <label style={styles.label}>ZIP</label>
                          <input
                            style={styles.input}
                            value={businessForm.zip}
                            onChange={(e) => handleBusinessChange("zip", e.target.value)}
                          />
                        </div>
                      </div>

                      <p style={styles.ruleText}>
                        Saving this address will automatically set the latitude and longitude for
                        your map pin.
                      </p>

                      <label style={styles.label}>Permits / licenses / notes</label>
                      <textarea
                        style={styles.textareaSmall}
                        value={businessForm.permits_info}
                        onChange={(e) =>
                          handleBusinessChange("permits_info", e.target.value)
                        }
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
                    </div>

                    <div style={styles.inlineButtonRow}>
                      <button
                        type="button"
                        style={styles.primaryButton}
                        onClick={handleSaveBusiness}
                        disabled={savingBusiness || uploadingImage}
                      >
                        {savingBusiness || uploadingImage
                          ? "Saving..."
                          : "Save Business Info"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <DisplaySection
                      title="Core Profile"
                      rows={[
                        ["Business Name", business.business_name],
                        ["Category", business.category],
                        ["Business Type", business.business_type],
                        ["Location", business.location],
                      ]}
                      blocks={[
                        ["Description", business.description],
                        ["What You Sell", business.what_they_sell],
                      ]}
                    />

                    <div style={styles.sectionDivider} />

                    <DisplaySection
                      title="Featured Products"
                      rows={[
                        ["Product 1", business.featured_product_1_name],
                        ["Product 2", business.featured_product_2_name],
                        ["Product 3", business.featured_product_3_name],
                      ]}
                      blocks={[
                        ["Product 1 Description", business.featured_product_1_description],
                        ["Product 2 Description", business.featured_product_2_description],
                        ["Product 3 Description", business.featured_product_3_description],
                      ]}
                    />

                    <div style={styles.sectionDivider} />

                    <DisplaySection
                      title="Contact & Links"
                      rows={[
                        ["Contact Email", business.contact_email || business.email],
                        ["Phone", business.phone],
                        ["Best Contact", business.best_contact_method],
                        ["Website", business.website],
                        ["Instagram", business.instagram],
                        ["Facebook", business.facebook],
                      ]}
                    />

                    <div style={styles.sectionDivider} />

                    <DisplaySection
                      title="Location & Setup"
                      rows={[
                        ["Street Address", business.address],
                        ["City", business.city],
                        ["State", business.state],
                        ["ZIP", business.zip],
                        ["Latitude", business.latitude],
                        ["Longitude", business.longitude],
                      ]}
                      blocks={[["Permits / Notes", business.permits_info]]}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={styles.sideColumn}>
            <div style={styles.billingCard}>
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.cardEyebrow}>Billing</p>
                  <h3 style={styles.cardTitle}>Billing & visibility status</h3>
                </div>
              </div>

              <div style={styles.billingTopBox}>
                <div>
                  <p style={styles.billingBigLabel}>Current billing status</p>
                  <h3 style={styles.billingBigValue}>{billingLabel}</h3>
                </div>

                <span style={styles.liveBadge}>{visibilityLabel}</span>
              </div>

              <div style={styles.metricGrid}>
                <Metric label="Subscription" value={business.subscription_status || "inactive"} />
                <Metric label="Payment" value={business.payment_status || "unpaid"} />
                <Metric label="Override" value={business.payment_override ? "Yes" : "No"} />
                <Metric label="Agreement" value={business.agreed_to_terms ? "Signed" : "Needed"} />
              </div>

              <div style={styles.billingActionStack}>
                <button
                  type="button"
                  style={styles.billingCardButton}
                  onClick={() => handleStartCheckout("card")}
                  disabled={startingCheckout}
                >
                  {startingCheckout ? "Opening Checkout..." : "Pay with Card — $15.99"}
                </button>

                <button
                  type="button"
                  style={styles.billingBankButton}
                  onClick={() => handleStartCheckout("ach")}
                  disabled={startingCheckout}
                >
                  {startingCheckout ? "Opening Checkout..." : "Pay with Bank — $14.99"}
                </button>
              </div>
            </div>

            <div style={styles.helperCard}>
              <p style={styles.cardEyebrow}>Seller Readiness</p>
              <h3 style={styles.cardTitle}>What helps you stand out</h3>
              <ul style={styles.helperList}>
                <li>Add a strong business photo or logo</li>
                <li>Fill in what you sell and your business type</li>
                <li>Add website and social links</li>
                <li>Add featured products to your public profile</li>
                <li>Create live events so customers can find you</li>
              </ul>
            </div>
          </div>
        </div>

        <div style={styles.bottomGrid}>
          <div style={styles.calendarCard}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.cardEyebrow}>Events</p>
                <h3 style={styles.cardTitle}>Event calendar</h3>
                <p style={styles.smallMuted}>Click any day to see what’s booked there.</p>
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

                const dayEvents = events.filter((event) =>
                  isDateInEventRange(dateObj, event)
                );

                const hasEvents = dayEvents.length > 0;
                const hasLive = dayEvents.some((event) => getEventStatus(event) === "live");

                return (
                  <button
                    key={dateObj.toISOString()}
                    type="button"
                    style={{
                      ...styles.dayCell,
                      ...(hasEvents ? styles.dayCellHasEvent : {}),
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

                      {dayEvents.length > 2 ? (
                        <div style={styles.moreEventsChip}>+{dayEvents.length - 2} more</div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={styles.selectedDayPanel}>
              <div style={styles.selectedDayHeader}>
                <div>
                  <p style={styles.cardEyebrow}>Selected Day</p>
                  <h4 style={styles.subsectionTitle}>{formatDisplayDate(selectedDay)}</h4>
                </div>
              </div>

              {selectedDayEvents.length === 0 ? (
                <p style={styles.smallMuted}>No events on this day yet.</p>
              ) : (
                <div style={styles.selectedDayList}>
                  {selectedDayEvents.map((event) => (
                    <div key={event.id} style={styles.selectedEventCard}>
                      <div style={styles.selectedEventTop}>
                        <strong>{event.title || "Untitled Event"}</strong>
                        <span
                          style={{
                            ...styles.miniStatusPill,
                            background:
                              getEventStatus(event) === "live" ? "#ecfdf3" : "#f5f5f5",
                            color: getEventStatus(event) === "live" ? "#027a48" : "#666666",
                          }}
                        >
                          {getEventStatus(event)}
                        </span>
                      </div>

                      <p style={styles.eventLine}>Type: {event.type || "—"}</p>
                      <p style={styles.eventLine}>
                        Location: {event.address || event.city || "—"}
                      </p>
                      <p style={styles.eventLine}>
                        Starts: {formatDisplayDateTime(event.start_time)}
                      </p>
                      <p style={styles.eventLine}>
                        Ends: {formatDisplayDateTime(event.end_time)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div id="create-event-card" style={styles.eventFormCard}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.cardEyebrow}>Go Live</p>
                <h3 style={styles.cardTitle}>Create live event</h3>
                <p style={styles.smallMuted}>
                  Add your exact event address so your business can appear on the map.
                </p>
              </div>
            </div>

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

              <p style={styles.ruleText}>Live events can run for a maximum of 7 days.</p>

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
      </div>
    </div>
  );
}

function DisplaySection({ title, rows = [], blocks = [] }) {
  return (
    <div style={styles.displaySection}>
      <h4 style={styles.subsectionTitle}>{title}</h4>

      {rows.map(([label, value]) => (
        <div key={label} style={styles.infoRow}>
          <span style={styles.infoLabel}>{label}</span>
          <span style={styles.infoValue}>{value || "—"}</span>
        </div>
      ))}

      {blocks.map(([label, value]) => (
        <div key={label} style={styles.infoBlock}>
          <span style={styles.infoLabel}>{label}</span>
          <p style={styles.infoParagraph}>{value || "—"}</p>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={styles.metricMiniCard}>
      <span style={styles.metricMiniLabel}>{label}</span>
      <strong style={styles.metricMiniValue}>{value}</strong>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <strong style={styles.statValue}>{value}</strong>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "24px 18px 44px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    color: "#111827",
  },
  shell: { maxWidth: "1440px", margin: "0 auto" },
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    fontFamily: "Arial, sans-serif",
  },
  loadingCard: {
    padding: "20px 24px",
    borderRadius: "18px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
    color: "#64748b",
    fontSize: "14px",
  },
  emptyCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 20px 44px rgba(15,23,42,0.06)",
  },
  heroCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "28px",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "center",
    flexWrap: "wrap",
    boxShadow: "0 18px 42px rgba(15,23,42,0.06)",
  },
  heroLeft: { display: "flex", flexDirection: "column", gap: "8px", maxWidth: "920px" },
  heroEyebrow: {
    margin: 0,
    fontSize: "11px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#64748b",
    fontWeight: 800,
  },
  heroTitle: {
    margin: 0,
    fontSize: "36px",
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    color: "#0f172a",
  },
  heroSubtitle: { margin: 0, color: "#64748b", fontSize: "14px", lineHeight: 1.6 },
  heroMetaRow: { display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" },
  heroActions: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  statusPill: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "capitalize",
  },
  softPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    color: "#334155",
    fontSize: "12px",
    fontWeight: 700,
  },
  quickActionsBar: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "18px",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
    flexWrap: "wrap",
    boxShadow: "0 12px 28px rgba(15,23,42,0.04)",
  },
  quickActionsTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 900,
    color: "#0f172a",
  },
  quickActionsText: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "#64748b",
  },
  quickActionsButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "1.35fr 0.75fr",
    gap: "18px",
    alignItems: "start",
    marginBottom: "18px",
  },
  sideColumn: { display: "flex", flexDirection: "column", gap: "18px" },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: "18px",
    alignItems: "start",
  },
  businessCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 16px 36px rgba(15,23,42,0.05)",
  },
  billingCard: {
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 16px 36px rgba(15,23,42,0.06)",
  },
  helperCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "0 14px 30px rgba(15,23,42,0.04)",
  },
  statsStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "14px",
    marginBottom: "18px",
  },
  statCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },
  statLabel: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.09em",
    marginBottom: "10px",
  },
  statValue: { fontSize: "34px", fontWeight: 900, lineHeight: 1, color: "#0f172a" },
  calendarCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 16px 36px rgba(15,23,42,0.05)",
  },
  eventFormCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 16px 36px rgba(15,23,42,0.05)",
    scrollMarginTop: "18px",
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
    color: "#64748b",
    fontWeight: 900,
  },
  cardTitle: { margin: 0, fontSize: "19px", fontWeight: 900, lineHeight: 1.2, color: "#0f172a" },
  subsectionTitle: {
    margin: "0 0 10px 0",
    fontSize: "16px",
    fontWeight: 900,
    color: "#0f172a",
  },
  businessProfileLayout: {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gap: "20px",
    alignItems: "start",
  },
  businessImageColumn: { display: "flex", flexDirection: "column", gap: "14px" },
  businessImageWrap: { width: "100%" },
  businessImage: {
    width: "100%",
    height: "220px",
    objectFit: "cover",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  businessImagePlaceholder: {
    height: "220px",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontWeight: 800,
  },
  completionCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    background: "#f8fafc",
    padding: "14px",
  },
  completionTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    alignItems: "center",
    marginBottom: "10px",
  },
  completionLabel: {
    fontSize: "11px",
    fontWeight: 900,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  completionPercent: { fontSize: "14px", fontWeight: 900, color: "#0f172a" },
  completionBarTrack: {
    width: "100%",
    height: "10px",
    borderRadius: "999px",
    background: "#e5e7eb",
    overflow: "hidden",
    marginBottom: "10px",
  },
  completionBarFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #111827 0%, #334155 100%)",
  },
  completionText: { margin: 0, fontSize: "12px", lineHeight: 1.5, color: "#64748b" },
  businessDetails: { display: "flex", flexDirection: "column", gap: "12px" },
  sectionBlock: { display: "flex", flexDirection: "column", gap: "10px" },
  displaySection: { display: "flex", flexDirection: "column" },
  sectionDivider: { height: "1px", background: "#e5e7eb", margin: "2px 0" },
  formStack: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  threeCol: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  infoBlock: { paddingTop: "10px" },
  infoLabel: {
    fontSize: "11px",
    fontWeight: 900,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    minWidth: "120px",
  },
  infoValue: {
    fontSize: "14px",
    fontWeight: 800,
    color: "#0f172a",
    textAlign: "right",
    wordBreak: "break-word",
  },
  infoParagraph: { margin: "8px 0 0 0", color: "#475569", lineHeight: 1.7, fontSize: "14px" },
  label: { fontSize: "13px", fontWeight: 800, color: "#334155", marginTop: "2px" },
  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
  },
  textarea: {
    width: "100%",
    minHeight: "120px",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
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
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
  },
  uploadBox: { display: "block", cursor: "pointer" },
  uploadInner: {
    border: "1.5px dashed #cbd5e1",
    borderRadius: "18px",
    background: "#f8fafc",
    padding: "18px 14px",
    textAlign: "center",
  },
  uploadIcon: { fontSize: "24px", marginBottom: "8px" },
  uploadTitle: { margin: "0 0 4px 0", fontSize: "14px", fontWeight: 900, color: "#0f172a" },
  uploadText: { margin: 0, fontSize: "12px", color: "#64748b", lineHeight: 1.5 },
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
    fontWeight: 800,
    color: "#334155",
    marginTop: "2px",
  },
  billingTopBox: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    background: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: "14px",
  },
  billingBigLabel: {
    margin: "0 0 6px 0",
    fontSize: "11px",
    fontWeight: 900,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  billingBigValue: { margin: 0, fontSize: "26px", fontWeight: 900, lineHeight: 1.1, color: "#0f172a" },
  liveBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#ecfdf3",
    border: "1px solid #bbf7d0",
    color: "#027a48",
    fontWeight: 900,
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
  metricGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  metricMiniCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "12px 14px",
    background: "#ffffff",
  },
  metricMiniLabel: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "6px",
  },
  metricMiniValue: { fontSize: "14px", fontWeight: 900, color: "#0f172a" },
  billingActionStack: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" },
  helperList: {
    margin: "10px 0 0 0",
    paddingLeft: "18px",
    color: "#475569",
    fontSize: "13px",
    lineHeight: 1.7,
  },
  selectedDayPanel: { marginTop: "18px", borderTop: "1px solid #e5e7eb", paddingTop: "16px" },
  selectedDayHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "10px",
  },
  selectedDayList: { display: "flex", flexDirection: "column", gap: "10px" },
  selectedEventCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "12px",
    background: "#ffffff",
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
    fontWeight: 900,
    textTransform: "capitalize",
  },
  eventLine: { margin: "4px 0", color: "#475569", fontSize: "13px" },
  smallMuted: { margin: "6px 0 0 0", fontSize: "13px", color: "#64748b", lineHeight: 1.5 },
  ruleText: { margin: "-2px 0 2px 0", fontSize: "12px", color: "#64748b", lineHeight: 1.5 },
  calendarNav: { display: "flex", alignItems: "center", gap: "10px" },
  calendarArrow: {
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    cursor: "pointer",
    fontWeight: 800,
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
    color: "#64748b",
    fontWeight: 800,
    textAlign: "center",
    padding: "6px 0",
  },
  calendarGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" },
  blankDay: { minHeight: "92px" },
  dayCell: {
    minHeight: "96px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    padding: "8px",
    textAlign: "left",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  dayCellHasEvent: {
    border: "2px solid #2563eb",
    background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 68%)",
    boxShadow: "inset 0 0 0 1px rgba(37,99,235,0.10)",
  },
  dayCellSelected: {
    border: "2px solid #111827",
    boxShadow: "0 8px 18px rgba(15,23,42,0.12)",
  },
  dayNumberRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    fontSize: "12px",
    fontWeight: 800,
  },
  todayTag: {
    fontSize: "10px",
    background: "#eef2ff",
    color: "#3730a3",
    borderRadius: "999px",
    padding: "3px 6px",
  },
  dayEventsWrap: { display: "flex", flexDirection: "column", gap: "4px" },
  dayEventChip: {
    fontSize: "10px",
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    padding: "4px 6px",
    borderRadius: "8px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  moreEventsChip: {
    fontSize: "10px",
    color: "#1d4ed8",
    fontWeight: 900,
    padding: "2px 4px",
  },
  eyebrow: {
    margin: "0 0 4px 0",
    fontSize: "11px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 900,
    color: "#64748b",
  },
  emptyTitle: { margin: "0 0 8px 0", fontSize: "30px", fontWeight: 900 },
  subtitle: { margin: "0 0 16px 0", color: "#64748b", fontSize: "14px", lineHeight: 1.6 },
  primaryButton: {
    padding: "12px 18px",
    borderRadius: "999px",
    border: "none",
    background: "#111827",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 18px rgba(15,23,42,0.15)",
  },
  primaryButtonSmall: {
    padding: "10px 14px",
    borderRadius: "999px",
    border: "none",
    background: "#111827",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 14px",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
  },
  billingCardButton: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "999px",
    border: "none",
    background: "#111827",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },
  billingBankButton: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "999px",
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },
  messageBox: {
    borderRadius: "16px",
    padding: "13px 15px",
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "18px",
  },
};