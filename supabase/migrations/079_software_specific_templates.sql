-- 079_software_specific_templates.sql
-- 1) Fix remaining "free" language in existing course templates
-- 2) Add dedicated 5-email sequences for Club Caddie, foreUP, and GolfNow courses
-- Rules: no "free software" unless Founding Partner offer. $349/mo standard.
-- Founding Partner: first 10 courses, year 1 at no cost. Never invent exact durations.
-- Voice: no em dashes, peer-to-peer, specific pain, soft ask. Signed as Neil.

-- =====================================================
-- PATCH EXISTING TEMPLATES WITH "FREE" LANGUAGE
-- =====================================================

UPDATE crm_email_templates SET body_html =
'<p>Hi {{name}},</p>
<p>Most courses I''ve talked to in Metro Detroit are giving up 4 to 8 tee times a day to GolfNow in exchange for "free" booking software. At an average rate of $55, that''s $80,000 to $160,000 a year in lost revenue to a company in Florida. An NGCOA study put the average annual barter cost at $37,000 per course, and 70% of those barter rounds go out during your peak hours.</p>
<p>We built TeeAhead differently. Tee sheet software at $349 a month, but paired with a golfer loyalty membership that sends paying members to your course and pays you a 10% rev share on every membership that originates at {{course_name}}. The software earns its keep.</p>
<p>We''re also wrapping up a Founding Partner program for the first 10 Metro Detroit courses. Those courses get year one at no cost and priority placement in the golfer app. Worth a 15 minute screen share to see if it makes sense?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>'
WHERE name = 'Course Cold Open: GolfNow math' AND record_type = 'course';

UPDATE crm_email_templates SET
  name = 'Course Cold Open: Value proposition',
  subject = 'Tee sheet software that pays you back',
  body_html =
'<p>Hi {{name}},</p>
<p>Neil here, co-founder of TeeAhead. We build tee sheet software for Metro Detroit courses with a golfer loyalty membership layered on top. Courses pay $349 a month for the software, but earn a 10% rev share on every membership that originates at their property. For most courses we talk to, the rev share covers the software cost within the first few months.</p>
<p>No commissions on tee times, no barter, no annual contracts.</p>
<p>We''re also in the final stretch of a Founding Partner program for the first 10 local courses. Those courses get year one at no cost. I can check if {{course_name}} still qualifies.</p>
<p>15 minutes, screen share, no pitch deck. Worth a look?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>'
WHERE name = 'Course Cold Open: Free software' AND record_type = 'course';

UPDATE crm_email_templates SET body_html =
'<p>Hi {{name}},</p>
<p>I grew up playing public golf in Metro Detroit and my business partner Billy is a Ford engineer who''s lived here his whole life. We started TeeAhead because we kept hearing the same thing from course operators: GolfNow eats into margins, Club Caddie and Lightspeed are expensive, and nothing is built specifically for this market.</p>
<p>So we built it. Tee sheet software at $349 a month with a golfer loyalty program built in. Local company, local players, local courses. Courses earn a 10% rev share on memberships tied to their property, which offsets the software cost for most courses fairly quickly.</p>
<p>We''re also filling the last few Founding Partner spots for Metro Detroit courses. Those get year one at no cost. Would {{course_name}} be open to a 15 minute call?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>'
WHERE name = 'Course Cold Open: Local angle' AND record_type = 'course';

UPDATE crm_email_templates SET body_html =
'<p>Hi {{name}},</p>
<p>Quick question. Are you happy with what {{course_name}} is currently paying for booking software, whether that''s a monthly SaaS fee or GolfNow barter rounds?</p>
<p>If the answer is "not really," I''d love 15 minutes to show you TeeAhead. Tee sheet software at $349 a month, paired with a golfer loyalty program that pays you a 10% rev share on memberships. Built locally for Metro Detroit courses.</p>
<p>If the answer is "yep, all good," no worries at all.</p>
<p>Neil<br>TeeAhead<br>teeahead.com</p>'
WHERE name = 'Course Cold Open: Short and direct' AND record_type = 'course';

UPDATE crm_email_templates SET body_html =
'<p>Hi {{name}},</p>
<p>Thanks again for the time on our call. A quick recap of what I showed you:</p>
<p>Tee sheet software at $349 a month with no commissions or barter. Public listing in our golfer app the day you go live. 10% rev share on memberships you refer. No contract.</p>
<p>If it makes sense to move forward, the next step is a 20 minute onboarding call. I can have you live by the end of the week.</p>
<p>If you''re weighing it against something else, happy to answer whatever questions are on your mind.</p>
<p>Neil</p>'
WHERE name = 'Course Follow-Up: After demo' AND record_type = 'course';

