---
version: alpha
name: Linear-design-analysis
description: "A near-black product-focused marketing canvas built around #010102 (the deepest dark surface of any tool in this collection), light gray text (#f7f8f8), and the signature Linear lavender-blue (#5e6ad2) used as the single chromatic accent. The system reads as software-craft documentation: dense, technical, and quietly luxurious. Display type is set in the Linear custom sans (SF Pro Display fallback) at 500–700 with measured negative tracking. Cards live as charcoal panels (#0f1011) with hairline borders. The accent lavender appears on the brand mark, focus rings, and a few intentional CTAs — never decoratively. Page rhythm leans on product UI screenshots framed in dark panels rather than atmospheric color."

colors:
  primary: "#5e6ad2"
  on-primary: "#ffffff"
  primary-hover: "#828fff"
  primary-focus: "#5e69d1"
  ink: "#f7f8f8"
  ink-muted: "#d0d6e0"
  ink-subtle: "#8a8f98"
  ink-tertiary: "#62666d"
  canvas: "#010102"
  surface-1: "#0f1011"
  surface-2: "#141516"
  surface-3: "#18191a"
  surface-4: "#191a1b"
  hairline: "#23252a"
  hairline-strong: "#34343a"
  hairline-tertiary: "#3e3e44"
  inverse-canvas: "#ffffff"
  inverse-surface-1: "#f5f6f6"
  inverse-surface-2: "#f6f7f7"
  inverse-ink: "#000000"
  brand-secure: "#7a7fad"
  semantic-success: "#27a644"
  semantic-overlay: "#000000"

typography:
  display-xl:
    fontFamily: Linear Display
    fontSize: 80px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -3.0px
  display-lg:
    fontFamily: Linear Display
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.10
    letterSpacing: -1.8px
  display-md:
    fontFamily: Linear Display
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -1.0px
  headline:
    fontFamily: Linear Display
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.20
    letterSpacing: -0.6px
  card-title:
    fontFamily: Linear Display
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: -0.4px
  subhead:
    fontFamily: Linear Display
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.40
    letterSpacing: -0.2px
  body-lg:
    fontFamily: Linear Text
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: -0.1px
  body:
    fontFamily: Linear Text
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: -0.05px
  body-sm:
    fontFamily: Linear Text
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0
  caption:
    fontFamily: Linear Text
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.40
    letterSpacing: 0
  button:
    fontFamily: Linear Text
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.20
    letterSpacing: 0
  eyebrow:
    fontFamily: Linear Text
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.30
    letterSpacing: 0.4px
  mono:
    fontFamily: Linear Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 24px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  button-primary-pressed:
    backgroundColor: "{colors.primary-focus}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  button-tertiary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  button-inverse:
    backgroundColor: "{colors.inverse-canvas}"
    textColor: "{colors.inverse-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  pricing-card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 24px
  pricing-card-featured:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 24px
  feature-card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 24px
  product-screenshot-card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: 24px
  testimonial-card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.lg}"
    padding: 32px
  customer-logo-tile:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 16px
  text-input:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  text-input-focused:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  pricing-tab-default:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 6px 14px
  pricing-tab-selected:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 6px 14px
  cta-banner:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.lg}"
    padding: 48px
  changelog-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xs}"
    padding: 24px 0
  status-badge:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 2px 8px
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    height: 56px
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 64px 32px
---

## Overview

Linear's marketing canvas is the deepest dark surface in this collection — `{colors.canvas}` is #010102, essentially pure black with a faint blue tint. On top sits a four-step surface ladder (`{colors.surface-1}` through `{colors.surface-4}`) for cards, panels, and lifted tiles, with hairline borders running from `{colors.hairline}` (#23252a) up through `{colors.hairline-strong}` and `{colors.hairline-tertiary}`. Light gray text (`{colors.ink}` #f7f8f8) carries the body and headlines.

