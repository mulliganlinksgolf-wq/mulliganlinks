-- 080_teesnap_templates.sql
-- 5-email cold outreach sequence for courses running TeeSnap.
-- TeeSnap is owned by Acushnet (Titleist/FootJoy parent) — an equipment company,
-- not a software-first business. No golfer loyalty layer, no rev share.
-- Rules: no "free software." $349/mo standard. Founding Partner: first 10 courses,
-- year 1 at no cost. No em dashes, peer-to-peer tone, signed as Neil.

INSERT INTO crm_email_templates (name, subject, body_html, record_type) VALUES

(
  'TeeSnap: Cold Open (Acushnet angle)',
  'A question about TeeSnap at {{course_name}}',
  '<p>Hi {{name}},</p>
<p>I noticed {{course_name}} is running TeeSnap. Worth knowing: TeeSnap is owned by Acushnet, the company behind Titleist and FootJoy. They make great golf equipment. But their core business is selling balls and shoes, not building software to grow your course''s revenue. The tee sheet exists to support that ecosystem, not yours.</p>
<p>TeeAhead is the opposite. We''re a Metro Detroit company and the tee sheet is the core product, not an afterthought. We run a golfer loyalty membership alongside it, and courses earn a 10% rev share on every membership tied to their property. The software pays for itself instead of just adding to the cost column.</p>
<p>We''re also in the final stretch of a Founding Partner program for the first 10 Metro Detroit courses. Those get year one at no cost and first placement in the golfer app. Happy to check if {{course_name}} still qualifies.</p>
<p>15 minutes on a screen share?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'TeeSnap: Cold Open (loyalty gap)',
  'What TeeSnap doesn''t do for {{course_name}}',
  '<p>Hi {{name}},</p>
<p>TeeSnap handles the booking side fine. But it doesn''t give your regulars a reason to keep choosing {{course_name}} over the course down the road, and it doesn''t generate any revenue beyond managing what you already have.</p>
<p>TeeAhead fills that gap. The tee sheet is $349 a month, but the reason courses sign up is the golfer loyalty membership we run alongside it. Players earn perks for staying loyal to courses in the network. {{course_name}} earns a 10% rev share on every membership tied to your property, paid monthly. For most courses that offsets the software cost within the first couple of months.</p>
<p>We''re also wrapping up a Founding Partner program for Metro Detroit courses. The first 10 get year one at no cost. Worth 15 minutes to see how it works?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'TeeSnap: Cold Open (short)',
  '{{course_name}} + TeeAhead',
  '<p>Hi {{name}},</p>
<p>Quick question: does TeeSnap put any money back into {{course_name}}, or is it purely a cost?</p>
<p>TeeAhead does both. Tee sheet software at $349 a month, built around a golfer loyalty program that pays you a 10% rev share on memberships tied to your course. Also worth knowing: TeeSnap is owned by Acushnet, an equipment company. We''re a Metro Detroit software company, built specifically to grow course revenue. Founding Partner program wrapping up for the first 10 local courses, year one at no cost. 15 minutes?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'TeeSnap: Follow-Up 1',
  'Re: {{course_name}} + TeeAhead',
  '<p>Hi {{name}},</p>
<p>Following up in case my last email got buried.</p>
<p>Short version: we''re a Metro Detroit company with tee sheet software and a golfer loyalty program built in. Courses earn a 10% rev share on memberships tied to their property. Unlike TeeSnap, which is a side product of a golf equipment company, we''re software-first and built entirely around growing course revenue.</p>
<p>We''re also wrapping up a Founding Partner program for local courses. If you''d rather watch than talk, I can send a two minute video instead of asking for a call.</p>
<p>Neil</p>',
  'course'
),

(
  'TeeSnap: Break-Up',
  'Closing the loop on {{course_name}}',
  '<p>Hi {{name}},</p>
<p>A couple of emails and no response, so I''ll leave it here.</p>
<p>If the timing ever changes and {{course_name}} wants to look at tee sheet software that pays you back through a golfer loyalty rev share, you know where to find me.</p>
<p>One last thing: we''re filling the final spots in our Founding Partner program for Metro Detroit courses. Those get year one at no cost and first placement in the golfer app. Standard pricing is $349 a month after that. If there''s any interest, sooner is better.</p>
<p>Good luck this season.</p>
<p>Neil<br>TeeAhead<br>teeahead.com</p>',
  'course'
);
