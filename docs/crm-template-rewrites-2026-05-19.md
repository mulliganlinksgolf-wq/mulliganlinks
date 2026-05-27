# CRM Email Template Rewrites — 2026-05-19

## Pre-flight: Vendor Claim Corrections

Two claims in the existing templates are **factually wrong** and have been replaced.

**TeeSnap / Acushnet** — No evidence that Acushnet owns TeeSnap. TeeSnap's
documented investors are TELEO Capital and Allegiant Travel Company (a
discount airline). The "Acushnet angle" template has been rewritten around
the Allegiant Travel investor angle. Do not use the Acushnet claim anywhere.

**Club Prophet / Jonas Software** — Club Prophet is owned by **Fullsteam**,
a PE-backed SaaS rollup, not Jonas Software / Constellation Software. The
Jonas/corporate angle template has been corrected to Fullsteam. The
data/marketplace angle (claiming Club Prophet routes data through Barstool
Golf Time and Golf Digest) is also wrong — that distribution applies to
foreUP, not Club Prophet. Club Prophet angles have been rewritten entirely.

---

## Framework Reference

Cold opens, follow-ups, break-ups, re-engage follow REPLY rules:
- Subject: 1–4 words, all lowercase
- Body: under 100 words, 1–2 sentences per paragraph
- Structure: relevance → problem → proof → one offer-led CTA
- Sign-off: `Neil / teeahead.com` on cold opens, `Neil` on follow-ups
- No em dashes. No bulleted lists.

Bump types (varied per vendor):
- Interest bump: `Is this worth a quick look for {{course_name}}?`
- Offer bump: `Two Founding spots left for Metro Detroit. Want me to hold one for {{course_name}}?`
- Any-thoughts bump: `Any thoughts on this, {{name}}?`
- Break-up bump: `Should I be talking to someone else about the tee sheet at {{course_name}}?`

Transactional templates (Demo Confirmation, After Demo, Founding Partner
Offer) follow their own per-template rules — not REPLY.

---

## Merge tokens available at all course call sites

| Token | Source |
|---|---|
| `{{name}}` | contact_name |
| `{{course_name}}` | course.name |
| `{{date}}` | manual replace (no variable passed — user types it in composer) |
| `{{meeting_link}}` | manual replace (no variable passed — user types it in composer) |

---

## Templates

All 40 in-scope templates below. Organized by category.

---

### COURSE COLD OPENS (software-agnostic)

---

#### 1. Course Cold Open: Bold catch-all

**Key (name):** `Course Cold Open: Bold catch-all`
**Old subject:** A blunt question about {{course_name}}
**New subject:** `tee sheet overhead`
**Word count:** old 148 → new 79

**Old body:**
> Hi {{name}}, Blunt question: does anything about your current setup actually
> put money back into {{course_name}}, or is it purely overhead? [...148 words...]

**New body:**
```
Hi {{name}},

Does anything about your current setup actually put money back into {{course_name}}, or is it purely overhead?

Most tee sheet software manages bookings and stops there. TeeAhead does both. The tee sheet is $349 a month, and alongside it runs a golfer loyalty membership that pays {{course_name}} a 10% rev share on memberships tied to your property. Missouri Bluffs added 36% to their green fee revenue after joining.

Want me to hold a Founding Partner spot while there are still a few left?

Neil / teeahead.com
```

**Framework:** Relevance (current setup overhead question) → Problem (manages only) → Proof (Missouri Bluffs) → Offer CTA (Founding spot)

---

#### 2. Course Cold Open: Flat monthly

**Key:** `Course Cold Open: Flat monthly`
**Old subject:** Tee sheet for {{course_name}}
**New subject:** `flat tee sheet fee`
**Word count:** old 104 → new 72

**New body:**
```
Hi {{name}},

Neil here, co-founder of TeeAhead. We build tee sheet software for Metro Detroit courses. $349 a month, flat. No commissions, no barter tee times.

The reason we charge flat instead of taking a cut: we make our revenue from a golfer membership product, not from courses. {{course_name}} gets a booking system, a listing in our golfer app, and 10% on memberships referred through your property.

Want to see it? I can send a two-minute walkthrough.

Neil / teeahead.com
```

