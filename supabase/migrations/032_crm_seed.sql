-- 032_crm_seed.sql
-- Seed data: 9 starter email templates

INSERT INTO crm_email_templates (name, subject, body_html, record_type) VALUES

-- Course templates
(
  'Course Intro Outreach',
  'Introducing TeeAhead — Your Course, More Rounds',
  '<p>Hi {{contact_name}},</p>
<p>My name is Neil Barris, co-founder of TeeAhead — we''re building a local golf loyalty network for metro Detroit golfers.</p>
<p>The concept is simple: golfers subscribe monthly and get exclusive benefits at our network of partner courses. We drive incremental rounds to your course at <strong>zero cost to you</strong>.</p>
<p>I''d love to share more about how it works and why courses like {{course_name}} are a great fit. Would you have 20 minutes this week for a quick call?</p>
<p>Best,<br>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'Follow-Up (No Response)',
  'Following up — TeeAhead Partnership',
  '<p>Hi {{contact_name}},</p>
<p>I wanted to follow up on my previous note about TeeAhead. I know your inbox stays full — just wanted to make sure this didn''t get buried.</p>
<p>We''re building a local golf membership network and {{course_name}} would be a natural fit. No fees, no technology lift on your end — just more members walking through your doors.</p>
<p>Happy to work around your schedule. Even a 15-minute call would be great.</p>
<p>Best,<br>Neil</p>',
  'course'
),

(
  'Demo Confirmation',
  'Confirmed: TeeAhead Demo — {{date}}',
  '<p>Hi {{contact_name}},</p>
<p>Looking forward to our demo on {{date}}. I''ll walk you through the TeeAhead platform and show you exactly how the member experience works from a course perspective.</p>
<p>Join link: {{meeting_link}}</p>
<p>Questions before then? Just reply to this email.</p>
<p>See you then,<br>Neil</p>',
  'course'
),

(
  'Founding Partner Offer',
  'Founding Partner Offer — Reserved for {{course_name}}',
  '<p>Hi {{contact_name}},</p>
<p>I''m reaching out to extend a Founding Partner invitation to {{course_name}}.</p>
<p>Founding Partners get locked-in terms, priority placement in our platform, and permanent "Founding Partner" recognition — in exchange for being an early believer in what we''re building.</p>
<p>I''ve attached our Founding Partner proposal. Happy to walk through it on a call if helpful.</p>
<p>Best,<br>Neil</p>',
  'course'
),

-- Outing templates
(
  'Outing Quote',
  'Your TeeAhead Outing Quote — {{event_date}}',
  '<p>Hi {{contact_name}},</p>
<p>Thanks for reaching out about an outing through TeeAhead! I''ve attached a quote based on the details you shared.</p>
<p>Please review and let me know if you''d like to make any adjustments — we can accommodate most requests. To lock in the date, we''ll need a 50% deposit.</p>
<p>Let me know if you have questions!</p>
<p>Best,<br>Neil<br>TeeAhead</p>',
  'outing'
),

(
  'Outing Confirmation',
  'Your Outing is Confirmed — {{event_date}} at {{course_name}}',
  '<p>Hi {{contact_name}},</p>
<p>Great news — your outing on {{event_date}} is officially confirmed at {{course_name}}!</p>
<p>I''ve attached your confirmation document with all the details. Please review and reach out with any questions.</p>
<p>We''ll be in touch a week before the event to confirm final headcount. Looking forward to a great day on the course!</p>
<p>Best,<br>Neil<br>TeeAhead</p>',
  'outing'
),

-- Member templates
(
  'Member Welcome',
  'Welcome to TeeAhead, {{name}}!',
  '<p>Hi {{name}},</p>
<p>Welcome to TeeAhead! We''re thrilled to have you as a member.</p>
<p>Here''s what you can expect:</p>
<ul>
<li>Access to exclusive member rates at our partner courses</li>
<li>Monthly barter credits to use toward rounds</li>
<li>Priority tee times at your home course</li>
</ul>
<p>Log in at teeahead.com to see available courses and book your first round. If you have any questions, just reply to this email — we''re here to help.</p>
<p>See you on the course,<br>Neil & Billy<br>TeeAhead Co-Founders</p>',
  'member'
),

(
  'Win-Back (Lapsed)',
  'We miss you at TeeAhead, {{name}}',
  '<p>Hi {{name}},</p>
<p>It''s been a while since we''ve seen you on the platform, and we wanted to reach out personally.</p>
<p>A lot has changed at TeeAhead — we''ve added new courses and improved the booking experience. We''d love to have you back.</p>
<p>If something wasn''t working for you, I''d genuinely love to hear it. Just reply to this email — I read every response.</p>
<p>Best,<br>Neil<br>TeeAhead Co-Founder</p>',
  'member'
),

(
  'Upgrade to Ace',
  'Upgrade to TeeAhead Ace — Unlock More',
  '<p>Hi {{name}},</p>
<p>You''ve been a great TeeAhead Eagle member — thank you for being part of our community.</p>
<p>I wanted to share what you''d unlock by upgrading to our Ace tier: higher monthly barter credits, access to premium-tier course rates, and early access to new features.</p>
<p>You can upgrade directly from your account at teeahead.com, or just reply here and I''ll take care of it for you.</p>
<p>Best,<br>Neil</p>',
  'member'
);