The single chromatic accent is **Linear lavender-blue** `{colors.primary}` (#5e6ad2) — used on the brand mark, focus rings, and the primary CTA button. A lighter hover state (`{colors.primary-hover}` #828fff) and a focus-tinted variant (`{colors.primary-focus}` #5e69d1) extend the same hue. Linear avoids saturated greens, oranges, reds, etc. on the marketing canvas — the only semantic color is `{colors.semantic-success}` (#27a644) for status pills and the rare success indicator.

Display type runs Linear's custom sans (with `SF Pro Display` fallback) at weight 500–700 with negative letter-spacing scaling from -3.0px at 80px down to 0 at body. The body family is Linear's text cut, and a Linear Mono is reserved for code snippets in product screenshots.

The page rhythm is **dense product screenshots** — Linear's marketing leads with high-fidelity captures of the product UI (issue list, project view, dashboard) framed in `{colors.surface-1}` panels with `{rounded.xl}` 16px corners. The chrome is intentionally minimal so the app screenshots can do the heavy lifting.

**Key Characteristics:**
- **Dark-canvas marketing system** — `{colors.canvas}` (#010102) is the deepest dark in this collection.
- **Lavender-blue brand accent** (`{colors.primary}` #5e6ad2) — used scarcely on brand mark, focus, and the primary CTA.
- Four-step surface ladder (canvas → surface-1 → surface-2 → surface-3 → surface-4) carries hierarchy without shadow.
- Display tracking pulls aggressively negative (-3.0px at 80px); body holds at -0.05px.
- Cards use `{rounded.lg}` 12px corners with 1px hairline borders — never pill, rarely 16px.
- **Product UI screenshots** dominate the page. The marketing chrome is a dark frame for the app.
- No second chromatic color. No atmospheric gradients. No spotlight cards.

## Framework: Stisla

This design system is implemented using **Stisla v3** — a modern CSS framework with a small JavaScript runtime that provides component primitives through data attributes and CSS custom properties.

### Installation

**Via CDN** (quickest for prototyping):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>IMS - BEM FT UNESA</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@stisla/css@3/dist/stisla.css">
  </head>
  <body>
    <!-- Your content -->
    <script src="https://cdn.jsdelivr.net/npm/@stisla/vanilla@3/dist/stisla.js"></script>
  </body>
</html>
```

**Via Package Manager** (recommended for production):

```bash
npm install @stisla/css @stisla/vanilla
```

```javascript
// main.js
import '@stisla/css';
import '@stisla/vanilla';
```

### Browser Support

Stisla requires modern browser features (OKLCH, color-mix, :has(), @layer, container queries):
- Safari 16.4+
- Chrome 111+
- Firefox 121+

No polyfills needed. These versions align with the stable feature set Stisla relies on.

### Customization Strategy

Stisla ships as a complete stylesheet, but you override its CSS custom properties to apply this Linear-inspired design system:

```css
:root {
  /* Brand & Accent */
  --color-primary: #5e6ad2;
  --color-primary-hover: #828fff;
  --color-primary-focus: #5e69d1;
  
  /* Surface */
  --color-canvas: #010102;
  --color-surface-1: #0f1011;
  --color-surface-2: #141516;
  --color-surface-3: #18191a;
  --color-surface-4: #191a1b;
  
  /* Text */
  --color-ink: #f7f8f8;
  --color-ink-muted: #d0d6e0;
  --color-ink-subtle: #8a8f98;
  --color-ink-tertiary: #62666d;
  
  /* Borders */
  --color-hairline: #23252a;
  --color-hairline-strong: #34343a;
  
  /* Typography */
  --font-display: 'Linear Display', 'SF Pro Display', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif;
  --font-text: 'Linear Text', 'SF Pro Display', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Linear Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  
  /* Spacing */
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
  
  /* Rounded */
  --rounded-xs: 4px;
  --rounded-sm: 6px;
  --rounded-md: 8px;
  --rounded-lg: 12px;
  --rounded-xl: 16px;
  --rounded-pill: 9999px;
}
```

### Component Architecture

Stisla components use `data-stisla-*` attributes for JavaScript-driven behavior and CSS classes for styling. The runtime auto-initializes components on page load.

Example button:
```html
<button type="button" class="button button--primary">
  Get started
</button>
```

Example dialog (overlay):
```html
<div data-stisla-dialog="welcome-modal">
  <div class="dialog__content">
    <h2>Welcome</h2>
    <p>Linear-inspired dialog content</p>
  </div>
</div>
```

### Optimization

For production builds that only need specific components, install `@stisla/style` (source version) instead of the precompiled bundle and compile a subset. See the Stisla Optimization docs for tree-shaking guidance.

### Components with External Libraries

Three Stisla components bundle third-party libraries:
- **Carousel** — Embla
- **Combobox** (searchable, multi-select, tagging) — Tom Select
- **Scroll area** (custom scrollbars) — OverlayScrollbars

These are included in the default bundle. If unused, compile from source to exclude them.

## Colors

> Source pages: linear.app (home), /intake, /pricing, /contact/sales, /build.

### Brand & Accent
- **Lavender-Blue** ({colors.primary}): The signature Linear accent — primary CTA, brand mark, link emphasis.
- **Lavender Hover** ({colors.primary-hover}): Lighter lavender (#828fff) — hovered state of the primary CTA.
- **Lavender Focus** ({colors.primary-focus}): Focus-ring tint (#5e69d1) — focused inputs, focused buttons.
- **Brand Secure** ({colors.brand-secure}): Muted lavender-gray (#7a7fad) — used in "Linear Security" surfaces.

### Surface
- **Canvas** ({colors.canvas}): Default page background — #010102, near-pure black with a faint blue tint.
- **Surface 1** ({colors.surface-1}): One step above canvas — feature cards, pricing cards, product screenshot panels.
- **Surface 2** ({colors.surface-2}): Two steps above — featured pricing card, hovered cards.
- **Surface 3** ({colors.surface-3}): Three steps above — line-tertiary backgrounds, sub-nav.
- **Surface 4** ({colors.surface-4}): Four steps above — bg-level-3, deepest lifted surface.
- **Hairline** ({colors.hairline}): 1px borders on cards and dividers.
- **Hairline Strong** ({colors.hairline-strong}): Stronger 1px borders — input focus rings.
- **Hairline Tertiary** ({colors.hairline-tertiary}): Tertiary borders for nested surfaces.
- **Inverse Canvas** ({colors.inverse-canvas}): Pure white — surface of the inverse pill CTA on a small set of section openers.
- **Inverse Surface 1** ({colors.inverse-surface-1}): One step above inverse canvas.
- **Inverse Surface 2** ({colors.inverse-surface-2}): Two steps above inverse canvas.

### Text
- **Ink** ({colors.ink}): All headlines and emphasized body type — light gray #f7f8f8.
- **Ink Muted** ({colors.ink-muted}): Secondary type at #d0d6e0 — meta info on hero panels.
- **Ink Subtle** ({colors.ink-subtle}): Tertiary type at #8a8f98 — deselected pricing tabs, footer columns.
- **Ink Tertiary** ({colors.ink-tertiary}): Quaternary at #62666d — disabled, footnotes.

### Semantic
- **Success Green** ({colors.semantic-success}): Status pills, success indicators. The only semantic color on marketing.
- **Overlay** ({colors.semantic-overlay}): Pure black overlay scrim for modals.

## Typography

### Font Family

- **Linear Display** — Linear's custom display sans; fallback `SF Pro Display, -apple-system, system-ui, Segoe UI, Roboto`. Carries display-xl through subhead.
- **Linear Text** — Linear's custom text sans (a slightly different cut tuned for body sizes); same fallback stack. Carries body sizes, button labels, captions.
- **Linear Mono** — Linear's custom mono; fallback `ui-monospace, SF Mono, Menlo`. Used for code snippets in product screenshots and for status / ID tokens.

The marketing surface treats Display and Text as one continuous voice; the family change is silent.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 80px | 600 | 1.05 | -3.0px | Largest hero headline |
| `{typography.display-lg}` | 56px | 600 | 1.10 | -1.8px | Section opener headlines |
| `{typography.display-md}` | 40px | 600 | 1.15 | -1.0px | Sub-section headlines |
| `{typography.headline}` | 28px | 600 | 1.20 | -0.6px | Pricing tier titles, CTA banner heading |
| `{typography.card-title}` | 22px | 500 | 1.25 | -0.4px | Feature card title |
| `{typography.subhead}` | 20px | 400 | 1.40 | -0.2px | Lead body, intro paragraphs |
| `{typography.body-lg}` | 18px | 400 | 1.50 | -0.1px | Hero subhead, lead paragraphs |
| `{typography.body}` | 16px | 400 | 1.50 | -0.05px | Default body |
| `{typography.body-sm}` | 14px | 400 | 1.50 | 0 | Card body, footer columns |
| `{typography.caption}` | 12px | 400 | 1.40 | 0 | Captions, meta, status |
| `{typography.button}` | 14px | 500 | 1.20 | 0 | All button labels |
| `{typography.eyebrow}` | 13px | 500 | 1.30 | 0.4px | Section eyebrow (slight positive tracking) |
| `{typography.mono}` | 13px | 400 | 1.50 | 0 | Linear Mono for code in product screenshots |

### Principles

- **Aggressive negative tracking on display** (-3.0px at 80px ≈ 4% of size).
- **Single voice from display to body.** Display-xl at 600 → body at 400 — same family, narrower weights.
- **Eyebrow uses positive tracking** (+0.4px) — contrast against the negative-tracked display marks the eyebrow as taxonomy.
- **Mono only in code contexts.** Linear Mono lives inside product screenshots — not on marketing chrome.

### Note on Font Substitutes

Linear's custom typeface isn't publicly distributed; the documented fallback `SF Pro Display, -apple-system, system-ui` is the recommended substitute on macOS. For cross-platform implementation, **Inter** at weight 500 / 600 / 700 is the closest free substitute. **Geist Sans** is also viable. For mono, **JetBrains Mono** or **Geist Mono** at weight 400 closely approximates Linear Mono.

## Layout

### Spacing System

- **Base unit**: 4px.
- **Tokens (front matter)**: `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- Card interior padding: `{spacing.lg}` 24px on feature/pricing cards; `{spacing.xl}` 32px on testimonial cards; `{spacing.xxl}` 48px on CTA banners.
- Pill button padding: 8px vertical · 14px horizontal — Linear's compact button spec.
- Form input padding: 8px vertical · 12px horizontal.

### Grid & Container

- Max content width sits around 1280px.
- Card grids are 3-up at desktop, 2-up at tablet, 1-up at mobile.
- Pricing tier grid is 3-up; comparison strip below shows checkmarks per tier.
- Product screenshot panels span full content width — they're the protagonist.

### Whitespace Philosophy

The dark canvas IS the whitespace. Sections separate by lift onto surface-1 panels, not by gaps in white. Within a panel, generous `{spacing.lg}` 24px gaps between content blocks; `{spacing.section}` 96px between sections.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 (flat) | No shadow, no border | Default for body type, hero text, footer |
| 1 (charcoal lift) | `{colors.surface-1}` background on canvas, 1px `{colors.hairline}` | Default cards, product panels |
| 2 (surface-2 lift) | `{colors.surface-2}` background, 1px `{colors.hairline-strong}` | Featured pricing card, hovered cards |
| 3 (surface-3 lift) | `{colors.surface-3}` background | Sub-nav, dropdown menus |
| 4 (focus ring) | 2px `{colors.primary-focus}` outline at 50% opacity | Focused input, focused button |

Linear's depth is carried by surface ladder + hairline borders. The brand resists drop shadows on dark almost entirely.

### Decorative Depth

- **Product UI screenshots** dominate as decorative depth.
- **No atmospheric gradients, no spotlight cards.**
- **Subtle white edge highlight** on the top edge of lifted panels — gives the dark surface a faint "pixel rendered" feel.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Small chips, status badges |
| `{rounded.sm}` | 6px | Inline tags |
| `{rounded.md}` | 8px | All buttons, form inputs |
| `{rounded.lg}` | 12px | Pricing cards, feature cards, testimonial cards |
| `{rounded.xl}` | 16px | Product screenshot panels |
| `{rounded.xxl}` | 24px | Oversized CTA banners (rare) |
| `{rounded.pill}` | 9999px | Pricing tab toggles, status pills |
| `{rounded.full}` | 9999px | Avatar circles |

### Photography & Illustration Geometry

- Product UI screenshots dominate; they sit in `{rounded.xl}` 16px tiles with `{spacing.lg}` 24px outer padding.
- Customer logo tiles render at small sizes (~24px logo height) on `{colors.canvas}` with no border.
- Avatar circles in testimonial cards use `{rounded.full}` at 32–40px sizes.

## Components

### Implementation with Stisla

The following component definitions map directly to Stisla's component primitives. Stisla provides base classes (e.g., `.button`, `.card`, `.input`) that you customize with CSS custom properties and modifier classes.

**Stisla Component Mapping:**

| Design Token | Stisla Base | Custom Classes | Notes |
|---|---|---|---|
| `button-primary` | `.button` | `.button--primary` | Override `--color-primary` for lavender |
| `button-secondary` | `.button` | `.button--secondary` | Maps to surface-1 background |
| `pricing-card` | `.card` | `.card--pricing` | Use Stisla card with custom surface tokens |
| `text-input` | `.input` | `.input--default` | Override surface and ink tokens |
| `top-nav` | `.navbar` | `.navbar--dark` | Stisla navbar with canvas background |
| Dialog/Modal | `[data-stisla-dialog]` | `.dialog` | Overlay component with auto-initialization |
| Tabs | `.tabs` | `.tabs--pills` | For pricing toggle behavior |

**Example: Primary Button with Stisla**

```html
<button type="button" class="button button--primary">
  Get started
</button>
```

```css
/* Custom override in your stylesheet */
.button--primary {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  border-radius: var(--rounded-md);
  padding: 8px 14px;
  font-family: var(--font-text);
  font-size: 14px;
  font-weight: 500;
}

.button--primary:hover {
  background-color: var(--color-primary-hover);
}

.button--primary:focus-visible {
  outline: 2px solid var(--color-primary-focus);
  outline-offset: 2px;
}
```

**Example: Feature Card with Stisla**

```html
<div class="card card--feature">
  <div class="card__header">
    <h3 class="card__title">Advanced Analytics</h3>
  </div>
  <div class="card__body">
    <p>Real-time insights into your project performance with customizable dashboards.</p>
  </div>
</div>
```

```css
.card--feature {
  background-color: var(--color-surface-1);
  border: 1px solid var(--color-hairline);
  border-radius: var(--rounded-lg);
  padding: var(--spacing-lg);
}

.card__title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.4px;
  color: var(--color-ink);
}

.card__body {
  color: var(--color-ink-muted);
  margin-top: var(--spacing-sm);
}
```

**Example: Navigation with Stisla**

```html
<nav class="navbar navbar--dark" data-stisla-navbar>
  <div class="navbar__brand">
    <a href="/" class="navbar__logo">
      <img src="/logo.svg" alt="IMS - BEM FT UNESA">
    </a>
  </div>
  <div class="navbar__menu">
    <a href="/features" class="navbar__link">Features</a>
    <a href="/pricing" class="navbar__link">Pricing</a>
    <a href="/about" class="navbar__link">About</a>
  </div>
  <div class="navbar__actions">
    <button class="button button--secondary">Sign in</button>
    <button class="button button--primary">Get started</button>
  </div>
</nav>
```

**Example: Dialog/Modal with Stisla**

```html
<!-- Trigger -->
<button type="button" data-stisla-dialog-trigger="contact-modal" class="button button--primary">
  Contact Sales
</button>

<!-- Dialog -->
<div data-stisla-dialog="contact-modal" class="dialog">
  <div class="dialog__overlay"></div>
  <div class="dialog__content">
    <div class="dialog__header">
      <h2 class="dialog__title">Contact Sales</h2>
      <button type="button" data-stisla-dialog-close class="dialog__close">
        ×
      </button>
    </div>
    <div class="dialog__body">
      <form class="form">
        <div class="form__group">
          <label for="email" class="form__label">Email</label>
          <input type="email" id="email" class="input" placeholder="you@company.com">
        </div>
        <div class="form__group">
          <label for="message" class="form__label">Message</label>
          <textarea id="message" class="textarea" rows="4"></textarea>
        </div>
      </form>
    </div>
    <div class="dialog__footer">
      <button type="button" class="button button--secondary" data-stisla-dialog-close>
        Cancel
      </button>
      <button type="submit" class="button button--primary">
        Send Message
      </button>
    </div>
  </div>
</div>
```

```css
/* Dialog customization */
.dialog__content {
  background-color: var(--color-surface-1);
  border: 1px solid var(--color-hairline);
  border-radius: var(--rounded-lg);
  max-width: 480px;
}

.dialog__overlay {
  background-color: var(--color-semantic-overlay);
  opacity: 0.8;
}

.dialog__title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.6px;
  color: var(--color-ink);
}
```

### Buttons

**`button-primary`** — Lavender CTA. The default primary CTA across all pages.
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}`, padding 8px 14px, rounded `{rounded.md}`.
- Pressed state lives in `button-primary-pressed` (background shifts to `{colors.primary-focus}`).
- Hover state lives in `button-primary-hover` (background shifts to `{colors.primary-hover}` lighter lavender).

**`button-secondary`** — Charcoal button. Used for secondary CTAs ("Sign in", "Read changelog").
- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.button}`, padding 8px 14px, rounded `{rounded.md}`. 1px `{colors.hairline}` border.

**`button-tertiary`** — Plain text button.
- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.button}`, rounded `{rounded.md}`, padding 8px 14px.

**`button-inverse`** — White-on-dark inverse CTA.
- Background `{colors.inverse-canvas}`, text `{colors.inverse-ink}`, type `{typography.button}`, rounded `{rounded.md}`, padding 8px 14px.

### Pricing Tabs

**`pricing-tab-default`** + **`pricing-tab-selected`** — Pill-toggle on `/pricing`.
- Default: `{colors.canvas}` background, `{colors.ink-subtle}` text, rounded `{rounded.pill}`, padding 6px 14px.
- Selected: `{colors.surface-2}` background, `{colors.ink}` text — selected = surface lift.

### Cards & Containers

**`pricing-card`** — Each tier on `/pricing`.
- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.body}`, rounded `{rounded.lg}`, padding 24px. 1px `{colors.hairline}` border.

**`pricing-card-featured`** — Recommended tier — surface lift to surface-2.
- Background `{colors.surface-2}`, otherwise identical structure.

**`feature-card`** — Generic feature highlight tile.
- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.body}`, rounded `{rounded.lg}`, padding 24px.

**`product-screenshot-card`** — The dominant card type — frames a high-fidelity Linear app UI screenshot.
- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.body}`, rounded `{rounded.xl}`, padding 24px.