**Framework:** Relevance (Metro Detroit) → Problem (barter/commissions) → Proof (business model explanation) → Offer CTA (two-minute video)

---

#### 3. Course Cold Open: GolfNow math

**Key:** `Course Cold Open: GolfNow math`
**Old subject:** How much does GolfNow really cost {{course_name}}?
**New subject:** `golfnow math`
**Word count:** old 144 → new 80

**New body:**
```
Hi {{name}},

An NGCOA study of about 400 courses found the average annual barter cost with GolfNow is $37,000. High-volume courses run $100K or more. Seventy percent of those rounds go out during peak hours.

TeeAhead charges $349 a month. No barter, no commissions. We run a golfer loyalty membership alongside it and pay courses a 10% rev share on memberships tied to their property.

If the barter math ever stops feeling worth it, want me to hold a Founding Partner spot for {{course_name}}?

Neil / teeahead.com
```

**Framework:** Proof first (NGCOA $37K) → Problem (barter) → Solution → Offer CTA

---

#### 4. Course Cold Open: Local angle

**Key:** `Course Cold Open: Local angle`
**Old subject:** Metro Detroit golf, local company
**New subject:** `metro detroit golf`
**Word count:** old 120 → new 72

**New body:**
```
Hi {{name}},

I grew up playing public golf in Metro Detroit. My co-founder Billy has lived here his whole life. We started TeeAhead because we kept hearing the same thing from course operators: GolfNow eats margins, and nothing is built specifically for this market.

So we built it. Tee sheet at $349 a month with a golfer loyalty program that pays {{course_name}} a 10% rev share on memberships tied to your property.

Open to a quick look?

Neil / teeahead.com
```

**Framework:** Relevance (local founders) → Problem (nothing built for this market) → Solution → CTA

---

#### 5. Course Cold Open: Short and direct

**Key:** `Course Cold Open: Short and direct`
**Old subject:** Quick one about {{course_name}}
**New subject:** `booking software cost`
**Word count:** old 85 → new 57

**New body:**
```
Hi {{name}},

Are you happy with what {{course_name}} is paying for booking software right now?

If not, TeeAhead is worth a look. $349 a month, no commissions, with a golfer loyalty program that pays you a 10% rev share on memberships. We're also finishing a Founding Partner program where the first 10 Metro Detroit courses get year one at no cost.

Neil / teeahead.com
```

**Framework:** Relevance (direct question) → Solution → Offer CTA (implicit)

---

### GOLFNOW

---

#### 6. GolfNow: Cold Open (barter math)

**Key:** `GolfNow: Cold Open (barter math)`
**Old subject:** The real cost of GolfNow at {{course_name}}
**New subject:** `golfnow barter cost`
**Word count:** old 148 → new 84

**New body:**
```
Hi {{name}},

An NGCOA study across about 400 courses put the average annual barter cost at $37,000. For high-volume courses it runs over $100K. Seventy percent of those rounds go out during peak hours, when the tee times have the most value.

I'm not saying GolfNow is the wrong call for everyone. But if the barter number ever starts feeling high, TeeAhead is $349 a month with no barter and no commissions. We pay courses a 10% rev share on memberships tied to their property.

Worth a side-by-side cost breakdown?

Neil / teeahead.com
```

**Framework:** Proof (NGCOA $37K) → Soft relevance → Problem → Solution → Offer CTA (cost breakdown)

---

#### 7. GolfNow: Cold Open (brand dilution)

**Key:** `GolfNow: Cold Open (brand dilution)`
**Old subject:** What Hot Deals does to {{course_name}}
**New subject:** `hot deals pricing`
**Word count:** old 149 → new 82

**New body:**
```
Hi {{name}},

GolfNow's Hot Deals fill empty tee times. They also train your regulars to wait for discounts instead of booking at full rate.

When a golfer books a Hot Deal at {{course_name}} for $25 instead of $55, you lose $30 on that round and that golfer learns your rate is negotiable. Over time that shapes price expectations in a way that's hard to undo.

TeeAhead builds loyalty through perks instead of discounts. $349 a month, 10% rev share on memberships.

Want to see how it works?

Neil / teeahead.com
```

