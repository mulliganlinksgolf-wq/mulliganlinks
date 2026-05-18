-- 082_universal_bold_template.sql
-- Single bold catch-all cold email. Works for any course regardless of software.
-- Designed to provoke a response. Short, direct, pattern-interrupt opener.
-- No em dashes, peer-to-peer tone, signed as Neil.
-- Rules: $349/mo standard. Founding Partner: first 10 courses, year 1 at no cost.

INSERT INTO crm_email_templates (name, subject, body_html, record_type) VALUES
(
  'Course Cold Open: Bold catch-all',
  'A blunt question about {{course_name}}',
  '<p>Hi {{name}},</p>
<p>Blunt question: does anything about your current setup actually put money back into {{course_name}}, or is it purely overhead?</p>
<p>Most tee sheet software costs $200-$400 a month and stops there. It manages bookings. It does not grow your revenue, retain your golfers, or generate anything beyond what you already had.</p>
<p>TeeAhead is built differently. The tee sheet is $349 a month, but the reason courses switch is what comes with it: a golfer loyalty membership program that pays you a 10% rev share on every membership tied to your property, monthly. For most courses that offsets the software cost within the first couple of months. Your regulars get rewarded for staying loyal to {{course_name}} instead of price-shopping the course down the road.</p>
<p>We are also filling the last few Founding Partner spots for Metro Detroit courses. Those get year one at no cost. After that it is $349 a month.</p>
<p>Worth a 15-minute call? Or if the timing is bad, just tell me and I will follow up later in the season.</p>
<p>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
);
