import React from "react";
import { Icon, Pill, MetricCard, Card } from "./ui";
import { sentColor, fmt } from "../utils";

export default function PropertyView({
  propertyName, properties, reviews, actionItems, analysisCache,
  onBack
}) {
  const prop = properties.find((p) => p.name === propertyName);
  if (!prop) {
    return (
      <div style={{ color: "var(--color-text-secondary)", padding: 20 }}>
        Property not found. <button onClick={onBack}>Back</button>
      </div>
    );
  }

  const propReviews = reviews.filter((r) => r.property === prop.name);
  const analyzed = propReviews.filter((r) => analysisCache[r.id]);
  const analyses = analyzed.map((r) => analysisCache[r.id]);

  const avgRating = propReviews.length
    ? propReviews.reduce((s, r) => s + (r.rating || 0), 0) / propReviews.length
    : null;
  const sentiment = analyses.length
    ? analyses.reduce((s, a) => s + (a.score || 3), 0) / analyses.length
    : null;
  const removalCandidates = analyses.filter((a) => a.removal_candidate);
  const openTasks = actionItems.filter((a) => a.property === prop.name && a.status !== "done").length;

  // Aggregate upsides/downsides
  const countMap = (arr) => {
    const m = {};
    arr.forEach((x) => {
      const k = x.toLowerCase().trim();
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6);
  };
  const topUpsides = countMap(analyses.flatMap((a) => a.upsides || []));
  const topDownsides = countMap(analyses.flatMap((a) => a.downsides || []));

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: "none", border: "none", fontSize: 13,
          color: "var(--color-text-secondary)", cursor: "pointer",
          marginBottom: 16, padding: 0, display: "flex", alignItems: "center", gap: 4,
        }}
      >
        <Icon name="arrow-left" size={14} /> Back to portfolio
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8, background: "var(--color-background-info)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="home" size={20} color="var(--color-text-info)" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{prop.name}</div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            {prop.otas?.join(" · ")} {prop.market && `| ${prop.market}`} | {propReviews.length} reviews
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <MetricCard label="Avg rating" value={avgRating ? fmt(avgRating) : "—"} />
        <MetricCard label="Sentiment" value={sentiment ? fmt(sentiment) + "/5" : "—"} />
        <MetricCard
          label="Removal candidates"
          value={removalCandidates.length}
          valueColor={removalCandidates.length > 0 ? "var(--color-text-warning)" : undefined}
        />
        <MetricCard label="Open tasks" value={openTasks} />
      </div>

      {/* Upsides / Downsides */}
      {(topUpsides.length > 0 || topDownsides.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <Card style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="thumb-up" size={16} color="var(--color-text-success)" />
              Top upsides
            </div>
            {topUpsides.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>Run AI analysis to see results</div>
            ) : (
              topUpsides.map(([label, count], i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                    <span>{label}</span>
                    <span style={{ color: "var(--color-text-success)", fontWeight: 500 }}>{count}x</span>
                  </div>
                  <div style={{ height: 4, background: "var(--color-background-secondary)", borderRadius: 2 }}>
                    <div style={{
                      height: 4,
                      width: `${Math.min(100, (count / (topUpsides[0]?.[1] || 1)) * 100)}%`,
                      background: "#5DCAA5", borderRadius: 2,
                    }} />
                  </div>
                </div>
              ))
            )}
          </Card>
          <Card style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="thumb-down" size={16} color="var(--color-text-danger)" />
              Top downsides
            </div>
            {topDownsides.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>Run AI analysis to see results</div>
            ) : (
              topDownsides.map(([label, count], i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                    <span>{label}</span>
                    <span style={{ color: "var(--color-text-danger)", fontWeight: 500 }}>{count}x</span>
                  </div>
                  <div style={{ height: 4, background: "var(--color-background-secondary)", borderRadius: 2 }}>
                    <div style={{
                      height: 4,
                      width: `${Math.min(100, (count / (topDownsides[0]?.[1] || 1)) * 100)}%`,
                      background: "#F09595", borderRadius: 2,
                    }} />
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      {/* Recent reviews */}
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Recent reviews</div>
      <Card>
        {propReviews.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--color-text-secondary)" }}>
            No reviews imported for this property yet.
          </div>
        ) : (
          propReviews
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 20)
            .map((r) => {
              const a = analysisCache[r.id];
              return (
                <div key={r.id} style={{ padding: "12px 20px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{r.ota}</span>
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                        {r.date ? new Date(r.date).toLocaleDateString() : ""}
                      </span>
                      {r.rating > 0 && (
                        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                          {"★".repeat(Math.round(r.rating))}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {a?.sentiment && <Pill {...sentColor(a.sentiment)}>{a.sentiment}</Pill>}
                      {a?.removal_candidate && <Pill bg="#FCEBEB" text="#791F1F">removal</Pill>}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                    "{r.text.slice(0, 250)}{r.text.length > 250 ? "..." : ""}"
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
      </Card>
    </div>
  );
}
