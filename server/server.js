require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const nodemailer = require("nodemailer");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());

// ✅ FORCE CORRECT FRONTEND URL (NO OLD PORTS EVER)
const APP_URL = process.env.APP_URL || "http://localhost:3004";
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

// EMAIL SETUP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: Number(process.env.SMTP_PORT || 465) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function updateBusinessBillingStatus(businessId, values) {
  return updateBusinessBillingStatusByField("id", businessId, values);
}

async function updateBusinessBillingStatusByField(field, value, values) {
  if (!SUPABASE_URL) {
    throw new Error("Missing SUPABASE_URL for billing update");
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for billing update");
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/businesses`);
  url.searchParams.set(field, `eq.${value}`);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(values),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Supabase business update failed");
  }

  return Array.isArray(data) ? data[0] || null : data;
}

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ STRIPE WEBHOOK SIGNATURE ERROR:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const businessId = session.metadata?.businessId || null;
          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id || null;
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id || null;
          const paidUntil = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString();

          if (businessId) {
            await updateBusinessBillingStatus(businessId, {
              payment_status: "paid",
              subscription_status: "active",
              paid_until: paidUntil,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
            });
          }

          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object;
          const subscriptionId =
            typeof invoice.subscription === "string"
              ? invoice.subscription
              : invoice.subscription?.id || null;
          const customerId =
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id || null;
          const paidUntilUnix =
            invoice.lines?.data?.[0]?.period?.end || invoice.period_end || null;
          const updates = {
            paid_until: paidUntilUnix
              ? new Date(paidUntilUnix * 1000).toISOString()
              : null,
          };

          if (subscriptionId) {
            await updateBusinessBillingStatusByField(
              "stripe_subscription_id",
              subscriptionId,
              updates
            );
          } else if (customerId) {
            await updateBusinessBillingStatusByField(
              "stripe_customer_id",
              customerId,
              updates
            );
          }

          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object;
          const customerId =
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer?.id || null;
          const updates = {
            subscription_status: subscription.status || "active",
            paid_until: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          };

          await updateBusinessBillingStatusByField(
            "stripe_subscription_id",
            subscription.id,
            updates
          ).catch(async () => {
            if (customerId) {
              await updateBusinessBillingStatusByField(
                "stripe_customer_id",
                customerId,
                {
                  ...updates,
                  stripe_subscription_id: subscription.id,
                  stripe_customer_id: customerId,
                }
              );
            }
          });

          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const customerId =
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer?.id || null;
          const updates = {
            subscription_status: "inactive",
          };

          await updateBusinessBillingStatusByField(
            "stripe_subscription_id",
            subscription.id,
            updates
          ).catch(async () => {
            if (customerId) {
              await updateBusinessBillingStatusByField(
                "stripe_customer_id",
                customerId,
                updates
              );
            }
          });

          break;
        }

        default:
          break;
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("❌ STRIPE WEBHOOK ERROR:", err.message);
      return res.status(500).json({ error: "Webhook handler failed" });
    }
  }
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// DEBUG LOGS (KEEP THESE — SUPER HELPFUL)
console.log("STRIPE KEY PREFIX:", process.env.STRIPE_SECRET_KEY?.slice(0, 8));
console.log("STRIPE CARD PRICE ID:", process.env.STRIPE_CARD_PRICE_ID);
console.log("STRIPE ACH PRICE ID:", process.env.STRIPE_ACH_PRICE_ID);
console.log("APP URL:", APP_URL);
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("EMAIL FROM:", process.env.EMAIL_FROM);
console.log("ADMIN NOTIFY EMAIL:", process.env.ADMIN_NOTIFICATION_EMAIL);

// ==============================
// CREATE STRIPE CHECKOUT SESSION
// ==============================
app.post("/api/billing/create-checkout-session", async (req, res) => {
  try {
    const { businessId, email, paymentType } = req.body;

    let priceId;
    let paymentMethods;

    if (paymentType === "ach") {
      priceId = process.env.STRIPE_ACH_PRICE_ID;
      paymentMethods = ["us_bank_account"];
    } else {
      priceId = process.env.STRIPE_CARD_PRICE_ID;
      paymentMethods = ["card"];
    }

    if (!priceId) {
      return res.status(400).json({ error: "Missing Stripe price configuration" });
    }

    if (!businessId) {
      return res.status(400).json({ error: "Missing businessId" });
    }

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: paymentMethods,
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&businessId=${businessId}`,
      cancel_url: `${APP_URL}/payment-setup?businessId=${businessId}&canceled=true`,
      metadata: {
        businessId,
        paymentType: paymentType || "card",
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ CREATE SESSION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// VERIFY STRIPE SESSION
// ==============================
app.post("/api/billing/verify-session", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer", "subscription"],
    });

    if (!session) {
      return res.status(404).json({ error: "Stripe session not found" });
    }

    const isPaid =
      session.payment_status === "paid" || session.status === "complete";

    const businessId = session.metadata?.businessId || null;
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id || null;
    const subscription =
      typeof session.subscription === "string" ? null : session.subscription || null;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id || null;

    if (isPaid && businessId) {
      await updateBusinessBillingStatus(businessId, {
        payment_status: "paid",
        subscription_status: subscription?.status || "active",
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        paid_until: subscription?.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      });
    }

    res.json({
      ok: true,
      session_id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      paid: isPaid,
      customer_id: customerId,
      subscription_id: subscriptionId,
      businessId,
      payment_type: session.metadata?.paymentType || "card",
    });
  } catch (err) {
    console.error("❌ VERIFY SESSION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// SEND APPROVAL EMAIL
// ==============================
app.post("/api/admin/send-approval-email", async (req, res) => {
  try {
    const { email, businessName, businessId } = req.body;

    if (!email || !businessId) {
      return res.status(400).json({
        error: "Missing email or businessId",
      });
    }

    // ✅ ALWAYS USE CORRECT FRONTEND
    const agreementUrl = `${APP_URL}/seller-agreement?businessId=${businessId}`;

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h2>You're approved 🎉</h2>
        <p>Your business <strong>${businessName || "Business"}</strong> has been approved.</p>

        <a href="${agreementUrl}" 
           style="background:#173d33;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;">
          Review Seller Agreement
        </a>

        <p style="margin-top:12px;">If the button doesn’t work, use this link:</p>
        <p>${agreementUrl}</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "You're approved on Right to the Source 🎉",
      html,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ APPROVAL EMAIL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// SEND ADMIN NEW SUBMISSION EMAIL
// ==============================
app.post("/api/admin/new-submission-notify", async (req, res) => {
  try {
    const { businessName, contactEmail, category, location, businessId } = req.body;

    const reviewUrl = `${APP_URL}/review-submissions`;

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h2>New seller submission received 🚀</h2>

        <p><strong>Business:</strong> ${businessName || "New Business"}</p>
        <p><strong>Email:</strong> ${contactEmail || "Not provided"}</p>
        <p><strong>Category:</strong> ${category || "Not provided"}</p>
        <p><strong>Location:</strong> ${location || "Not provided"}</p>
        <p><strong>Business ID:</strong> ${businessId || "Not provided"}</p>

        <a href="${reviewUrl}" 
           style="background:#173d33;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;display:inline-block;">
          Open Review Submissions
        </a>

        <p style="margin-top:12px;">If the button doesn’t work, use this link:</p>
        <p>${reviewUrl}</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_NOTIFICATION_EMAIL,
      subject: "New business submission to review 🚀",
      html,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ NEW SUBMISSION EMAIL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// START SERVER
// ==============================
const PORT = process.env.PORT || 4242;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🔥 SOURCE APP BACKEND RUNNING ON PORT ${PORT}`);
  });
}

module.exports = app;
