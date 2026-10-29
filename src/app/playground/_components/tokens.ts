// globals.css에 토큰을 추가하면 여기에도 추가해 견본에 보이게 한다.

export const THEMES = [
  { id: "default", label: "기본" },
  { id: "night-desk", label: "밤의 책상" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const COLOR_TOKENS = [
  { name: "background", pair: "foreground" },
  { name: "card", pair: "card-foreground" },
  { name: "popover", pair: "popover-foreground" },
  { name: "primary", pair: "primary-foreground" },
  { name: "secondary", pair: "secondary-foreground" },
  { name: "muted", pair: "muted-foreground" },
  { name: "accent", pair: "accent-foreground" },
  { name: "destructive", pair: null },
  { name: "border", pair: null },
  { name: "input", pair: null },
  { name: "ring", pair: null },
  { name: "reward", pair: "reward-foreground" },
  { name: "pending", pair: null },
  { name: "postponed", pair: null },
] as const;

export const RADIUS_TOKENS = [
  { name: "sm", className: "rounded-sm" },
  { name: "md", className: "rounded-md" },
  { name: "lg (--radius)", className: "rounded-lg" },
  { name: "xl", className: "rounded-xl" },
  { name: "2xl", className: "rounded-2xl" },
] as const;

export const MOTION_TOKENS = ["duration-fast", "duration-reward"] as const;

export const LAYER_TOKENS = [
  "z-wallpaper",
  "z-window",
  "z-wall-decor",
  "z-furniture",
  "z-floor",
  "z-character",
] as const;

export const PREVIEW_WIDTHS = [
  { width: 360, label: "360 폰" },
  { width: 600, label: "600 중간 시작" },
  { width: 840, label: "840 넓음 시작" },
  { width: 1024, label: "1024 폴드 펼침" },
] as const;