**`testimonial-card`** — Customer quote with avatar + name + role.
- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.body-lg}`, rounded `{rounded.lg}`, padding 32px.

**`customer-logo-tile`** — Small tile in the customer marquee.
- Background `{colors.canvas}`, text `{colors.ink-subtle}`, type `{typography.caption}`, rounded `{rounded.xs}`, padding 16px.

**`cta-banner`** — Closing CTA panel near page bottom.
- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.headline}`, rounded `{rounded.lg}`, padding 48px.

### Inputs & Forms

**`text-input`** + **`text-input-focused`** — Form fields on `/contact/sales` and signup overlays.
- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.body}`, rounded `{rounded.md}`, padding 8px 12px.
- Focused state retains the same surface; the focus ring is a 2px `{colors.primary-focus}` outline at 50% opacity.

### Status & Build Page

**`changelog-row`** — Each row in `/build` (changelog page) listing version, date, and changes.
- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body}`, rounded `{rounded.xs}`, padding 24px 0. 1px `{colors.hairline}` bottom rule.

**`status-badge`** — Small status pill.
- Background `{colors.surface-2}`, text `{colors.ink-muted}`, type `{typography.caption}`, rounded `{rounded.pill}`, padding 2px 8px.

### Navigation

**`top-nav`** — Sticky dark bar with the Linear wordmark left, primary nav links centered, and a `button-secondary` ("Sign in") + `button-primary` ("Get started") pair right.
- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body-sm}`, height 56px.

### Footer

**`footer`** — Dense link grid on `{colors.canvas}` with the Linear wordmark left.
- Background `{colors.canvas}`, text `{colors.ink-subtle}`, type `{typography.caption}`, padding 64px 32px.

## Do's and Don'ts

### Do

- Reserve `{colors.canvas}` (#010102) as the system's anchor surface — the faint blue tint is intentional.
- Use `{colors.primary}` lavender ONLY for: brand mark, primary CTA, focus ring, link emphasis.
- Use the four-step surface ladder for hierarchy. Avoid skipping levels.
- Pair display weight 600 with body weight 400 — Linear resists 700+ display weights.
- Apply negative letter-spacing aggressively on display.
- Use product UI screenshots as the protagonist of every section.
- Compose CTAs as `{rounded.md}` 8px corners.

### Don't

- Don't ship a light-mode marketing page.
- Don't use lavender as a section background or card fill.
- Don't introduce a second chromatic accent (orange, pink, green for marketing).
- Don't add atmospheric gradients or spotlight cards.
- Don't pill-round CTAs.
- Don't use `#000000` true black as the canvas.
- Don't combine multiple bright accents in product screenshot mockups.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Desktop-XL | 1440px | Default desktop layout |
| Desktop | 1280px | Card grid 3-up maintained |
| Tablet | 1024px | Card grid 3-up → 2-up |
| Mobile-Lg | 768px | Pricing comparison becomes accordion; nav hamburger |
| Mobile | 480px | Single-column; display-xl scales 80px → ~36px |

