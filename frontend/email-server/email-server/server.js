const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const GMAIL_USER = "righttothesourcemarketplace@gmail.com";
const GMAIL_APP_PASSWORD = "bemlseadjvvvnwwb";
const ADMIN_EMAIL = "righttothesourcemarketplace@gmail.com";

const FRONTEND_BASE_URL = "http://localhost:3008";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

app.get("/", (_req, res) => {
  res.send("Email server is running.");
});

app.post("/send-new-application-email", async (req, res) => {
  const {
    business_name,
    owner_name,
    contact_email,
    phone,
    website,
    instagram,
    facebook,
    category,
    business_type,
    what_they_sell,
    why_join,
    city,
    state,
  } = req.body;

  try {
    await transporter.sendMail({
      from: `"Right to The Source" <${GMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `🚨 New Business Application: ${business_name || "New Submission"}`,
      html: `<p>New application received</p>
      <a href="${FRONTEND_BASE_URL}/review-submissions">Review Submission</a>`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("NEW APPLICATION EMAIL ERROR:", err);
    res.status(500).json({ error: err.message || "Email failed" });
  }
});

app.post("/send-approval-email", async (req, res) => {
  const { email, businessName, businessId } = req.body;

  console.log("📩 APPROVAL EMAIL DATA:", req.body); // 👈 DEBUG LINE

  if (!email || !businessId) {
    return res.status(400).json({ error: "Missing email or businessId." });
  }

  const agreementUrl = `${FRONTEND_BASE_URL}/seller-agreement?businessId=${businessId}`;

  try {
    await transporter.sendMail({
      from: `"Right to The Source" <${GMAIL_USER}>`,
      to: email,
      subject: "You're approved on Right to The Source 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>You're approved 🎉</h2>

          <p>Your business <strong>${businessName || "Business"}</strong> has been approved.</p>

          <p>Next step: review your agreement.</p>

          <a href="${agreementUrl}" style="padding: 12px 18px; background: green; color: white; text-decoration: none;">
            Review Seller Agreement
          </a>

          <p>${agreementUrl}</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("SEND APPROVAL EMAIL ERROR:", err);
    res.status(500).json({ error: err.message || "Email failed" });
  }
});

app.listen(4000, () => {
  console.log("🔥 Email server running on http://localhost:4000");
});