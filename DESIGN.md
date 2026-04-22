---
name: LoopiFy
tagline: Peer learning, looped together
description: >
  A friendly, mobile-first peer-learning app that brings study groups,
  shared resources, live video sessions, and an always-on AI tutor into
  a single calm, focused experience. The visual identity blends a cool,
  near-white canvas with confident vibrant blue accents and gentle
  blue→purple gradients to feel modern, optimistic, and academic.

design_tokens:
  color:
    # All values are HSL triplets (hue saturation% lightness%).
    # Pair with hsl()/hsla() at consumption time.
    light:
      background:        "209 40% 96%"   # cool off-white app canvas
      foreground:        "222 47% 11%"   # near-black ink
      surface:           "210 40% 98%"   # cards, sheets
      surface-muted:     "214 31% 91%"   # popovers, soft chips
      border:            "212 26% 83%"   # hairline dividers
      input:             "212 26% 83%"
      ring:              "200 98% 39%"   # focus ring (matches primary)
      muted:             "215 20% 65%"
      muted-foreground:  "215 16% 46%"
      primary:           "200 98% 39%"   # vibrant LoopiFy blue
      primary-foreground:"204 100% 97%"
      secondary:         "215 24% 26%"   # deep slate (used for video/utility)
      secondary-foreground: "210 40% 98%"
      accent:            "210 40% 98%"   # subtle hover wash
      accent-foreground: "215 19% 34%"
      success:           "142 71% 45%"
      success-foreground:"0 0% 100%"
      destructive:       "0 72% 50%"
      destructive-foreground: "0 85% 97%"
    dark:
      background:        "222 47% 11%"
      foreground:        "210 40% 98%"
      surface:           "217 32% 17%"
      surface-muted:     "215 24% 26%"
      border:            "215 19% 34%"
      input:             "215 19% 34%"
      ring:              "198 93% 59%"
      muted:             "215 16% 46%"
      muted-foreground:  "215 20% 65%"
      primary:           "198 93% 59%"   # brightened blue for dark mode
      primary-foreground:"204 80% 15%"
      secondary:         "212 26% 83%"
      secondary-foreground: "228 84% 4%"
      accent:            "228 84% 4%"
      accent-foreground: "215 20% 65%"
      success:           "142 71% 45%"
      destructive:       "0 84% 60%"
    gradients:
      brand:
        from: "200 98% 39%"   # primary blue
        to:   "215 24% 26%"   # deep slate
        angle: 135deg
        usage: "Logo wordmark, hero CTAs, AI Tutor card, brand avatars"
      brand-soft:
        from: "200 98% 39% / 0.10"
        to:   "215 24% 26% / 0.10"
        angle: 135deg
        usage: "Onboarding hero backdrops, empty states"
    chart:
      - "198 93% 59%"
      - "213 93% 67%"
      - "215 20% 65%"
      - "215 16% 46%"
      - "215 19% 34%"

  typography:
    families:
      sans:
        stack: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        usage: "All UI: body, buttons, labels, navigation, captions"
      serif:
        stack: "Lora, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
        usage: "Personal greeting headlines (e.g. 'Hello, Learner') for warmth"
      mono:
        stack: "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        usage: "Code snippets and any tabular/technical text"
    weights: [400, 500, 600, 700]
    scale:
      display:  { size: 30px, line: 36px, weight: 700, tracking: -0.01em }
      h1:       { size: 24px, line: 32px, weight: 600, tracking: -0.01em }
      h2:       { size: 18px, line: 28px, weight: 600 }
      h3:       { size: 16px, line: 24px, weight: 600 }
      body:     { size: 14px, line: 20px, weight: 400 }
      body-lg:  { size: 16px, line: 24px, weight: 400 }
      label:    { size: 14px, line: 20px, weight: 500 }
      caption:  { size: 12px, line: 16px, weight: 500 }
    paragraph:
      max-measure: 65ch

  spacing:
    base-unit: 4px
    scale:
      0: 0
      1: 4px
      2: 8px
      3: 12px
      4: 16px
      5: 20px
      6: 24px
      8: 32px
      10: 40px
      12: 48px
      16: 64px
    container:
      max-width: 1400px
      gutter: 16px       # mobile
      gutter-lg: 32px    # desktop

  radii:
    none: 0
    sm:   4px    # inputs, small chips
    md:   6px    # default buttons, dropdown items
    lg:   8px    # cards, popovers (base --radius)
    xl:   16px   # featured cards
    "2xl": 20px  # quick-action tiles, group rows
    "3xl": 24px  # hero AI Tutor card
    full: 9999px # avatars, icon buttons, pills

  elevation:
    # Soft, low-contrast shadows; brand shadows tint with primary blue.
    none:    "none"
    xs:      "0 1px 3px 0 hsl(0 0% 0% / 0.05)"
    sm:      "0 1px 3px 0 hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)"
    md:      "0 1px 3px 0 hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10)"
    lg:      "0 1px 3px 0 hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10)"
    xl:      "0 1px 3px 0 hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10)"
    card:    "0 4px 24px -4px hsl(220 20% 10% / 0.12)"
    brand:   "0 10px 40px -10px hsl(200 98% 39% / 0.30)"
    brand-lg:"0 20px 60px -15px hsl(200 98% 39% / 0.35)"

  effects:
    glass:
      backdrop-filter: "blur(16px)"
      background: "hsl(var(--background) / 0.80)"
      usage: "Sticky top headers and floating bars"
    focus-ring:
      width: 2px
      offset: 2px
      color: "ring"

  motion:
    durations:
      instant: 100ms
      fast:    150ms
      base:    200ms
      slow:    300ms
      page:    400ms
    easings:
      standard: "cubic-bezier(0.4, 0, 0.2, 1)"
      emphasized: "cubic-bezier(0.2, 0, 0, 1)"
      linear: "linear"
    presets:
      fade-up:
        from: { opacity: 0, y: 20px }
        to:   { opacity: 1, y: 0 }
        duration: base
      slide-in-x:
        from: { opacity: 0, x: 60px }
        to:   { opacity: 1, x: 0 }
        duration: slow
      tap:
        scale: 0.95
        duration: fast
      hover-lift:
        scale: 1.05
        duration: fast
      spinner:
        rotate: 360deg
        duration: 1000ms
        easing: linear
        loop: infinite
    library: "framer-motion (entry animations, page transitions, micro-interactions)"

  iconography:
    library: "lucide-react"
    stroke-width: 2
    sizes: { xs: 16px, sm: 20px, md: 24px, lg: 32px }
    style: "Outlined, rounded joins; never filled silhouettes"

  components:
    button:
      heights: { sm: 36px, md: 40px, lg: 44px, icon: 40px }
      padding-x: { sm: 12px, md: 16px, lg: 32px }
      radius: md
      variants:
        - default       # solid primary
        - secondary     # solid slate
        - outline       # 1px border, transparent fill
        - ghost         # no border, hover wash
        - destructive
        - link
        - brand-gradient # uses gradient.brand + shadow.brand
    input:
      height: 40px
      radius: md
      border: "1px solid hsl(var(--input))"
      focus: "ring 2px primary, offset 2px"
    card:
      radius: lg
      border: "1px solid hsl(var(--border) / 0.5)"
      shadow: card
      padding: 24px
    quick-action-tile:
      size: 64px
      icon-tile: 44px
      radius: "2xl"
      shadow: card
    avatar:
      sizes: { sm: 32px, md: 40px, lg: 56px }
      radius: full
      fallback: "gradient.brand background, white initial"
    badge:
      radius: full
      padding: "2px 8px"
      size: 12px

  layout:
    breakpoints:
      sm: 640px
      md: 768px
      lg: 1024px
      xl: 1280px
      "2xl": 1400px
    grid:
      quick-actions: "4 columns, 12px gap on mobile"
      content: "single column, generous vertical rhythm (24-32px between sections)"

  accessibility:
    contrast:
      body-text: "AA on background"
      primary-on-primary-foreground: "AA"
    focus: "Always-visible 2px ring with 2px offset"
    motion: "Respect prefers-reduced-motion; disable transforms, keep opacity"
    tap-target: "Minimum 40x40px"
