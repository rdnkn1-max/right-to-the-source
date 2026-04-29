import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AddProduct() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    business_id: "",
    title: "",
    type: "craft_fair",
    address: "",
    city: "",
    state: "FL",
    start_time: "",
    end_time: "",
    note: "",
    is_active: true,
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  async function fetchBusinesses() {
    const { data, error } = await supabase
      .from("businesses")
      .select("id, business_name")
      .order("business_name", { ascending: true });

    if (error) {
      console.log("Error loading businesses:", error);
      setBusinesses([]);
      return;
    }

    setBusinesses(data || []);
  }

  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function getCoordinates(fullAddress) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      fullAddress
    )}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const fullAddress = `${form.address}, ${form.city}, ${form.state}`;
      const coords = await getCoordinates(fullAddress);

      if (!coords) {
        setMessage("Could not find that address. Try a more complete address.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("seller_events").insert([
        {
          business_id: form.business_id,
          type: form.type,
          title: form.title,
          address: form.address,
          city: form.city,
          state: form.state,
          start_time: form.start_time,
          end_time: form.end_time,
          note: form.note,
          is_active: form.is_active,
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      ]);

      if (error) {
        console.log("Insert error:", error);
        setMessage("Could not save event.");
        setLoading(false);
        return;
      }

      setMessage("Live event created successfully.");

      setForm({
        business_id: "",
        title: "",
        type: "craft_fair",
        address: "",
        city: "",
        state: "FL",
        start_time: "",
        end_time: "",
        note: "",
        is_active: true,
      });
    } catch (err) {
      console.log("Submit error:", err);
      setMessage("Something went wrong while finding the address.");
    }

    setLoading(false);
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f7f3ec",
      padding: "40px 20px",
      fontFamily: "Arial, sans-serif",
      color: "#1f1f1f",
    },
    shell: {
      maxWidth: "760px",
      margin: "0 auto",
      background: "#fff",
      border: "1px solid #e5dbcf",
      borderRadius: "24px",
      padding: "28px",
      boxShadow: "0 16px 36px rgba(66, 49, 21, 0.08)",
    },
    eyebrow: {
      fontSize: "11px",
      fontWeight: 800,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "#8a6b4b",
      marginBottom: "8px",
    },
    title: {
      margin: "0 0 8px 0",
      fontSize: "34px",
      fontWeight: 800,
    },
    text: {
      margin: "0 0 24px 0",
      color: "#6b645d",
      lineHeight: 1.6,
      fontSize: "15px",
    },
    form: {
      display: "grid",
      gap: "14px",
    },
    twoCol: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "14px",
    },
    threeCol: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "14px",
    },
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: 700,
      marginBottom: "6px",
      color: "#3f3a35",
    },
    input: {
      width: "100%",
      padding: "13px 14px",
      borderRadius: "14px",
      border: "1px solid #d8cfc3",
      boxSizing: "border-box",
      fontSize: "14px",
      background: "#fff",
    },
    textarea: {
      width: "100%",
      minHeight: "110px",
      padding: "13px 14px",
      borderRadius: "14px",
      border: "1px solid #d8cfc3",
      boxSizing: "border-box",
      fontSize: "14px",
      background: "#fff",
      resize: "vertical",
    },
    checkboxRow: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginTop: "4px",
    },
    button: {
      padding: "14px 18px",
      borderRadius: "14px",
      border: "none",
      background: "#173d33",
      color: "#fff",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: "15px",
      marginTop: "8px",
    },
    message: {
      marginTop: "16px",
      padding: "14px 16px",
      borderRadius: "14px",
      background: "#f4efe7",
      border: "1px solid #e5dbcf",
      color: "#4e4741",
      fontSize: "14px",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.eyebrow}>Create Live Event</div>
        <h1 style={styles.title}>Add a live location</h1>
        <p style={styles.text}>
          Enter the event details below. The address will automatically convert
          into map coordinates and show up on your live map.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label}>Business</label>
            <select
              value={form.business_id}
              onChange={(e) => handleChange("business_id", e.target.value)}
              style={styles.input}
              required
            >
              <option value="">Select a business</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.business_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Event title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="RDNKN Live Booth"
              style={styles.input}
              required
            />
          </div>

          <div>
            <label style={styles.label}>Event type</label>
            <select
              value={form.type}
              onChange={(e) => handleChange("type", e.target.value)}
              style={styles.input}
              required
            >
              <option value="craft_fair">Craft Fair</option>
              <option value="food_truck">Food Truck</option>
              <option value="pop_up">Pop-Up</option>
              <option value="market">Market</option>
              <option value="apparel">Apparel</option>
              <option value="seafood">Seafood</option>
              <option value="beef">Beef</option>
              <option value="poultry">Poultry</option>
              <option value="pantry">Pantry</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>Street address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="1790 Basin St"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.threeCol}>
            <div>
              <label style={styles.label}>City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Merritt Island"
                style={styles.input}
                required
              />
            </div>

            <div>
              <label style={styles.label}>State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
                placeholder="FL"
                style={styles.input}
                required
              />
            </div>

            <div>
              <label style={styles.label}>Active now?</label>
              <div style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => handleChange("is_active", e.target.checked)}
                />
                <span>Yes</span>
              </div>
            </div>
          </div>

          <div style={styles.twoCol}>
            <div>
              <label style={styles.label}>Start time</label>
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => handleChange("start_time", e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div>
              <label style={styles.label}>End time</label>
              <input
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => handleChange("end_time", e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>Note</label>
            <textarea
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
              placeholder="At the front near the washrooms"
              style={styles.textarea}
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Saving live event..." : "Create Live Event"}
          </button>
        </form>

        {message && <div style={styles.message}>{message}</div>}
      </div>
    </div>
  );
}