-- 081_club_prophet_templates.sql
-- 5-email cold outreach sequence for courses running Club Prophet.
-- Key angles:
--   1. Club Prophet routes golfer data through third-party marketplaces
--      (Barstool Golf Time, Golf Digest) — your customers shown to competitors
--   2. Owned by Jonas Software / Constellation — same corporate parent as Club Caddie,
--      a holding company roll-up, not a software-first business
--   3. Legacy platform not built to drive golfer acquisition or generate course revenue
-- Rules: no "free software." $349/mo standard. Founding Partner: first 10 courses,
-- year 1 at no cost. No em dashes, peer-to-peer tone, signed as Neil.

INSERT INTO crm_email_templates (name, subject, body_html, record_type) VALUES

(
  'Club Prophet: Cold Open (data/marketplace angle)',
  'A question about Club Prophet at {{course_name}}',
  '<p>Hi {{name}},</p>
<p>I noticed {{course_name}} is running Club Prophet. Something worth knowing: Club Prophet routes your golfer data through third-party marketplaces including Barstool Golf Time and Golf Digest. That means the golfers who play {{course_name}} are being shown other courses those platforms want to promote. You''re paying for software that quietly works against your retention.</p>
<p>TeeAhead is built to do the opposite. The tee sheet is $349 a month, but it''s designed around keeping your golfers loyal to {{course_name}}, not redirecting them somewhere else. We run a golfer loyalty membership alongside it, and courses earn a 10% rev share on every membership tied to their property. Your golfers stay yours.</p>
<p>We''re also wrapping up a Founding Partner program for the first 10 Metro Detroit courses. Those get year one at no cost and first placement in the golfer app. Worth 15 minutes on a screen share?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'Club Prophet: Cold Open (Jonas/corporate angle)',
  'Who actually owns Club Prophet',
  '<p>Hi {{name}},</p>
<p>Club Prophet is owned by Jonas Software, part of Constellation Software, a holding company that acquires and operates vertical market software businesses across dozens of industries. Their model is to buy established software, keep the customers, and manage for margin. Building new features to grow your course''s revenue is not really the priority.</p>
<p>We started TeeAhead because we kept seeing courses paying corporate-owned software companies that had no stake in how well those courses actually performed. We''re a Metro Detroit company and our whole business model is tied to courses succeeding. We charge $349 a month for the tee sheet and pay courses a 10% rev share on golfer memberships tied to their property. When you do well, we do well.</p>
<p>We''re also filling the last few Founding Partner spots for local courses. Those get year one at no cost. 15 minutes to see what it looks like?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'Club Prophet: Cold Open (short)',
  '{{course_name}} + TeeAhead',
  '<p>Hi {{name}},</p>
<p>Quick question: does Club Prophet generate any revenue for {{course_name}}, or just manage bookings while routing your golfer data to outside marketplaces?</p>
<p>TeeAhead does the opposite. Tee sheet at $349 a month, golfer loyalty program built in, 10% rev share on memberships tied to your course. Your players stay yours. We''re also wrapping up a Founding Partner program for the first 10 Metro Detroit courses, year one at no cost. 15 minutes?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'Club Prophet: Follow-Up 1',
  'Re: {{course_name}} + TeeAhead',
  '<p>Hi {{name}},</p>
<p>Following up in case my last email got buried.</p>
<p>Short version: Club Prophet is owned by a large software holding company and routes your golfer data through outside marketplaces that show your players competing courses. TeeAhead keeps your golfers loyal to {{course_name}}, charges $349 a month for the tee sheet, and pays you a 10% rev share on memberships tied to your property.</p>
<p>We''re also wrapping up a Founding Partner program for local courses. If you''d rather watch than talk, I can send a two minute video instead of asking for a call.</p>
<p>Neil</p>',
  'course'
),

(
  'Club Prophet: Break-Up',
  'Closing the loop on {{course_name}}',
  '<p>Hi {{name}},</p>
<p>A couple of emails and no response, so I''ll leave it here.</p>
<p>If the timing ever changes, we build tee sheet software for Metro Detroit courses that keeps your golfer data in house, pays you a 10% rev share on memberships, and doesn''t route your customers to competing courses in the background.</p>
<p>One last thing: we''re filling the final Founding Partner spots for Metro Detroit courses. Those get year one at no cost and first placement in the golfer app. Standard pricing is $349 a month after that. If there''s any interest, it''s worth a quick reply before those spots close.</p>
<p>Good luck this season.</p>
<p>Neil<br>TeeAhead<br>teeahead.com</p>',
  'course'
);
