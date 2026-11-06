# Start here

The niche is chosen: **compliance expiry tracking for letting agents.** The
reasoning and the £10–20m maths are in `PLAN.md`. Read that first.

```
PLAN.md                       the decision, the maths, the 90-day plan
site/app.html                 the working tracker (your whole demo)
site/index.html               the offer page
site/style.css                shared styling
outreach/leads.py             builds your call list from OpenStreetMap
outreach/messages-lettings.md exactly what to say
```

Total cost so far: £0. Everything runs in a browser or the Python standard library.

---

## 1. Look at the demo (5 minutes)

```bash
cd site
python3 -m http.server 3000 --bind 0.0.0.0
```

Open `http://localhost:3000/app.html`. It comes preloaded with three example
properties. Delete them, add a real address you know and a real gas certificate
date, and watch it go red. That moment is your entire sales pitch: *"here is
what is already expired in your portfolio."*

It stores everything in your own browser — nothing is sent anywhere. Say that
out loud to prospects, because it is the answer to their first objection.

---

## 2. Build the call list (10 minutes)

```bash
cd outreach
python3 leads.py --niche estate_agent --area Manchester --out agents-manchester.csv
```

Add other towns and you have 100+ names in half an hour:

```bash
python3 leads.py --niche estate_agent --area Salford    --out agents-salford.csv
python3 leads.py --niche estate_agent --area Stockport  --out agents-stockport.csv
python3 leads.py --niche estate_agent --area Bolton     --out agents-bolton.csv
```

Other niches, if you ever want to re-test the decision:

```
plumber electrician dentist physio optician veterinary car_repair gym
hairdresser beauty estate_agent accountant solicitor cafe restaurant takeaway
```

Then filter the CSV down to the ones that matter:

- **50–500 properties.** Big enough to have the problem, small enough that the
  owner answers the phone. Under 50, a spreadsheet genuinely works.
- A direct phone number or a named director, not a `sales@` mailbox.
- Multi-branch chains go to the bottom of the list — they have procurement.

---

## 3. Make the calls (the only part that counts)

`outreach/messages-lettings.md`. Tuesday to Thursday, 9:30–11:00 or 14:00–16:00.

One question, no pitch:

> "When an EICR runs out on a property you manage, how do you currently find out?"

Then be quiet. Count how many say "spreadsheet" or "we don't really know".
`PLAN.md` gives you the kill criteria — fewer than 8 in 40 and you should re-pick
the niche, not push harder.

---

## 4. The 90-day shape

| Days | Do | Evidence you are on track |
|---|---|---|
| 1–14 | 40 conversations, no pitching | 8+ say the pain is real |
| 15–30 | 5 demos on *their* data | 3 will send 20 addresses |
| 31–60 | 3 paid trials at £1/property | 3 trials from 40 conversations |
| 61–90 | 2 paying agencies, time the manual work | £500–700/month |

Two agencies at 340 properties is roughly **£680/month** — your £300/week, with
room. From there it is a sales problem, not an idea problem.

---

## 5. Admin, in order

1. **Sole trader** with HMRC once money is coming in. Ten minutes online.
2. **ICO registration** (~£50/yr) once you hold real tenant data. Do this before
   the first trial, not after. It is the cheapest credibility you will ever buy.
3. **Ltd** at ~£30k profit, or as soon as a client asks you to sign anything.
4. **Terms that say you are not giving legal advice.** One page, plain English.
   The demo has the disclaimer; the contract needs it too.
5. **Receipts in one folder** from day one.

---

## 6. The failure mode, stated plainly

This fails for one of three reasons, and none of them are the product:

1. **You make 8 calls, get 3 voicemails, and decide the market has spoken.**
   40 conversations is the sample size. Not 8.
2. **You keep building the app instead of showing it.** The demo is already
   good enough to sell. Every hour spent on features before 5 conversations is
   an hour of procrastination with a technical excuse.
3. **You sell to the wrong person** — a negotiator who thinks it sounds great and
   has no budget. Ask for the owner or the person who handles compliance.

The upside case in `PLAN.md` is a lottery ticket. The floor case — a business you
own doing £10k+/month by 25 — is not. Protect the floor case first.

## Get it onto your GitHub

Everything is committed in this workspace, but this environment has no GitHub
credentials, so the push has to be run by you.

**1. Create the empty repo.** Go to https://github.com/new and name it `expiry`.
Leave "Add a README", .gitignore and licence **off** — the repo already has them.

**2. Authenticate once, in a terminal in this workspace.**

```bash
gh auth login          # GitHub.com -> HTTPS -> Login with a web browser
```

**3. Push.** `origin` is already set to https://github.com/Soso1311/expiry.git.

```bash
git push -u origin HEAD:main
```

`HEAD:main` publishes the current branch as `main` on the remote, so you don't
need to rename anything locally first.

From then on, a normal `git push` works from the `main` branch:

```bash
git checkout -b main --track origin/main
```
