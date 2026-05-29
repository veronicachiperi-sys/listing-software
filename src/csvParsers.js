import Papa from "papaparse";
import { genId } from "./utils";

// Try a list of aliases, return first match
const pick = (r, keys) => keys.reduce((v, k) => v || r[k] || "", "");

// Auto-detect column roles from content when aliases don't match
function autoDetect(data) {
  if (!data.length) return {};
  const keys = Object.keys(data[0]);
  const sample = data.slice(0, Math.min(20, data.length));
  const result = {};

  const avgLen = k => sample.reduce((s, r) => s + (r[k]?.length || 0), 0) / sample.length;

  // Text: longest-content column, excluding obvious metadata
  const metaLike = /^(id|date|rating|score|stars|property|listing|ota|platform|guest|reviewer|name|status|type|url|link|price|amount|fee|night|bedroom|bath|city|zip|state|country)/;
  const textCandidates = keys
    .filter(k => !metaLike.test(k))
    .sort((a, b) => avgLen(b) - avgLen(a));
  if (textCandidates.length && avgLen(textCandidates[0]) > 10) {
    result.text = textCandidates[0];
  }

  // Rating: numeric column with values 0–10
  for (const k of keys) {
    if (k === result.text) continue;
    const vals = sample.map(r => parseFloat(r[k])).filter(v => !isNaN(v));
    if (vals.length >= sample.length * 0.3 && vals.every(v => v >= 0 && v <= 10)) {
      result.rating = k;
      break;
    }
  }

  // Date: column whose values parse as dates
  for (const k of keys) {
    if (k === result.text || k === result.rating) continue;
    const vals = sample.map(r => r[k]).filter(Boolean);
    if (!vals.length) continue;
    const dateCount = vals.filter(v => !isNaN(Date.parse(v))).length;
    if (dateCount >= vals.length * 0.5) { result.date = k; break; }
  }

  // Property: low-cardinality short-string column (same value repeated = property name)
  for (const k of keys) {
    if ([result.text, result.rating, result.date].includes(k)) continue;
    const vals = sample.map(r => r[k]).filter(Boolean);
    if (!vals.length) continue;
    const uniq = new Set(vals);
    if (uniq.size <= Math.max(3, vals.length * 0.6) && vals[0]?.length > 1 && vals[0]?.length < 80) {
      result.property = k;
      break;
    }
  }

  return result;
}

export function parseReviewCSV(text) {
  const { data, errors } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_"),
  });

  if (errors.length > 0) console.warn("CSV parse warnings:", errors);
  if (!data.length) return [];

  const fb = autoDetect(data);

  return data
    .map((r) => {
      const textVal = pick(r, [
        "text", "review", "comment", "review_text", "comments", "review_body",
        "public_review", "guest_review", "guest_comment", "private_feedback",
        "description", "feedback", "notes", "message",
      ]) || (fb.text ? r[fb.text] : "") || "";

      return {
        id: genId(),
        property: pick(r, [
          "property", "property_name", "listing", "listing_name", "listing_title",
          "unit", "unit_name", "accommodation", "rental",
        ]) || (fb.property ? r[fb.property] : "") || "Unknown",
        ota: pick(r, [
          "ota", "platform", "channel", "source", "booking_channel",
          "booking_platform", "site",
        ]) || "Unknown",
        date: pick(r, [
          "date", "review_date", "created_at", "created", "submitted",
          "check_out", "check_out_date", "checkout_date", "check_out_date",
          "departure_date", "stay_date",
        ]) || (fb.date ? r[fb.date] : "") || "",
        rating: parseFloat(pick(r, [
          "rating", "score", "overall_rating", "stars", "overall",
          "overall_score", "review_rating", "total_rating",
        ]) || (fb.rating ? r[fb.rating] : "") || 0) || 0,
        text: textVal,
        guest: pick(r, [
          "guest", "guest_name", "reviewer", "reviewer_name", "name",
          "traveler", "traveller", "author",
        ]),
        category_ratings: extractCategoryRatings(r),
        analyzed: false,
      };
    })
    .filter(r => r.text.trim().length > 0);
}

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

export function parsePropertyCSV(text) {
  const { data } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_"),
  });

  if (!data.length) return [];

  const fb = autoDetect(data);

  return data
    .filter((r) => pick(r, ["name", "property", "property_name", "listing", "listing_name", "listing_title", "unit", "unit_name"]) || (fb.property ? r[fb.property] : ""))
    .map((r) => ({
      id: genId(),
      name: pick(r, ["name", "property", "property_name", "listing", "listing_name", "listing_title", "unit", "unit_name"]) || (fb.property ? r[fb.property] : "") || "Unknown",
      market: pick(r, ["market", "city", "location", "area", "region", "neighborhood"]),
      otas: (pick(r, ["otas", "platforms", "channels", "active_channels"]) || "Airbnb,Booking.com,VRBO")
        .split(",").map(s => s.trim()).filter(Boolean),
      guestyId: pick(r, ["guesty_id", "external_id", "pms_id", "id"]),
      type: pick(r, ["type", "property_type"]),
      bedrooms: pick(r, ["bedrooms", "beds"]),
      maxGuests: pick(r, ["max_guests", "capacity", "guests"]),
      airbnbUrl: pick(r, ["airbnb_url", "airbnb_link", "airbnb"]),
      bookingUrl: pick(r, ["booking_url", "booking_link", "booking"]),
      vrboUrl: pick(r, ["vrbo_url", "vrbo_link", "vrbo"]),
      added: new Date().toISOString(),
    }));
}

export function parseAuditCSV(text) {
  const { data } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (!data.length) return [];

  const metaKeys = new Set([
    "property", "property_name", "listing", "unit",
    "ota", "platform", "channel",
    "date", "audit_date",
  ]);

  return data
    .map((r) => {
      const lower = {};
      Object.keys(r).forEach((k) => (lower[k.toLowerCase().replace(/[\s-]+/g, "_")] = r[k]));

      const base = {
        id: genId(),
        property: lower.property || lower.property_name || lower.listing || lower.unit || "Unknown",
        ota: lower.ota || lower.platform || lower.channel || "All",
        date: lower.date || lower.audit_date || new Date().toISOString(),
      };

      const fields = {};
      Object.keys(r).forEach((k) => {
        const kl = k.toLowerCase().replace(/[\s-]+/g, "_");
        if (!metaKeys.has(kl)) fields[k] = r[k];
      });

      return { ...base, fields };
    })
    .filter(r => r.property !== "Unknown" || Object.keys(r.fields).length > 0);
}

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
