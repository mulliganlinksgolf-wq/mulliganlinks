-- 077_tee_it_up_templates.sql
-- Cold outreach sequence for courses currently using Tee It Up.
-- Strategy: hyper-specific opener (name their software), one concrete financial pain,
-- clear contrast, tiny low-friction ask. Signed as Neil. No em dashes.
-- Variables: {{name}}, {{course_name}}

INSERT INTO crm_email_templates (name, subject, body_html, record_type) VALUES

-- 1) Cold open: lead with what they're paying vs. free
(
  'Tee It Up: Cold Open (software cost)',
  'A question about your Tee It Up setup',
  '<p>Hi {{name}},</p>
<p>I noticed {{course_name}} is running on Tee It Up. Solid system, but you''re paying a monthly fee for booking software that doesn''t send you new golfers or generate any additional revenue on its own.</p>
<p>We built TeeAhead specifically to fix that. It''s free tee sheet software for the course, but we run a paid golfer loyalty membership on top of it. Members get perks at every course on the network, and courses earn a 10% rev share on any membership that originates at their property, for 12 months straight.</p>
<p>So instead of paying for software, you''re getting paid by it.</p>
<p>Worth a 15 minute look? I can show you the whole thing on a screen share, no slides, just the actual product.</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

-- 2) Cold open: angle on the loyalty/membership gap
(
  'Tee It Up: Cold Open (loyalty gap)',
  'What Tee It Up doesn''t do for {{course_name}}',
  '<p>Hi {{name}},</p>
<p>Tee It Up handles your tee sheet well. But it doesn''t give your regulars a reason to choose you over the course down the road, and it doesn''t put a dollar back in your pocket when a golfer becomes a repeat customer.</p>
<p>That''s the gap we built TeeAhead to fill. The tee sheet is free, same as what you have now. But layered on top is a golfer membership program that rewards players for staying loyal to your course. You get a 10% commission on every membership that comes through {{course_name}}, paid monthly, for a full year.</p>
<p>Courses in Metro Detroit are using it to add a revenue line they didn''t have before, without changing anything about how they run their operation.</p>
<p>Would it make sense to see how it works? 15 minutes, I''ll show you the golfer side and the course dashboard.</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

-- 3) Cold open: ultra-short pattern interrupt
(
  'Tee It Up: Cold Open (short)',
  '{{course_name}} + TeeAhead',
  '<p>Hi {{name}},</p>
<p>One honest question: does your Tee It Up subscription send new golfers to {{course_name}}, or does it just manage the ones you already have?</p>
<p>If it''s the latter, TeeAhead does both. Free tee sheet software, plus a loyalty membership we sell to golfers that drives them to courses on our network. Courses earn 10% of every membership they refer, recurring for 12 months.</p>
<p>Takes 15 minutes to see the whole thing. Worth it?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

-- 4) Follow-up #1 after no response (5-7 days later)
(
  'Tee It Up: Follow-Up 1',
  'Re: {{course_name}} + TeeAhead',
  '<p>Hi {{name}},</p>
<p>Following up on my last note in case the timing was off.</p>
<p>The short version: we''re a Metro Detroit company offering free tee sheet software and a golfer loyalty program that pays {{course_name}} a rev share every month. If you''re spending money on Tee It Up right now, that''s a conversation worth having for 15 minutes.</p>
<p>If the timing genuinely isn''t right, just say the word. But if there''s even mild curiosity, I''ll send over a two minute video that shows exactly how it works.</p>
<p>Neil</p>',
  'course'
),

-- 5) Break-up email (last touch, creates curiosity without pressure)
(
  'Tee It Up: Break-Up',
  'Closing the loop on {{course_name}}',
  '<p>Hi {{name}},</p>
<p>I''ve reached out a couple times and haven''t heard back, so I''ll leave it here. I don''t want to be that person in your inbox.</p>
<p>If the timing ever changes and {{course_name}} wants to look at a free tee sheet with a built-in revenue share, you know where to find me.</p>
<p>One last thing, and I''ll get out of your hair: we''re onboarding a limited number of founding partner courses in Metro Detroit before we open the network wider. Those courses get the software free for the first year and get listed first in the golfer app. That window won''t be open forever.</p>
<p>Either way, good luck this season.</p>
<p>Neil<br>TeeAhead<br>teeahead.com</p>',
  'course'
);
