[SETUP-GUIDE.md](https://github.com/user-attachments/files/29161856/SETUP-GUIDE.md)
# Setup Guide — The Block Court

Site: http://matban.mooo.com/

This site is ready to use right now with sample data. Follow the steps below to
connect it to your own Google Sheet so you (or anyone else) can update games,
scores, squads, and announcements just by typing into a spreadsheet — no code.

---

## Part 1 — Create your Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank sheet.
2. Rename it something like "Block Court Data."
3. Create **4 tabs** at the bottom, named exactly:
   - `Schedule`
   - `Results`
   - `Rosters`
   - `Announcements`

4. In each tab, add these exact column headers in row 1:

**Schedule tab**
| Date | Time | TeamA | TeamB | Location | Notes |
|---|---|---|---|---|---|
| 2026-06-27 | 6:00 PM | Block Party | Court Kings | Riverside Court | |

> Date must be in `YYYY-MM-DD` format (e.g. `2026-06-27`). Time should look like `6:00 PM`.

**Results tab**
| Date | TeamA | ScoreA | TeamB | ScoreB |
|---|---|---|---|---|
| 2026-06-13 | Block Party | 58 | Rim Reapers | 52 |

**Rosters tab**
| Team | Player | Number | Position |
|---|---|---|---|
| Block Party | Marcus J. | 23 | Forward |

**Announcements tab**
| Date | Title | Message |
|---|---|---|
| 2026-06-18 | New start time | Games start at 5:30 starting in July. |

Fill in a few real rows so there's something to see.

---

## Part 2 — Publish each tab to the web

You need to do this **once per tab** (4 times total).

1. In Google Sheets: **File → Share → Publish to web**.
2. In the dropdown, select the specific tab (e.g. "Schedule") — not "Entire Document."
3. Change the format dropdown to **Comma-separated values (.csv)**.
4. Click **Publish** → confirm.
5. Copy the link it gives you. It'll look like:
   `https://docs.google.com/spreadsheets/d/e/2PACX-xxxxxxx/pub?gid=0&single=true&output=csv`
6. Repeat for the other 3 tabs.

---

## Part 3 — Paste the links into the site

1. Open `script.js` in the website folder.
2. At the very top, find this block:

```js
const CONFIG = {
  scheduleCsvUrl: "",
  resultsCsvUrl: "",
  rostersCsvUrl: "",
  newsCsvUrl: "",
  facebookUrl: "https://facebook.com/",
};
```

3. Paste each published CSV link into the matching spot, and put your real
   Facebook page URL in `facebookUrl`. Example:

```js
const CONFIG = {
  scheduleCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-xxxx/pub?gid=0&single=true&output=csv",
  resultsCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-xxxx/pub?gid=111&single=true&output=csv",
  rostersCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-xxxx/pub?gid=222&single=true&output=csv",
  newsCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-xxxx/pub?gid=333&single=true&output=csv",
  facebookUrl: "https://facebook.com/yourpagehere",
};
```

4. Save the file.

From now on, **editing the Google Sheet is the only thing you ever need to do.**
Add a row for a new game, fill in a final score, add a player — the website
picks it up automatically (changes usually show within a minute or two).

---

## Part 4 — Put it on GitHub Pages

1. Create a new GitHub repository named exactly `your-username.github.io`.
2. Upload `index.html`, `style.css`, and `script.js` to it.
3. Go to **Settings → Pages** and confirm it's serving from the main branch.
4. Visit `your-username.github.io` — your site is live.

Once that's working, you can follow the is-a.dev steps from earlier to give it
a custom address like `webname.is-a.dev` instead.

---

## Notes

- If a CSV link is left blank in `CONFIG`, that section just shows the sample
  data — handy for testing before your sheet is ready.
- The "Next Up" card automatically finds whichever Schedule row is the
  soonest upcoming game — no manual work needed.
- Team names in the Rosters tab must match exactly how they appear in
  Schedule/Results if you want everything to line up visually (this is
  cosmetic only — nothing will break if they don't match).
