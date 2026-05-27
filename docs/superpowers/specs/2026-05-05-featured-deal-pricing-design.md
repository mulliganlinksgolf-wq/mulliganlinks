# Featured Deal Pricing

**Date:** 2026-05-05  
**Status:** Approved

## Overview

Courses can mark individual tee times with a special override price and an optional custom label (e.g. "Twilight Rate", "Early Bird"). Featured tee times surface at the top of the member booking grid with a strikethrough original price and savings callout.

## Data Model

Two new nullable columns on `tee_times`:

| Column | Type | Notes |
|---|---|---|
| `special_price` | `numeric(10,2)` | Freeform override price; any value (not restricted to discounts). `NULL` = no deal active. |
| `special_label` | `text` | Optional course-defined label shown on the member card. `NULL` = no label shown. |

A tee time is considered **featured** when `special_price IS NOT NULL`.

One migration adds both columns with `DEFAULT NULL`.

## Course-Side UX (TeeSheetGrid)

- The expanded tee time row gains a **"Set deal"** button alongside existing actions (Book walk-in, Close slot).
- Clicking "Set deal" reveals an inline form **within the row**:
  - `Special price` text input (numeric)
  - `Label` text input with "(optional)" hint
  - **Save** and **Remove** buttons
- When a deal is active, the price column in the collapsed row shows a small amber **DEAL** pill next to the base price so it's visible without expanding.
- **Remove** clears both `special_price` and `special_label`, restoring the tee time to normal.

## Member-Side UX (PublicTeeTimeGrid)

- Featured tee times sort to the **top** of their morning or afternoon section, ahead of chronological slots.
- Featured card shows:
  - If `special_label` is set: small label tag at the top of the card (e.g. "Twilight Rate")
  - Base price in gray with strikethrough
  - Special price in red, bold
  - "Save $X" in small red text below the price
- Non-featured cards are visually unchanged.

## Server Action

One new action: `setTeeTimeDeal(teeTimeId: string, specialPrice: number | null, specialLabel: string | null)`

- Validates the course owns the tee time.
- Sets or clears both fields atomically.
- Revalidates the tee sheet path on success.

## Out of Scope

- Expiry dates or time windows for deals (can add later)
- Member-only vs. public-only deal visibility
- Analytics or reporting on deal performance
