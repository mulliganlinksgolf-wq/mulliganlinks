-- 067_crm_email_templates_rewrite.sql
-- Replace starter templates with expert cold sales copy.
-- Voice rules: no em dashes, peer-to-peer, specific pain points, soft asks,
-- concrete numbers where possible, signed as Neil. Variables: {{name}}, {{course_name}}.

DELETE FROM crm_email_templates;

INSERT INTO crm_email_templates (name, subject, body_html, record_type) VALUES

-- =================== COURSE TEMPLATES ===================

-- 1) Cold open: lead with the math on GolfNow barter
(
  'Course Cold Open: GolfNow math',
  'How much does GolfNow really cost {{course_name}}?',
  '<p>Hi {{name}},</p>
<p>Most courses I''ve talked to in Metro Detroit are giving up 4 to 8 tee times a day to GolfNow in exchange for "free" booking software. At an average rate of $55, that''s $80,000 to $160,000 a year in lost revenue to a company in Florida.</p>
<p>We built TeeAhead to flip that. Free tee sheet, no barter, no commissions, no contracts. We make money from a golfer loyalty membership we sell directly to players, and we cut courses in on a 10% rev share on any membership that comes through your course.</p>
<p>Worth a 15 minute screen share? Even if you stick with GolfNow, you''ll leave with a clearer number on what those barter tee times are actually worth.</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

-- 2) Cold open: lead with the free software hook
(
  'Course Cold Open: Free software',
  'Free tee sheet for {{course_name}}',
  '<p>Hi {{name}},</p>
<p>Neil here, co-founder of TeeAhead. We''re a Metro Detroit company building free tee sheet software for local courses. No commissions, no barter tee times, no annual contracts.</p>
<p>The honest version of why it''s free: we make our money from a golfer membership product, not from courses. Courses get a clean booking system, a public listing in our golfer app, and 10% of any membership revenue from players you refer for the first 12 months.</p>
<p>I''d love to show you what it looks like. 15 minutes, screen share, no pitch deck.</p>
<p>Open to a quick look next week?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

-- 3) Cold open: local Metro Detroit angle
(
  'Course Cold Open: Local angle',
  'Metro Detroit golf, local company',
  '<p>Hi {{name}},</p>
<p>I grew up playing public golf in Metro Detroit and my business partner Billy is a Ford engineer who''s lived here his whole life. We started TeeAhead because we kept hearing the same thing from course operators: GolfNow eats into margins, ClubCaddie and Lightspeed are pricey, and nothing is built for this market specifically.</p>
<p>So we built it. Free tee sheet software for Metro Detroit courses, paid for by a golfer loyalty program we run alongside it. Local company, local players, local courses.</p>
<p>Would {{course_name}} be open to a 15 minute call? I''ll show you the software and the golfer experience, and you can decide if any of it makes sense.</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

-- 4) Cold open: short and direct
(
  'Course Cold Open: Short and direct',
  'Quick one about {{course_name}}',
  '<p>Hi {{name}},</p>
<p>Quick question. Are you happy with what {{course_name}} is currently paying for booking software, whether that''s a monthly fee or GolfNow barter rounds?</p>
<p>If the answer is "not really," I''d love 15 minutes to show you what we''re building at TeeAhead. Free tee sheet, no barter, no contracts. Built locally for Metro Detroit courses.</p>
<p>If the answer is "yep, all good," no worries, ignore this.</p>
<p>Neil<br>TeeAhead<br>teeahead.com</p>',
  'course'
),

-- 5) Follow-up bump (4 days after first email)
(
  'Course Follow-Up: Bump',
  'Re: {{course_name}}',
  '<p>Hi {{name}},</p>
<p>Bumping this up in case it got buried. No worries if the timing isn''t right, I just didn''t want it to get lost.</p>
<p>If a 15 minute call doesn''t make sense, I can also send a 2 minute Loom video walking through the platform. Whichever is easier.</p>
<p>Neil</p>',
  'course'
),

-- 6) Follow-up after a meeting / no response after demo
(
  'Course Follow-Up: After demo',
  'Following up on our call',
  '<p>Hi {{name}},</p>
<p>Thanks again for the time on our call. A quick recap of what I showed you:</p>
<p>Free tee sheet software with no commissions or barter. Public listing in our golfer app the day you go live. 10% rev share on memberships you refer for 12 months. No contract.</p>
<p>If it makes sense to move forward, the next step is a 20 minute onboarding call. I can have you live by the end of the week.</p>
<p>If you''re weighing it against something else, happy to answer whatever questions are sitting on your mind.</p>
<p>Neil</p>',
  'course'
),

-- 7) Founding Partner offer (exclusivity / urgency)
(
  'Course Founding Partner Offer',
  'Founding Partner spot for {{course_name}}',
  '<p>Hi {{name}},</p>
<p>We''re launching TeeAhead with 10 Founding Partner courses in Metro Detroit. The deal for those 10 is different from the standard partnership.</p>
<p>Locked-in pricing for 5 years (free now, can''t be repriced later). Priority placement when golfers search the network. Co-branding in our launch press and marketing. And a 15% rev share on referred memberships for 24 months instead of the standard 10% for 12.</p>
<p>We''re at 6 of 10 spots filled. Wanted to make sure {{course_name}} had the chance to grab one before they''re gone.</p>
<p>Worth a 20 minute call to walk through it?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

-- 8) Demo confirmation
(
  'Course Demo Confirmation',
  'Confirmed for {{date}}',
  '<p>Hi {{name}},</p>
<p>Locked in for {{date}}. I''ll send a calendar invite separately so it shows up on your end.</p>
<p>Plan for the call: 5 minutes on what TeeAhead is, 15 minutes screen sharing the platform from your perspective and the golfer''s, then questions and pricing details.</p>
<p>Join link: {{meeting_link}}</p>
<p>If anything comes up before then, just reply here.</p>
<p>Neil</p>',
  'course'
),

