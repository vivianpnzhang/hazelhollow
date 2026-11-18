# Launch checklist 🌰

## 1. Fill in your details (5 minutes)
Open `js/config.js` and fill in:
- [ ] `CONTACT_EMAIL`
- [ ] `APPLY_FORM_URL` (see step 3)
- [ ] `FEEDBACK_FORM_URL` (see step 3)
- [ ] `SITE_URL` once you have your web address (step 5)
- [ ] `SQUIRREL_NAME` when you pick a name

Then in `data/codes.json`, change `HH-FOUNDER-CHANGE-ME` to a secret code only you know.

## 2. Check the name before buying anything
I have NOT checked any of these. Please do:
- [ ] Domains: is `hazelhollow.ca` / `.com` / `.app` free? (search at any registrar)
- [ ] Google "HazelHollow" and "Hazel Hollow", especially money or finance apps
- [ ] Search the App Store and Google Play for "HazelHollow"
- [ ] Search the **Canadian Trademarks Database** (Government of Canada, ised-isde.canada.ca) for "HazelHollow" and "Hazel Hollow"
- [ ] Check the name on LinkedIn, Instagram and TikTok before making pages

## 3. Make your two forms (Tally or Google Forms)
**Apply to the Founding Team** form fields:
- Name · School and program · Year · Email · LinkedIn link (optional)
- Which role: Founding Tester / Campus Ambassador
- A checkbox that is **NOT ticked by default**: "Yes, HazelHollow can email me about the Founding Team. I can unsubscribe any time." (Canada's anti-spam law, CASL)
- A checkbox: "It's okay to list my name, role and LinkedIn on the Founding Team wall" (optional)
- A **hidden field called `ref`** (in Tally: insert block → Hidden fields → name it `ref`)
- A link to your privacy policy

**Feedback** form: 5 short questions about this week's missions and the app.

Paste both links into `js/config.js`.

## 4. Put it online for free (about 10 minutes)
The easiest way, with no coding tools:
1. Go to **Netlify** (netlify.com) and sign up for a free account.
2. Open **Netlify Drop** (app.netlify.com/drop).
3. Drag the whole `hazel` folder onto the page. It's live in seconds at an address like `something.netlify.app`.
4. In Site settings, rename it (e.g. `hazelhollow.netlify.app`).
5. To update the site later, open your site → **Deploys** → drag the folder in again.

(Cloudflare Pages and GitHub Pages are also free and work the same way with this folder.)

## 5. Connect your own domain
1. Buy the domain you checked in step 2 (for a `.ca`, use a CIRA-certified registrar; you qualify as a Canadian resident).
2. In Netlify: **Domain management → Add a domain**, type it in, and follow the DNS steps it shows
   (usually you copy 1–2 records into your registrar's DNS page).
3. Wait up to a few hours. Netlify turns on HTTPS (the padlock) automatically.
4. Put the new address in `SITE_URL` in `js/config.js` and upload again.

## 6. Before you test with real people
- [ ] Open `/tests.html` on the live site: all checks should pass
- [ ] On your phone: open the site → Share → **Add to Home Screen**, then try it in airplane mode
- [ ] Turn on Reduce Motion (iPhone: Settings → Accessibility → Motion) and check that the leaves, blinking and tail stop
- [ ] Try Export, then Delete all my data

## 7. Legal (before you ever charge money)
- [ ] Have `privacy.html`, `terms.html` and `not-advice.html` reviewed (your school's legal clinic or entrepreneurship centre is a good free start)
- [ ] Keep the disclosure line in every team post (Competition Bureau guidance on endorsements)
- [ ] Only email people who ticked the CASL box
- [ ] Keep every number on the site real. The team count comes straight from `data/team.json`
