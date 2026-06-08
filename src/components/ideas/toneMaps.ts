// Enum → Tailwind class maps for ideas/radar components.
// E3 reuses this module. E4 adds sourceToneClass, signalToneClass, smallBadgeToneClass, alertToneClass.
// guardrail: full static strings only — no dynamic concatenation.
import type {
  VerdictTone,
  BadgeTone,
  WindowTone,
  InboxSourceTone,
  InboxSignalTone,
  CreatorBadgeTone,
  TrackAlertTone,
  GradientTone,
} from "@/types/ideas";

export const verdictToneClass: Record<VerdictTone, string> = {
  blue: "bg-emerald-50 text-emerald-700 border-emerald-200",
  neutral: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-gray-100 text-gray-600 border-gray-200",
};

export const badgeToneClass: Record<BadgeTone, string> = {
  purple: "bg-purple-50 text-purple-700",
  sky: "bg-sky-50 text-sky-700",
  emerald: "bg-emerald-50 text-emerald-700",
};

export const windowToneClass: Record<WindowTone, string> = {
  open: "text-amber-600",
  mid: "text-amber-600",
  narrow: "text-amber-700",
  pending: "text-gray-500",
};

// E4 · source chip bg+text (inbox cards)
export const sourceToneClass: Record<InboxSourceTone, string> = {
  indigo: "bg-indigo-50 text-indigo-700",
  purple: "bg-purple-50 text-purple-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-sky-50 text-sky-700",
};

// E4 · inbox score signal dot colour
export const signalToneClass: Record<InboxSignalTone, string> = {
  amber: "text-amber-600",
  green: "text-emerald-600",
};

// E4 · creator / track small badge (library cards)
export const smallBadgeToneClass: Record<CreatorBadgeTone | "amber", string> = {
  fuchsia: "bg-fuchsia-100 text-fuchsia-700",
  gray: "bg-gray-100 text-gray-600",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
};

// E4 · track alert pill (library track cards)
export const alertToneClass: Record<TrackAlertTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
};

// E-polish · gradient enum → full static gradient classes (no fragments in data).
// Avatars (library creators) use the 400/500 shade pair; thumbnails (library videos) use 200/300.
export const avatarGradientClass: Record<GradientTone, string> = {
  fuchsia: "from-fuchsia-400 to-purple-500",
  indigo: "from-indigo-400 to-purple-500",
  emerald: "from-emerald-400 to-teal-500",
  sky: "from-sky-400 to-indigo-500",
  rose: "from-rose-400 to-orange-500",
  amber: "from-amber-400 to-yellow-500",
};
export const thumbGradientClass: Record<GradientTone, string> = {
  fuchsia: "from-fuchsia-200 to-purple-300",
  indigo: "from-indigo-200 to-purple-300",
  emerald: "from-emerald-200 to-teal-300",
  sky: "from-sky-200 to-indigo-300",
  rose: "from-rose-200 to-orange-300",
  amber: "from-amber-200 to-yellow-300",
};
