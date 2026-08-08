# Premium Bottom Navigation Animation

## What's wrong today

The current bar renders the active indicator as a `motion.span` mounted *inside the active tab button* with `layoutId="nav-indicator"`. Because the element is conditionally rendered (`{active && ...}`), it unmounts on the old tab and remounts on the new one, so it pops instead of sliding. It also sits at the very top edge of the bar, which is why in the screenshot the purple line looks like it is floating above the nav rather than belonging to it. Icons and labels currently have no motion at all, only a colour swap.

## What will change

Only the visual/animation layer of the existing bar. Tabs, labels, icons, routes, order, haptics and hidden-route logic stay exactly as they are.

### Active indicator
- One single indicator element, always mounted, positioned absolutely over the tab row and moved with a transform to the active tab's slot (index / 5 of the row width).
- Spring transition (~270ms feel, stiffness ≈ 420, damping ≈ 34) so it slides smoothly from the previous tab to the new one; rapid switching just retargets the same element.
- Small rounded pill sitting just inside the top border of the bar, using the existing brand gradient accent.

### Active tab
- Icon scales to 1.08x with a soft radial glow behind it (opacity-animated, no layout impact).
- Label fades in and lifts 4px, keeping the existing primary accent colour.
- Inactive icons/labels stay muted grey with no animation.

### Stability
- Bar height stays fixed at the existing 64px; labels are always rendered (only opacity/translate change), so nothing reflows.
- All motion is `transform` + `opacity` only (GPU friendly), and the existing safe-area padding is kept.

### Page transition
- Wrap the routed content in a keyed fade + 8px lift transition on route change, fast (~180ms ease-out), inside the existing layout wrapper so nav position is unaffected.

## Technical notes

- `src/components/BottomNav.tsx`: refactor to a single persistent indicator driven by the active tab index; per-tab `motion.div` for icon scale/glow and label lift; memoized tab list to avoid re-render churn.
- `src/components/AppLayout.tsx`: add an `AnimatePresence`/keyed motion wrapper around `children` keyed on `pathname` for the page transition.
- No changes to `App.tsx` routes, `src/index.css` tokens (reuse `--bottom-nav-height`, `--bottom-nav-safe`, `.grad-brand`), or any hook.

## Verification

Drive the preview with Playwright at mobile width and step through Home → Study Hub → Learn → Loopi AI → Profile → Home, capturing the nav after each switch to confirm the indicator lands aligned under each tab, height never changes, and no console errors appear.