---

# LoopiFy — Design Language

## 1. Personality

LoopiFy feels like a **calm, modern study desk**: clean white surfaces, a
single confident blue accent, and just enough warmth (a serif greeting,
soft shadows, gentle motion) to feel personal rather than corporate.
It is **mobile-first**, optimistic, and academic without being stuffy.

Three adjectives drive every decision:

- **Friendly** — soft radii, generous spacing, warm serif headings.
- **Focused** — near-white canvas, one dominant accent color, no visual noise.
- **Alive** — subtle framer-motion entrances, hover lifts, and a brand
  gradient reserved for the moments that matter most.

## 2. Color story

The palette is built on a **cool off-white canvas** (`209 40% 96%`) with
**near-black ink**. Color is used sparingly and with intent:

- **Primary blue** (`200 98% 39%`) is the single brand accent. It appears
  on primary buttons, focus rings, the logo sparkle, the unread-dot, and
  active-state indicators. Used at small surface area but high frequency.
- **Brand gradient** (blue → deep slate at 135°) is reserved for *hero
  moments*: the wordmark, the AI Tutor card, the avatar fallback, and
  primary-CTA halos. Never use it for body backgrounds or chrome.
- **Deep slate secondary** (`215 24% 26%`) anchors utility surfaces — the
  Video quick-action tile is intentionally near-black to differentiate
  "real-time / serious" actions from chat-style ones.
- **Soft pastel washes** (`from-blue-50`, `from-violet-50`, `from-emerald-50`,
  `from-orange-50`) are used **only** behind onboarding illustrations to
  give each feature a distinct mood without breaking the white aesthetic.
- **Destructive red** is loud and saturated — it should startle, because it
  only appears for irreversible actions (delete account, sign out from
  settings).