UPDATE crm_email_templates SET body_html =
'<p>Hi {{name}},</p>
<p>It''s been a while since we last connected on TeeAhead. A lot has changed on our side that might shift the conversation.</p>
<p>We''re now live with several Metro Detroit courses, we''ve added a referral program that pays courses a 10% rev share on any membership they refer, and our golfer base has grown significantly. The software is $349 a month, but the rev share offsets that for most courses in the first couple of months.</p>
<p>If it''s worth another look, I''d love 15 minutes to walk you through where we are today.</p>
<p>Neil</p>'
WHERE name = 'Course Re-Engage: Cold lead' AND record_type = 'course';

-- =====================================================
-- CLUB CADDIE SEQUENCE
-- =====================================================
-- Angle: Club Caddie is Detroit-based but owned by Jonas Software (large corp).
-- It''s an ops tool that manages existing demand but doesn''t create new demand
-- or generate revenue. TeeAhead adds the golfer acquisition + loyalty layer.

INSERT INTO crm_email_templates (name, subject, body_html, record_type) VALUES

(
  'Club Caddie: Cold Open (loyalty gap)',
  'A question about Club Caddie at {{course_name}}',
  '<p>Hi {{name}},</p>
<p>I noticed {{course_name}} is on Club Caddie. It handles the operations side well. My question is: does it send new golfers to your course, or does it manage the ones you already have?</p>
<p>We built TeeAhead to fill that gap. It''s a tee sheet at $349 a month, but the reason courses sign up is the golfer loyalty membership we run alongside it. Members get perks for playing at courses in the network, and courses earn a 10% rev share on every membership tied to their property. The software pays for itself rather than just costing a line item.</p>
<p>We''re also in the final stretch of a Founding Partner program for Metro Detroit courses. Those courses get year one at no cost and first placement in the golfer app. Happy to check if {{course_name}} still qualifies.</p>
<p>Worth 15 minutes on a screen share?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'Club Caddie: Cold Open (corporate angle)',
  'Club Caddie + TeeAhead',
  '<p>Hi {{name}},</p>
<p>Club Caddie does solid work on the operations side. But it''s owned by Jonas Software, part of a large holding company in Canada, and it''s fundamentally an ops tool. It doesn''t put any money back in your pocket and it doesn''t help you build loyalty with the golfers already playing {{course_name}}.</p>
<p>TeeAhead is different. We''re a Metro Detroit company, and we built the tee sheet software as part of a golfer loyalty membership product. Courses get a booking system, a public listing in our golfer app, and a 10% rev share on memberships that come through their property. Software that generates revenue instead of just consuming it.</p>
<p>We''re filling the last few Founding Partner spots for local courses. Those get the first year at no cost. 15 minutes to see the whole thing?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'Club Caddie: Cold Open (short)',
  'Quick one for {{course_name}}',
  '<p>Hi {{name}},</p>
<p>Does Club Caddie generate any revenue for {{course_name}}, or just manage bookings?</p>
<p>TeeAhead does both. Tee sheet software at $349 a month, built around a golfer loyalty program. Courses earn 10% on memberships tied to their property. We''re also wrapping up a Founding Partner program where the first 10 Metro Detroit courses get year one at no cost. 15 minutes to see it?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'Club Caddie: Follow-Up 1',
  'Re: {{course_name}} + TeeAhead',
  '<p>Hi {{name}},</p>
<p>Following up in case the timing was off last week.</p>
<p>Short version: we''re a Metro Detroit company with tee sheet software and a golfer loyalty membership built in. Courses earn a 10% rev share on memberships tied to their property. Software at $349 a month that generates revenue instead of just being a cost.</p>
<p>We''re also wrapping up a Founding Partner program for local courses. If there''s any curiosity, I can send a two minute video instead of asking for a call.</p>
<p>Neil</p>',
  'course'
),

