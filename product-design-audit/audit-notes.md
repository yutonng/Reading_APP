# Product Design Audit

Date: 2026-06-25
Scope: local web app at `http://127.0.0.1:8787/`

## Evidence

- `01-home-library.png`: mobile library
- `02-reader.png`: mobile reader
- `03-privacy.png`: privacy page
- `04-admin-login.png`: admin login
- `05-home-desktop.png`: desktop library
- `06-admin-dashboard.png`: admin dashboard

## Overall Health

The current layout is structurally sound and readable. The main issue is visual maturity: the UI still reads like a default web form/list because color, card treatment, typography hierarchy, and surfaces are not unified around a reading-product identity.

## Findings

1. Library cards have good information density, but the white cards on blue-gray page background feel generic. Keep the layout, but move to a warmer paper surface, deeper ink text, softer borders, and a subtle bottom progress line.
2. The reader page is functionally clear, but its huge empty center makes the page feel less intentional. A warmer paper background, softer top bar, and slightly quieter progress label preserve the reading focus without layout changes.
3. The admin pages are usable but overly default. They need the same paper/ink color system so admin and reader feel like one product.
4. Desktop home constrains content well, but the top title "首页" undersells the product context. "书库" is clearer and more consistent with the mobile app.
5. The page emits a favicon 500. It is minor visually, but it pollutes verification and should be fixed.

## Recommended Direction

Use a restrained editorial reading style:

- Background: warm paper, not cold gray.
- Text: dark green-black ink.
- Accent: muted sage for progress and focus states.
- Cards: 8px radius, thin warm borders, very light shadow only where useful.
- Progress: bottom-edge hairline on each book card, no extra metadata line.

## Implementation Boundary

Do not change layout structure in this pass. Limit changes to visual tokens, copy labels, card treatment, progress line styling, and the favicon response.

## Applied Changes

- Unified the web UI around a restrained paper-and-sage palette.
- Kept the existing layout and card structure.
- Preserved the bottom-edge progress line on book cards.
- Renamed the web home header from "首页" to "书库".
- Fixed `/favicon.ico` so local verification no longer reports a 500 error.

## After Screenshots

- `07-after-home-library.png`: first pass after styling
- `08-after-reader.png`: reader after styling
- `09-after-admin.png`: admin after styling
- `10-after-home-final.png`: final mobile library after palette adjustment
- `11-ui-ux-pro-max-home.png`: first UI/UX Pro Max pass
- `12-ui-ux-pro-max-home-final.png`: final UI/UX Pro Max library pass with SVG icons
- `13-ui-ux-pro-max-reader.png`: final UI/UX Pro Max reader pass
- `14-ui-ux-pro-max-admin.png`: final UI/UX Pro Max admin login pass

## UI/UX Pro Max Direction

The first generated system skewed toward an App Store landing page and cyan accents, which did not match the in-app reading surface. A second query for "book reading mobile app editorial quiet premium content-first minimal" returned a better fit:

- Pattern: Newsletter / Content First
- Style: Swiss Modernism 2.0
- Color candidate: Premium black + gold accent
- Typography candidate: editorial Chinese serif headings with clean system sans body fallback

Applied interpretation:

- Neutral near-white background instead of gray-green or heavy beige.
- White cards with restrained borders and soft elevation.
- Deep ink text for contrast and perceived quality.
- Amber progress line for reading progress and focused accents.
- SVG icons for structural controls instead of text symbols.
