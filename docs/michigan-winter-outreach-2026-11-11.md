# Michigan winter course outreach — November 11, 2026

Eight templates were added to the configured TeeAhead CRM and read back successfully. Existing templates were preserved. No emails were sent or scheduled. The expandable usage guide on the email-template page is a local code change and needs deployment.

## Start here

Open a course in Admin → CRM, compose an email, and choose **Michigan Winter**. Use **01 Before spring** as the default opener. For courses you emailed earlier without a response, use **03 Earlier email unanswered** instead. Use **02 Pro shop workload** as an alternative for operations contacts. Choose one opener per course, not all three.

Before sending, review the contact history and opt-outs, confirm the name and course, and check the sender signature in preview. The composer fills `first_name` from the contact name and `sender_name` from the logged-in sender. Correct any remaining placeholders, or use “Hi,” if no personal name is known. Add one relevant, verified course detail where it helps. A public booking link alone does not establish the course's full software stack or contract.

## Follow-up plan

- First message: 01, 02, or 03, depending on the relationship.
- After 5–7 business days without a reply: 04 A useful comparison.
- After another 7–10 business days without a reply: 06 Leave it here, then stop.
- Use 05 Right person instead of a follow-up when responsibility is unclear.
- Use reply mode to preserve the subject and thread. Do not manually add a fake “Re:” to a new email.
- Any reply ends the no-response sequence. Handle the answer personally; honor a decline or opt-out and cancel any pending follow-ups.
- Only use 07 after they actually said offseason. Use 08 after a positive reply, preferably replacing its final question with two real available times in Eastern Time.

This is a starting cadence based on practical judgment, not a golf-specific research result. Earlier outreach counts; do not restart a sequence someone has already exhausted. These are manual templates, not an automated campaign or automatic suppression system.

## Why this approach

