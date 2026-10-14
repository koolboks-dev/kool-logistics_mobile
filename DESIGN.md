# KOOL Logistics — Design Language

The single reference for how this app looks and behaves. Read this before adding
a screen or component. If something here is wrong, fix the doc in the same
change as the code.

**It follows the Koolboks Sales CRM** (`Koolboks-sales-CRM/koolboks_sales_crm_web/DESIGN.md`)
and the two web consoles: clean white cards on a light grey page, charcoal text
and primary buttons, Work Sans, 12px corners, thin borders, soft shadows, and
Koolboks orange as the accent — not the main colour.

---

## 1. Non-negotiables

1. **iOS and Android must render identically.** Same spacing, same radii, same
   type metrics, same motion. A screenshot from each device should differ only
   in status bar and safe-area insets.
2. **No platform-native widgets.** Do not use `@expo/ui`, the stock RN `Switch`,
   `SegmentedControl`, or SF Symbols in shared UI — each renders differently per
   platform. Every control in `src/components/ui` is custom for this reason.
3. **Component-first.** Screens compose components. A screen should contain
   layout and data wiring, not bespoke styling. If you style something twice,
   promote it to `src/components/ui`.
4. **Tokens only.** No hardcoded hex, spacing, or radius values in components or
   screens. Everything comes from `src/theme/tokens.ts`.

---

## 2. Brand

Colors sampled directly from the logo artwork.

