// ─── ID & format helpers ───
export const genId = () => Math.random().toString(36).slice(2, 10);

export const fmt = (n, d = 1) => (typeof n === "number" ? n.toFixed(d) : "—");

export const pct = (n) => (typeof n === "number" ? Math.round(n) + "%" : "—");

export const ago = (iso) => {
  if (!iso) return "never";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
};

// ─── Storage keys ───
export const STORAGE_KEYS = {
  properties: "str-dashboard:properties",
  reviews: "str-dashboard:reviews",
  auditData: "str-dashboard:audit-data",
  actionItems: "str-dashboard:action-items",
  changeLog: "str-dashboard:change-log",
  settings: "str-dashboard:settings",
  analysisCache: "str-dashboard:analysis-cache",
};

// ─── LocalStorage wrapper ───
export const store = {
  get(key) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error("Storage set error:", e);
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

// ─── Color helpers ───
export const scoreColor = (s) => {
  if (s >= 85) return { bg: "#EAF3DE", text: "#27500A" };
  if (s >= 70) return { bg: "#FAEEDA", text: "#633806" };
  return { bg: "#FCEBEB", text: "#791F1F" };
};

export const sentColor = (s) => {
  if (s === "positive") return { bg: "#E1F5EE", text: "#085041" };
  if (s === "negative") return { bg: "#FCEBEB", text: "#791F1F" };
  return { bg: "#F1EFE8", text: "#444441" };
};

export const priorityColor = (p) => {
  if (p === "high") return { bg: "#FCEBEB", text: "#791F1F" };
  if (p === "medium") return { bg: "#FAEEDA", text: "#633806" };
  return { bg: "#E6F1FB", text: "#0C447C" };
};

export const statusColor = (s) => {
  if (s === "done") return { bg: "#EAF3DE", text: "#27500A" };
  if (s === "in_progress") return { bg: "#FAEEDA", text: "#633806" };
  return { bg: "#FCEBEB", text: "#791F1F" };
};
