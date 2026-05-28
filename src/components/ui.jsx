import React from "react";
import {
  Home, Upload, MessageCircle, CheckSquare, Settings,
  ArrowLeft, AlertTriangle, ThumbsUp, ThumbsDown, Info,
  Trash2, Download, Key, Sparkles, ClipboardList, LayoutDashboard,
  Plus, Building2, Flag, Search, ChevronDown, Star, TrendingUp, TrendingDown, Minus
} from "lucide-react";

// ─── Icon map (lucide-react) ───
const iconMap = {
  home: Home,
  upload: Upload,
  "message-circle": MessageCircle,
  checklist: CheckSquare,
  settings: Settings,
  "arrow-left": ArrowLeft,
  "alert-triangle": AlertTriangle,
  "thumb-up": ThumbsUp,
  "thumb-down": ThumbsDown,
  "info-circle": Info,
  trash: Trash2,
  download: Download,
  key: Key,
  sparkles: Sparkles,
  clipboard: ClipboardList,
  "layout-dashboard": LayoutDashboard,
  plus: Plus,
  "building-skyscraper": Building2,
  flag: Flag,
  search: Search,
  "chevron-down": ChevronDown,
  star: Star,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  minus: Minus,
};

export const Icon = ({ name, size = 16, color, style = {}, ...props }) => {
  const IconComp = iconMap[name];
  if (!IconComp) return null;
  return <IconComp size={size} color={color} style={style} {...props} />;
};

// ─── Pill ───
export const Pill = ({ bg, text, children, style = {} }) => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 500,
      background: bg,
      color: text,
      padding: "2px 10px",
      borderRadius: 6,
      whiteSpace: "nowrap",
      display: "inline-flex",
      alignItems: "center",
      ...style,
    }}
  >
    {children}
  </span>
);

// ─── Metric Card ───
export const MetricCard = ({ label, value, sub, valueColor }) => (
  <div
    style={{
      background: "var(--color-background-secondary)",
      borderRadius: "var(--radius-md)",
      padding: "14px 16px",
    }}
  >
    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 22, fontWeight: 500, color: valueColor || "var(--color-text-primary)" }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
        {sub}
      </div>
    )}
  </div>
);

// ─── Empty State ───
export const EmptyState = ({ icon, title, description, action }) => (
  <div
    style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--radius-lg)",
      padding: 40,
      textAlign: "center",
      color: "var(--color-text-secondary)",
    }}
  >
    <Icon name={icon} size={32} style={{ display: "block", margin: "0 auto 12px", opacity: 0.5 }} />
    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: "var(--color-text-primary)" }}>
      {title}
    </div>
    <div style={{ fontSize: 13, marginBottom: action ? 16 : 0 }}>{description}</div>
    {action}
  </div>
);

// ─── Card wrapper ───
export const Card = ({ children, style = {}, ...props }) => (
  <div
    style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

// ─── Card Header ───
export const CardHeader = ({ left, right }) => (
  <div
    style={{
      padding: "12px 20px",
      borderBottom: "0.5px solid var(--color-border-tertiary)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <span style={{ fontSize: 14, fontWeight: 500 }}>{left}</span>
    {right && <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{right}</span>}
  </div>
);

// ─── Section Title ───
export const SectionTitle = ({ children, right }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    }}
  >
    <div style={{ fontSize: 15, fontWeight: 500 }}>{children}</div>
    {right}
  </div>
);
