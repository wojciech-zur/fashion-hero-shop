# New Seller Boost

## Executive Summary

New Seller Boost is a paid visibility package for newly joined marketplace sellers on FashionHero.

For a one-time fee of **49 zl**, a seller can activate a **7-day promotion window** and select up to **10 offers** to be highlighted in a dedicated top carousel on category pages.

The objective is to accelerate first sales for new sellers while giving FashionHero a measurable growth lever for supply-side activation.

## Business Goals

- Improve discovery for new sellers in the first stage of onboarding.
- Increase sell-through of new-seller inventory.
- Generate data-driven insight on visibility-to-conversion impact.
- Validate willingness to pay for visibility placement.

## Commercial Rules

- Package name: **New Seller Boost**.
- Price: **49 zl**.
- Billing note shown in UX: **"49 zl will be added to your FashionHero invoice."**
- Activation length: **7 days** from activation timestamp.
- Usage policy: **one-time only per seller**.
- Inventory cap: seller can promote up to **10 offers** at a time.

## Eligibility

- Feature is intended for newer/smaller sellers.
- Eligibility is evaluated server-side based on seller offer count at activation time.
- Seller is eligible when account has **up to 20 offers**.
- Seller can access dashboard inventory before activation, but promotion controls become available only in active boost window.

## Seller Experience

### 1. Login and Seller Context

- User signs in through the standard account login.
- From `/account`, user can open **Go to seller dashboard** (debug entrypoint).
- Debug picker (`/account/seller/debug`) lets the tester choose one existing seller profile.
- Session stores selected `sellerId` for dashboard and boost operations.

### 2. Seller Dashboard (`/account/seller`)

Before activation:
- Seller sees their own catalog items.
- Seller sees package terms (49 zl, 7 days, max 10 offers, invoice billing).
- Seller can activate package if eligible and not previously used.

After activation:
- Seller can turn promotion on/off per item.
- Seller sees selected-offer counter (`0-10`) and pending state.
- Seller confirms with **Apply changes** (server-side save).
- Seller sees KPI summary: `promo views`, `promo clicks`, `promo sold`.
- Seller also gets debug controls for QA (`DEBUG: expire`, `DEBUG: deactivate`).

After expiration:
- Boost auto-deactivates.
- Item-level toggle controls are hidden.
- KPI section is hidden.
- Package cannot be reactivated (one-time rule).

### 3. Debug Utilities

- Seller selector flow is intentionally exposed through `/account/seller/debug` for QA.
- While boost is active:
  - **DEBUG: expire** forces boost into expired state.
  - **DEBUG: deactivate** clears active state for test reset.
- When boost is expired/inactive after use:
  - **DEBUG: restore** appears and restores testability.
- Intended for prototype testing only.

## Buyer Experience

- Category pages include a top carousel:
  - heading: **"Just dropped: standout picks from new sellers"**
  - only items promoted by active boosts
  - only items belonging to current category context
  - randomized order
  - manual left/right arrows for scroll

## Data Model and Persistence

- Server persists feature state in JSON storage.
- Core state per seller includes:
  - `usedOnce`
  - `activatedAt`
  - `expiresAt`
  - `boostedProductIds[]`

## Expiration and Safety Logic

Auto-expiration is executed in two key read paths:

1. During category carousel data fetch:
   - expired boosts are deactivated before promoted items are returned.
2. During seller dashboard load/login path:
   - expired boosts are deactivated before rendering controls.

This ensures stale promotions are removed even without background jobs.

## Tracking and Measurement (PostHog)

### Core Events

- `boost_banner_view` (only when boost is not active yet and still eligible)
- `boost_activate`
- `boost_apply_changes`
- `promo_carousel_view`
- `promo_carousel_click`
- `promo_add_to_cart`
- `promo_place_order`

### Required Properties

- `sellerId`
- `productId`
- `collectionSlug` (when applicable)
- `isPromoted`
- `quantity` (for order events)

### KPI Definitions

- **promo views**: count of `promo_carousel_view` for seller's promoted items.
- **promo clicks**: count of `promo_carousel_click` for seller's promoted items.
- **promo sold**: sum of quantities from `promo_place_order` on promoted items (item-level quantity metric).

### PostHog Actions (recommended setup)

To make reporting cleaner than raw `$autocapture`, define named Actions in PostHog Toolbar:

1. **Action name:** `NSB - Activate clicked`
   - Target element: **Activate New Seller Boost for 49 zl** button
   - Why: key intent signal for package uptake
2. **Action name:** `NSB - Apply changes clicked`
   - Target element: **Apply changes** button
   - Why: confirms seller committed selected listings
3. **Action name:** `NSB - Banner viewed (eligible)`
   - Target event: `boost_banner_view`
   - Why: top-of-funnel denominator for activation rate
4. **Action name:** `NSB - Apply changes (has selection)`
   - Target event: `boost_apply_changes` with `selectedOffers > 0`
   - Why: confirms seller completed meaningful package setup

Use these Actions in Trends/Funnels for business-level visibility, while custom events provide deeper diagnostics.

### Recommended Management Metrics (NSB-specific)

- **Activation rate** = `NSB - Activate clicked` / `NSB - Banner viewed (eligible)`
- **Configuration completion rate** = `NSB - Apply changes (has selection)` / `NSB - Activate clicked`
- **Average selected offers per activated seller** = average `selectedOffers` on `boost_apply_changes`
- **Clicks per view (CTR) for boosted inventory** = `promo clicks` / `promo views`
- **Units sold per activated seller** = `promo sold` grouped by `sellerId`

## Success Criteria

- Sellers can activate and configure package without support intervention.
- Promoted items appear correctly in category carousel within active window.
- Promotion automatically deactivates after 7 days.
- KPI panel reflects tracked interaction and order data.
- Product and growth teams can analyze conversion funnel in PostHog Insights.