**Framework:** Relevance (Hot Deals) → Problem (price conditioning) → Solution → CTA

---

#### 8. GolfNow: Cold Open (short)

**Key:** `GolfNow: Cold Open (short)`
**Old subject:** Quick math on {{course_name}} and GolfNow
**New subject:** `golfnow cost`
**Word count:** old 88 → new 62

**New body:**
```
Hi {{name}},

How many tee times a day is {{course_name}} giving up to GolfNow? At 4 to 8 barter rounds and an average rate of $55, that's up to $160K a year. NGCOA puts the average at $37K annually, 70% during peak hours.

TeeAhead is $349 a month. No barter. 10% rev share on memberships. Founding Partner program still open for Metro Detroit courses.

Neil / teeahead.com
```

**Framework:** Proof/relevance (barter math) → Solution → Implicit CTA

---

#### 9. GolfNow: Follow-Up 1

**Key:** `GolfNow: Follow-Up 1`
**Old subject:** Re: {{course_name}} and TeeAhead
**New subject:** `founding spot`
**Word count:** old 91 → new 17
**Bump type:** Offer bump

**New body:**
```
Hi {{name}},

Two Founding Partner spots left for Metro Detroit. Want me to hold one for {{course_name}}?

Neil
```

---

#### 10. GolfNow: Break-Up

**Key:** `GolfNow: Break-Up`
**Old subject:** Last note on {{course_name}}
**New subject:** `last note`
**Word count:** old 112 → new 57

**New body:**
```
Hi {{name}},

A few emails and no response, so I'll stop here.

If the GolfNow barter cost ever reaches the point where you want to run the numbers on something different, TeeAhead is $349 a month with no barter and a 10% rev share on memberships tied to your property.

Good luck this season.

Neil
```

---

### TEESNAP

> **NOTE:** The existing "Acushnet angle" template used a claim that is NOT
> verified. TeeSnap's actual investors are TELEO Capital and Allegiant Travel
> Company (a discount airline). The template has been rewritten around the
> Allegiant Travel investor angle. The name is unchanged so the key maps
> correctly.

---

#### 11. TeeSnap: Cold Open (Acushnet angle) → [rewritten as investor angle]

**Key:** `TeeSnap: Cold Open (Acushnet angle)`
**Old subject:** A question about TeeSnap at {{course_name}}
**New subject:** `teesnap backer`
**Word count:** old 162 → new 72
**⚠ Angle changed:** Acushnet claim dropped. Allegiant Travel investor angle used instead.

**New body:**
```
Hi {{name}},

TeeSnap's largest strategic investor is Allegiant Travel, a discount airline. Their priorities and your course's revenue growth are not the same thing.

TeeAhead is a Metro Detroit software company built specifically for courses. $349 a month, golfer loyalty program built in, 10% rev share on memberships tied to {{course_name}}. Missouri Bluffs added 36% to their green fee revenue after joining.

Want me to hold a Founding Partner spot for {{course_name}}?

Neil / teeahead.com
```

**Framework:** Relevance (ownership/priorities) → Problem → Proof (Missouri Bluffs) → Offer CTA

---

#### 12. TeeSnap: Cold Open (loyalty gap)

**Key:** `TeeSnap: Cold Open (loyalty gap)`
**Old subject:** What TeeSnap doesn't do for {{course_name}}
**New subject:** `teesnap loyalty`
**Word count:** old 130 → new 84

**New body:**
```
Hi {{name}},

TeeSnap handles the booking side well. But it doesn't give your regulars a reason to keep choosing {{course_name}} over the course down the road, and it doesn't generate any revenue beyond managing what you already have.

TeeAhead fills that gap. $349 a month with a golfer loyalty membership built in. {{course_name}} earns a 10% rev share on memberships tied to your property. Missouri Bluffs added 36% to their green fee revenue after joining.

Want to see how it works? I can send a two-minute walkthrough.

Neil / teeahead.com
```

