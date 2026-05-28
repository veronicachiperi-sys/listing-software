import React from "react";
import { Icon, Pill, Card } from "./ui";
import { exportCSV } from "../csvParsers";

export default function SettingsView({
  apiKey, onSaveApiKey,
  reviews, actionItems, analysisCache,
  onClearReviews, onClearProperties, onClearActions, onResetAll,
  onAddLog
}) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>Settings</div>

      {/* API Key */}
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="key" size={16} />
          Claude API key
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
          Required for AI review analysis — sentiment detection, topic extraction, removal candidate flagging,
          and response suggestions. Get a key at{" "}
          <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--color-text-info)" }}>
            console.anthropic.com
          </a>.
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onSaveApiKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            style={{ flex: 1, fontSize: 13 }}
          />
          {apiKey && (
            <Pill bg="#EAF3DE" text="#27500A" style={{ padding: "4px 12px" }}>
              Connected
            </Pill>
          )}
        </div>
      </Card>

      {/* Data management */}
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="trash" size={16} />
          Data management
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 12 }}>
          Clear specific data types or reset everything. This cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (window.confirm("Clear all reviews and analysis data?")) {
                onClearReviews();
                onAddLog("Cleared all reviews and analysis data");
              }
            }}
            style={{ fontSize: 13, padding: "6px 14px", cursor: "pointer" }}
          >
            Clear reviews
          </button>
          <button
            onClick={() => {
              if (window.confirm("Clear all properties?")) {
                onClearProperties();
                onAddLog("Cleared all properties");
              }
            }}
            style={{ fontSize: 13, padding: "6px 14px", cursor: "pointer" }}
          >
            Clear properties
          </button>
          <button
            onClick={() => {
              if (window.confirm("Clear all action items?")) {
                onClearActions();
                onAddLog("Cleared all action items");
              }
            }}
            style={{ fontSize: 13, padding: "6px 14px", cursor: "pointer" }}
          >
            Clear actions
          </button>
          <button
            onClick={() => {
              if (window.confirm("RESET EVERYTHING? All data will be permanently deleted.")) {
                onResetAll();
              }
            }}
            style={{
              fontSize: 13, padding: "6px 14px", cursor: "pointer",
              color: "var(--color-text-danger)",
              borderColor: "var(--color-text-danger)",
            }}
          >
            Reset everything
          </button>
        </div>
      </Card>

      {/* Export */}
      <Card style={{ padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="download" size={16} />
          Export data
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 12 }}>
          Download your data as CSV files for backup or external analysis.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              const data = reviews.map((r) => ({
                property: r.property,
                ota: r.ota,
                date: r.date,
                rating: r.rating,
                guest: r.guest,
                text: r.text,
                sentiment: analysisCache[r.id]?.sentiment || "",
                sentiment_score: analysisCache[r.id]?.score || "",
                topics: (analysisCache[r.id]?.topics || []).join("; "),
                upsides: (analysisCache[r.id]?.upsides || []).join("; "),
                downsides: (analysisCache[r.id]?.downsides || []).join("; "),
                removal_candidate: analysisCache[r.id]?.removal_candidate || false,
                removal_reason: analysisCache[r.id]?.removal_reason || "",
                response_suggestion: analysisCache[r.id]?.response_suggestion || "",
              }));
              exportCSV(data, `str-reviews-export-${new Date().toISOString().slice(0, 10)}.csv`);
            }}
            disabled={reviews.length === 0}
            style={{ fontSize: 13, padding: "6px 14px", cursor: "pointer" }}
          >
            Export reviews CSV
          </button>
          <button
            onClick={() => {
              exportCSV(actionItems, `str-actions-export-${new Date().toISOString().slice(0, 10)}.csv`);
            }}
            disabled={actionItems.length === 0}
            style={{ fontSize: 13, padding: "6px 14px", cursor: "pointer" }}
          >
            Export actions CSV
          </button>
        </div>
      </Card>
    </div>
  );
}
