# HazelHollow 🌰

A cozy, free budgeting web app for students. Made by Vivian Zhang.
Plain HTML, CSS and JavaScript: no build tools, nothing to install.

## Preview on your laptop
In Terminal, inside this folder:

    python3 -m http.server 8000

Then open http://localhost:8000. On your phone (same Wi-Fi), use your laptop's
address instead of localhost, e.g. http://192.168.x.x:8000.

## Files you'll edit by hand

| File | What it's for |
| --- | --- |
| `js/config.js` | **Your details**: squirrel name, contact email, website address, Apply & feedback form links. |
| `data/team.json` | The Founding Team wall. Add only people who said yes. The landing page counts this list (real numbers only). |
| `data/codes.json` | One personal code per team member. Delete someone's entry to switch off their Pro. |
| `data/missions.json` | This week's 1–2 missions for the Tester Hub. Use a new `id` for every mission. |
| `data/costs.json` | Suggested student costs. Only official sources, with source, link and date. |

## Everything else

| File | What it's for |
| --- | --- |
| `index.html` | Landing page |
| `app.html` + `js/app.js` | The app (setup, weekly number, logging, jars, badges, recap, Pro, Tester Hub) |
| `js/budget.js` | **The weekly-number math.** The formula and a worked example are explained at the top. |
| `tests.html` | Opens in a browser and checks the math against 17 hand-worked examples. Run it after any math change. |
| `js/squirrel.js` | The squirrel's moods and outfits, the hollow decorations, the jar drawing |
| `js/cards.js` | Downloadable recap card, Founding Team card and share image |
| `js/site.js` | Shared menu, footer, falling leaves, invite links, offline mode |
| `about.html`, `join.html`, `team.html` | About, Join the Team, Founding Team wall |
| `privacy.html`, `terms.html`, `not-advice.html` | Legal drafts (need review, see LAUNCH.md) |
| `credits.html`, `CREDITS.md` | Where every font and image came from |
| `sw.js`, `manifest.webmanifest` | Make it work offline and installable ("Add to Home Screen") |

## How the weekly number works
weekly amount = (money now − bills due before the next money date − money in jars) ÷ weeks left

Example: $3,000 now, next money Jan 5 (48 days = 6.86 weeks), rent $800 on Dec 1 and Jan 1,
phone $50 on Dec 15 → ($3,000 − $1,650) ÷ 6.86 = **$196.88 this week**.
Spending you log this week comes off that. Overspending gently lowers next week's number.

## How invite links work
1. A team member's link looks like `https://yoursite/?ref=anna`.
2. When a friend opens it, the site saves "anna" **on the friend's own device** (nothing is sent anywhere).
3. If the friend clicks **Apply** on the Join page, the form link gets `?ref=anna` added.
4. In your form, add a **hidden field named `ref`**. The form fills it in automatically, so each
   application shows who invited them.

## About team codes (honest limitation)
Codes are in `data/codes.json`, which anyone could technically open in their browser. A determined
person could find a code. That's fine for a small volunteer team. If Pro is ever sold, codes would
need to be checked by a real server instead.

## Privacy
All money data is saved only in the person's browser (`localStorage`). There are no accounts, no
analytics, no cookies, and no third-party requests (fonts are stored in this folder).
