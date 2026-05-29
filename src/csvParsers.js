import Papa from "papaparse";
import { genId } from "./utils";

/**
 * Parse review CSV - flexible column matching
 * Accepts: property/property_name/listing, ota/platform/channel,
 * date/review_date/created_at, rating/score/stars,
 * text/review/comment/review_text/comments, guest/guest_name/reviewer
 */
export function parseReviewCSV(text) {
  const { data, errors } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  if (errors.length > 0) {
    console.warn("CSV parse warnings:", errors);
  }

  const pick = (r, keys) => keys.reduce((v, k) => v || r[k] || "", "");

  const mapped = data
    .filter((r) => {
      const txt = pick(r, [
        "text", "review", "comment", "review_text", "comments", "review_body",
        "public_review", "guest_review", "guest_comment", "private_feedback",
        "description", "feedback", "notes",
      ]);
      return txt.trim().length > 0;
    })
    .map((r) => ({
      id: genId(),
      property: pick(r, [
        "property", "property_name", "listing", "listing_name", "listing_title",
        "unit", "unit_name", "accommodation", "rental",
      ]) || "Unknown",
      ota: pick(r, [
        "ota", "platform", "channel", "source", "booking_channel",
        "booking_platform", "site",
      ]) || "Unknown",
      date: pick(r, [
        "date", "review_date", "created_at", "created", "submitted",
        "check_out", "check_out_date", "checkout_date", "check-out_date",
        "departure_date", "stay_date",
      ]),
      rating: parseFloat(pick(r, [
        "rating", "score", "overall_rating", "stars", "overall",
        "overall_score", "review_rating", "total_rating",
      ]) || 0),
      text: pick(r, [
        "text", "review", "comment", "review_text", "comments", "review_body",
        "public_review", "guest_review", "guest_comment", "private_feedback",
        "description", "feedback", "notes",
      ]),
      guest: pick(r, [
        "guest", "guest_name", "reviewer", "reviewer_name", "name",
        "traveler", "traveller", "author",
      ]),
      category_ratings: extractCategoryRatings(r),
      analyzed: false,
    }));

  return mapped;
}

/**
 * Extract sub-category ratings if present (Airbnb-style)
 */
function extractCategoryRatings(row) {
  const categories = {};
  const catKeys = [
    "cleanliness", "communication", "check_in", "checkin", "check-in",
    "accuracy", "location", "value", "overall",
  ];
  Object.keys(row).forEach((k) => {
    const lower = k.toLowerCase().replace(/\s+/g, "_");
    catKeys.forEach((cat) => {
      if (lower.includes(cat) && !isNaN(parseFloat(row[k]))) {
        categories[cat.replace(/-/g, "_").replace("checkin", "check_in")] = parseFloat(row[k]);
      }
    });
  });
  return Object.keys(categories).length > 0 ? categories : null;
}

/**
 * Parse property CSV
 */
export function parsePropertyCSV(text) {
  const { data } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  return data
    .filter((r) => r.name || r.property || r.property_name || r.listing || r.unit)
    .map((r) => ({
      id: genId(),
      name:
        r.name || r.property || r.property_name || r.listing || r.unit || r.unit_name,
      market: r.market || r.city || r.location || r.area || r.region || "",
      otas: (
        r.otas || r.platforms || r.channels || r.active_channels || "Airbnb,Booking.com,VRBO"
      )
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      guestyId: r.guesty_id || r.external_id || r.pms_id || r.id || "",
      type: r.type || r.property_type || "",
      bedrooms: r.bedrooms || r.beds || "",
      maxGuests: r.max_guests || r.capacity || r.guests || "",
      airbnbUrl: r.airbnb_url || r.airbnb_link || r.airbnb || "",
      bookingUrl: r.booking_url || r.booking_link || r.booking || "",
      vrboUrl: r.vrbo_url || r.vrbo_link || r.vrbo || "",
      added: new Date().toISOString(),
    }));
}

/**
 * Parse listing audit CSV - all non-standard columns become audit fields
 */
export function parseAuditCSV(text) {
  const { data } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const metaKeys = new Set([
    "property", "property_name", "listing", "unit",
    "ota", "platform", "channel",
    "date", "audit_date",
  ]);

  return data
    .filter((r) => {
      const lower = {};
      Object.keys(r).forEach((k) => (lower[k.toLowerCase().replace(/\s+/g, "_")] = r[k]));
      return lower.property || lower.property_name || lower.listing || lower.unit;
    })
    .map((r) => {
      const lower = {};
      Object.keys(r).forEach((k) => (lower[k.toLowerCase().replace(/\s+/g, "_")] = r[k]));

      const base = {
        id: genId(),
        property:
          lower.property || lower.property_name || lower.listing || lower.unit,
        ota: lower.ota || lower.platform || lower.channel || "All",
        date: lower.date || lower.audit_date || new Date().toISOString(),
      };

      const fields = {};
      Object.keys(r).forEach((k) => {
        const kl = k.toLowerCase().replace(/\s+/g, "_");
        if (!metaKeys.has(kl)) {
          fields[k] = r[k];
        }
      });

      return { ...base, fields };
    });
}

/**
 * Export data as CSV and trigger download
 */
export function exportCSV(data, filename) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