### Touch Targets

- CTAs hold ≥40px tap height across viewports.
- Pricing tab pills hold ≥36px tap height; touch viewports grow to ≥44px.
- Form inputs hold ≥44px tap target on touch.

### Collapsing Strategy

- **Top nav**: links collapse to hamburger below 768px.
- **Card grids**: 3-up → 2-up at 1024px → 1-up below 768px.
- **Pricing comparison**: per-tier accordion below 768px.
- **Display type**: `{typography.display-xl}` 80px scales toward `{typography.display-md}` 40px on mobile.

### Image Behavior

- Product UI screenshots maintain aspect ratio and never crop.
- Customer logos in the marquee may collapse from 6-up to 3-up below 768px.

## Quick Start: Stisla + Linear Design System

This section provides a complete starter template combining Stisla with the Linear-inspired design tokens. Copy this structure to begin implementation.

### Complete HTML Starter Template

```html
<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>IMS - BEM FT UNESA</title>
    <meta name="description" content="Information Management System untuk BEM FT UNESA">
    
    <!-- Stisla CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@stisla/css@3/dist/stisla.css">
    
    <!-- Custom Design System -->
    <link rel="stylesheet" href="/css/design-system.css">
    <link rel="stylesheet" href="/css/components.css">
  </head>
  <body>
    <!-- Navigation -->
    <nav class="navbar navbar--dark" data-stisla-navbar>
      <div class="navbar__container">
        <div class="navbar__brand">
          <a href="/" class="navbar__logo">IMS BEM FT</a>
        </div>
        <div class="navbar__menu">
          <a href="/features" class="navbar__link">Features</a>
          <a href="/about" class="navbar__link">About</a>
          <a href="/contact" class="navbar__link">Contact</a>
        </div>
        <div class="navbar__actions">
          <button class="button button--secondary">Sign in</button>
          <button class="button button--primary">Get started</button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <h1 class="hero__title">Modern Information Management</h1>
        <p class="hero__subtitle">Streamline your organization's workflow with powerful tools designed for efficiency.</p>
        <div class="hero__actions">
          <button class="button button--primary button--lg">Get started</button>
          <button class="button button--secondary button--lg">Learn more</button>
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section class="features">
      <div class="container">
        <h2 class="section__title">Key Features</h2>
        <div class="features__grid">
          <div class="card card--feature">
            <div class="card__header">
              <h3 class="card__title">Real-time Collaboration</h3>
            </div>
            <div class="card__body">
              <p>Work together seamlessly with your team in real-time.</p>
            </div>
          </div>
          <!-- Repeat for more feature cards -->
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <p>&copy; 2026 BEM FT UNESA. All rights reserved.</p>
      </div>
    </footer>

    <!-- Stisla JS Runtime -->
    <script src="https://cdn.jsdelivr.net/npm/@stisla/vanilla@3/dist/stisla.js"></script>
  </body>
</html>
```