(
  'Club Caddie: Break-Up',
  'Closing the loop on {{course_name}}',
  '<p>Hi {{name}},</p>
<p>I''ve reached out a couple times and haven''t heard back, so I''ll leave it here.</p>
<p>If the timing ever changes and {{course_name}} wants to look at tee sheet software that also drives golfer loyalty and pays you a rev share, you know where to find me.</p>
<p>Last thing: we''re filling the final Founding Partner spots for Metro Detroit courses. Those get year one at no cost and first placement in the golfer app. Standard pricing is $349 a month after that. If there''s any interest, sooner is better.</p>
<p>Good luck this season.</p>
<p>Neil<br>TeeAhead<br>teeahead.com</p>',
  'course'
),

-- =====================================================
-- FOREUP SEQUENCE
-- =====================================================
-- foreUP merged with Xplor Golf March 2026. Battery Ventures-backed.
-- Partners with Supreme Golf for distribution — your tee times listed
-- on a marketplace alongside your competitors. $349/mo+ SaaS.
-- Angle: corporate consolidation, marketplace exposure, no loyalty layer.

(
  'foreUP: Cold Open (marketplace angle)',
  'A question about your foreUP setup',
  '<p>Hi {{name}},</p>
<p>I noticed {{course_name}} is running foreUP. Something worth knowing: foreUP recently merged with Xplor and has a distribution partnership with Supreme Golf. That means your available tee times are being surfaced in a marketplace right next to your competitors, often at discounted rates to drive traffic.</p>
<p>We built TeeAhead to do the opposite. Instead of putting your inventory in a marketplace, we build loyalty with the golfers already choosing {{course_name}}. Tee sheet software at $349 a month, with a golfer membership program layered on top. Courses earn a 10% rev share on memberships tied to their property. Your players stay yours.</p>
<p>We''re also in the final stretch of a Founding Partner program for Metro Detroit courses. Those get the first year at no cost. Worth 15 minutes on a screen share?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'foreUP: Cold Open (loyalty gap)',
  'What foreUP doesn''t do for {{course_name}}',
  '<p>Hi {{name}},</p>
<p>foreUP manages your tee sheet well. But it doesn''t give your regulars a reason to keep choosing {{course_name}} over the course down the road, and it doesn''t generate any revenue on its own.</p>
<p>TeeAhead fills that gap. The software handles bookings at $349 a month, but the part courses care most about is the golfer loyalty membership we run alongside it. Members build perks by playing courses in the network. {{course_name}} earns a 10% rev share on every membership tied to your property, paid monthly. The software pays for itself.</p>
<p>We''re also wrapping up a Founding Partner program for Metro Detroit courses. The first 10 get year one at no cost. I can check if you still qualify. 15 minutes?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'foreUP: Cold Open (short)',
  '{{course_name}} + TeeAhead',
  '<p>Hi {{name}},</p>
<p>Honest question: does foreUP put any money back into {{course_name}}, or is it purely a cost?</p>
<p>TeeAhead does both. Tee sheet at $349 a month, with a golfer loyalty program that pays you a 10% rev share on memberships. Also worth knowing: foreUP''s distribution partnership with Supreme Golf puts your tee times in a competing marketplace. TeeAhead keeps your players loyal to you, not to a marketplace. 15 minutes to see it?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'foreUP: Follow-Up 1',
  'Re: {{course_name}} + TeeAhead',
  '<p>Hi {{name}},</p>
<p>Following up in case my last email got buried.</p>
<p>The short version: we''re a Metro Detroit company with tee sheet software and a golfer loyalty program built in. Courses earn a 10% rev share on memberships tied to their property. Unlike foreUP''s marketplace model, we build loyalty to your specific course rather than routing golfers to whichever course discounts the deepest.</p>
<p>We''re also wrapping up a Founding Partner program for local courses. If you''d rather watch than talk, I can send a two minute video instead.</p>
<p>Neil</p>',
  'course'
),

(
  'foreUP: Break-Up',
  'Closing the loop on {{course_name}}',
  '<p>Hi {{name}},</p>
<p>A couple of emails and no response, so I''ll leave it here.</p>
<p>If the timing ever changes, we build tee sheet software for Metro Detroit courses that pays you back through a golfer rev share program rather than just being a monthly expense.</p>
<p>One last note: we''re filling the final spots in our Founding Partner program for local courses. Those get year one at no cost and first listing in the golfer app. Standard pricing is $349 a month after that. If there''s any interest at all, it''s worth a quick reply.</p>
<p>Good luck this season.</p>
<p>Neil<br>TeeAhead<br>teeahead.com</p>',
  'course'
),

