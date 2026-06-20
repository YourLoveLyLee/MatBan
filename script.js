/* =========================================================
   THE BLOCK COURT — site data + rendering

   HOW TO CONNECT YOUR OWN GOOGLE SHEET:
   See SETUP-GUIDE.md for the full walkthrough. Once your
   sheet is published, paste the 4 CSV links below. Leave
   any of them blank to keep showing the sample data for
   that section.
   ========================================================= */

const CONFIG = {
  scheduleCsvUrl: "",      // paste your "Schedule" tab CSV link here
  resultsCsvUrl: "",       // paste your "Results" tab CSV link here
  rostersCsvUrl: "",       // paste your "Rosters" tab CSV link here
  newsCsvUrl: "",          // paste your "Announcements" tab CSV link here
  facebookUrl: "https://facebook.com/", // your Facebook page link
};

/* ===== Sample data (shown until you connect a real sheet) ===== */

const SAMPLE_SCHEDULE = [
  { Date: "2026-06-27", Time: "6:00 PM", TeamA: "Block Party", TeamB: "Court Kings", Location: "Riverside Court", Notes: "" },
  { Date: "2026-07-04", Time: "5:30 PM", TeamA: "Rim Reapers", TeamB: "Block Party", Location: "Riverside Court", Notes: "Holiday weekend — bring water" },
  { Date: "2026-07-11", Time: "6:00 PM", TeamA: "Court Kings", TeamB: "Rim Reapers", Location: "Riverside Court", Notes: "" },
];

const SAMPLE_RESULTS = [
  { Date: "2026-06-13", TeamA: "Block Party", ScoreA: "58", TeamB: "Rim Reapers", ScoreB: "52" },
  { Date: "2026-06-06", TeamA: "Court Kings", ScoreA: "61", TeamB: "Block Party", ScoreB: "64" },
];

const SAMPLE_ROSTERS = [
  { Team: "Block Party", Player: "Marcus J.", Number: "23", Position: "Forward" },
  { Team: "Block Party", Player: "Dre T.", Number: "7", Position: "Guard" },
  { Team: "Block Party", Player: "Lil Cee", Number: "11", Position: "Guard" },
  { Team: "Court Kings", Player: "Tony R.", Number: "5", Position: "Center" },
  { Team: "Court Kings", Player: "Jamal B.", Number: "14", Position: "Forward" },
  { Team: "Rim Reapers", Player: "Eddie V.", Number: "3", Position: "Guard" },
  { Team: "Rim Reapers", Player: "Big Pete", Number: "44", Position: "Center" },
];

const SAMPLE_NEWS = [
  { Date: "2026-06-18", Title: "New start time for July games", Message: "Games starting July 4th will kick off at 5:30 instead of 6 — beat the heat." },
  { Date: "2026-06-10", Title: "Court Kings need a sub", Message: "Looking for one more player for next Saturday. Hit up the page if you're free." },
];

/* ===== Helpers ===== */

function parseTimeTo24h(timeStr) {
  if (!timeStr) return { h: 23, m: 59 };
  const match = String(timeStr).trim().match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])?/);
  if (!match) return { h: 23, m: 59 };
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return { h, m };
}

function toDateObj(dateStr, timeStr) {
  if (!dateStr) return null;
  const { h, m } = parseTimeTo24h(timeStr);
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  d.setHours(h, m, 0, 0);
  return d;
}

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
}

function daysUntil(dateObj) {
  const now = new Date();
  const diffMs = dateObj.setHours(0,0,0,0) - new Date(now).setHours(0,0,0,0);
  return Math.round(diffMs / 86400000);
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/* ===== Data loading ===== */

function fetchCsv(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: () => resolve(null),
    });
  });
}

async function loadAll() {
  const [schedule, results, rosters, news] = await Promise.all([
    fetchCsv(CONFIG.scheduleCsvUrl),
    fetchCsv(CONFIG.resultsCsvUrl),
    fetchCsv(CONFIG.rostersCsvUrl),
    fetchCsv(CONFIG.newsCsvUrl),
  ]);

  renderNextUp(schedule || SAMPLE_SCHEDULE);
  renderSchedule(schedule || SAMPLE_SCHEDULE);
  renderResults(results || SAMPLE_RESULTS);
  renderRosters(rosters || SAMPLE_ROSTERS);
  renderNews(news || SAMPLE_NEWS);

  const fbLink = document.getElementById("facebook-link");
  if (fbLink && CONFIG.facebookUrl) fbLink.href = CONFIG.facebookUrl;
}

/* ===== Renderers ===== */

