import React, { useState } from "react";
import { Icon, Pill, Card } from "./ui";
import { sentColor } from "../utils";

export default function ReviewsView({
  reviews, analysisCache, analyzing,
  onRunAnalysis
}) {
  const [filter, setFilter] = useState("all");

  const unanalyzed = reviews.filter((r) => !r.analyzed);
  const removalCandidates = reviews.filter((r) => analysisCache[r.id]?.removal_candidate);
  const negative = reviews.filter((r) => analysisCache[r.id]?.sentiment === "negative");

  const filtered = (() => {
    if (filter === "unanalyzed") return unanalyzed;
    if (filter === "removal") return removalCandidates;
    if (filter === "negative") return negative;
    return reviews;
  })();

  const filters = [
    { id: "all", label: `All (${reviews.length})` },
    { id: "unanalyzed", label: `Unanalyzed (${unanalyzed.length})` },
    { id: "removal", label: `Removal candidates (${removalCandidates.length})` },
    { id: "negative", label: `Negative (${negative.length})` },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>
          Review intelligence
          <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-secondary)", marginLeft: 8 }}>
            {reviews.length} total, {reviews.length - unanalyzed.length} analyzed
          </span>
        </div>
        <button
          onClick={onRunAnalysis}
          disabled={analyzing || unanalyzed.length === 0}
          style={{
            fontSize: 13, padding: "8px 16px",
            cursor: analyzing ? "wait" : "pointer",
            opacity: analyzing || unanalyzed.length === 0 ? 0.5 : 1,
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <Icon name="sparkles" size={14} />
          {analyzing ? "Analyzing..." : `Analyze ${unanalyzed.length} reviews`}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              background: filter === f.id ? "var(--color-background-secondary)" : "transparent",
              border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12,
              fontWeight: filter === f.id ? 500 : 400,
              color: filter === f.id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Review list */}
      <Card>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--color-text-secondary)" }}>
            {reviews.length === 0
              ? "No reviews uploaded yet. Go to Upload data to import reviews."
              : "No reviews match this filter."}
          </div>
        ) : (
          filtered
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 50)
            .map((r) => {
              const a = analysisCache[r.id];
              return (
                <div key={r.id} style={{ padding: "12px 20px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{r.property}</span>
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{r.ota}</span>
                      <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
                        {r.date ? new Date(r.date).toLocaleDateString() : ""}
                      </span>
                      {r.rating > 0 && (
                        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                          {"★".repeat(Math.round(r.rating))}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {!r.analyzed && (
                        <Pill bg="var(--color-background-secondary)" text="var(--color-text-tertiary)">pending</Pill>
                      )}
                      {a?.sentiment && <Pill {...sentColor(a.sentiment)}>{a.sentiment}</Pill>}
                      {a?.removal_candidate && <Pill bg="#FCEBEB" text="#791F1F">removal</Pill>}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                    "{r.text.slice(0, 280)}{r.text.length > 280 ? "..." : ""}"
                  </div>
                  {a?.topics?.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                      {a.topics.map((t, i) => (
                        <span key={i} style={{
                          fontSize: 11, background: "var(--color-background-secondary)",
                          color: "var(--color-text-secondary)", padding: "1px 8px", borderRadius: 4,
                        }}>{t}</span>
                      ))}
                    </div>
                  )}
                  {a?.removal_reason && (
                    <div style={{ fontSize: 12, color: "var(--color-text-info)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="info-circle" size={13} /> {a.removal_reason}
                    </div>
                  )}
                  {a?.response_suggestion && (
                    <details style={{ marginTop: 6 }}>
                      <summary style={{ fontSize: 12, color: "var(--color-text-info)", cursor: "pointer" }}>
                        ▸ Suggested response
                      </summary>
                      <div style={{
                        fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4,
                        padding: "8px 12px", background: "var(--color-background-secondary)",
                        borderRadius: 6, lineHeight: 1.5,
                      }}>
                        {a.response_suggestion}
                      </div>
                    </details>
                  )}
                </div>
              );
            })
        )}
        {filtered.length > 50 && (
          <div style={{ padding: 12, textAlign: "center", fontSize: 12, color: "var(--color-text-tertiary)" }}>
            Showing 50 of {filtered.length}
          </div>
        )}
      </Card>
    </div>
  );
}
