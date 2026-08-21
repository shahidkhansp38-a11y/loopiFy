# LoopiFy UI Colour Options

Goal: present curated colour palette directions for the LoopiFy edtech app and pick a default to apply.

## Recommended default: Indigo Aurora

This keeps the existing premium Gen-Z direction (deep indigo/violet with cyan glow) while tightening the token set.

```yaml
colors:
  brand:
    50:  239 246 255   # #eff6ff
    100: 219 234 254   # #dbeafe
    200: 191 219 254   # #bfdbfe
    300: 147 197 253   # #93c5fd
    400:  96 165 250   # #60a5fa
    500:  59 130 246   # #3b82f6  (primary actions)
    600:  37  99 235   # #2563eb
    700:  29  78 216   # #1d4ed8
    800:  30  64 175   # #1e40af
    900:  30  58 138   # #1e3a8a
  accent:
    violet: 139 92 246   # #8b5cf6
    cyan:    6 182 212   # #06b6d4
    fuchsia:217 70 239  # #d946ef
  surfaces:
    background:   250 250 252   # #fafafc
    foreground:   15  23  42   # #0f172a
    card:         255 255 255   # #ffffff
    muted:        241 245 249   # #f1f5f9
    border:       226 232 240   # #e2e8f0
  dark:
    background:  10  10  30   # #0a0a1e
    foreground: 248 250 252   # #f8fafc
    card:        15  15  35   # #0f0f23
    muted:       30  30  55   # #1e1e37
    border:      51  51  80   # #333350
  gradients:
    hero: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)"
    card: "linear-gradient(145deg, rgba(79,70,229,0.15) 0%, rgba(6,182,212,0.08) 100%)"
    glow: "radial-gradient(circle at 50% 0%, rgba(79,70,229,0.35), transparent 60%)"
```

## Alternative palettes

### Midnight Indigo — calm, trustworthy, enterprise-ready
Best if you want LoopiFy to feel more "academic" and less "neon".

```yaml
colors:
  brand:
    500:  79 70 229   # #4f46e5
    600:  67 56 202   # #4338ca
  accent:
    cyan:   6 182 212  # #06b6d4
    amber:245 158 11  # #f59e0b
  surfaces:
    background: 248 250 252
    foreground:  15  23  42
  dark:
    background:   2   6  23   # #020617
    card:        15  23  42   # #0f172a
```

### Neon Mint — fresh, high-energy, startup
Best if you want a brighter, more "TikTok/Gen Z" energy.

```yaml
colors:
  brand:
    500:  45 212 191   # #2dd4bf
    600:  13 148 136   # #0d9488
  accent:
    lime: 163 230 53   # #a3e635
    teal:  20 184 166   # #14b8a6
  surfaces:
    background: 250 252 251
    foreground:   2  32  32   # #022020
  dark:
    background:   2  26  22   # #021a16
    card:         4  47  39   # #042f27
```

### Electric Coral — bold, attention-grabbing, creative
Best if you want maximum visual punch and a non-blue identity.

```yaml
colors:
  brand:
    500: 249 115  22   # #f97316
    600: 234  88  12   # #ea580c
  accent:
    coral: 255 107 107  # #ff6b6b
    pink:  236  72 153  # #ec4899
    purple:124  58 237  # #7c3aed
  surfaces:
    background: 255 250 250
    foreground:  64  21  21   # #401515
  dark:
    background:  30  10  10   # #1e0a0a
    card:        55  18  18   # #371212
```

## Proposed next step

Apply the **Indigo Aurora** token set to `src/index.css`, update the Tailwind config if needed, and verify the home dashboard renders with the new tokens in both light and dark mode.