function renderNextUp(schedule) {
  const el = document.getElementById("next-up-card");
  const now = new Date();

  const upcoming = schedule
    .map((g) => ({ ...g, _date: toDateObj(g.Date, g.Time) }))
    .filter((g) => g._date && g._date >= now)
    .sort((a, b) => a._date - b._date);

  if (upcoming.length === 0) {
    el.innerHTML = `<p class="empty-state">No games on the books yet — check back soon.</p>`;
    return;
  }

  const next = upcoming[0];
  const days = daysUntil(new Date(next._date));
  const countdownLabel = days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`;

  el.innerHTML = `
    <div class="next-up-top">
      <span class="next-up-when">${formatDateDisplay(next.Date)} &middot; ${escapeHtml(next.Time || "")}</span>
      <span class="next-up-countdown">${countdownLabel}</span>
    </div>
    <p class="next-up-matchup">${escapeHtml(next.TeamA)}<span class="next-up-vs">VS</span>${escapeHtml(next.TeamB)}</p>
    <p class="next-up-meta">${escapeHtml(next.Location || "")}${next.Notes ? " &middot; " + escapeHtml(next.Notes) : ""}</p>
  `;
}

function renderSchedule(schedule) {
  const el = document.getElementById("schedule-list");
  const now = new Date();

  const upcoming = schedule
    .map((g) => ({ ...g, _date: toDateObj(g.Date, g.Time) }))
    .filter((g) => g._date && g._date >= now)
    .sort((a, b) => a._date - b._date);

  if (upcoming.length === 0) {
    el.innerHTML = `<p class="empty-state">Nothing scheduled right now.</p>`;
    return;
  }

  el.innerHTML = upcoming.map((g) => `
    <div class="game-card">
      <p class="date">${formatDateDisplay(g.Date)} &middot; ${escapeHtml(g.Time || "")}</p>
      <p class="matchup">${escapeHtml(g.TeamA)}<span class="vs">vs</span>${escapeHtml(g.TeamB)}</p>
      <p class="meta">${escapeHtml(g.Location || "")}</p>
      ${g.Notes ? `<p class="notes">${escapeHtml(g.Notes)}</p>` : ""}
    </div>
  `).join("");
}

function renderResults(results) {
  const el = document.getElementById("results-list");

  const sorted = results
    .filter((r) => r.Date)
    .sort((a, b) => new Date(b.Date) - new Date(a.Date));

  if (sorted.length === 0) {
    el.innerHTML = `<p class="empty-state">No games played yet.</p>`;
    return;
  }

  el.innerHTML = sorted.map((r) => {
    const scoreA = parseInt(r.ScoreA, 10);
    const scoreB = parseInt(r.ScoreB, 10);
    const aWins = scoreA > scoreB;
    const bWins = scoreB > scoreA;
    return `
      <div class="result-row">
        <span class="result-date">${formatDateDisplay(r.Date)}</span>
        <span class="result-score">
          <span class="team-name ${aWins ? "winner" : bWins ? "loser" : ""}">${escapeHtml(r.TeamA)}</span>
          <span class="score-num">${escapeHtml(r.ScoreA)}</span>
          <span class="dash">&ndash;</span>
          <span class="score-num">${escapeHtml(r.ScoreB)}</span>
          <span class="team-name ${bWins ? "winner" : aWins ? "loser" : ""}">${escapeHtml(r.TeamB)}</span>
        </span>
      </div>
    `;
  }).join("");
}

function renderRosters(rosters) {
  const el = document.getElementById("rosters-list");

  const byTeam = {};
  rosters.forEach((row) => {
    if (!row.Team) return;
    if (!byTeam[row.Team]) byTeam[row.Team] = [];
    byTeam[row.Team].push(row);
  });

  const teamNames = Object.keys(byTeam);
  if (teamNames.length === 0) {
    el.innerHTML = `<p class="empty-state">No squads added yet.</p>`;
    return;
  }

  el.innerHTML = teamNames.map((team) => `
    <div class="team-card">
      <h3>${escapeHtml(team)}</h3>
      <ul class="player-list">
        ${byTeam[team].map((p) => `
          <li class="player-chip">
            ${p.Number ? `<span class="player-number">#${escapeHtml(p.Number)}</span>` : ""}
            <span>${escapeHtml(p.Player)}</span>
            ${p.Position ? `<span class="player-position">${escapeHtml(p.Position)}</span>` : ""}
          </li>
        `).join("")}
      </ul>
    </div>
  `).join("");
}

function renderNews(news) {
  const el = document.getElementById("news-list");

  const sorted = news
    .filter((n) => n.Date)
    .sort((a, b) => new Date(b.Date) - new Date(a.Date));

  if (sorted.length === 0) {
    el.innerHTML = `<p class="empty-state">No updates yet.</p>`;
    return;
  }

  el.innerHTML = sorted.map((n) => `
    <div class="news-item">
      <p class="news-date">${formatDateDisplay(n.Date)}</p>
      <p class="news-title">${escapeHtml(n.Title)}</p>
      <p class="news-message">${escapeHtml(n.Message)}</p>
    </div>
  `).join("");
}

loadAll();
