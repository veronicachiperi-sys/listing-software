import React, { useState, useRef } from "react";
import { Icon, MetricCard, Card } from "./ui";
import { genId } from "../utils";

export default function UploadView({
  properties, reviews, auditData,
  onUploadReviews, onUploadProperties, onUploadAudit, onPasteReviews,
  onAddLog
}) {
  const [uploadTab, setUploadTab] = useState("reviews");
  const [pasteText, setPasteText] = useState("");
  const [pasteOTA, setPasteOTA] = useState("Airbnb");
  const [pasteProp, setPasteProp] = useState(properties[0]?.name || "");
  const fileRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      if (uploadTab === "reviews") onUploadReviews(text, file.name);
      else if (uploadTab === "properties") onUploadProperties(text, file.name);
      else if (uploadTab === "audit") onUploadAudit(text, file.name);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handlePaste = () => {
    if (!pasteText.trim()) return;
    onPasteReviews(pasteText, pasteProp, pasteOTA);
    setPasteText("");
  };

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>Upload data</div>

      {/* Tab selector */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {["reviews", "properties", "audit"].map((t) => (
          <button
            key={t}
            onClick={() => setUploadTab(t)}
            style={{
              background: uploadTab === t ? "var(--color-background-secondary)" : "transparent",
              border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13,
              fontWeight: uploadTab === t ? 500 : 400,
              color: uploadTab === t ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              cursor: "pointer", textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* CSV Upload zone */}
      <div
        style={{
          background: "var(--color-background-primary)",
          border: "2px dashed var(--color-border-secondary)",
          borderRadius: "var(--radius-lg)",
          padding: 32,
          textAlign: "center",
          cursor: "pointer",
          marginBottom: 20,
          transition: "border-color 0.15s",
        }}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--color-accent)"; }}
        onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = "var(--color-border-secondary)";
          const file = e.dataTransfer.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const text = ev.target.result;
              if (uploadTab === "reviews") onUploadReviews(text, file.name);
              else if (uploadTab === "properties") onUploadProperties(text, file.name);
              else if (uploadTab === "audit") onUploadAudit(text, file.name);
            };
            reader.readAsText(file);
          }
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
        <Icon name="upload" size={28} color="var(--color-text-tertiary)" style={{ display: "block", margin: "0 auto 10px" }} />
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
          Upload {uploadTab} CSV
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          Click to browse or drag and drop a CSV file
        </div>
      </div>

      {/* Paste reviews */}
      {uploadTab === "reviews" && (
        <Card style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="clipboard" size={14} />
            Paste reviews manually
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
            For platforms without CSV export (like VRBO), paste reviews here — one review per line.
            Include the rating if possible (e.g. "4.5/5" or "★★★★").
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <select value={pasteProp} onChange={(e) => setPasteProp(e.target.value)} style={{ flex: 1, fontSize: 13 }}>
              <option value="">Select property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            <select value={pasteOTA} onChange={(e) => setPasteOTA(e.target.value)} style={{ flex: 1, fontSize: 13 }}>
              {["Airbnb", "Booking.com", "VRBO"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"Paste reviews here, one per line.\n\nExample:\n4.5/5 The location was amazing, right on the beach. Only complaint was the noise from the road.\n3/5 Apartment was clean but smaller than expected from the photos."}
            style={{
              width: "100%", minHeight: 140, fontSize: 13, padding: 12,
              borderRadius: 8, border: "1px solid var(--color-border-secondary)",
              background: "var(--color-background-secondary)", color: "var(--color-text-primary)",
              resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
              lineHeight: 1.5,
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={handlePaste} disabled={!pasteText.trim()} style={{ fontSize: 13, padding: "6px 16px", cursor: "pointer" }}>
              Add reviews
            </button>
          </div>
        </Card>
      )}

      {/* Data summary */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Current data</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <MetricCard label="Properties" value={properties.length} />
          <MetricCard label="Reviews" value={reviews.length} />
          <MetricCard label="Audit records" value={auditData.length} />
        </div>
      </div>
    </div>
  );
}
