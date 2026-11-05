# The decision, and the honest maths

You asked me to pick. Here it is, with the reasoning and the numbers, so you can
argue with it rather than just take it.

---

## 1. The niche: compliance expiry tracking for letting agents

**What it is:** every letting agent in the UK has to hold a valid gas safety
certificate, an EICR every five years, an EPC, working alarms, a protected
deposit within 30 days and the prescribed documents served before move-in — for
every property they manage. Most of them track this in a spreadsheet that somebody
updates when they remember.

**Why I picked it over everything else:**

| Test | Why it passes |
|---|---|
| Is there money attached to failure? | Up to £30,000 civil penalty per breach per property, and an invalid Section 21 — which loses the *client*, not just the fine. |
| Can a 19-year-old reach the buyer? | Yes. Agency owner or director, on LinkedIn, in every high street. No procurement, no IT committee. |
| Is it recurring? | Certificates expire on a calendar. This is the definition of recurring revenue. |
| Does AI actually help? | Document extraction, date reconciliation, chasing. Real work, not a wrapper. |
| Can it scale past one city? | Same product, every town. Then every "regulated document with an expiry date" vertical. |
| Is the market big enough? | ~20,000 independent agencies managing ~5.5m homes. Average firm: ~340 properties. |

**Sources:** English Housing Survey 2024/25 (4.7m PRS households in England);
Housing, Communities and Local Government Committee, *Housing Conditions in the
Private Rented Sector* (£30,000 per breach per property); GoodLord *State of the
Lettings Industry 2025* (average firm 340 properties, 14 staff); Credas 2025
survey via Letting Agent Today (£16,000/yr compliance spend for a small agency);
Dwelly/TechTimes 2026 (~20,000 independent agencies, ~5.5m homes, ~£10bn commissions).

---

## 2. £2m and £15m are not the same business

This is the thing that matters most in this document.

- **£300/week** is *income*. You sell your hours to a local business. Ceiling:
  maybe £150k/year, and it stops the day you stop.
- **£2m** is a small *asset*. A £500k-ARR business at 4x, or a service company
  with £300k of profit at 6-7x SDE. Achievable solo in 4-6 years.
- **£10–20m** is an *equity event*. It is not "more of the same, harder". It
  requires a business that grows without you in the room, which means either
  hundreds of customers on a card mandate, or employees selling for you.

Working backwards from current UK multiples (median small SaaS sells around
2.5x–4x ARR under $1M; 4x–6x ARR at $1M–5M; see the arraycapital.com and
FE International data):

| Exit target | Multiple | ARR required | Paying agencies at £340/mo |
|---|---|---|---|
| £2m | 4x | £500k | ~120 |
| £10m | 4x | £2.5m | ~620 |
| £10m | 5x | £2m | ~490 |
| £20m | 5x | £4m | ~980 |
| £20m | 7x (only with NRR >110%, low churn) | £2.9m | ~700 |

**So the target is: 600–1,000 paying agencies, and the multiple you get is decided
by retention, not by hustle.** Every point of churn is worth more than every
extra hour you work. That is the whole game at this level.

Sanity check on the market: 1,000 agencies out of ~20,000 is **5% penetration**.
That is a real, hard, achievable number — not a fantasy, and not easy.

---

## 3. What that actually takes, per year

To reach 1,000 agencies in six years you need roughly:

- Year 1: **5–15 agencies** (£20k–£60k ARR). You, on the phone, solo. Do not hire.
- Year 2: **60–120 agencies** (£250k–£500k ARR). First two hires — one of them
  must be someone who can sell, not code.
- Year 3: **250–350** (£1m–£1.4m ARR). Team of 6–10. This is where most people
  stall, because you have to stop doing the work you are good at.
- Year 4–6: **600–1,000** (£2.5m–£4m ARR). 20–40 people, or a much smaller team
  if the product genuinely self-serves.

The shape is: **solo until £250k ARR, then hire sales before engineers.**

---

## 4. The wedge, and the trap

The trap is building a property management system. You will lose. Reapit and
Alto have 15,000+ branches and 25 years of integrations; agencies hate switching
core systems more than they hate being non-compliant.

**Sell the increment, not the replacement.** One screen, one job: what expires
next. It runs alongside their existing software. It takes a CSV to start. Nobody
has to migrate anything, so the buying decision is 15 minutes rather than a
six-month project.