In **dark mode** the canvas inverts to a deep navy (`222 47% 11%`) and the
primary lifts to a brighter cyan-blue (`198 93% 59%`) so it still pops
against the darker surfaces. Cards float on `217 32% 17%` rather than pure
black, preserving the layered, soft feel.

## 3. Typography

Three families, each with a clear job:

- **Inter** carries 95% of the interface — buttons, labels, body, nav.
  Weights 400/500/600/700, slight negative tracking on headings.
- **Lora** (serif) is used **only for personal greetings** — e.g. the
  "Hello, [Name]" line on the home screen. This single typographic move
  is the brand's signature warmth; it makes the app feel hand-written
  to the user without dressing up the rest of the UI.
- **Space Mono** is reserved for code, IDs, and any tabular/technical text
  inside the AI tutor or resources views.

Heading hierarchy is restrained: most screens use a 24px semibold H1, an
18px section title, and 14px body. Long-form content caps at ~65ch.

## 4. Shape & space

- **Radii are generous and stepped**: 6px on inputs, 8px on cards, 16–20px
  on featured tiles, 24px on the hero AI Tutor card, full-round on
  avatars and icon buttons. The compounding curvature is what makes the
  app feel friendly.
- **Spacing follows a 4px base unit**, with 16/24/32px doing most of the
  vertical-rhythm work between sections. Sections breathe; nothing is
  cramped.
- **Containers max out at 1400px** but the design is tuned for a single
  mobile column — desktop simply centers that column with extra air.

## 5. Elevation & glass

Shadows are intentionally **soft and short**, never harsh:

- Cards use a low, slightly cool drop shadow (`0 4px 24px -4px`) to look
  like they're resting *on* the canvas, not floating above it.
- Two **brand-tinted shadows** exist (`brand`, `brand-lg`) using the
  primary blue at 30–35% opacity. These are reserved for the hero AI
  Tutor card and primary CTAs to add a subtle blue "glow" that ties them
  back to the logo.
- The **sticky top header** uses a `glass-effect` (16px backdrop blur over
  80% background) so content scrolls beneath it with a frosted feel.

## 6. Motion

Motion is **purposeful, never decorative**. Every screen entrance follows
the same vocabulary so the app feels coherent:

- **Header / hero**: slide down 20px + fade.
- **Sections**: fade up 20px, staggered 100ms behind one another.
- **List items / quick actions**: scale-from-0.8 with 100ms cascade.
- **Hover**: 1.05 scale on tappable tiles; 4px x-shift on list rows.
- **Tap**: 0.95 scale.
- **Page-to-page** (e.g. onboarding slides): 60px x-axis slide with fade,
  direction-aware.
- **Loading**: a single 12px primary-blue ring spinning at 1s linear,
  used everywhere so loading feels consistent.

All motion respects `prefers-reduced-motion` — transforms drop, opacity
remains.

## 7. Iconography & imagery

- **Lucide** outlined icons at 2px stroke, sized 16/20/24/32. Never mix
  with filled icon sets.
- A small set of recurring icons forms a visual taxonomy:
  `Sparkles` = brand/AI, `Users` = groups, `BookOpen` = resources,
  `Bot` = AI tutor, `Video` = live sessions, `Bell` = notifications.
- Photography is **not** used in the core app. Identity is carried by
  type, color, and gradient instead.

## 8. Component patterns

- **Quick-action tile**: 64px square card, 44px gradient/solid icon
  badge inside, 12px label below. Always presented in a 4-column grid.
- **Group row**: rounded-2xl card, 48px gradient avatar with `BookOpen`
  icon, two lines of text, chevron-right affordance, 4px x-shift on hover.
- **Hero AI card**: full-width, 24px radius, brand gradient background,
  white type, brand-lg shadow, secondary white-on-glass button inside.
- **Profile row**: same shape as group row but with a circular gradient
  avatar that shows the user's initial in white.
- **Empty state**: muted/50 fill, centered icon at muted color, single
  short prompt, single primary CTA (gradient).

## 9. Voice in the visuals

The app uses **first-name, present-tense, encouraging language**
("Ready to learn something new today?", "Start Conversation", "Explore
Groups"). Visually this is mirrored by:

- Lowercase chips and short labels ("Groups", "Video", "AI Tutor").
- Friendly serif greeting at the top of every authenticated session.
- Soft, never-shouting color contrast except on destructive actions.

## 10. Do / Don't

**Do**

- Lead with white space; let the canvas breathe.
- Use the brand gradient for *one* hero element per screen, max.
- Pair every primary action with a brand-tinted shadow.
- Animate entrances with the standard fade-up cascade.

**Don't**

- Don't introduce new accent hues — extend with tints/shades of the
  existing blue and slate instead.
- Don't use the brand gradient on body text, chrome, or large background
  fills.
- Don't use hard black (`#000`) shadows or borders — always the cool
  near-black ink at low opacity.
- Don't mix icon styles or swap Inter for another sans-serif.