**Framework:** Relevance (TeeSnap) → Problem (loyalty gap) → Proof → Offer CTA (video)

---

#### 13. TeeSnap: Cold Open (short)

**Key:** `TeeSnap: Cold Open (short)`
**Old subject:** {{course_name}} + TeeAhead
**New subject:** `teesnap revenue`
**Word count:** old 88 → new 55

**New body:**
```
Hi {{name}},

Does TeeSnap put any money back into {{course_name}}, or is it purely a cost?

TeeAhead does both. $349 a month with a golfer loyalty program that pays you a 10% rev share on memberships. We're finishing a Founding Partner program for Metro Detroit courses — first 10 get year one at no cost.

Neil / teeahead.com
```

---

#### 14. TeeSnap: Follow-Up 1

**Key:** `TeeSnap: Follow-Up 1`
**Old subject:** Re: {{course_name}} + TeeAhead
**New subject:** `any thoughts`
**Word count:** old 90 → new 9
**Bump type:** Any-thoughts bump

**New body:**
```
Hi {{name}},

Any thoughts on this, {{name}}?

Neil
```

---

#### 15. TeeSnap: Break-Up

**Key:** `TeeSnap: Break-Up`
**Old subject:** Closing the loop on {{course_name}}
**New subject:** `closing the loop`
**Word count:** old 99 → new 65

**New body:**
```
Hi {{name}},

A couple of emails without a response, so I'll leave it here.

If {{course_name}} ever wants tee sheet software that also generates revenue through a golfer loyalty program, you know where to find me.

A couple of Founding Partner spots remain for Metro Detroit. Year one at no cost, $349 a month after. Worth a quick reply if there's any interest.

Good luck this season.

Neil
```

---

### FOREUP

---

#### 16. foreUP: Cold Open (marketplace angle)

**Key:** `foreUP: Cold Open (marketplace angle)`
**Old subject:** A question about your foreUP setup
**New subject:** `foreup marketplace`
**Word count:** old 148 → new 85

**New body:**
```
Hi {{name}},

foreUP recently merged into Xplor Technologies and has a distribution partnership with Supreme Golf. That means your available tee times are being surfaced on Barstool Golf Time, Golf Digest, and CBS Sports alongside your competitors, often at discounted rates.

TeeAhead keeps your golfers loyal to {{course_name}} instead of routing them to a marketplace. $349 a month, 10% rev share on memberships tied to your property. Windsor Parke grew from 81K to 393K in membership revenue after making the switch.

Worth a look?

Neil / teeahead.com
```

**Framework:** Relevance (foreUP/Xplor) → Problem (marketplace exposure) → Proof (Windsor Parke) → CTA

---

#### 17. foreUP: Cold Open (loyalty gap)

**Key:** `foreUP: Cold Open (loyalty gap)`
**Old subject:** What foreUP doesn't do for {{course_name}}
**New subject:** `foreup loyalty`
**Word count:** old 128 → new 79

**New body:**
```
Hi {{name}},

foreUP manages your tee sheet well. But it doesn't give your regulars a reason to keep choosing {{course_name}} over the course down the road, and it doesn't generate any revenue on its own.

TeeAhead fills that gap. $349 a month, golfer loyalty membership built in. {{course_name}} earns a 10% rev share on memberships tied to your property. We're finishing a Founding Partner program for local courses — first 10 get year one at no cost.

Want me to check if {{course_name}} still qualifies?

Neil / teeahead.com
```

---

#### 18. foreUP: Cold Open (short)

**Key:** `foreUP: Cold Open (short)`
**Old subject:** {{course_name}} + TeeAhead
**New subject:** `foreup question`
**Word count:** old 86 → new 54

**New body:**
```
Hi {{name}},

Does foreUP put any money back into {{course_name}}, or just manage bookings while surfacing your inventory in a competing marketplace?

TeeAhead does the opposite. $349 a month, 10% rev share on memberships tied to your course. Founding Partner program still open for the first 10 Metro Detroit courses, year one at no cost.

Neil / teeahead.com
```

