# Expiry — compliance tracker for letting agents

**Live:** https://site-bfc5f09e02c34a4f8dace85a3b29b005.freebuff.page

A working demo of a compliance expiry tracker for UK letting agencies, plus the
offer page, the lead generator and the sales scripts needed to sell it.

Everything is static HTML, CSS and vanilla JS. No build step, no dependencies,
no framework. It runs from a file, a USB stick, or any static host.

---

## What's in here

```
site/
  index.html      the offer page (what a prospect sees first)
  app.html        the tracker — this is your demo, and your product prototype
  style.css       shared design system
  config.js       ← YOUR BRANDING LIVES HERE. Edit this one file.

outreach/
  leads.py             builds a call list of local businesses from OpenStreetMap
  messages-lettings.md what to say on the phone / LinkedIn / email
  messages.md          generic cold-outreach scripts (trades, other niches)

PLAN.md         the niche decision, the exit maths, the 90-day plan
START-HERE.md   what to do this week
```

---

## Run it

```bash
cd site
python3 -m http.server 3000
```

Then open <http://localhost:3000>. Use port 3000 or anything above 1024.

There is nothing to install. `leads.py` also needs only the Python standard
library — no `pip install`.

---

## Make it yours (2 minutes)

Open `site/config.js` and change:

| Field | What it does |
|---|---|
| `brand` | Your business name, in the nav, footer and page title |
| `town` | Your patch |
| `niche` | Who you sell to — shown in the hero |
| `perProperty` | Your price per property per month |
| `minMonthly` | Your floor price for small portfolios |
| `email` | Where enquiries go |
| `bookingUrl` | Optional Cal.com / Calendly link |
| `paymentUrl` | Optional Stripe Payment Link |

Reload. Both pages update. Nothing else needs editing.

The `[Your name]` in the index FAQ is the one remaining manual edit — it is
deliberate, because it should sound like you, not a config string.

---

## Deploy it free

Both pages are static, so anything that serves files works:

- **Cloudflare Pages** — connect the repo, no build command, output directory `site`
- **Netlify Drop** — drag the `site` folder onto <https://app.netlify.com/drop>
- **GitHub Pages** — Settings → Pages → deploy from branch, folder `/site`

The tracker stores everything in the visitor's own browser (`localStorage`).
Nothing is sent to a server, which is worth saying out loud to a prospect: it is
the answer to their first data-protection question.

---

## Push this to your own repo

This repo is already committed locally. To send it to GitHub / GitLab:

```bash
# create an empty repo on your host first, then:
git remote add origin https://github.com/Soso1311/expiry.git
git branch -M main
git push -u origin main
```

Use SSH (`git@github.com:...`) if you have a key set up, otherwise HTTPS and a
personal access token. Do not commit a token into any file in this repo.

If you would rather work from a fork of an existing repo, tell me the URL and I
will wire the remote for you.

---

## Working with clients

Before the first paid trial:

1. **ICO registration** (~£50/yr) — you are handling tenant data once a real
   portfolio is involved.
2. **One-page terms** stating clearly that this is a reminder system, not legal
   advice, and the agent remains responsible for compliance.
3. **A data handling answer you can say in one sentence.** For the trial it is:
   "It runs in your browser and nothing leaves your machine."

The demo carries a disclaimer at the bottom of `app.html`. Keep it.

---

## Importing a real portfolio

Portfolio import is built: paste rows or upload a CSV/TSV and the tracker maps
columns by name, parses UK day-first dates, Excel serial dates and "12 Mar 2023",
and reports which columns were not found. Anything the export did not contain shows
as "No data" rather than as missing, so a client is never wrongly accused.

The next build step is a CSV/TSV importer that maps an agency's export
(Alto / Reapit / Street / a spreadsheet) into properties. That is the feature
that turns a demo into something you can actually deliver a trial with.

---

## Licence

Yours. It is your business.