### design-system.css — Core Token Overrides

```css
/* /css/design-system.css */
:root {
  /* Brand & Accent */
  --color-primary: #5e6ad2;
  --color-on-primary: #ffffff;
  --color-primary-hover: #828fff;
  --color-primary-focus: #5e69d1;
  
  /* Surface Ladder */
  --color-canvas: #010102;
  --color-surface-1: #0f1011;
  --color-surface-2: #141516;
  --color-surface-3: #18191a;
  --color-surface-4: #191a1b;
  
  /* Text Hierarchy */
  --color-ink: #f7f8f8;
  --color-ink-muted: #d0d6e0;
  --color-ink-subtle: #8a8f98;
  --color-ink-tertiary: #62666d;
  
  /* Borders */
  --color-hairline: #23252a;
  --color-hairline-strong: #34343a;
  --color-hairline-tertiary: #3e3e44;
  
  /* Inverse (Light Mode Accents) */
  --color-inverse-canvas: #ffffff;
  --color-inverse-surface-1: #f5f6f6;
  --color-inverse-surface-2: #f6f7f7;
  --color-inverse-ink: #000000;
  
  /* Semantic */
  --color-brand-secure: #7a7fad;
  --color-semantic-success: #27a644;
  --color-semantic-overlay: #000000;
  
  /* Typography */
  --font-display: 'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif;
  --font-text: 'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', monospace;
  
  /* Spacing */
  --spacing-xxs: 4px;
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
  --spacing-section: 96px;
  
  /* Border Radius */
  --rounded-xs: 4px;
  --rounded-sm: 6px;
  --rounded-md: 8px;
  --rounded-lg: 12px;
  --rounded-xl: 16px;
  --rounded-xxl: 24px;
  --rounded-pill: 9999px;
  --rounded-full: 9999px;
}

/* Global Styles */
body {
  background-color: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-text);
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: -0.05px;
  margin: 0;
  padding: 0;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

/* Typography Scale */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  color: var(--color-ink);
  margin: 0;
}

h1 {
  font-size: 56px;
  font-weight: 600;
  line-height: 1.10;
  letter-spacing: -1.8px;
}

h2 {
  font-size: 40px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -1.0px;
}

h3 {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.20;
  letter-spacing: -0.6px;
}

@media (max-width: 768px) {
  h1 { font-size: 36px; letter-spacing: -1.0px; }
  h2 { font-size: 28px; letter-spacing: -0.6px; }
  h3 { font-size: 22px; letter-spacing: -0.4px; }
}
```

