# Public site production review — September 16, 2026

Reviewed the restored redesign at https://www.teeahead.com, based on main commit 381efa6.

## Coverage

- 22 public marketing routes plus all 17 blog articles, each rendered at 1440px desktop and 390px mobile (78 checks).
- All returned HTTP 200, included the shared audience navigation, had no broken loaded images and no horizontal page overflow. Full-page screenshots were captured and reviewed for theme consistency.
- Internal destination coverage includes every public page linked by the header, footer, page calls to action and articles. On-page anchors resolve.
- Exercised mobile menu open/close/navigation, homepage and pricing FAQs, blog filters, golfer membership selection, four tier query links, empty-form validation, calculator sliders/presets/vendor choices and clipboard sharing.
- Reviewed report modal opening, validation, failure, retry, success and dismissal. Failure/success API responses were simulated locally; no customer messages or production leads were sent.

## Issues fixed

- Blog featured and standard cards now format calendar dates in UTC, avoiding server/client text differences and React hydration errors for visitors in other timezones. Verified in an America/Los_Angeles browser context.
- Calculator copy/share buttons use the current page URL; the Damage calculator previously shared the Software Cost page.
- Both calculator request handlers reject unsuccessful HTTP responses. The shared report form displays a retryable error, retains entered fields and shows success only after its callback succeeds.
- Clipboard failures show an explanatory message instead of claiming the link was copied.

## Limits

This covers the public marketing website, not authenticated golfer, course staff or admin applications. Email, phone and SMS links were inspected but not used to contact anyone. Social sharing launch URLs were checked without posting. Live email delivery and database persistence were not retested in this review.

Browser evidence: /tmp/teeahead-live-audit (screenshots and JSON results). Local report failure/retry verification: /tmp/teeahead-fix-check.log. Release checks: /tmp/teeahead-sept16-verify.log.