| Token | Hex | Use |
|---|---|---|
| `Palette.charcoal` | `#050711` | Text and primary (filled) buttons — the workhorse |
| `Palette.orange` | `#F57E16` | The accent: active tab, focus, links, icons, at most one orange button per screen |
| `Palette.orangeDark` | `#DC6C0B` | Pressed orange |
| `Palette.orangeText` | `#B85A0A` | Orange *text* on white (pure orange is only 2.7:1, so it's for fills and icons) |
| `Palette.orangeSoft` | `#FEF1E6` | Tinted icon wells, selected states |

Keep orange to roughly 10% of a screen. If a screen looks orange, there is too much.

**Logo variants** — `assets/images/logo/`

- `logo.png` — charcoal "LOGISTICS". **Light backgrounds only.**
- `logo-white-bg.png` — white "LOGISTICS". **Dark backgrounds only.** The name
  is misleading: it is white *text* on transparent, not a white background.
- Both variants are cut from the same official artwork, so they share one
  aspect ratio: **`LogoRatio` = 2.8241**. Always derive height as
  `width / LogoRatio` rather than hardcoding it.
- `@2x` / `@3x` are generated; React Native picks the density. The pristine
  source sits in `logo/source/` and is not bundled.
- `mark.svg` — the chevron mark as **true vector**, traced from the official
  artwork. `ChevronMarkIcon` carries the same path, and every app icon is
  rendered from it, so icons stay crisp at any size.

**Source of truth is koollogistiks.com.** Do not regenerate or "enhance" the
logo with image tools — an earlier upscaled copy drifted from the real mark and
carried red fringing. The site's own `/icons/site-logo.svg` is a bitmap inside
an SVG `<pattern>`, not a vector; the usable original is 305×108, which is why
the mark was traced rather than upscaled.

---

## 3. Color semantics

Never reach for `Palette` in a component; use the semantic theme from
`useColors()` / `useTheme()` so dark mode follows automatically.

| Role | Meaning |
|---|---|
| `background` | Screen base — `#F8F9FA` light grey, so white cards stand out |
| `primary` / `onPrimary` | Charcoal fill and its text — the primary button |
| `brandText` | Orange text (links, "View all") |
| `surface` | Cards, sheets, inputs |
| `surfaceAlt` | Filled cards, icon wells, pressed rows |
| `surfaceSunken` | Tracks behind controls (switch, segmented) |
| `text` / `textSecondary` / `textMuted` | Primary / supporting / de-emphasized |
| `border` / `borderStrong` | Hairlines / visible outlines |
| `controlTrack` / `controlThumb` | Recessed track and moving thumb of a switch or segmented control. Use these, never `surface`/`surfaceSunken` — in dark those two are 4 points apart and the thumb disappears. |
| `brand` / `brandSoft` / `onBrand` | Brand fill / tinted bg / content on brand |
| `success` `danger` `info` `warning` (+ `*Soft`) | Status semantics |

**Delivery status → color** (in `StatusPill`, do not re-map elsewhere):

| Status | Color |
|---|---|
| `awaiting_pickup` | warning (amber) |
| `in_transit` | info (blue) |
| `delivered` | success (green) |
| `cancelled` / `failed` | danger (red) |
| `pending` | neutral |

---

## 4. Typography — Work Sans

The CRM's and the web consoles' face. Loaded in `app/_layout.tsx`; the splash
holds until fonts resolve so no frame renders in the system font.

**Import per-weight** (`@expo-google-fonts/work-sans/400Regular`), never from the
package barrel — the barrel pulls every weight.

Four weights only: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold.

| Variant | Size / Line | Weight | Use |
|---|---|---|---|
| `display` | 36 / 44 | Bold | Splash, one-off hero numbers |
| `title` | 24 / 32 | Bold | Screen titles |
| `heading` | 20 / 28 | SemiBold | Section headers, dialog titles |
| `subheading` | 17 / 24 | SemiBold | Card titles, sheet titles |
| `body` | 14 / 21 | Regular | Default |
| `bodyStrong` | 14 / 21 | Medium | Emphasis, values in detail rows |
| `caption` | 12 / 17 | Regular | Supporting text, timestamps |
| `label` | 13 / 18 | SemiBold | Small section titles, sentence case (no ALL CAPS) |

Always use `<Text variant=… tone=…>`, never RN `Text` directly — it defaults to
the system font and breaks parity.

---

## 5. Spacing, radius, layout

4pt scale: `xxs 2 · xs 4 · sm 8 · md 12 · base 16 · lg 20 · xl 24 · xxl 32 · xxxl 48`

Radius: `xs 6 · sm 8 · md 12 · lg 12 · xl 16 · xxl 20 · pill 999` — **12px (`md`)
for buttons, inputs and cards**, like the CRM. `pill` only for chips, status pills,
avatars and toggles.

- Screen horizontal padding: `Layout.screenPadding` (20)
- Content caps at `Layout.maxContentWidth` (620) and centers — tablets/web
- Section titles are `subheading` in sentence case ("Active deliveries"), with
  a muted count where useful; no ALL-CAPS eyebrows
- Controls: 48 tall (`controlHeight`, the CRM input height and a comfortable
  touch target), 40 for compact (`controlHeightSm`)
- **Buttons and inputs have 12px corners**, not pills. Inputs: white, 1px
  `border`, orange border on focus. Cards: white, 1px `border`, 12px, no or soft
  shadow. Sheets use `xxl`.
- **Buttons:** `primary` = charcoal; `brand` = orange, for the one key action on
  a screen; `outline` = charcoal border; `secondary` = light grey fill.
  Labels are verbs in sentence case.
- Input labels sit above the field as `bodyStrong` in the primary text color —
  not muted captions.
- Bottom padding on any scroll view sitting under the tab bar: **160**

Elevation always sets iOS `shadow*` **and** Android `elevation` together —
`Elevation.sm | md | lg`. Setting only one makes the surface flat on the other
platform.

---

## 6. Glass

`GlassSurface` is the only way to render a translucent surface.

- **iOS 26+**: real Liquid Glass via `expo-glass-effect`.
- **Everywhere else** (Android, older iOS, web): `expo-blur` at matched tint.

The wrapper applies radius, border and padding **outside** the branch, so
geometry is identical either way and layout never shifts. Check availability
with `liquidGlassSupported()`. Use glass for floating chrome — the tab bar,
overlays on imagery — not for ordinary content cards.

**Always pass `tint` when the element had its own fill.** Glass on a plain
background has nothing to refract and reads as an empty outline; the tint keeps
the element's identity (avatar = `brandSoft`, glass icon button = `surfaceAlt`)
while still frosting whatever passes behind.

**Android needs `experimentalBlurMethod`.** `expo-blur` defaults it to `'none'`,
which renders a flat translucent view and no blur at all. `GlassSurface` sets
`dimezisBlurViewSdk31Plus` so Android 12+ gets a real blur and older devices
degrade gracefully. Never use `BlurView` directly — go through `GlassSurface`.

---

## 6b. Appearance

Three levels, chosen on Account → Appearance and persisted with AsyncStorage:
`auto` (follows the device), `light`, `dark`.

Switching does **not** hard-flip. `AppThemeProvider` crossfades: a full-screen
cover in the destination background fades in (170ms), the palette swaps behind
it, then it fades out (240ms). Components stay ignorant of the transition — no
shared values threaded through the tree.

Read the current appearance with `useTheme().mode`; read the user's choice with
`.preference`. Never branch on `useColorScheme()` directly in a component, or it
will ignore a manual Light/Dark override.

---

## 7. Motion

From `Motion`: `fast 140ms` (state tints), `base 220ms` (transitions, chevrons),
`slow 340ms` (entrances). Springs: `spring` (crisp, for press) and `springSoft`
(settled, for sheets).

Rules:

- Every pressable scales on press — `0.97` for buttons, `0.9` for icon buttons.
- List and section entrances use `FadeInDown`, staggered `~60ms` per item.
- Animate with Reanimated on the UI thread. Never `Animated` from `react-native`.
- Motion should confirm an action, never delay it.
- **Alerts do not bounce.** `Dialog` and `Toast` use short timed fades with a
  barely-there scale settle (`Keyframe`, not `springify`). Springs are for
  direct manipulation — presses, sheets, tab selection — not for something that
  interrupts the user.

---

## 8. Haptics

Touch feedback is part of the design, not a nicety.

| Gesture | Feedback |
|---|---|
| Primary / secondary button | `impactAsync(Light)` |
| Tab change, chip, segment, select, row | `selectionAsync()` |
| Success (delivered, confirmed) | `notificationAsync(Success)` |
| Error (wrong PIN, failure) | `notificationAsync(Error)` |

Every tab press fires haptics — a tab is the most-used control in the app.

---

## 9. Icons

**Every icon is custom SVG** (`src/components/icons`) — 24×24 grid, 1.8
stroke, round caps and joins. Custom because platform icon sets diverge
visually, and an icon font is a large download.

- **Tab bar and brand icons** — `Icons` in `index.tsx`, with an `active`
  filled state for the selected tab.
- **Everything else** (buttons, inputs, rows, banners, empty states, status
  rows) — `<Glyph name="call-outline" size={18} color={c.brand} />`. The
  drawings live in `glyph-data.ts`; names keep the Ionicons spelling the app
  already used. `-outline` names are line icons; the others (e.g.
  `checkmark-circle`, `flash`) add a soft filled shape (16% of the colour).

Do not use Ionicons or another icon font. Need a new icon? Draw it in
`glyph-data.ts` on the same grid and stroke, and check it next to its
neighbours.

---

## 10. Components

`src/components/ui`, exported through its barrel.

**Primitives** — `Text` `Button` `IconButton` `Card` `Divider` `GlassSurface`
**Inputs** — `Input` `PinInput` `SearchBar` `Select` `Chip` `Switch` `SegmentedControl`
**Data** — `DetailRow` `Accordion` `Timeline` `OrderCard` `ListRow` `Avatar` `StatusPill` `Badge` `Pagination` `ProgressBar`
**Feedback** — `SuccessCheck` `EmptyState` `Skeleton` `Toast`
**Overlays** — `BottomSheet` `Dialog`
**Navigation** — `TabBar` `ScreenScroll` `GlassBackButton`

Adding one: build it in `src/components/ui`, take colors from `useColors()`,
take every dimension from tokens, add press animation + haptics if interactive,
export from `index.ts`, and add a live example to the gallery.

---

## 11. Content

- Currency: `₦` with thousands separators — `₦18,500`
- Order references: `#KL-84213`
- Timestamps in lists: `HH:mm`; absolute dates elsewhere
- Sentence case everywhere: labels, buttons, section titles ("Mark as delivered")
- Buttons are verbs. "Confirm delivery", not "OK"

---

## 12. App structure

```
src/
  app/                    expo-router routes
    _layout.tsx           fonts + theme + app state + toasts
    index.tsx             redirect: signed in → /home, else → /welcome
    (auth)/               welcome, sign-in
    (tabs)/               home, orders, scan, alerts, account
    order/[id].tsx        order detail
    result.tsx            delivered / cancelled outcome
    gallery.tsx           component library
  components/ui/          the design system
  components/icons/       custom SVG icon set
  theme/                  tokens, provider, fonts
  data/                   mock orders and notifications
  store/                  app state (rider, orders, notifications)
```

**Screen conventions**

- Every screen uses `ScreenScroll`. There is no header bar at rest: the page
  opens with a large inline title, and scrolling hands that title off to a
  compact glass bar pinned to the top (inline fades out, bar fades in, over
  28–76pt of scroll).
- **Back buttons belong only on inner screens** — never on a tab root. A tab
  root is reached by tapping its tab, so "back" has no meaning there.
- The back affordance is `GlassBackButton`: an `arrow-back` inside a
  liquid-glass circle, floating above the bar so it never fades with it.
- Scroll content under the tab bar ends with `paddingBottom: 160`.
- Content is width-capped and centered via `Layout.maxContentWidth`.
- Sections enter with `FadeInDown`, staggered ~60–80ms.
- Destructive actions always route through `Dialog`, never fire directly.
- Data comes from `useApp()`. Screens never import `data/` directly, so
  swapping the mock store for an API touches one file.