### components.css — Component Styles

```css
/* /css/components.css */

/* Buttons */
.button {
  font-family: var(--font-text);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  padding: 8px 14px;
  border-radius: var(--rounded-md);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button--primary {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

.button--primary:hover {
  background-color: var(--color-primary-hover);
}

.button--primary:focus-visible {
  outline: 2px solid var(--color-primary-focus);
  outline-offset: 2px;
}

.button--secondary {
  background-color: var(--color-surface-1);
  color: var(--color-ink);
  border: 1px solid var(--color-hairline);
}

.button--secondary:hover {
  background-color: var(--color-surface-2);
  border-color: var(--color-hairline-strong);
}

.button--lg {
  padding: 12px 20px;
  font-size: 16px;
}

/* Cards */
.card {
  background-color: var(--color-surface-1);
  border: 1px solid var(--color-hairline);
  border-radius: var(--rounded-lg);
  padding: var(--spacing-lg);
  transition: all 0.3s ease;
}

.card:hover {
  background-color: var(--color-surface-2);
  border-color: var(--color-hairline-strong);
}

.card__title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: -0.4px;
  color: var(--color-ink);
  margin-bottom: var(--spacing-sm);
}

.card__body {
  color: var(--color-ink-muted);
  font-size: 16px;
  line-height: 1.5;
}

/* Navigation */
.navbar {
  background-color: var(--color-canvas);
  border-bottom: 1px solid var(--color-hairline);
  padding: var(--spacing-md) 0;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.navbar__logo {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-ink);
  text-decoration: none;
}

.navbar__menu {
  display: flex;
  gap: var(--spacing-lg);
}

.navbar__link {
  color: var(--color-ink-muted);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s ease;
}

.navbar__link:hover {
  color: var(--color-ink);
}

.navbar__actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* Hero Section */
.hero {
  padding: var(--spacing-section) 0;
  text-align: center;
}

.hero__title {
  margin-bottom: var(--spacing-lg);
}

.hero__subtitle {
  font-size: 18px;
  color: var(--color-ink-muted);
  max-width: 600px;
  margin: 0 auto var(--spacing-xl);
}

.hero__actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

/* Features Grid */
.features {
  padding: var(--spacing-section) 0;
}

.section__title {
  text-align: center;
  margin-bottom: var(--spacing-xxl);
}

.features__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

/* Footer */
.footer {
  background-color: var(--color-canvas);
  border-top: 1px solid var(--color-hairline);
  padding: var(--spacing-xxl) 0;
  text-align: center;
  color: var(--color-ink-subtle);
  font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
  .navbar__menu {
    display: none; /* Implement hamburger menu */
  }
  
  .hero__actions {
    flex-direction: column;
    align-items: center;
  }
  
  .features__grid {
    grid-template-columns: 1fr;
  }
}
```