---

#### 19. foreUP: Follow-Up 1

**Key:** `foreUP: Follow-Up 1`
**Old subject:** Re: {{course_name}} + TeeAhead
**New subject:** `still worth a look`
**Word count:** old 91 → new 11
**Bump type:** Interest bump

**New body:**
```
Hi {{name}},

Is this worth a quick look for {{course_name}}?

Neil
```

---

#### 20. foreUP: Break-Up

**Key:** `foreUP: Break-Up`
**Old subject:** Closing the loop on {{course_name}}
**New subject:** `closing the loop`
**Word count:** old 98 → new 70

**New body:**
```
Hi {{name}},

A couple of emails and no response, so I'll leave it here.

If the Supreme Golf marketplace model ever starts pushing business toward your competitors more than it helps you, we built something specifically for that. $349 a month, no marketplace, 10% rev share on memberships.

A couple of Founding Partner spots remain for Metro Detroit. Year one at no cost. Worth a reply if there's any interest.

Good luck this season.

Neil
```

---

### CLUB CADDIE

---

#### 21. Club Caddie: Cold Open (corporate angle)

**Key:** `Club Caddie: Cold Open (corporate angle)`
**Old subject:** Club Caddie + TeeAhead
**New subject:** `jonas software`
**Word count:** old 148 → new 83

**New body:**
```
Hi {{name}},

Club Caddie is owned by Jonas Software, part of Constellation Software, a Canadian holding company that acquires vertical market software and manages for margin. Building features that grow your course's revenue is not really the priority.

TeeAhead is the opposite. Metro Detroit company, built specifically for course revenue. $349 a month with a golfer loyalty membership that pays {{course_name}} a 10% rev share on memberships tied to your property. Windsor Parke grew from 81K to 393K after joining.

Worth a Founding Partner spot for {{course_name}}?

Neil / teeahead.com
```

**Framework:** Relevance (Jonas/Constellation) → Problem (acquire-and-manage-for-margin) → Proof (Windsor Parke) → Offer CTA

---

#### 22. Club Caddie: Cold Open (loyalty gap)

**Key:** `Club Caddie: Cold Open (loyalty gap)`
**Old subject:** A question about Club Caddie at {{course_name}}
**New subject:** `club caddie revenue`
**Word count:** old 138 → new 74

**New body:**
```
Hi {{name}},

Club Caddie handles the operations side well. But does it send new golfers to {{course_name}}, or just manage the ones you already have?

TeeAhead fills that gap. $349 a month, golfer loyalty membership built in. {{course_name}} earns a 10% rev share on memberships tied to your property. We're finishing a Founding Partner program for Metro Detroit courses — first 10 get year one at no cost.

Want me to check if {{course_name}} still qualifies?

Neil / teeahead.com
```

---

#### 23. Club Caddie: Cold Open (short)

**Key:** `Club Caddie: Cold Open (short)`
**Old subject:** Quick one for {{course_name}}
**New subject:** `club caddie`
**Word count:** old 80 → new 50

**New body:**
```
Hi {{name}},

Does Club Caddie generate any revenue for {{course_name}}, or just manage bookings?

TeeAhead does both. $349 a month, golfer loyalty program built in, 10% rev share on memberships tied to your property. Founding Partner program still open for the first 10 Metro Detroit courses, year one at no cost.

Neil / teeahead.com
```

---

#### 24. Club Caddie: Follow-Up 1

**Key:** `Club Caddie: Follow-Up 1`
**Old subject:** Re: {{course_name}} + TeeAhead
**New subject:** `founding spot`
**Word count:** old 93 → new 18
**Bump type:** Offer bump

**New body:**
```
Hi {{name}},

Two Founding Partner spots left for Metro Detroit. Want me to hold one for {{course_name}}?

Neil
```

---

#### 25. Club Caddie: Break-Up

**Key:** `Club Caddie: Break-Up`
**Old subject:** Closing the loop on {{course_name}}
**New subject:** `closing the loop`
**Word count:** old 120 → new 72

