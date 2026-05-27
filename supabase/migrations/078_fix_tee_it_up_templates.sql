-- 078_fix_tee_it_up_templates.sql
-- Remove all "free software" language from Tee It Up templates.
-- Software is $349/month. Only the first 10 Founding Partner courses
-- get it free for 1 year. Lead with differentiated value and rev share;
-- use the Founding Partner spot as the close, not "it's free."

UPDATE crm_email_templates SET
  subject = 'A question about your Tee It Up setup',
  body_html = '<p>Hi {{name}},</p>
<p>I noticed {{course_name}} is running on Tee It Up. My question for you: does your booking software send new golfers to your course, or does it just manage the ones you already have?</p>
<p>We built TeeAhead to do both. It''s tee sheet software built around a paid golfer loyalty membership. Members get perks at every course in our network, and courses earn a 10% rev share on any membership that comes through their property for 12 months. So instead of your software being a cost center, it actively pays you back.</p>
<p>We''re also wrapping up our Founding Partner program, where the first 10 courses get the software at no cost for the first year. I don''t know where we are on that count right now, but I can check if {{course_name}} would still qualify.</p>
<p>Worth a 15 minute screen share? No slides, just the actual product.</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>'
WHERE name = 'Tee It Up: Cold Open (software cost)' AND record_type = 'course';

UPDATE crm_email_templates SET
  subject = 'What Tee It Up doesn''t do for {{course_name}}',
  body_html = '<p>Hi {{name}},</p>
<p>Tee It Up handles your tee sheet well. But it doesn''t give your regulars a reason to choose you over the course down the road, and it doesn''t generate any revenue on its own.</p>
<p>That''s the gap TeeAhead was built to fill. On top of the tee sheet is a golfer membership program that rewards players for staying loyal to their home course. {{course_name}} earns a 10% rev share on every membership tied to your property, paid monthly for a full year. The software pays for itself before most courses finish onboarding.</p>
<p>We''re also in the final stretch of a Founding Partner program for the first 10 Metro Detroit courses. Those courses get the first year at no cost and get listed first in the golfer app. I can check if there''s still a spot.</p>
<p>15 minutes to see the whole thing? I''ll show you the golfer side and the course dashboard.</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>'
WHERE name = 'Tee It Up: Cold Open (loyalty gap)' AND record_type = 'course';

UPDATE crm_email_templates SET
  subject = '{{course_name}} + TeeAhead',
  body_html = '<p>Hi {{name}},</p>
<p>Honest question: does Tee It Up send new golfers to {{course_name}}, or does it just manage the ones you already have?</p>
<p>TeeAhead does both. It''s tee sheet software built around a golfer loyalty membership. Courses earn a 10% rev share on memberships that come through their property. The software earns its keep rather than just costing you a line item.</p>
<p>We have a Founding Partner program wrapping up for the first 10 Metro Detroit courses. Worth checking if {{course_name}} still qualifies. 15 minutes?</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>'
WHERE name = 'Tee It Up: Cold Open (short)' AND record_type = 'course';

UPDATE crm_email_templates SET
  body_html = '<p>Hi {{name}},</p>
<p>Following up on my last note in case the timing was off.</p>
<p>Short version: we''re a Metro Detroit company offering tee sheet software with a golfer loyalty program built in. Courses earn a 10% rev share on memberships that come through their property. And we''re wrapping up a Founding Partner program where the first 10 courses get year one at no cost.</p>
<p>If you''d rather watch than talk, I can send a two minute video that walks through the whole thing. Either way, happy to answer questions.</p>
<p>Neil</p>'
WHERE name = 'Tee It Up: Follow-Up 1' AND record_type = 'course';

UPDATE crm_email_templates SET
  body_html = '<p>Hi {{name}},</p>
<p>I''ve reached out a couple times and haven''t heard back, so I''ll leave it here.</p>
<p>If the timing ever changes and {{course_name}} wants to look at tee sheet software that pays you back through a golfer rev share program, you know where to find me.</p>
<p>One last thing: we''re filling the final spots in our Founding Partner program for Metro Detroit courses. Those courses get year one at no cost and first placement in the golfer app. Once those spots are gone, everyone pays the standard $349 per month. If there''s any interest, sooner is better.</p>
<p>Either way, good luck this season.</p>
<p>Neil<br>TeeAhead<br>teeahead.com</p>'
WHERE name = 'Tee It Up: Break-Up' AND record_type = 'course';
