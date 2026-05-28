import React from "react";
import { Icon, Pill, MetricCard, EmptyState, Card, CardHeader } from "./ui";
import { scoreColor, fmt } from "../utils";

export default function PortfolioView({
  properties, reviews, actionItems, auditData, analysisCache,
  onNavigate, onOpenProperty
}) {
  // Compute per-property stats
  const getPropertyStats = (propName) => {
    const propReviews = reviews.filter((r) => r.property === propName);
    const analyzed = propReviews.filter((r) => analysisCache[r.id]);
    const analyses = analyzed.map((r) => analysisCache[r.id]);
    const avgRating = propReviews.length
      ? propReviews.reduce((s, r) => s + (r.rating || 0), 0) / propReviews.length
      : null;

    // Audit score
    const audits = auditData.filter((a) => a.property === propName);
    let auditScore = null;
    if (audits.length) {
      const latest = audits[audits.length - 1];
      const fields = Object.values(latest.fields || {});
      const filled = fields.filter(
        (v) => v && v !== "" && v !== "0" && v.toLowerCase?.() !== "no" && v.toLowerCase?.() !== "n/a" && v.toLowerCase?.() !== "missing"
      ).length;
      auditScore = fields.length ? Math.round((filled / fields.length) * 100) : null;
    }

    const openActions = actionItems.filter((a) => a.property === propName && a.status !== "done").length;

    return { avgRating, totalReviews: propReviews.length, auditScore, openActions, analyzedCount: analyzed.length };
  };

  const propStats = properties.map((p) => ({ ...p, stats: getPropertyStats(p.name) }));
  const withRatings = propStats.filter((p) => p.stats.avgRating);
  const avgRating = withRatings.length
    ? withRatings.reduce((s, p) => s + p.stats.avgRating, 0) / withRatings.length
    : null;
  const totalOpenActions = actionItems.filter((a) => a.status !== "done").length;
  const analyzedCount = reviews.filter((r) => r.analyzed).length;

  return (
    <div>
      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <MetricCard label="Properties" value={properties.length} />
        <MetricCard label="Avg rating" value={avgRating ? fmt(avgRating) : "—"} />
        <MetricCard
          label="Reviews"
          value={reviews.length}
          sub={analyzedCount > 0 ? `${analyzedCount} analyzed` : undefined}
        />
        <MetricCard
          label="Open actions"
          value={totalOpenActions}
          valueColor={totalOpenActions > 0 ? "var(--color-text-warning)" : undefined}
        />
      </div>

      {/* Property table */}
      {properties.length === 0 ? (
        <EmptyState
          icon="home"
          title="No properties yet"
          description="Upload a properties CSV or review data to get started."
          action={
            <button onClick={() => onNavigate("upload")} style={{ fontSize: 13, padding: "8px 20px", cursor: "pointer" }}>
              <Icon name="upload" size={14} style={{ marginRight: 6 }} />
              Upload data
            </button>
          }
        />
      ) : (
        <Card>
          <CardHeader left="Property health ranking" right={`${properties.length} properties`} />

          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
              padding: "8px 20px",
              fontSize: 11,
              color: "var(--color-text-tertiary)",
              borderBottom: "0.5px solid var(--color-border-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            <span>Property</span>
            <span>Rating</span>
            <span>Reviews</span>
            <span>Audit</span>
            <span>Actions</span>
          </div>

          {/* Property rows */}
          {propStats
            .sort((a, b) => (a.stats.avgRating || 0) - (b.stats.avgRating || 0))
            .map((p) => {
              const sc = p.stats.auditScore;
              const scC = sc !== null ? scoreColor(sc) : null;
              return (
                <div
                  key={p.id}
                  onClick={() => onOpenProperty(p.name)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
                    padding: "12px 20px",
                    alignItems: "center",
                    fontSize: 13,
                    borderBottom: "0.5px solid var(--color-border-tertiary)",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-background-secondary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                    {p.stats.openActions > 2 && <Icon name="alert-triangle" size={14} color="var(--color-text-danger)" />}
                    {p.name}
                    {p.market && (
                      <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{p.market}</span>
                    )}
                  </span>
                  <span>{p.stats.avgRating ? fmt(p.stats.avgRating) : "—"}</span>
                  <span>{p.stats.totalReviews}</span>
                  <span>
                    {scC ? <Pill bg={scC.bg} text={scC.text}>{sc}%</Pill> : "—"}
                  </span>
                  <span
                    style={{
                      fontWeight: p.stats.openActions > 0 ? 500 : 400,
                      color: p.stats.openActions > 0 ? "var(--color-text-warning)" : "var(--color-text-secondary)",
                    }}
                  >
                    {p.stats.openActions}
                  </span>
                </div>
              );
            })}
        </Card>
      )}
    </div>
  );
}