### Project Structure

```
/
├── index.html
├── css/
│   ├── design-system.css    # Core token overrides
│   └── components.css        # Component-specific styles
├── js/
│   └── main.js               # Custom JavaScript (optional)
└── assets/
    ├── images/
    └── fonts/                # Optional: Linear Display/Text fonts
```

### Next Steps

1. **Copy the starter template** above into your `index.html`
2. **Create** `css/design-system.css` with the token overrides
3. **Create** `css/components.css` with component styles
4. **Test** in a modern browser (Chrome 111+, Safari 16.4+, Firefox 121+)
5. **Customize** colors, spacing, and typography as needed
6. **Refer to** [Stisla documentation](https://stisla.com/docs) for advanced components

## Iteration Guide

1. Focus on ONE component at a time and reference it by its `components:` token name.
2. When introducing a section, decide first which surface lift it lives on.
3. Default body to `{typography.body}` at weight 400.
4. Run `npx @google/design.md lint DESIGN.md` after edits.
5. Add new variants as separate component entries.
6. Treat lavender as scarce: brand mark, primary CTA, focus, link emphasis.
7. Lead every section with a product UI screenshot.

## Known Gaps

- The four-step surface ladder values are extracted directly from Linear's `--color-bg-level-3`, `--color-line-tint`, etc. CSS variables; they are Linear's canonical surface spec.
- Form-field error and validation styling is not visible on the inspected pages.
- Light mode is not documented because the marketing site does not ship a light theme.
- Linear's actual product UI uses a richer color-tag palette (red, orange, yellow, green, blue, purple) for issue priorities and project labels — those colors live in the in-product surfaces shown in mockups.
- The custom display, text, and mono families are proprietary; an open-source substitute is acceptable.
