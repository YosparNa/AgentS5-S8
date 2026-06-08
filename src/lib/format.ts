export const esc = (s: string): string =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const verdictStars = (v: string): string =>
  v === "recommend_lock" ? "★★★" : v === "review" ? "★★" : "★";