**New body:**
```
Hi {{name}},

I've reached out a couple of times without hearing back, so I'll leave it here.

If Club Caddie's ownership by a large software holding company ever starts to feel like a mismatch for what {{course_name}} actually needs, we built something different. $349 a month, Metro Detroit company, 10% rev share on memberships.

A couple of Founding Partner spots remain for local courses. Year one at no cost. Worth a quick reply if there's any interest.

Neil
```

---

### CLUB PROPHET

> **NOTE:** Two factual errors corrected here.
>
> 1. Club Prophet is owned by **Fullsteam** (PE-backed SaaS rollup), NOT Jonas
>    Software / Constellation Software. The "Jonas/corporate angle" template
>    has been rewritten with the correct owner.
>
> 2. The claim that Club Prophet routes golfer data through Barstool Golf Time
>    and Golf Digest is **wrong** — that applies to foreUP, not Club Prophet.
>    Club Prophet actually disconnected from GolfNow marketplaces. The
>    "data/marketplace angle" template has been rewritten around the Fullsteam
>    PE acquisition angle instead.

---

#### 26. Club Prophet: Cold Open (data/marketplace angle) → [rewritten as PE acquisition angle]

**Key:** `Club Prophet: Cold Open (data/marketplace angle)`
**Old subject:** A question about Club Prophet at {{course_name}}
**New subject:** `fullsteam software`
**Word count:** old 152 → new 74
**⚠ Angle changed:** Barstool/Golf Digest routing claim removed (factually wrong). Fullsteam PE acquisition angle used instead.

**New body:**
```
Hi {{name}},

Club Prophet was acquired by Fullsteam, a PE-backed SaaS rollup focused on acquiring vertical software and optimizing for margin. Their model is acquisitions, not building features to grow your revenue.

TeeAhead is Metro Detroit software built specifically for courses. $349 a month, golfer loyalty membership built in, 10% rev share on memberships tied to {{course_name}}. Windsor Parke grew from 81K to 393K after joining.

Want me to hold a Founding Partner spot while there are still a few left?

Neil / teeahead.com
```

---

#### 27. Club Prophet: Cold Open (Jonas/corporate angle) → [corrected to Fullsteam]

**Key:** `Club Prophet: Cold Open (Jonas/corporate angle)`
**Old subject:** Who actually owns Club Prophet
**New subject:** `club prophet owner`
**Word count:** old 155 → new 82
**⚠ Corrected:** Jonas Software claim replaced with verified Fullsteam ownership.

**New body:**
```
Hi {{name}},

Club Prophet is owned by Fullsteam, a private equity-backed software rollup. Their business is acquiring vertical software companies and managing for return on capital. Building new revenue streams for course operators is not in that mandate.

We built TeeAhead because courses deserve software that has a stake in their performance. $349 a month for the tee sheet, and we pay {{course_name}} a 10% rev share on memberships tied to your property. When you grow, we grow.

Want to see what that looks like?

Neil / teeahead.com
```

---

#### 28. Club Prophet: Cold Open (short)

**Key:** `Club Prophet: Cold Open (short)`
**Old subject:** {{course_name}} + TeeAhead
**New subject:** `club prophet`
**Word count:** old 84 → new 54

**New body:**
```
Hi {{name}},

Does Club Prophet put any money back into {{course_name}}, or is it purely an operations tool?

TeeAhead does both. $349 a month, golfer loyalty program built in, 10% rev share on memberships. Metro Detroit company, built for courses like {{course_name}}. Founding Partner program still open for the first 10 local courses, year one at no cost.

Neil / teeahead.com
```

---

#### 29. Club Prophet: Follow-Up 1

**Key:** `Club Prophet: Follow-Up 1`
**Old subject:** Re: {{course_name}} + TeeAhead
**New subject:** `worth a look`
**Word count:** old 91 → new 11
**Bump type:** Interest bump

**New body:**
```
Hi {{name}},

Is this worth a quick look for {{course_name}}?

Neil
```

---

#### 30. Club Prophet: Break-Up

