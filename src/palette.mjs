// The one source of every token value. tokens.css is generated from this file (scripts/build.mjs); the tests read it
// to prove contrast. Colours are the Stone palette (Plan 89, D-89-1): one neutral ramp per mode with a slight warm bias.

/** Colour roles per mode. Text roles must clear 4.5:1 on every ground; see TEXT and GROUNDS below. */
export const COLOURS = {
  light: {
    bg: "#F4F4F1",
    surface: "#FFFFFF",
    sunken: "#EBEBE7",
    line: "#E0E0DB",
    "line-2": "#C9C9C3",
    "line-strong": "#8A8A85",
    faint: "#B3B3AD",
    muted: "#686864",
    "ink-2": "#3B3B38",
    ink: "#0C0C0B",
    "on-ink": "#FFFFFF",
    up: "#0A6B3D",
    down: "#AB3027",
    warn: "#895100",
  },
  dark: {
    bg: "#0B0B0A",
    surface: "#121211",
    sunken: "#1A1A19",
    line: "#252523",
    "line-2": "#3A3A37",
    "line-strong": "#6A6A66",
    faint: "#4A4A47",
    muted: "#8E8E89",
    "ink-2": "#C9C9C4",
    ink: "#F3F3F0",
    "on-ink": "#0B0B0A",
    up: "#3DCB80",
    down: "#FF6F61",
    warn: "#F0B03E",
  },
};

/** Grounds that text sits on. */
export const GROUNDS = ["bg", "surface", "sunken"];
/** Roles used for text: each must reach 4.5:1 on every ground (WCAG 1.4.3, the site's D5 floor). */
export const TEXT = ["ink", "ink-2", "muted", "up", "down", "warn"];
/** Roles that draw a control's boundary or a focus ring: 3:1 on bg and surface (WCAG 1.4.11). */
export const NON_TEXT = ["line-strong", "ink"];
/** Decorative only, never text: rules, dividers, disabled glyphs. */
export const DECOR = ["line", "line-2", "faint"];

/** Tints behind state text (a delivered badge, a refusal, a caution), as alpha over the ground. */
export const TINT_ALPHA = 0.12;
export const TINTS = ["up", "down", "warn"];

/** Per-mode values that are not plain colours. */
export const MODE_EXTRAS = {
  light: {
    scrim: "rgba(12, 12, 11, 0.32)",
    "shadow-1": "0 1px 2px rgba(12, 12, 11, 0.06)",
    "shadow-2": "0 1px 2px rgba(12, 12, 11, 0.06), 0 12px 32px -12px rgba(12, 12, 11, 0.22)",
  },
  dark: {
    scrim: "rgba(0, 0, 0, 0.56)",
    "shadow-1": "0 1px 2px rgba(0, 0, 0, 0.5)",
    "shadow-2": "0 1px 2px rgba(0, 0, 0, 0.5), 0 16px 40px -12px rgba(0, 0, 0, 0.7)",
  },
};

/** Mode-independent tokens. */
export const SCALE = {
  "font-sans": '"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  "font-mono": '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  "text-2xs": "11px",
  "text-xs": "13px",
  "text-sm": "14px",
  "text-md": "16px",
  "text-lg": "18px",
  "text-xl": "22px",
  "text-2xl": "28px",
  "text-3xl": "36px",
  "text-4xl": "48px",
  "text-5xl": "56px",
  "text-hero": "clamp(44px, 7.4vw, 96px)",
  "leading-tight": "1.1",
  "leading-snug": "1.3",
  "leading-body": "1.55",
  "track-display": "-0.045em",
  "track-heading": "-0.03em",
  "track-snug": "-0.015em",
  "track-label": "0.08em",
  "space-1": "4px",
  "space-2": "8px",
  "space-3": "12px",
  "space-4": "16px",
  "space-5": "24px",
  "space-6": "32px",
  "space-7": "48px",
  "space-8": "64px",
  "space-9": "96px",
  "radius-sm": "6px",
  "radius-md": "10px",
  "radius-lg": "14px",
  "radius-xl": "22px",
  "radius-pill": "999px",
  ease: "cubic-bezier(0.16, 1, 0.3, 1)",
  "ease-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
  "dur-1": "120ms",
  "dur-2": "200ms",
  "dur-3": "320ms",
  "dur-4": "460ms",
  "z-sticky": "20",
  "z-dropdown": "40",
  "z-modal": "80",
  "z-toast": "90",
  "z-intro": "100",
};

/** Every token is written as --ui-<name>, so it cannot collide with a consumer's own custom properties. */
export const PREFIX = "--ui-";
