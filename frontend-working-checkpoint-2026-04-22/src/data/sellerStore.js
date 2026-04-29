import baseSellers from "./sellers";

const PENDING_KEY = "the_source_pending_submissions";
const APPROVED_KEY = "the_source_approved_sellers";

function readJson(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeProducts(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  }
  return [];
}

function normalizeImage(image) {
  if (!image) return "https://via.placeholder.com/600x400?text=Business+Photo";
  return image;
}

function buildLiveSellerId() {
  return `seller-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function getPendingSubmissions() {
  if (typeof window === "undefined") return [];
  return readJson(PENDING_KEY, []);
}

export function getApprovedSellers() {
  if (typeof window === "undefined") return [];
  return readJson(APPROVED_KEY, []);
}

export function getAllLiveSellers() {
  const approved = typeof window === "undefined" ? [] : getApprovedSellers();
  return [...baseSellers, ...approved];
}

export function getSellerById(id) {
  return getAllLiveSellers().find((seller) => String(seller.id) === String(id));
}

export function getApprovedSellerById(id) {
  return getApprovedSellers().find((seller) => String(seller.id) === String(id));
}

export function createSubmission(formData) {
  const pending = getPendingSubmissions();

  const submission = {
    id: `submission-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    submittedAt: new Date().toISOString(),
    businessName: formData.businessName?.trim() || "",
    ownerName: formData.ownerName?.trim() || "",
    email: formData.email?.trim() || "",
    phone: formData.phone?.trim() || "",
    category: formData.category?.trim() || "Apparel",
    city: formData.city?.trim() || "",
    state: formData.state?.trim() || "",
    description: formData.description?.trim() || "",
    website: formData.website?.trim() || "",
    instagram: formData.instagram?.trim() || "",
    image: normalizeImage(formData.image),
    lat: Number(formData.lat),
    lng: Number(formData.lng),
    featured: false,
    products: normalizeProducts(formData.products),
  };

  pending.unshift(submission);
  writeJson(PENDING_KEY, pending);
  return submission;
}

export function approveSubmission(submissionId) {
  const pending = getPendingSubmissions();
  const approved = getApprovedSellers();

  const found = pending.find((item) => item.id === submissionId);
  if (!found) return null;

  const liveSeller = {
    id: buildLiveSellerId(),
    name: found.businessName,
    category: found.category,
    city: found.city,
    state: found.state,
    lat: Number(found.lat),
    lng: Number(found.lng),
    image: normalizeImage(found.image),
    description: found.description,
    featured: Boolean(found.featured),
    website: found.website,
    instagram: found.instagram,
    phone: found.phone,
    email: found.email,
    ownerName: found.ownerName,
    products: normalizeProducts(found.products),
    approvedAt: new Date().toISOString(),
  };

  writeJson(
    PENDING_KEY,
    pending.filter((item) => item.id !== submissionId)
  );

  approved.unshift(liveSeller);
  writeJson(APPROVED_KEY, approved);

  return liveSeller;
}

export function rejectSubmission(submissionId) {
  const pending = getPendingSubmissions();
  writeJson(
    PENDING_KEY,
    pending.filter((item) => item.id !== submissionId)
  );
}

export function updateApprovedSeller(sellerId, updates) {
  const approved = getApprovedSellers();

  const next = approved.map((seller) => {
    if (String(seller.id) !== String(sellerId)) return seller;

    return {
      ...seller,
      name: updates.name?.trim?.() ?? seller.name,
      category: updates.category?.trim?.() ?? seller.category,
      city: updates.city?.trim?.() ?? seller.city,
      state: updates.state?.trim?.() ?? seller.state,
      lat:
        updates.lat !== undefined && updates.lat !== ""
          ? Number(updates.lat)
          : seller.lat,
      lng:
        updates.lng !== undefined && updates.lng !== ""
          ? Number(updates.lng)
          : seller.lng,
      image: updates.image ? normalizeImage(updates.image) : seller.image,
      description: updates.description?.trim?.() ?? seller.description,
      featured:
        typeof updates.featured === "boolean" ? updates.featured : seller.featured,
      website: updates.website?.trim?.() ?? seller.website,
      instagram: updates.instagram?.trim?.() ?? seller.instagram,
      phone: updates.phone?.trim?.() ?? seller.phone,
      email: updates.email?.trim?.() ?? seller.email,
      ownerName: updates.ownerName?.trim?.() ?? seller.ownerName,
      products:
        updates.products !== undefined
          ? normalizeProducts(updates.products)
          : normalizeProducts(seller.products),
      updatedAt: new Date().toISOString(),
    };
  });

  writeJson(APPROVED_KEY, next);
  return next.find((seller) => String(seller.id) === String(sellerId)) || null;
}

export function deleteApprovedSeller(sellerId) {
  const approved = getApprovedSellers();
  writeJson(
    APPROVED_KEY,
    approved.filter((seller) => String(seller.id) !== String(sellerId))
  );
}

export function clearAllSubmissionData() {
  localStorage.removeItem(PENDING_KEY);
  localStorage.removeItem(APPROVED_KEY);
}