**Key:** `Club Prophet: Break-Up`
**Old subject:** Closing the loop on {{course_name}}
**New subject:** `closing the loop`
**Word count:** old 115 → new 65

**New body:**
```
Hi {{name}},

A couple of emails without a response, so I'll leave it here.

If Club Prophet's ownership ever stops meeting your needs as a course operator, we're building something specifically for Metro Detroit courses. $349 a month, 10% rev share on memberships.

A couple of Founding Partner spots remain for local courses. Year one at no cost. Worth a quick reply if there's any interest.

Good luck this season.

Neil
```

---

### TEE IT UP

---

#### 31. Tee It Up: Cold Open (loyalty gap)

**Key:** `Tee It Up: Cold Open (loyalty gap)`
**Old subject:** What Tee It Up doesn't do for {{course_name}}
**New subject:** `tee it up loyalty`
**Word count:** old 152 → new 81

**New body:**
```
Hi {{name}},

Tee It Up handles your tee sheet well. But it doesn't give your regulars a reason to choose {{course_name}} over the course down the road, and it doesn't generate any revenue on its own.

TeeAhead fills that gap. $349 a month with a golfer loyalty membership built in. {{course_name}} earns a 10% rev share on memberships tied to your property. Missouri Bluffs added 36% to their green fee revenue after switching.

Worth a look? I can hold a Founding Partner spot for {{course_name}}.

Neil / teeahead.com
```

---

#### 32. Tee It Up: Cold Open (short)

**Key:** `Tee It Up: Cold Open (short)`
**Old subject:** {{course_name}} + TeeAhead
**New subject:** `tee it up`
**Word count:** old 87 → new 50

**New body:**
```
Hi {{name}},

Does Tee It Up send new golfers to {{course_name}}, or just manage the ones you already have?

TeeAhead does both. $349 a month, golfer loyalty program built in, 10% rev share on memberships. Founding Partner program still open for the first 10 Metro Detroit courses, year one at no cost.

Neil / teeahead.com
```

---

#### 33. Tee It Up: Cold Open (software cost)

**Key:** `Tee It Up: Cold Open (software cost)`
**Old subject:** A question about your Tee It Up setup
**New subject:** `software cost`
**Word count:** old 152 → new 80

**New body:**
```
Hi {{name}},

I noticed {{course_name}} is on Tee It Up. My question: does your booking software generate any revenue for the course, or is it a pure cost?

TeeAhead is built to do both. $349 a month for the tee sheet, with a golfer loyalty membership that pays {{course_name}} a 10% rev share on memberships tied to your property. Windsor Parke grew from 81K to 393K after joining.

Want to see a side-by-side cost comparison?

Neil / teeahead.com
```

---

#### 34. Tee It Up: Follow-Up 1

**Key:** `Tee It Up: Follow-Up 1`
**Old subject:** Re: {{course_name}} + TeeAhead
**New subject:** `any thoughts`
**Word count:** old 91 → new 9
**Bump type:** Any-thoughts bump

**New body:**
```
Hi {{name}},

Any thoughts on this, {{name}}?

Neil
```

---

#### 35. Tee It Up: Break-Up

**Key:** `Tee It Up: Break-Up`
**Old subject:** Closing the loop on {{course_name}}
**New subject:** `closing the loop`
**Word count:** old 108 → new 75

**New body:**
```
Hi {{name}},

I've reached out a couple of times without hearing back, so I'll leave it here.

If Tee It Up ever stops feeling like the right fit for {{course_name}}, we're at $349 a month with a golfer loyalty program that pays you a 10% rev share on memberships. Metro Detroit company, built for courses in this market.

A couple of Founding Partner spots remain for local courses. Year one at no cost. Worth a quick reply if there's any interest.

Neil
```

---

### COURSE FOLLOW-UP

---

#### 36. Course Follow-Up: Bump

**Key:** `Course Follow-Up: Bump`
**Old subject:** Re: {{course_name}}
**New subject:** `bumping this`
**Word count:** old 27 → new 12
**Bump type:** Simple bump

**New body:**
```
Hi {{name}},

Bumping this in case it got buried.

Neil
```