-- =====================================================
-- GOLFNOW SEQUENCE
-- =====================================================
-- Barter model: avg $37k/year, 70% of barter during peak hours.
-- Hot Deals trains price sensitivity (brand dilution).
-- They added +320 courses in Q1 2025 — don''t position as "courses are leaving."
-- Angle: the barter math, brand dilution from Hot Deals, loyalty alternative.

(
  'GolfNow: Cold Open (barter math)',
  'The real cost of GolfNow at {{course_name}}',
  '<p>Hi {{name}},</p>
<p>An NGCOA study of about 400 courses put the average annual barter cost at $37,000 per course. For high-volume courses it runs $100,000 to $150,000 or more. And 70% of GolfNow barter rounds go out during peak hours, when those tee times have the most value.</p>
<p>I''m not writing to tell you GolfNow is terrible. Plenty of courses run it and accept the trade-off. But if you''re at the point where the barter cost feels high, TeeAhead is worth 15 minutes of your time.</p>
<p>We charge $349 a month for the tee sheet. No barter, no commissions, no marketplace. We make our money from a golfer loyalty membership we sell directly to players, and we pay courses a 10% rev share on memberships tied to their property. Most courses offset the software cost within the first couple of months.</p>
<p>We''re also wrapping up a Founding Partner program for the first 10 Metro Detroit courses. Those get year one at no cost. Is it worth a look?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'GolfNow: Cold Open (brand dilution)',
  'What Hot Deals does to {{course_name}}',
  '<p>Hi {{name}},</p>
<p>GolfNow''s Hot Deals feature is good at filling empty tee times. It''s also quietly training your regulars to wait for discounts instead of booking at full price.</p>
<p>When a golfer books a Hot Deal at {{course_name}} for $25 instead of the standard $55, two things happen. You lose $30 on that round, and that golfer learns that your rate is negotiable. Over time that shapes price expectations in a way that''s hard to undo.</p>
<p>TeeAhead is built around loyalty instead of discounting. Golfers earn perks by playing courses in the network at full rate. {{course_name}} earns a 10% rev share on memberships tied to your course. The software is $349 a month with no barter and no Hot Deals.</p>
<p>We''re also filling the last few Founding Partner spots for Metro Detroit courses. Those get year one at no cost. Worth a 15 minute screen share?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'GolfNow: Cold Open (short)',
  'Quick math on {{course_name}} and GolfNow',
  '<p>Hi {{name}},</p>
<p>How many tee times a day is {{course_name}} giving up to GolfNow? At 4 to 8 barter rounds a day and an average rate of $55, that''s $80,000 to $160,000 a year. The NGCOA average across 400 courses is $37,000 annually, and 70% of those rounds go out during peak hours.</p>
<p>TeeAhead charges $349 a month. No barter, no commissions. We pay courses a 10% rev share on golfer memberships tied to their property. We also have a Founding Partner program wrapping up for the first 10 Metro Detroit courses, year one at no cost. 15 minutes?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'GolfNow: Follow-Up 1',
  'Re: {{course_name}} and TeeAhead',
  '<p>Hi {{name}},</p>
<p>Bumping this up in case it got buried.</p>
<p>We''re a Metro Detroit company with tee sheet software at $349 a month, no barter, no Hot Deals. We run a golfer loyalty membership alongside it and pay courses a 10% rev share on memberships tied to their property. We also have a Founding Partner program wrapping up for local courses, year one at no cost for the first 10.</p>
<p>If a call isn''t easy right now, I can send a two minute video instead. Either way, happy to answer questions.</p>
<p>Neil</p>',
  'course'
),

(
  'GolfNow: Break-Up',
  'Last note on {{course_name}}',
  '<p>Hi {{name}},</p>
<p>A few emails and no response, so I''ll stop here. No hard feelings at all.</p>
<p>If the GolfNow barter cost ever gets to a point where it feels like too much, we built something specifically for that situation. Tee sheet software at $349 a month, no barter, no commissions, golfer loyalty program built in, and a 10% rev share that offsets the cost.</p>
<p>We''re filling the final Founding Partner spots for Metro Detroit courses now. Year one at no cost, first placement in the golfer app. Standard pricing after that is $349 a month. If there''s any interest, sooner is better before those spots close.</p>
<p>Good luck this season.</p>
<p>Neil<br>TeeAhead<br>teeahead.com</p>',
  'course'
);