Also be honest about the competitive weather: Dwelly has raised $170m to *buy*
letting agencies outright, and every incumbent is bolting AI onto compliance.
Your advantage is not the model — it is being a solo founder who will personally
import a 340-property portfolio on a Sunday for £340/month, which no funded
competitor can afford to do. That advantage expires. Use it to get to 100
agencies fast, then build the thing they cannot copy: the contractor network and
the expiry data.

---

## 5. The honest odds

I am not going to tell you this is likely.

Starting at 19 with no capital, £10–20m by 25 is roughly a **1-in-1,000 to
1-in-5,000** outcome. Not impossible — people do it — but the reason they do it
is almost never "worked harder than everyone else". It is a combination of a
market that happened to turn, distribution they got cheaply, and being in the
room when someone wrote a cheque. Effort is necessary and nowhere near sufficient.

What *is* likely if you execute this properly: a business you own doing
**£10k–£40k/month** by 25, worth **£500k–£2m**, which is financial independence at
an age most people are still renting. That is the floor case, and it is excellent.

The way to treat the £10–20m target is: **build the thing that makes the floor
case near-certain, and hold the upside as a lottery ticket you can afford.** If
you chase the £20m directly — raise money, hire 20 people, chase enterprise deals
at 20 years old with no track record — you mostly buy a higher chance of zero.

---

## 6. On "legal is enough"

You said you don't care about ethics as long as it's legal. I'll skip the sermon
and give you the practical version, because at this size it genuinely matters:

**Your exit is a diligence process, not a handshake.** An acquirer pays 4x ARR
because they believe the revenue will continue. So they look at churn, contracts,
complaints, staff turnover, and *you*. A pattern of sharp practice shows up as
churn and as a founder who cannot be trusted with a 24-month earn-out. Legal-but-
grubby is priced as risk, and risk is a discount.

**Your regulators are your customers' regulators.** You are handling tenant
personal data. That means UK GDPR, ICO registration, a lawful basis, retention
rules, and breach notification within 72 hours. Get this wrong and the fine is
not the problem — the client leaving is.

**Your market is small and gossipy.** Twenty thousand agencies, one trade press
title, one Facebook group per region. One agent who feels misled will tell all of
them, and you will never know why the phone stopped ringing.

So: ruthless is fine, silly is expensive. Be the person who answers the phone at
7pm and tells a client "you don't need this feature" — that is not ethics, that
is a compounding distribution strategy, and it is worth more than any growth hack
you could run at this stage.

---

## 7. 90 days, with kill criteria

**Days 1–14 — proof of pain, not product.**
Call or LinkedIn 40 Manchester agencies with one question: *"how do you currently
find out a certificate expired?"* Do not pitch. Write down the exact words they
use. Kill criteria: if fewer than 8 of 40 say "we don't really know / spreadsheet
/ someone remembers", the pain is not sharp enough and you pick a different niche.

**Days 15–30 — five demos on their own data.**
Ask each interested agency for a portfolio export or just 20 addresses. Import
them. Show them what is already expired. The demo in `site/app.html` is enough
for this — it is not a product, it is a mirror. Kill criteria: if nobody will
send 20 addresses, you have a nice idea and no urgency.

**Days 31–60 — three paid trials at £1/property, free for 30 days.**
Charge from day 31, even if it is £99. Free users lie to you about value.
Deliver manually: a weekly email you write by hand from their spreadsheet.
Kill criteria: fewer than 3 trials from 40 conversations means the pitch is
wrong, not the market.

**Days 61–90 — convert two, and time the manual work.**
Two paying agencies is £500–£700/month. That is your £300/week, done. Then
measure: how many minutes per agency per week does this cost you by hand? That
number is your product spec. Automate only what you have personally done 20 times.

**Then stop and re-decide.** At 90 days you will know more than any plan can
tell you. Either the number goes up or you change niche with 90 days of
sales experience you did not have.

---

## 8. What I would not do

- **Do not build the app before you have 5 conversations.** The demo exists to
  be shown, not to be finished.
- **Do not raise money at £0 ARR.** You will give away 20% for a valuation that
  makes the £20m target arithmetically impossible for you personally.
- **Do not take a co-founder because you are lonely.** Take one when you find
  someone who can do the half you cannot.
- **Do not chase enterprise or councils in year one.** 9-month sales cycles kill
  solo founders. Agencies with a card and a decision made in one meeting.
- **Do not optimise tax at £500/month.** Sole trader, receipts in one folder,
  revisit at £30k profit.
