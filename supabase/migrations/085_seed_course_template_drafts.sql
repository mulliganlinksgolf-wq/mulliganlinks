-- Step 6: Seed rewritten course templates as status='draft', version=2
-- Each draft is linked to its current active row via superseded_by (left NULL here;
-- the approval UI sets superseded_by when promoting draft → active).
-- Safe to re-run: ON CONFLICT DO NOTHING skips rows that already exist as drafts.
--
-- ROLLBACK:
--   delete from crm_email_templates
--     where status = 'draft' and version = 2 and record_type = 'course';

begin;

insert into crm_email_templates (name, subject, body_html, record_type, version, status)
values

-- =====================================================================
-- COURSE COLD OPENS (software-agnostic)
-- =====================================================================

(
  'Course Cold Open: Bold catch-all',
  'tee sheet overhead',
  '<p>Hi {{name}},</p>
<p>Does anything about your current setup actually put money back into {{course_name}}, or is it purely overhead?</p>
<p>Most tee sheet software manages bookings and stops there. TeeAhead does both. The tee sheet is $349 a month, and alongside it runs a golfer loyalty membership that pays {{course_name}} a 10% rev share on memberships tied to your property. Missouri Bluffs added 36% to their green fee revenue after joining.</p>
<p>Want me to hold a Founding Partner spot while there are still a few left?</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'Course Cold Open: Flat monthly',
  'flat tee sheet fee',
  '<p>Hi {{name}},</p>
<p>Neil here, co-founder of TeeAhead. We build tee sheet software for Metro Detroit courses. $349 a month, flat. No commissions, no barter tee times.</p>
<p>The reason we charge flat instead of taking a cut: we make our revenue from a golfer membership product, not from courses. {{course_name}} gets a booking system, a listing in our golfer app, and 10% on memberships referred through your property.</p>
<p>Want to see it? I can send a two-minute walkthrough.</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'Course Cold Open: GolfNow math',
  'golfnow math',
  '<p>Hi {{name}},</p>
<p>An NGCOA study of about 400 courses found the average annual barter cost with GolfNow is $37,000. High-volume courses run $100K or more. Seventy percent of those rounds go out during peak hours.</p>
<p>TeeAhead charges $349 a month. No barter, no commissions. We run a golfer loyalty membership alongside it and pay courses a 10% rev share on memberships tied to their property.</p>
<p>If the barter math ever stops feeling worth it, want me to hold a Founding Partner spot for {{course_name}}?</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'Course Cold Open: Local angle',
  'metro detroit golf',
  '<p>Hi {{name}},</p>
<p>I grew up playing public golf in Metro Detroit. My co-founder Billy has lived here his whole life. We started TeeAhead because we kept hearing the same thing from course operators: GolfNow eats margins, and nothing is built specifically for this market.</p>
<p>So we built it. Tee sheet at $349 a month with a golfer loyalty program that pays {{course_name}} a 10% rev share on memberships tied to your property.</p>
<p>Open to a quick look?</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'Course Cold Open: Short and direct',
  'booking software cost',
  '<p>Hi {{name}},</p>
<p>Are you happy with what {{course_name}} is paying for booking software right now?</p>
<p>If not, TeeAhead is worth a look. $349 a month, no commissions, with a golfer loyalty program that pays you a 10% rev share on memberships. We''re also finishing a Founding Partner program where the first 10 Metro Detroit courses get year one at no cost.</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

-- =====================================================================
-- GOLFNOW
-- =====================================================================

(
  'GolfNow: Cold Open (barter math)',
  'golfnow barter cost',
  '<p>Hi {{name}},</p>
<p>An NGCOA study across about 400 courses put the average annual barter cost at $37,000. For high-volume courses it runs over $100K. Seventy percent of those rounds go out during peak hours, when the tee times have the most value.</p>
<p>I''m not saying GolfNow is the wrong call for everyone. But if the barter number ever starts feeling high, TeeAhead is $349 a month with no barter and no commissions. We pay courses a 10% rev share on memberships tied to their property.</p>
<p>Worth a side-by-side cost breakdown?</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'GolfNow: Cold Open (brand dilution)',
  'hot deals pricing',
  '<p>Hi {{name}},</p>
<p>GolfNow''s Hot Deals fill empty tee times. They also train your regulars to wait for discounts instead of booking at full rate.</p>
<p>When a golfer books a Hot Deal at {{course_name}} for $25 instead of $55, you lose $30 on that round and that golfer learns your rate is negotiable. Over time that shapes price expectations in a way that''s hard to undo.</p>
<p>TeeAhead builds loyalty through perks instead of discounts. $349 a month, 10% rev share on memberships.</p>
<p>Want to see how it works?</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'GolfNow: Cold Open (short)',
  'golfnow cost',
  '<p>Hi {{name}},</p>
<p>How many tee times a day is {{course_name}} giving up to GolfNow? At 4 to 8 barter rounds and an average rate of $55, that''s up to $160K a year. NGCOA puts the average at $37K annually, 70% during peak hours.</p>
<p>TeeAhead is $349 a month. No barter. 10% rev share on memberships. Founding Partner program still open for Metro Detroit courses.</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'GolfNow: Follow-Up 1',
  'founding spot',
  '<p>Hi {{name}},</p>
<p>Two Founding Partner spots left for Metro Detroit. Want me to hold one for {{course_name}}?</p>
<p>Neil</p>',
  'course', 2, 'draft'
),

(
  'GolfNow: Break-Up',
  'last note',
  '<p>Hi {{name}},</p>
<p>A few emails and no response, so I''ll stop here.</p>
<p>If the GolfNow barter cost ever reaches the point where you want to run the numbers on something different, TeeAhead is $349 a month with no barter and a 10% rev share on memberships tied to your property.</p>
<p>Good luck this season.</p>
<p>Neil</p>',
  'course', 2, 'draft'
),

-- =====================================================================
-- TEESNAP
-- =====================================================================

(
  'TeeSnap: Cold Open (Acushnet angle)',
  'teesnap backer',
  '<p>Hi {{name}},</p>
<p>TeeSnap''s largest strategic investor is Allegiant Travel, a discount airline. Their priorities and your course''s revenue growth are not the same thing.</p>
<p>TeeAhead is a Metro Detroit software company built specifically for courses. $349 a month, golfer loyalty program built in, 10% rev share on memberships tied to {{course_name}}. Missouri Bluffs added 36% to their green fee revenue after joining.</p>
<p>Want me to hold a Founding Partner spot for {{course_name}}?</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'TeeSnap: Cold Open (loyalty gap)',
  'teesnap loyalty',
  '<p>Hi {{name}},</p>
<p>TeeSnap handles the booking side well. But it doesn''t give your regulars a reason to keep choosing {{course_name}} over the course down the road, and it doesn''t generate any revenue beyond managing what you already have.</p>
<p>TeeAhead fills that gap. $349 a month with a golfer loyalty membership built in. {{course_name}} earns a 10% rev share on memberships tied to your property. Missouri Bluffs added 36% to their green fee revenue after joining.</p>
<p>Want to see how it works? I can send a two-minute walkthrough.</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'TeeSnap: Cold Open (short)',
  'teesnap revenue',
  '<p>Hi {{name}},</p>
<p>Does TeeSnap put any money back into {{course_name}}, or is it purely a cost?</p>
<p>TeeAhead does both. $349 a month with a golfer loyalty program that pays you a 10% rev share on memberships. We''re finishing a Founding Partner program for Metro Detroit courses — first 10 get year one at no cost.</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'TeeSnap: Follow-Up 1',
  'any thoughts',
  '<p>Hi {{name}},</p>
<p>Any thoughts on this, {{name}}?</p>
<p>Neil</p>',
  'course', 2, 'draft'
),

(
  'TeeSnap: Break-Up',
  'closing the loop',
  '<p>Hi {{name}},</p>
<p>A couple of emails without a response, so I''ll leave it here.</p>
<p>If {{course_name}} ever wants tee sheet software that also generates revenue through a golfer loyalty program, you know where to find me.</p>
<p>A couple of Founding Partner spots remain for Metro Detroit. Year one at no cost, $349 a month after. Worth a quick reply if there''s any interest.</p>
<p>Good luck this season.</p>
<p>Neil</p>',
  'course', 2, 'draft'
),

-- =====================================================================
-- FOREUP
-- =====================================================================

(
  'foreUP: Cold Open (marketplace angle)',
  'foreup marketplace',
  '<p>Hi {{name}},</p>
<p>foreUP recently merged into Xplor Technologies and has a distribution partnership with Supreme Golf. That means your available tee times are being surfaced on Barstool Golf Time, Golf Digest, and CBS Sports alongside your competitors, often at discounted rates.</p>
<p>TeeAhead keeps your golfers loyal to {{course_name}} instead of routing them to a marketplace. $349 a month, 10% rev share on memberships tied to your property. Windsor Parke grew from 81K to 393K in membership revenue after making the switch.</p>
<p>Worth a look?</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'foreUP: Cold Open (loyalty gap)',
  'foreup loyalty',
  '<p>Hi {{name}},</p>
<p>foreUP manages your tee sheet well. But it doesn''t give your regulars a reason to keep choosing {{course_name}} over the course down the road, and it doesn''t generate any revenue on its own.</p>
<p>TeeAhead fills that gap. $349 a month, golfer loyalty membership built in. {{course_name}} earns a 10% rev share on memberships tied to your property. We''re finishing a Founding Partner program for local courses — first 10 get year one at no cost.</p>
<p>Want me to check if {{course_name}} still qualifies?</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'foreUP: Cold Open (short)',
  'foreup question',
  '<p>Hi {{name}},</p>
<p>Does foreUP put any money back into {{course_name}}, or just manage bookings while surfacing your inventory in a competing marketplace?</p>
<p>TeeAhead does the opposite. $349 a month, 10% rev share on memberships tied to your course. Founding Partner program still open for the first 10 Metro Detroit courses, year one at no cost.</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'foreUP: Follow-Up 1',
  'still worth a look',
  '<p>Hi {{name}},</p>
<p>Is this worth a quick look for {{course_name}}?</p>
<p>Neil</p>',
  'course', 2, 'draft'
),

(
  'foreUP: Break-Up',
  'closing the loop',
  '<p>Hi {{name}},</p>
<p>A couple of emails and no response, so I''ll leave it here.</p>
<p>If the Supreme Golf marketplace model ever starts pushing business toward your competitors more than it helps you, we built something specifically for that. $349 a month, no marketplace, 10% rev share on memberships.</p>
<p>A couple of Founding Partner spots remain for Metro Detroit. Year one at no cost. Worth a reply if there''s any interest.</p>
<p>Good luck this season.</p>
<p>Neil</p>',
  'course', 2, 'draft'
),

-- =====================================================================
-- CLUB CADDIE
-- =====================================================================

(
  'Club Caddie: Cold Open (corporate angle)',
  'jonas software',
  '<p>Hi {{name}},</p>
<p>Club Caddie is owned by Jonas Software, part of Constellation Software, a Canadian holding company that acquires vertical market software and manages for margin. Building features that grow your course''s revenue is not really the priority.</p>
<p>TeeAhead is the opposite. Metro Detroit company, built specifically for course revenue. $349 a month with a golfer loyalty membership that pays {{course_name}} a 10% rev share on memberships tied to your property. Windsor Parke grew from 81K to 393K after joining.</p>
<p>Worth a Founding Partner spot for {{course_name}}?</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'Club Caddie: Cold Open (loyalty gap)',
  'club caddie revenue',
  '<p>Hi {{name}},</p>
<p>Club Caddie handles the operations side well. But does it send new golfers to {{course_name}}, or just manage the ones you already have?</p>
<p>TeeAhead fills that gap. $349 a month, golfer loyalty membership built in. {{course_name}} earns a 10% rev share on memberships tied to your property. We''re finishing a Founding Partner program for Metro Detroit courses — first 10 get year one at no cost.</p>
<p>Want me to check if {{course_name}} still qualifies?</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'Club Caddie: Cold Open (short)',
  'club caddie',
  '<p>Hi {{name}},</p>
<p>Does Club Caddie generate any revenue for {{course_name}}, or just manage bookings?</p>
<p>TeeAhead does both. $349 a month, golfer loyalty program built in, 10% rev share on memberships tied to your property. Founding Partner program still open for the first 10 Metro Detroit courses, year one at no cost.</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'Club Caddie: Follow-Up 1',
  'founding spot',
  '<p>Hi {{name}},</p>
<p>Two Founding Partner spots left for Metro Detroit. Want me to hold one for {{course_name}}?</p>
<p>Neil</p>',
  'course', 2, 'draft'
),

(
  'Club Caddie: Break-Up',
  'closing the loop',
  '<p>Hi {{name}},</p>
<p>I''ve reached out a couple of times without hearing back, so I''ll leave it here.</p>
<p>If Club Caddie''s ownership by a large software holding company ever starts to feel like a mismatch for what {{course_name}} actually needs, we built something different. $349 a month, Metro Detroit company, 10% rev share on memberships.</p>
<p>A couple of Founding Partner spots remain for local courses. Year one at no cost. Worth a quick reply if there''s any interest.</p>
<p>Neil</p>',
  'course', 2, 'draft'
),

-- =====================================================================
-- CLUB PROPHET
-- =====================================================================

(
  'Club Prophet: Cold Open (data/marketplace angle)',
  'fullsteam software',
  '<p>Hi {{name}},</p>
<p>Club Prophet was acquired by Fullsteam, a PE-backed SaaS rollup focused on acquiring vertical software and optimizing for margin. Their model is acquisitions, not building features to grow your revenue.</p>
<p>TeeAhead is Metro Detroit software built specifically for courses. $349 a month, golfer loyalty membership built in, 10% rev share on memberships tied to {{course_name}}. Windsor Parke grew from 81K to 393K after joining.</p>
<p>Want me to hold a Founding Partner spot while there are still a few left?</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'Club Prophet: Cold Open (Jonas/corporate angle)',
  'club prophet owner',
  '<p>Hi {{name}},</p>
<p>Club Prophet is owned by Fullsteam, a private equity-backed software rollup. Their business is acquiring vertical software companies and managing for return on capital. Building new revenue streams for course operators is not in that mandate.</p>
<p>We built TeeAhead because courses deserve software that has a stake in their performance. $349 a month for the tee sheet, and we pay {{course_name}} a 10% rev share on memberships tied to your property. When you grow, we grow.</p>
<p>Want to see what that looks like?</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'Club Prophet: Cold Open (short)',
  'club prophet',
  '<p>Hi {{name}},</p>
<p>Does Club Prophet put any money back into {{course_name}}, or is it purely an operations tool?</p>
<p>TeeAhead does both. $349 a month, golfer loyalty program built in, 10% rev share on memberships. Metro Detroit company, built for courses like {{course_name}}. Founding Partner program still open for the first 10 local courses, year one at no cost.</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'Club Prophet: Follow-Up 1',
  'worth a look',
  '<p>Hi {{name}},</p>
<p>Is this worth a quick look for {{course_name}}?</p>
<p>Neil</p>',
  'course', 2, 'draft'
),

(
  'Club Prophet: Break-Up',
  'closing the loop',
  '<p>Hi {{name}},</p>
<p>A couple of emails without a response, so I''ll leave it here.</p>
<p>If Club Prophet''s ownership ever stops meeting your needs as a course operator, we''re building something specifically for Metro Detroit courses. $349 a month, 10% rev share on memberships.</p>
<p>A couple of Founding Partner spots remain for local courses. Year one at no cost. Worth a quick reply if there''s any interest.</p>
<p>Good luck this season.</p>
<p>Neil</p>',
  'course', 2, 'draft'
),

-- =====================================================================
-- TEE IT UP
-- =====================================================================

(
  'Tee It Up: Cold Open (loyalty gap)',
  'tee it up loyalty',
  '<p>Hi {{name}},</p>
<p>Tee It Up handles your tee sheet well. But it doesn''t give your regulars a reason to choose {{course_name}} over the course down the road, and it doesn''t generate any revenue on its own.</p>
<p>TeeAhead fills that gap. $349 a month with a golfer loyalty membership built in. {{course_name}} earns a 10% rev share on memberships tied to your property. Missouri Bluffs added 36% to their green fee revenue after switching.</p>
<p>Worth a look? I can hold a Founding Partner spot for {{course_name}}.</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'Tee It Up: Cold Open (short)',
  'tee it up',
  '<p>Hi {{name}},</p>
<p>Does Tee It Up send new golfers to {{course_name}}, or just manage the ones you already have?</p>
<p>TeeAhead does both. $349 a month, golfer loyalty program built in, 10% rev share on memberships. Founding Partner program still open for the first 10 Metro Detroit courses, year one at no cost.</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'Tee It Up: Cold Open (software cost)',
  'software cost',
  '<p>Hi {{name}},</p>
<p>I noticed {{course_name}} is on Tee It Up. My question: does your booking software generate any revenue for the course, or is it a pure cost?</p>
<p>TeeAhead is built to do both. $349 a month for the tee sheet, with a golfer loyalty membership that pays {{course_name}} a 10% rev share on memberships tied to your property. Windsor Parke grew from 81K to 393K after joining.</p>
<p>Want to see a side-by-side cost comparison?</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

(
  'Tee It Up: Follow-Up 1',
  'any thoughts',
  '<p>Hi {{name}},</p>
<p>Any thoughts on this, {{name}}?</p>
<p>Neil</p>',
  'course', 2, 'draft'
),

(
  'Tee It Up: Break-Up',
  'closing the loop',
  '<p>Hi {{name}},</p>
<p>I''ve reached out a couple of times without hearing back, so I''ll leave it here.</p>
<p>If Tee It Up ever stops feeling like the right fit for {{course_name}}, we''re at $349 a month with a golfer loyalty program that pays you a 10% rev share on memberships. Metro Detroit company, built for courses in this market.</p>
<p>A couple of Founding Partner spots remain for local courses. Year one at no cost. Worth a quick reply if there''s any interest.</p>
<p>Neil</p>',
  'course', 2, 'draft'
),

-- =====================================================================
-- COURSE FOLLOW-UP
-- =====================================================================

(
  'Course Follow-Up: Bump',
  'bumping this',
  '<p>Hi {{name}},</p>
<p>Bumping this in case it got buried.</p>
<p>Neil</p>',
  'course', 2, 'draft'
),

-- =====================================================================
-- COURSE RE-ENGAGE
-- =====================================================================

(
  'Course Re-Engage: Cold lead',
  'checking back in',
  '<p>Hi {{name}},</p>
<p>It''s been a while. We''ve added several Metro Detroit courses and built out the golfer app significantly since we last connected.</p>
<p>The software is $349 a month. The 10% rev share on memberships tied to {{course_name}} offsets that for most courses within the first couple of months.</p>
<p>If it''s worth another look, I''d love 15 minutes to show you where we are today.</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
),

-- =====================================================================
-- TRANSACTIONAL / RELATIONAL
-- =====================================================================

(
  'Course Demo Confirmation',
  'Demo confirmed for {{date}}',
  '<p>Hi {{name}},</p>
<p>Looking forward to our call on {{date}}.</p>
<p>Here''s what we''ll cover: a quick overview of TeeAhead, a live walkthrough of the tee sheet and golfer app, and pricing. Plan for about 20 minutes total.</p>
<p>Join here: {{meeting_link}}</p>
<p>If anything comes up before then, just reply here.</p>
<p>Neil</p>',
  'course', 2, 'draft'
),

(
  'Course Follow-Up: After demo',
  'Following up on our call',
  '<p>Hi {{name}},</p>
<p>Thanks for the time today. Quick recap of what I showed you: tee sheet at $349 a month, no commissions, golfer loyalty membership built in, 10% rev share on memberships referred through {{course_name}}, no contract.</p>
<p>If you want to move forward, the next step is a 20-minute onboarding call and I can have you live by end of week.</p>
<p>Any questions in the meantime, just reply here.</p>
<p>Neil</p>',
  'course', 2, 'draft'
),

(
  'Course Founding Partner Offer',
  'Founding Partner spot for {{course_name}}',
  '<p>Hi {{name}},</p>
<p>Wanted to make sure {{course_name}} had a shot at one of the remaining Founding Partner spots before they close.</p>
<p>Here''s what that means in practice: the first year is free (standard pricing after the program closes is $349 a month). You get priority placement in the TeeAhead golfer app from day one, and your course is included in our launch press and co-branded marketing. The rev share is 10% on memberships referred through {{course_name}}, and Founding Partners earn that rev share for a longer term than the standard 12 months.</p>
<p>One thing to be clear on: the rev share is on memberships referred through {{course_name}}, not every membership in the network. It compounds meaningfully over time if your players and staff are referring friends.</p>
<p>We''re down to the last few spots. Worth a 20-minute call?</p>
<p>Neil / teeahead.com</p>',
  'course', 2, 'draft'
)

on conflict do nothing;

commit;
