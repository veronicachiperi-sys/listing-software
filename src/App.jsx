import React, { useState, useEffect } from "react";
import { Icon } from "./components/ui";
import { store, STORAGE_KEYS, genId } from "./utils";
import { parseReviewCSV, parsePropertyCSV, parseAuditCSV } from "./csvParsers";
import { analyzeReviews } from "./api";
import PortfolioView from "./components/PortfolioView";
import PropertyView from "./components/PropertyView";
import UploadView from "./components/UploadView";
import ReviewsView from "./components/ReviewsView";
import ActionsView from "./components/ActionsView";
import SettingsView from "./components/SettingsView";

export default function App() {
  const [view, setView] = useState("portfolio");
  const [selectedProperty, setSelectedProperty] = useState(null);

  const [properties, setProperties] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [auditData, setAuditData] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [changeLog, setChangeLog] = useState([]);
  const [analysisCache, setAnalysisCache] = useState({});
  const [apiKey, setApiKey] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // ─── Load from localStorage ───
  useEffect(() => {
    const p = store.get(STORAGE_KEYS.properties);
    const r = store.get(STORAGE_KEYS.reviews);
    const a = store.get(STORAGE_KEYS.auditData);
    const ai = store.get(STORAGE_KEYS.actionItems);
    const cl = store.get(STORAGE_KEYS.changeLog);
    const ac = store.get(STORAGE_KEYS.analysisCache);
    const s = store.get(STORAGE_KEYS.settings);

    if (p) setProperties(p);
    if (r) setReviews(r);
    if (a) setAuditData(a);
    if (ai) setActionItems(ai);
    if (cl) setChangeLog(cl);
    if (ac) setAnalysisCache(ac);
    if (s?.apiKey) setApiKey(s.apiKey);
    setLoaded(true);
  }, []);

  // ─── Persist on change ───
  useEffect(() => { if (loaded) store.set(STORAGE_KEYS.properties, properties); }, [properties, loaded]);
  useEffect(() => { if (loaded) store.set(STORAGE_KEYS.reviews, reviews); }, [reviews, loaded]);
  useEffect(() => { if (loaded) store.set(STORAGE_KEYS.auditData, auditData); }, [auditData, loaded]);
  useEffect(() => { if (loaded) store.set(STORAGE_KEYS.actionItems, actionItems); }, [actionItems, loaded]);
  useEffect(() => { if (loaded) store.set(STORAGE_KEYS.changeLog, changeLog); }, [changeLog, loaded]);
  useEffect(() => { if (loaded) store.set(STORAGE_KEYS.analysisCache, analysisCache); }, [analysisCache, loaded]);

  // ─── Helpers ───
  const saveApiKey = (k) => {
    setApiKey(k);
    store.set(STORAGE_KEYS.settings, { apiKey: k });
  };

  const addLog = (msg) => {
    const entry = { id: genId(), date: new Date().toISOString(), message: msg };
    setChangeLog((prev) => [entry, ...prev].slice(0, 200));
  };

  // ─── CSV upload handlers ───
  const handleUploadReviews = (text, filename) => {
    const parsed = parseReviewCSV(text);
    if (parsed.length === 0) {
      alert("No reviews found in the CSV. Check the column names match the expected format.");
      return;
    }
    setReviews((prev) => [...prev, ...parsed]);
    // Auto-create properties from review data
    const existingNames = new Set(properties.map((p) => p.name));
    const newProps = [...new Set(parsed.map((r) => r.property))]
      .filter((name) => name !== "Unknown" && !existingNames.has(name))
      .map((name) => ({
        id: genId(),
        name,
        market: "",
        otas: [...new Set(parsed.filter((r) => r.property === name).map((r) => r.ota))],
        guestyId: "",
        added: new Date().toISOString(),
      }));
    if (newProps.length) {
      setProperties((prev) => [...prev, ...newProps]);
      addLog(`Auto-created ${newProps.length} properties from review data`);
    }
    addLog(`Imported ${parsed.length} reviews from ${filename}`);
  };

  const handleUploadProperties = (text, filename) => {
    const parsed = parsePropertyCSV(text);
    if (parsed.length === 0) {
      alert("No properties found in the CSV. Check the column names.");
      return;
    }
    setProperties((prev) => [...prev, ...parsed]);
    addLog(`Imported ${parsed.length} properties from ${filename}`);
  };

  const handleUploadAudit = (text, filename) => {
    const parsed = parseAuditCSV(text);
    if (parsed.length === 0) {
      alert("No audit records found in the CSV.");
      return;
    }
    setAuditData((prev) => [...prev, ...parsed]);
    addLog(`Imported ${parsed.length} audit records from ${filename}`);
  };

  const handlePasteReviews = (text, property, ota) => {
    const lines = text.split("\n").filter((l) => l.trim().length > 10);
    const newRevs = lines.map((line) => {
      const ratingMatch = line.match(/(\d(?:\.\d)?)\s*(?:\/\s*5|stars?|★)/i);
      return {
        id: genId(),
        property: property || "Unknown",
        ota: ota,
        date: new Date().toISOString(),
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
        text: line.replace(/(\d(?:\.\d)?)\s*(?:\/\s*5|stars?|★)/gi, "").trim(),
        guest: "",
        analyzed: false,
      };
    });
    setReviews((prev) => [...prev, ...newRevs]);
    addLog(`Pasted ${newRevs.length} reviews for ${property} (${ota})`);
  };

  // ─── AI Analysis ───
  const runAnalysis = async () => {
    if (!apiKey) {
      alert("Please set your Claude API key in Settings first.");
      return;
    }
    const unanalyzed = reviews.filter((r) => !r.analyzed && !analysisCache[r.id]);
    if (unanalyzed.length === 0) {
      alert("All reviews are already analyzed.");
      return;
    }
    setAnalyzing(true);
    try {
      const results = await analyzeReviews(unanalyzed, apiKey);
      const newCache = { ...analysisCache };
      results.forEach((r) => { newCache[r.id] = r; });
      setAnalysisCache(newCache);
      setReviews((prev) =>
        prev.map((r) => (newCache[r.id] ? { ...r, analyzed: true } : r))
      );

      // Auto-generate action items for removal candidates
      const newActions = [];
      results.forEach((r) => {
        if (r.removal_candidate) {
          const rev = unanalyzed.find((u) => u.id === r.id);
          newActions.push({
            id: genId(),
            property: rev?.property || "Unknown",
            task: `Review removal: ${r.removal_reason?.slice(0, 80) || "Policy violation detected"}`,
            source: "AI analysis",
            priority: "high",
            assignee: "",
            status: "open",
            created: new Date().toISOString(),
            completed: null,
            reviewId: r.id,
          });
        }
      });
      if (newActions.length) setActionItems((prev) => [...newActions, ...prev]);

      const errorCount = results.filter((r) => r.error).length;
      addLog(
        `Analyzed ${results.length} reviews. ` +
        `${results.filter((r) => r.sentiment === "positive").length} positive, ` +
        `${results.filter((r) => r.sentiment === "negative").length} negative, ` +
        `${results.filter((r) => r.removal_candidate).length} removal candidates.` +
        (errorCount > 0 ? ` ${errorCount} had analysis errors.` : "")
      );
    } catch (e) {
      console.error(e);
      alert("Analysis failed: " + e.message);
    }
    setAnalyzing(false);
  };

  // ─── Action item management ───
  const updateAction = (id, updates) => {
    setActionItems((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, ...updates, completed: updates.status === "done" ? new Date().toISOString() : a.completed }
          : a
      )
    );
  };

  const deleteAction = (id) => {
    setActionItems((prev) => prev.filter((a) => a.id !== id));
  };

  const addAction = (action) => {
    setActionItems((prev) => [action, ...prev]);
  };

  // ─── Navigation ───
  const openProperty = (name) => {
    setSelectedProperty(name);
    setView("property");
  };

  // ─── Reset ───
  const resetAll = () => {
    setProperties([]);
    setReviews([]);
    setAuditData([]);
    setActionItems([]);
    setChangeLog([]);
    setAnalysisCache({});
    Object.values(STORAGE_KEYS).forEach((k) => store.remove(k));
  };

  if (!loaded) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)" }}>
        Loading dashboard...
      </div>
    );
  }

  // ─── Navigation tabs ───
  const navTabs = [
    { id: "portfolio", label: "Portfolio", icon: "layout-dashboard" },
    { id: "upload", label: "Upload data", icon: "upload" },
    { id: "reviews", label: "Reviews", icon: "message-circle" },
    { id: "actions", label: "Action items", icon: "checklist" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  return (
    <div style={{ padding: "24px 32px", maxWidth: 900, width: "100%", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "var(--color-accent-light)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="building-skyscraper" size={20} color="var(--color-accent)" />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>STR Optimization Dashboard</div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            {properties.length} properties · {reviews.length} reviews · {actionItems.filter((a) => a.status !== "done").length} open tasks
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 24,
        borderBottom: "1px solid var(--color-border-tertiary)", paddingBottom: 12,
      }}>
        {navTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            style={{
              background: view === t.id ? "var(--color-background-secondary)" : "transparent",
              border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13,
              fontWeight: view === t.id ? 500 : 400,
              color: view === t.id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.15s",
            }}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Views */}
      {view === "portfolio" && (
        <PortfolioView
          properties={properties}
          reviews={reviews}
          actionItems={actionItems}
          auditData={auditData}
          analysisCache={analysisCache}
          onNavigate={setView}
          onOpenProperty={openProperty}
        />
      )}
      {view === "property" && (
        <PropertyView
          propertyName={selectedProperty}
          properties={properties}
          reviews={reviews}
          actionItems={actionItems}
          analysisCache={analysisCache}
          onBack={() => setView("portfolio")}
        />
      )}
      {view === "upload" && (
        <UploadView
          properties={properties}
          reviews={reviews}
          auditData={auditData}
          onUploadReviews={handleUploadReviews}
          onUploadProperties={handleUploadProperties}
          onUploadAudit={handleUploadAudit}
          onPasteReviews={handlePasteReviews}
          onAddLog={addLog}
        />
      )}
      {view === "reviews" && (
        <ReviewsView
          reviews={reviews}
          analysisCache={analysisCache}
          analyzing={analyzing}
          onRunAnalysis={runAnalysis}
        />
      )}
      {view === "actions" && (
        <ActionsView
          properties={properties}
          actionItems={actionItems}
          changeLog={changeLog}
          onUpdateAction={updateAction}
          onDeleteAction={deleteAction}
          onAddAction={addAction}
          onAddLog={addLog}
        />
      )}
      {view === "settings" && (
        <SettingsView
          apiKey={apiKey}
          onSaveApiKey={saveApiKey}
          reviews={reviews}
          actionItems={actionItems}
          analysisCache={analysisCache}
          onClearReviews={() => { setReviews([]); setAnalysisCache({}); }}
          onClearProperties={() => setProperties([])}
          onClearActions={() => setActionItems([])}
          onResetAll={resetAll}
          onAddLog={addLog}
        />
      )}
    </div>
  );
}