[Gong's analysis of 304,174 emails](https://www.gong.io/blog/this-surprising-cold-email-cta-will-help-you-book-a-lot-more-meetings) supports asking whether a cold prospect is interested before asking them to commit time. Here, the offer is a concrete comparison of cost, daily workflows, and transition work, with one easy interest question. This is a directional application of general B2B research, not a response-rate promise for Michigan golf courses.

[Belkins' 2026 research](https://belkins.io/blog/cold-email-response-rates) emphasizes targeting and consistent reply-rate measurement, and cautions that older open-based benchmarks cannot be compared directly with replies per total send. Start with 20–30 carefully researched courses as an operational pilot, using one contact per buying team. That small pilot will provide qualitative feedback, not a statistically proven winning template. Test owner/GM opener 01 against an appropriate comparable group, holding list quality, sender, and timing steady. Log delivered messages, positive replies, qualified conversations, bounces, and opt-outs; exclude automatic replies. Avoid treating opens as buying intent.

Wednesday or Thursday mornings in the recipient's local time are a reasonable starting test from Belkins' broad B2B findings, not a rule for golf operators. Respect the course's actual winter hours.

If silence continues, investigate delivery before rewriting repeatedly. [Google's sender guidelines](https://support.google.com/a/answer/81126?hl=en) explain authentication and sender reputation. Verify SPF/DKIM, DMARC alignment, bounces, the actual From address, and the reply mailbox. This work did not audit mailbox delivery, DNS, or historical reply synchronization.

## Keep the offer credible

The no-barter/no-booking-commission language matches the product positioning in `src/app/pricing/page.tsx` and `src/app/features/page.tsx`. Verify current written terms before sending. Processing costs and other software costs should be stated in any comparison; “no commissions” is not a claim that processing or all software is free. No customer results, migration guarantees, unsupported integrations, competitor deficiencies, or limited-time scarcity were added.

If someone accepts the one-page comparison offer, prepare it using current written terms. Cover price and what is included, payment processing and other charges, their actual daily workflows, must-keep features, data exports/migration feasibility, training, timing, and unresolved questions. Do not imply it is already complete or that fit has been confirmed.

## Exact templates

### Michigan Winter: 01 Cold Open - Before spring (recommended)

**Use:** New owner or GM contact. Default opener; choose this OR 02.

**Subject:** {{course_name}} before spring

Hi {{first_name}},

With Michigan's golf season winding down, this is a good time to look at what you'd want to run differently next spring at {{course_name}}.

I'm with TeeAhead, a Metro Detroit company building tee sheet and online booking software. Our model has no barter tee times or booking commissions.

I'd like to compare your current setup with ours: the cost, the day-to-day work, and what a change would actually involve for your staff.

Would that be worth a look this winter?

{{sender_name}}
TeeAhead

---

### Michigan Winter: 02 Cold Open - Pro shop workload

**Use:** Alternative opener for a pro shop or operations lead; do not send after 01.

**Subject:** next spring's pro shop

Hi {{first_name}},

When the pro shop gets busy at {{course_name}}, the booking system should take work off your staff's plate.

I'm with TeeAhead here in Metro Detroit. We build tee sheet and online booking software, and I'd like to show you how it handles an everyday booking, a change, and check-in. You can judge it against how your team works today.

With the season winding down, would that be worth comparing before spring?

{{sender_name}}
TeeAhead

---

### Michigan Winter: 03 Re-Engage - Earlier email unanswered

**Use:** An earlier email went unanswered; no prior conversation required. Check contact history and do not restart an exhausted sequence.

**Subject:** better timing for {{course_name}}?

Hi {{first_name}},

I emailed earlier about TeeAhead. With Michigan's season winding down, I thought the timing might be better for {{course_name}}.

We're a Metro Detroit tee sheet and online booking company with no barter tee times or booking commissions. I'd like to give you a clear comparison before next season, including what switching would mean for your staff.

Would you be open to taking a look this winter?

{{sender_name}}
TeeAhead

---

### Michigan Winter: 04 Follow-Up - A useful comparison

**Use:** First no-response follow-up, 5–7 business days after 01, 02, or 03. Use reply mode.

**Subject:** a practical comparison

Hi {{first_name}},

For {{course_name}}, I'd suggest comparing three things before considering a different tee sheet: the full cost, the tasks your staff handles every day, and the work needed to be ready for opening day.

I can put TeeAhead's side on one page so you have something useful to weigh against your current setup.

Would you like me to send that over?

{{sender_name}}
TeeAhead

---

### Michigan Winter: 05 Follow-Up - Right person

**Use:** Optional routing note when the decision-maker is unconfirmed; use instead of another follow-up, not as an extra touch. Use reply mode.

**Subject:** who handles the tee sheet?

Hi {{first_name}},

Who handles booking software decisions for {{course_name}}?

I'm with TeeAhead in Metro Detroit. I'd like to get a tee sheet comparison to the right person while next season's plans are taking shape.

{{sender_name}}
TeeAhead

---

### Michigan Winter: 06 Break-Up - Leave it here

**Use:** Final note 7–10 business days after the follow-up. Stop afterward; no automatic spring restart. Use reply mode.

**Subject:** leave it here

Hi {{first_name}},

I'll leave it here after this note.

If a tee sheet comparison becomes useful while you're planning next season at {{course_name}}, I'd be glad to pick this up.

If you'd rather I not follow up again, just let me know and I'll update my notes.

{{sender_name}}
TeeAhead

---

### Michigan Winter: 07 Re-Engage - Previously said offseason

**Use:** Only when the contact actually asked to revisit in the offseason. Confirm the conversation in CRM history.

**Subject:** the offseason conversation

Hi {{first_name}},

You mentioned the offseason would be a better time to talk about TeeAhead for {{course_name}}, so I'm following up now.

We can start with one booking workflow your team would want to improve and see whether there's enough value to consider a change before spring.

Is now a good time to pick that up?

{{sender_name}}
TeeAhead

---

### Michigan Winter: 08 Demo - After a positive reply

**Use:** Only after an interested reply. Use reply mode and replace the final question with two real available times when possible.

**Subject:** a closer look at TeeAhead

Hi {{first_name}},

Glad you're open to a look. Let's keep it to 15 minutes and focus on how {{course_name}} handles bookings today, what you'd want to improve, and whether TeeAhead fits.

I'll walk through the relevant workflow and the costs, and we can identify what would need checking before any change.

What day next week works best for you?

{{sender_name}}
TeeAhead

---

## Reproduce or verify the CRM install

The JSON manifest is the source of truth. Preview safely without credentials:

```bash
cd /Users/barris/Desktop/MulliganLinks
node scripts/seed-michigan-winter-templates.mjs
```

For the same intended TeeAhead project, this command inserts only missing templates and verifies every field. It refuses modified existing templates rather than overwriting human edits. Do not change the project ref without verifying the target environment.

```bash
cd /Users/barris/Desktop/MulliganLinks
node --env-file=.env.local scripts/seed-michigan-winter-templates.mjs --apply --project-ref=raqarpvbcdpgojcrmpyh
```

Secrets are read from `.env.local` and are never included in the template data or output. No new dependencies or schema changes are required.

## Verification performed

- Validated all eight IDs, unique names, and supported composer variables.
- Inserted eight active course templates and verified every stored field against the manifest.
- Repeated the installer: zero inserts and all eight verified, confirming repeat runs do not duplicate templates.
- Passed all eight live bodies through the actual composer HTML/plain-text conversion and back with sample recipient/sender variables.
- Script syntax and `git diff --check` passed.
- TypeScript and targeted ESLint were attempted but stopped after they stalled without diagnostics. Full app build and authenticated browser verification remain unverified. The usage guide needs deployment; the templates are already in the live database.
