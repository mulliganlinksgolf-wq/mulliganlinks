-- Migration 062: Populate knowledge base with accurate course staff articles
-- Covers all 4 categories: Getting Started, Managing Your Tee Sheet, Members & Bookings, Payments & Billing

-- ─── Category ID aliases ────────────────────────────────────────────────────
DO $$
DECLARE
  cat_gs   uuid;
  cat_ts   uuid;
  cat_mb   uuid;
  cat_pb   uuid;
BEGIN
  SELECT id INTO cat_gs FROM kb_categories WHERE slug = 'getting-started';
  SELECT id INTO cat_ts FROM kb_categories WHERE slug = 'tee-sheet';
  SELECT id INTO cat_mb FROM kb_categories WHERE slug = 'members-bookings';
  SELECT id INTO cat_pb FROM kb_categories WHERE slug = 'payments-billing';

  -- ─── Fix existing seed article: Creating and Publishing Tee Times ──────────
  -- The original article incorrectly described a "single tee time" flow.
  -- In reality the only create UI is the bulk range form at /tee-times/create.
  UPDATE kb_articles SET
    content = E'## How Tee Times Work\n\nTeeAhead members can only book tee times you explicitly publish. '
           || E'Each published slot specifies a scheduled date and time, the number of available spots (1–4), and a base price.\n\n'
           || E'## Creating Tee Times\n\n'
           || E'From the Tee Sheet tab, click **Create Tee Times**. The form lets you generate a full block of slots at once:\n\n'
           || E'- **Start date / End date** — the date range to populate (e.g. today through two weeks from now).\n'
           || E'- **First tee time / Last tee time** — the window for each day (e.g. 7:00 AM – 5:00 PM).\n'
           || E'- **Interval** — minutes between slots. 8 or 10 minutes is standard; 5 is the minimum.\n'
           || E'- **Base price** — the dollar amount charged to members for this block.\n'
           || E'- **Max players per slot** — 1 to 4.\n\n'
           || E'Click **Create Tee Times** and all slots are published immediately and visible to members.\n\n'
           || E'## Viewing the Tee Sheet\n\n'
           || E'The Tee Sheet tab defaults to today. Use the **← Prev**, **Today**, and **Next →** buttons to navigate dates. '
           || E'Each slot shows the time, max players, slots filled, price, and any existing bookings (member name, players, amount paid, payment status).\n\n'
           || E'## Editing or Canceling\n\n'
           || E'You can edit pricing or spot count on any open slot before a booking is confirmed. '
           || E'To cancel a slot that already has bookings, contact TeeAhead support — members are notified and receive a rain check credit.\n\n'
           || E'## Best Practices\n\n'
           || E'- Publish at least 14 days out so members can plan ahead.\n'
           || E'- Use a consistent interval throughout the day — gaps confuse members.\n'
           || E'- Keep max players at 4 unless your course genuinely restricts group size.'
  WHERE slug = 'creating-and-publishing-tee-times';

  -- ─── Fix "How to Check In Members" if it exists — clarify it''s post-round ─
  UPDATE kb_articles SET
    content = E'## What Check-In Does\n\n'
           || E'The **Check-in** tab is used after a member finishes their round to award them Fairway Points. '
           || E'Points are automatically awarded at booking confirmation for paid rounds, but the check-in tool lets you '
           || E'award points for walk-ins, comp rounds, or any situation where the standard booking flow wasn''t used.\n\n'
           || E'## How to Check In a Member\n\n'
           || E'1. Go to **Check-in** in the top navigation.\n'
           || E'2. Search by the member''s name or email address.\n'
           || E'3. Select the member from the results.\n'
           || E'4. Confirm the check-in — Fairway Points are awarded immediately.\n\n'
           || E'## Fairway Points\n\n'
           || E'Members earn **1 Fairway Point per $1** spent on green fees. Points accumulate across all TeeAhead partner courses '
           || E'and can be redeemed for comp rounds at any participating course, subject to each course''s redemption settings.\n\n'
           || E'## Who Can Check In Members\n\n'
           || E'All staff roles (staff, operator, manager, owner) can access the Check-in tab.'
  WHERE slug = 'how-to-check-in-members';

  -- ─── GETTING STARTED ──────────────────────────────────────────────────────

  -- Article: Understanding Your Dashboard
  INSERT INTO kb_articles (category_id, title, slug, content, excerpt, is_published, sort_order)
  VALUES (
    cat_gs,
    'Understanding Your Dashboard',
    'understanding-your-dashboard',
    E'## Overview\n\n'
 || E'The **Dashboard** tab (manager and owner only) gives you a real-time snapshot of your course''s performance. '
 || E'It loads automatically when you open the course portal.\n\n'
 || E'## KPI Cards\n\n'
 || E'Four cards appear at the top:\n\n'
 || E'- **Today''s Bookings** — number of confirmed rounds today and total revenue collected.\n'
 || E'- **This Week** — cumulative revenue for the current calendar week and booking count.\n'
 || E'- **30-Day Utilization** — the percentage of available tee time slots that were actually booked over the past 30 days '
 || E'(e.g. "42% — 84/200 slots"). A healthy rate for most courses is 30–60%.\n'
 || E'- **Active Members** — unique members who have booked at your course.\n\n'
 || E'## Referral Widget\n\n'
 || E'Your unique referral code is displayed on the dashboard. Share it with golfers — when a new member signs up using your link, '
 || E'your course earns 10% of their membership fee for 12 months. Click the code to copy it, or navigate to the full Referral page for detailed tracking.\n\n'
 || E'## Top Members\n\n'
 || E'A table shows your top 5 members ranked by total spend. Use this to recognize and reward your most loyal golfers.',
    'Real-time KPIs, 30-day utilization, referral code, and top members at a glance.',
    true,
    2
  );

  -- Article: Inviting and Managing Your Team
  INSERT INTO kb_articles (category_id, title, slug, content, excerpt, is_published, sort_order)
  VALUES (
    cat_gs,
    'Inviting and Managing Your Team',
    'inviting-and-managing-your-team',
    E'## Staff Roles\n\n'
 || E'TeeAhead has four staff roles with different levels of access:\n\n'
 || E'| Role | Tee Sheet / Check-in / Bookings / Members | Dashboard / Reports / Payments / Billing / Settings |\n'
 || E'|------|------------------------------------------|-----------------------------------------------------|\n'
 || E'| **Staff** | ✓ | — |\n'
 || E'| **Operator** | ✓ | ✓ |\n'
 || E'| **Manager** | ✓ | ✓ |\n'
 || E'| **Owner** | ✓ | ✓ (cannot be removed) |\n\n'
 || E'## Inviting a Team Member\n\n'
 || E'1. Go to **Settings → Team Members**.\n'
 || E'2. Click **Invite Staff**.\n'
 || E'3. Enter their email address and select a role.\n'
 || E'4. Click **Send Invite** — they receive an email with a link to create their account.\n\n'
 || E'Pending invites appear in the team list with a "Pending" badge. Click **Resend** if they haven''t received it.\n\n'
 || E'## Changing a Role\n\n'
 || E'Use the role dropdown next to any team member''s name to change their role. The change takes effect immediately. '
 || E'You cannot change your own role.\n\n'
 || E'## Removing a Team Member\n\n'
 || E'Click **Remove** next to any staff member (not yourself) to revoke their access. '
 || E'They will no longer be able to log in to the course portal.',
    'Add staff accounts, assign roles, resend invites, and remove access.',
    true,
    3
  );

  -- Article: Configuring Rewards and Redemption Settings
  INSERT INTO kb_articles (category_id, title, slug, content, excerpt, is_published, sort_order)
  VALUES (
    cat_gs,
    'Configuring Rewards and Redemption Settings',
    'configuring-rewards-and-redemption',
    E'## Where to Find These Settings\n\n'
 || E'Go to **Settings → Rewards & Redemption**. These settings control how and when members can redeem Fairway Points for comp rounds at your course.\n\n'
 || E'## Comp Round Limits\n\n'
 || E'You can cap the number of complimentary rounds each membership tier can redeem per period:\n\n'
 || E'- **Eagle members** — default: 1 comp round per year.\n'
 || E'- **Ace members** — default: 2 comp rounds per year.\n\n'
 || E'Once a member hits their limit, the redemption option is hidden for the rest of the period.\n\n'
 || E'## Minimum Days Before Tee Time\n\n'
 || E'Set the minimum number of days in advance a member must book to use a comp round redemption. '
 || E'For example, setting 3 days prevents last-minute redemptions from blocking prime slots.\n\n'
 || E'## Blackout Dates\n\n'
 || E'Add dates when redemptions are not accepted — member tournaments, holidays, or any day you need to protect. '
 || E'Members can still book on blackout dates, they just cannot use points to pay.\n\n'
 || E'## Points Multipliers\n\n'
 || E'You can award bonus points for specific tiers. Eagle members earn 1.5× and Ace members earn 2× Fairway Points per dollar by default, '
 || E'but your agreement with TeeAhead may specify different multipliers.',
    'Set comp round limits per tier, blackout dates, minimum advance booking, and point multipliers.',
    true,
    4
  );

  -- ─── MANAGING YOUR TEE SHEET ──────────────────────────────────────────────

  -- Article: Viewing and Filtering Bookings
  INSERT INTO kb_articles (category_id, title, slug, content, excerpt, is_published, sort_order)
  VALUES (
    cat_ts,
    'Viewing and Filtering Bookings',
    'viewing-and-filtering-bookings',
    E'## The Bookings Tab\n\n'
 || E'The **Bookings** tab shows all reservations at your course with filtering, search, and a revenue summary.\n\n'
 || E'## Status Filters\n\n'
 || E'Click a tab at the top to filter by booking status:\n\n'
 || E'- **All** — every booking regardless of status.\n'
 || E'- **Confirmed** — paid, upcoming rounds.\n'
 || E'- **Completed** — rounds that have passed.\n'
 || E'- **Canceled** — bookings the member or course canceled.\n'
 || E'- **No Show** — member did not arrive and the slot was marked as no-show.\n\n'
 || E'## Time Range Filters\n\n'
 || E'Use the time range buttons to narrow the view:\n\n'
 || E'- **Today** — today''s bookings only.\n'
 || E'- **Last 7 days** — rolling 7-day window.\n'
 || E'- **Last 30 days** — rolling 30-day window.\n'
 || E'- **All time** — entire booking history (up to 100 most recent records).\n\n'
 || E'## What Each Column Means\n\n'
 || E'| Column | Description |\n'
 || E'|--------|-------------|\n'
 || E'| **Golfer** | Member full name, or guest name with a "walk-in" label for non-members |\n'
 || E'| **Tee Time** | Scheduled date and time |\n'
 || E'| **Players** | Number of players in the group |\n'
 || E'| **Paid** | Total amount collected |\n'
 || E'| **Method** | Payment method used |\n'
 || E'| **Status** | Booking status (color-coded badge) |\n'
 || E'| **Booked** | Date the reservation was made |\n\n'
 || E'## Revenue Summary\n\n'
 || E'Above the table, a summary shows the **total number of bookings** and **total revenue** for the current filter combination. '
 || E'Canceled bookings are excluded from the revenue total.',
    'Filter by status and date range, understand every column, and read your revenue summary.',
    true,
    2
  );

  -- Article: Managing Tee Time Trading
  INSERT INTO kb_articles (category_id, title, slug, content, excerpt, is_published, sort_order)
  VALUES (
    cat_ts,
    'Managing Tee Time Trading',
    'managing-tee-time-trading',
    E'## What Is Tee Time Trading?\n\n'
 || E'Tee Time Trading lets members list bookings they can no longer use so other members can claim them. '
 || E'The original member receives a platform credit equal to what they paid; your course keeps 100% of the revenue with no refund issued.\n\n'
 || E'## Enabling Trading\n\n'
 || E'1. Go to the **Trading** tab (manager and owner only).\n'
 || E'2. Check **Enable member trading**.\n'
 || E'3. Set the **Minimum hours before tee time** — members can only list a booking if it''s at least this many hours away. '
 || E'Options: 2, 4, 8, or 24 hours. This prevents last-minute listings that are unlikely to be claimed.\n'
 || E'4. Click **Save Settings**.\n\n'
 || E'## How It Works for Members\n\n'
 || E'1. A member lists their booking in the member app. The listing automatically expires at the cutoff time.\n'
 || E'2. Another member claims the listing and pays with the credit.\n'
 || E'3. The original member''s booking is transferred; they receive a credit equal to what they originally paid.\n'
 || E'4. The claiming member now holds the tee time.\n\n'
 || E'## Monitoring Activity\n\n'
 || E'The Trading tab shows two tables:\n\n'
 || E'- **Active Listings** — bookings currently listed for trade (member, tee time, credit value, expiry).\n'
 || E'- **Recent Transfers** — completed exchanges (from member → to member, credit issued, date).\n\n'
 || E'These are view-only from the course portal — no action is required from course staff.',
    'Enable trading, set the minimum listing window, and monitor active listings and completed transfers.',
    true,
    3
  );

  -- ─── MEMBERS & BOOKINGS ───────────────────────────────────────────────────

  -- Article: Understanding Member Tiers
  INSERT INTO kb_articles (category_id, title, slug, content, excerpt, is_published, sort_order)
  VALUES (
    cat_mb,
    'Understanding Member Tiers',
    'understanding-member-tiers',
    E'## The Three Tiers\n\n'
 || E'TeeAhead members belong to one of three tiers. The tier appears as a color-coded badge in your Members tab and affects '
 || E'how many Fairway Points they earn and what credits they receive.\n\n'
 || E'| Tier | Monthly Fee | Points Multiplier | Monthly Credit | Comp Rounds / Year |\n'
 || E'|------|------------|-------------------|----------------|--------------------|\n'
 || E'| **Fairway** | Included | 1× | — | — |\n'
 || E'| **Eagle** | $89/mo | 1.5× | $10 | 1 |\n'
 || E'| **Ace** | $159/mo | 2× | $20 | 2 |\n\n'
 || E'## Fairway Points\n\n'
 || E'Every member earns Fairway Points when they book at a TeeAhead course — 1 point per $1 spent, multiplied by their tier rate. '
 || E'Points accumulate across all partner courses and can be redeemed for comp rounds, subject to each course''s redemption settings.\n\n'
 || E'## Monthly Credits\n\n'
 || E'Eagle and Ace members receive a monthly credit ($10 and $20 respectively) that can be applied toward green fees. '
 || E'Credits expire after 2 months if unused. These are separate from Fairway Points.\n\n'
 || E'## Comp Rounds\n\n'
 || E'Eagle members get 1 free round per year, Ace members get 2. Comp round eligibility is controlled by your '
 || E'**Settings → Rewards & Redemption** configuration, including blackout dates and minimum advance booking requirements.\n\n'
 || E'## Viewing Member Details\n\n'
 || E'The **Members** tab shows every unique member who has booked at your course, including their tier, round count, '
 || E'total spend, and contact info. Use **Export CSV** to download the full list.',
    'How Fairway, Eagle, and Ace tiers differ — points multipliers, monthly credits, and comp round limits.',
    true,
    1
  );

  -- Article: Using the Members Tab
  INSERT INTO kb_articles (category_id, title, slug, content, excerpt, is_published, sort_order)
  VALUES (
    cat_mb,
    'Using the Members Tab',
    'using-the-members-tab',
    E'## What the Members Tab Shows\n\n'
 || E'The **Members** tab lists every unique TeeAhead member who has made at least one confirmed booking at your course. '
 || E'It does not show members who have only browsed or visited your profile.\n\n'
 || E'## Table Columns\n\n'
 || E'| Column | Description |\n'
 || E'|--------|-------------|\n'
 || E'| **Name** | Member''s full name |\n'
 || E'| **Email** | Contact email |\n'
 || E'| **Tier** | Fairway, Eagle, or Ace (color-coded badge) |\n'
 || E'| **Rounds** | Total confirmed bookings at your course |\n'
 || E'| **Total Spent** | Sum of all amounts paid at your course |\n'
 || E'| **Phone** | Phone number on file |\n\n'
 || E'## Exporting Member Data\n\n'
 || E'Click **Export CSV** to download the full member list as a spreadsheet. '
 || E'The export includes name, email, phone, tier, rounds, and total spent — '
 || E'useful for marketing campaigns, loyalty outreach, or your own CRM.\n\n'
 || E'## Who Is Included\n\n'
 || E'Only members with at least one **confirmed** booking appear. Canceled bookings do not count toward the round total or spend total.',
    'What each column means, how to export member data, and who appears in the list.',
    true,
    2
  );

  -- Article: Running a Golf League
  INSERT INTO kb_articles (category_id, title, slug, content, excerpt, is_published, sort_order)
  VALUES (
    cat_mb,
    'Running a Golf League',
    'running-a-golf-league',
    E'## Overview\n\n'
 || E'The **Leagues** tab (manager and owner only) lets you create and manage seasonal member leagues with score tracking and standings. '
 || E'Leagues are separate from regular tee time bookings.\n\n'
 || E'## Creating a League\n\n'
 || E'1. Go to **Leagues** and click **+ New League**.\n'
 || E'2. Fill in the details:\n'
 || E'   - **League name** — displayed to members.\n'
 || E'   - **Format** — Stroke Play (lowest gross/net score wins) or Stableford (points per hole, higher is better).\n'
 || E'   - **Holes** — 9 or 18 holes per session.\n'
 || E'   - **Season start / end dates** — the league''s active window.\n'
 || E'   - **Max players** — capacity cap (2–200).\n'
 || E'   - **Notes** — optional details shown to staff.\n'
 || E'3. Click **Create League**. The league starts as **Draft** status.\n\n'
 || E'## Adding Members\n\n'
 || E'Open the league and go to the **Members** tab. You can add TeeAhead members or enter guest names with a handicap. '
 || E'Each member record tracks name, handicap, status, and join date.\n\n'
 || E'## Recording Scores\n\n'
 || E'Go to the **Sessions** tab to create a session for each round played. Open a session to enter scores for each participant.\n\n'
 || E'## Standings\n\n'
 || E'The **Standings** tab automatically calculates and ranks members based on:\n\n'
 || E'- Rounds played\n'
 || E'- Average net score\n'
 || E'- Best net score\n'
 || E'- Total gross score\n\n'
 || E'Standings update as you enter scores for each session.',
    'Create a league, choose Stroke Play or Stableford, add members, record scores, and view standings.',
    true,
    3
  );

  -- ─── PAYMENTS & BILLING ───────────────────────────────────────────────────

  -- Article: Setting Up Stripe Payouts
  INSERT INTO kb_articles (category_id, title, slug, content, excerpt, is_published, sort_order)
  VALUES (
    cat_pb,
    'Setting Up Stripe Payouts',
    'setting-up-stripe-payouts',
    E'## Why You Need to Connect Stripe\n\n'
 || E'TeeAhead processes all member payments through Stripe. To receive your green fee revenue, you need to connect a bank account '
 || E'through Stripe''s onboarding flow. Until this is done, payments are held and cannot be disbursed.\n\n'
 || E'## Connecting Your Bank Account\n\n'
 || E'1. Go to the **Payments** tab (manager and owner only).\n'
 || E'2. If your account isn''t connected, you''ll see a banner: **"Set up payouts to start receiving funds."**\n'
 || E'3. Click **Connect bank account** — you''ll be redirected to Stripe''s secure onboarding.\n'
 || E'4. Enter your business details, EIN or SSN, and bank account information.\n'
 || E'5. Once approved, you''ll be redirected back to TeeAhead with a **"You''re live on Stripe!"** confirmation.\n\n'
 || E'## Account Status\n\n'
 || E'The Payments tab shows your current Stripe status:\n\n'
 || E'- **Not started** — no Stripe account connected yet.\n'
 || E'- **Onboarding** — you''ve started setup but haven''t completed all required fields.\n'
 || E'- **Restricted** — Stripe needs additional verification before enabling payouts.\n'
 || E'- **Active** — charges and payouts are both enabled. You''ll see an **Open Stripe Dashboard** link.\n\n'
 || E'## If Your Account Is Restricted\n\n'
 || E'Click **Continue setup** and complete any outstanding Stripe requirements. '
 || E'Common causes: missing EIN, unverified business address, or Stripe requesting a government ID.',
    'Connect your bank account through Stripe onboarding and understand the account status stages.',
    true,
    1
  );

  -- Article: Reading Your Payments Page
  INSERT INTO kb_articles (category_id, title, slug, content, excerpt, is_published, sort_order)
  VALUES (
    cat_pb,
    'Reading Your Payments Page',
    'reading-your-payments-page',
    E'## Recent Bookings Table\n\n'
 || E'The top section of the **Payments** tab shows your most recent member transactions:\n\n'
 || E'| Column | Description |\n'
 || E'|--------|-------------|\n'
 || E'| **Member** | Name of the golfer who paid |\n'
 || E'| **Your payout** | Amount you receive after TeeAhead''s platform fee |\n'
 || E'| **Platform fee** | TeeAhead''s fee shown as a sub-line |\n'
 || E'| **Status** | succeeded / pending / refunded / failed |\n\n'
 || E'> **Note:** TeeAhead collects **0% booking fee** per your contract. The platform fee line reflects any payment processing costs.\n\n'
 || E'## Recent Payouts Table\n\n'
 || E'Shows Stripe disbursements to your bank account:\n\n'
 || E'| Column | Description |\n'
 || E'|--------|-------------|\n'
 || E'| **Arrival Date** | Date funds land in your bank |\n'
 || E'| **Amount** | Payout total |\n'
 || E'| **Status** | paid or pending |\n\n'
 || E'Standard Stripe payout timing is 2 business days after a charge succeeds.\n\n'
 || E'## Disputes\n\n'
 || E'If a member files a chargeback, a red banner appears at the top of the Payments tab showing:\n\n'
 || E'- The disputed amount\n'
 || E'- The reason (e.g. "fraudulent", "unrecognized")\n'
 || E'- The evidence submission deadline\n\n'
 || E'Respond to disputes promptly — missing the deadline results in an automatic loss. '
 || E'Contact TeeAhead support if you need help compiling evidence.',
    'Understand the bookings table, payout schedule, platform fees, and what to do when a dispute appears.',
    true,
    2
  );

  -- Article: Your Plan and Contract Terms
  INSERT INTO kb_articles (category_id, title, slug, content, excerpt, is_published, sort_order)
  VALUES (
    cat_pb,
    'Your Plan and Contract Terms',
    'your-plan-and-contract-terms',
    E'## Viewing Your Plan\n\n'
 || E'Go to the **Billing** tab (manager and owner only) to see your current plan details, contract terms, and payout history.\n\n'
 || E'## Plan Details\n\n'
 || E'- **Plan:** TeeAhead Partner\n'
 || E'- **Price:** $349 / month, billed monthly. No setup fee.\n'
 || E'- **Booking fee:** 0% — TeeAhead does not take a cut of green fee revenue. You keep 100%.\n\n'
 || E'## Key Contract Terms\n\n'
 || E'| Term | Detail |\n'
 || E'|------|--------|\n'
 || E'| Platform fee | $349/month flat, no per-booking charges |\n'
 || E'| Booking fee | 0% — you keep all green fee revenue |\n'
 || E'| Tee sheet access | Full management, real-time availability, waitlist automation |\n'
 || E'| Fairway Points | Auto-awarded at 1 pt per dollar; redeemable at your course |\n'
 || E'| Cancellation | 30-day written notice. No early-termination fee. |\n'
 || E'| Data ownership | All member and booking data is yours. Exportable at any time. |\n\n'
 || E'## Payout History\n\n'
 || E'The Billing tab includes a **Payout History** table showing every Stripe disbursement with arrival date, amount, and status. '
 || E'Click **Export CSV** to download the full history for your accounting records.\n\n'
 || E'## Questions About Your Bill\n\n'
 || E'Contact TeeAhead at **hello@teeahead.com** for billing questions, invoice requests, or to discuss your plan.',
    'Your $349/month plan, 0% booking fee, 30-day cancellation terms, and how to export payout history.',
    true,
    3
  );

  -- Article: Understanding Your Reports
  INSERT INTO kb_articles (category_id, title, slug, content, excerpt, is_published, sort_order)
  VALUES (
    cat_pb,
    'Understanding Your Reports',
    'understanding-your-reports',
    E'## Accessing Reports\n\n'
 || E'Go to **Reports** in the top navigation (manager and owner only). Reports are broken into sub-sections accessible from the reports home page.\n\n'
 || E'## Date Range Filter\n\n'
 || E'All reports share a date range picker at the top with preset options:\n\n'
 || E'- **This Month** — current calendar month to date.\n'
 || E'- **Last Month** — prior complete month.\n'
 || E'- **This Quarter** — current quarter.\n'
 || E'- **YTD** — January 1 to today.\n'
 || E'- **Custom** — any date range you specify.\n\n'
 || E'## Summary KPIs\n\n'
 || E'The reports home shows four tiles for the selected period:\n\n'
 || E'- **Rounds** — confirmed bookings.\n'
 || E'- **Revenue Processed** — total green fees collected.\n'
 || E'- **TeeAhead Members** — unique members who booked.\n'
 || E'- **Waitlist Cancellations Recovered** — bookings filled from the waitlist after a cancellation.\n\n'
 || E'## Sub-Report Pages\n\n'
 || E'**Rounds & Utilization** — Monthly bar chart of rounds booked, month-over-month % change, and CSV export.\n\n'
 || E'**Revenue** — Monthly revenue line chart, average green fee, MoM % change, and CSV export.\n\n'
 || E'**Member Activity** — Acquisition and engagement metrics for your member base.\n\n'
 || E'**Waitlist & Recovery** — How many cancellations were backfilled and the revenue impact.\n\n'
 || E'**The TeeAhead Difference** — Impact of the trading and barter platform on your course.\n\n'
 || E'## Exporting Data\n\n'
 || E'Rounds and Revenue reports each have an **Export CSV** button that downloads the monthly breakdown table.',
    'Navigate sub-reports, use date range presets, and export rounds and revenue data as CSV.',
    true,
    4
  );

END $$;
