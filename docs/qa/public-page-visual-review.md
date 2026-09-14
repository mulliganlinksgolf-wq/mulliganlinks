# Public website visual review

Local preview: http://localhost:3003
Branch: codex/golfer-homepage-rebuild

## Coverage

Reviewed the 22 public marketing routes below in Chrome on desktop and at 390px mobile width. Checked all 22 at 320px for text and page overflow. Also checked Features, Pricing and the software comparison template at 768px. Reviewed all 17 blog articles with full-page mobile screenshots, desktop heading/sidebar screenshots, and DOM overflow checks.

Routes: /, /features, /pricing, /about, /contact, /contact/thanks, /waitlist/golfer, /waitlist/course, /waitlist/golfer/confirmed, /waitlist/course/confirmed, /privacy, /terms, /blog, /case-studies/windsor-parke, /barter, /damage, /software-cost, /tee-time-software, /best-tee-sheet-software, /golfnow-alternative, /golf-course-booking-software, /for-courses.

## Corrections

- Rebuilt both Features phone previews as crisp HTML/CSS. Greeting, balance, bookings and navigation have separate rows. Verified both frames contain all their content without clipping.
- Made Pricing's large comparison values size to their actual columns, with stacked layout on narrow screens.
- Made calculator headline numbers respond to their container width. Checked the Damage calculator at its maximum $4,380,000 value on a 320px viewport; enlarged the quantity column to fit 1,251×.
- Added space between comparison columns and reduced narrow-phone header tracking/type size to prevent labels colliding.
- Added horizontal padding to calculator calls to action.
- Fixed selected Contact audience text contrast and gold initials on forest backgrounds.
- Kept public page sections visible immediately instead of hiding them behind scroll animations.
- Reduced article headline size to suit the narrower article column.
- Converted raw Markdown tables in the platform-comparison and software-cost articles into the existing semantic table component. Wide tables scroll within the article, support keyboard focus, and use readable header contrast.
- Kept the homepage's final course-link arrow alongside its text.
- Verified the homepage dashboard image loads when scrolled into view.

## Verification and limits

TypeScript passed. The full unit run returned 600 passing tests and two failures caused by source-code line wrapping; normalizing whitespace in the existing disclaimer assertion resolved these, and all 17 tests in that affected suite then passed. Other changed components passed scoped ESLint. DamagePage retains two pre-existing react-hooks/set-state-in-effect lint errors in its number-animation effects; this visual work does not change those effects.

No live forms were submitted. The production reCAPTCHA key rejects localhost, so a fresh end-to-end signup still requires a deployment on an allowed domain. Confirmation page appearance was checked directly. Signed-in golfer/course/admin application routes were outside this marketing-site review. Competitor claims and article facts were not audited or rewritten.

These changes are local preview changes; they have not been deployed to production.