-- 9) Re-engage a cold course lead (90+ days no contact)
(
  'Course Re-Engage: Cold lead',
  'Different angle for {{course_name}}',
  '<p>Hi {{name}},</p>
<p>It''s been a while since we last connected on TeeAhead. A lot has changed on our side that might shift the conversation.</p>
<p>We''re now live with several Metro Detroit courses, we''ve added a referral program that pays courses 10% of any membership they refer for 12 months, and our golfer base has grown significantly. We''re also no longer charging anything for the tee sheet software.</p>
<p>If it''s worth another look, I''d love 15 minutes to walk you through where we are today.</p>
<p>Neil</p>',
  'course'
),

-- =================== OUTING TEMPLATES ===================

-- 10) Outing quote response
(
  'Outing Quote',
  'Quote for your {{event_date}} outing',
  '<p>Hi {{name}},</p>
<p>Thanks for reaching out about your outing. Quote attached.</p>
<p>A few things worth flagging up front. The quote assumes shotgun start with carts included, which works for most groups your size. If you''d rather do tee times, let me know and I''ll redo the math. Total includes a 15% service charge but not tax. To lock the date we''ll need a 50% deposit.</p>
<p>Anything you''d want to adjust? Happy to revise. Otherwise reply with a green light and I''ll send the booking link.</p>
<p>Neil<br>TeeAhead</p>',
  'outing'
),

-- 11) Outing confirmation
(
  'Outing Confirmation',
  'You''re booked: {{event_date}} at {{course_name}}',
  '<p>Hi {{name}},</p>
<p>Confirmed. Your outing is on the books for {{event_date}} at {{course_name}}.</p>
<p>Confirmation document attached. The main things to know: final headcount is due 7 days out, balance is due day-of, and if weather is questionable we''ll make the call by 6am that morning.</p>
<p>I''ll check in a week before the event. Looking forward to it.</p>
<p>Neil<br>TeeAhead</p>',
  'outing'
),

-- 12) Outing nudge (proposal sent, no reply)
(
  'Outing Follow-Up: Quote nudge',
  'Re: your outing quote',
  '<p>Hi {{name}},</p>
<p>Wanted to bump the quote I sent over in case it got buried. Totally fine if you''re still working through options on your end.</p>
<p>If something in the quote wasn''t quite right, just tell me what to change and I''ll send a fresh one over within the hour.</p>
<p>Neil</p>',
  'outing'
),

-- =================== MEMBER TEMPLATES ===================

-- 13) Member welcome
(
  'Member Welcome',
  'Welcome to TeeAhead, {{name}}',
  '<p>Hi {{name}},</p>
<p>Glad you''re in. Quick orientation so you can get the most out of your membership.</p>
<p>Your account gets you booking fee waivers across the network, member-only rates at partner courses, and Fairway Points on every round you play. The fastest path to value is to book one round in the next 30 days, that''s where most members tell us they "get it."</p>
<p>Log in at teeahead.com to browse courses and book your first round. If you hit any snags, just reply to this email and I''ll fix it personally.</p>
<p>Neil<br>TeeAhead Co-Founder</p>',
  'member'
),

-- 14) Win-back (lapsed member)
(
  'Member Win-Back',
  'Haven''t seen you, {{name}}',
  '<p>Hi {{name}},</p>
<p>It''s been a while since you''ve booked through TeeAhead and I wanted to check in directly. If something wasn''t working for you, I''d genuinely want to know what.</p>
<p>If it''s just been a busy stretch, no worries, your benefits are still good. If you want to pause or cancel, reply here and I''ll take care of it personally, no questions asked.</p>
<p>Either way, thanks for giving us a shot.</p>
<p>Neil</p>',
  'member'
),

-- 15) Upgrade to Ace
(
  'Member Upgrade to Ace',
  'Worth bumping to Ace?',
  '<p>Hi {{name}},</p>
<p>Looking at your TeeAhead activity, I think Ace might actually save you money at this point.</p>
<p>Eagle is $89 a year and gets you $120 in tee time credits plus 1 free round. Ace is $159 a year and gets you $240 in credits, 2 free rounds, 2 guest passes, a $20 birthday credit, and access to premium-tier course rates. If you book more than 3 rounds a year, Ace pays for itself.</p>
<p>Want me to do the swap? Or you can upgrade yourself from your account.</p>
<p>Neil</p>',
  'member'
),

-- 16) Birthday credit nudge
(
  'Member Birthday Credit',
  '{{name}}, your birthday credit is loaded',
  '<p>Hi {{name}},</p>
<p>Quick heads up. Your birthday credit is now live in your TeeAhead account. Use it on any partner course over the next 60 days.</p>
<p>Book a round at teeahead.com and the credit applies automatically at checkout.</p>
<p>Happy birthday. Hope you get out there.</p>
<p>Neil</p>',
  'member'
);