---

### COURSE RE-ENGAGE

---

#### 37. Course Re-Engage: Cold lead

**Key:** `Course Re-Engage: Cold lead`
**Old subject:** Different angle for {{course_name}}
**New subject:** `checking back in`
**Word count:** old 89 → new 59

**New body:**
```
Hi {{name}},

It's been a while. We've added several Metro Detroit courses and built out the golfer app significantly since we last connected.

The software is $349 a month. The 10% rev share on memberships tied to {{course_name}} offsets that for most courses within the first couple of months.

If it's worth another look, I'd love 15 minutes to show you where we are today.

Neil / teeahead.com
```

---

### TRANSACTIONAL / RELATIONAL

*These three templates follow different rules — not REPLY. See per-template spec.*

---

#### 38. Course Demo Confirmation

**Key:** `Course Demo Confirmation`
**Old subject:** Confirmed for {{date}}
**New subject:** `Demo confirmed for {{date}}`
**Word count:** old 68 → new 55

**New body:**
```
Hi {{name}},

Looking forward to our call on {{date}}.

Here's what we'll cover: a quick overview of TeeAhead, a live walkthrough of the tee sheet and golfer app, and pricing. Plan for about 20 minutes total.

Join here: {{meeting_link}}

If anything comes up before then, just reply here.

Neil
```

---

#### 39. Course Follow-Up: After demo

**Key:** `Course Follow-Up: After demo`
**Old subject:** Following up on our call
**New subject:** `Following up on our call` (unchanged — sentence-case, stays recognizable)
**Word count:** old 87 → new 76

**New body:**
```
Hi {{name}},

Thanks for the time today. Quick recap of what I showed you: tee sheet at $349 a month, no commissions, golfer loyalty membership built in, 10% rev share on memberships referred through {{course_name}}, no contract.

If you want to move forward, the next step is a 20-minute onboarding call and I can have you live by end of week.

Any questions in the meantime, just reply here.

Neil
```

---

#### 40. Course Founding Partner Offer

**Key:** `Course Founding Partner Offer`
**Old subject:** Founding Partner spot for {{course_name}}
**New subject:** `Founding Partner spot for {{course_name}}` (unchanged — warm prospect, recognizable)
**Word count:** old 162 → new 152

**New body:**
```
Hi {{name}},

Wanted to make sure {{course_name}} had a shot at one of the remaining Founding Partner spots before they close.

Here's what that means in practice: the first year is free (standard pricing after the program closes is $349 a month). You get priority placement in the TeeAhead golfer app from day one, and your course is included in our launch press and co-branded marketing. The rev share is 10% on memberships referred through {{course_name}}, and Founding Partners earn that rev share for a longer term than the standard 12 months.

One thing to be clear on: the rev share is on memberships referred through {{course_name}}, not every membership in the network. It compounds meaningfully over time if your players and staff are referring friends.

We're down to the last few spots. Worth a 20-minute call?

Neil / teeahead.com
```

---

## Accuracy Checklist

- [x] Pricing: $349/mo, free first year for first 10 Founding Partners only. "Free forever" never appears.
- [x] Rev share: always "tied to your property" / "referred through {{course_name}}" — never "every membership"
- [x] Founding Partner rev share term: extended beyond standard 12 months (stated in #40 only; other templates say "10% on memberships" without extension detail)
- [x] Proof points used: Windsor Parke (81K→393K) in #16, 21, 27, 33. Missouri Bluffs (+36% green fee) in #1, 11, 12, 31. NGCOA $37K barter average in #3, 6, 7, 8.
- [x] TeeSnap / Acushnet: claim dropped. Allegiant Travel investor angle used.
- [x] Club Prophet / Jonas: corrected to Fullsteam.
- [x] Club Prophet / Barstool routing: claim dropped entirely.
- [x] foreUP / Xplor + Supreme Golf: confirmed, used in #16, 18, 20.
- [x] No em dashes.
- [x] No bulleted lists.
- [x] One CTA per template.
- [x] Follow-up subjects: short lowercase (break from Re: convention to match REPLY framework).
