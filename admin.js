/* =========================================================
   THE BLOCK COURT — Admin form logic

   Paste your Apps Script Web App URL below once you've
   deployed it (see SETUP-GUIDE.md, Part 2.5).
   ========================================================= */

const CONFIG = {
  webAppUrl: "", // paste your deployed Apps Script Web app URL here
};

const COLUMN_ORDER = {
  Schedule: ["Date", "Time", "TeamA", "TeamB", "Location", "Notes"],
  Results: ["Date", "TeamA", "ScoreA", "TeamB", "ScoreB"],
  Rosters: ["Team", "Player", "Number", "Position"],
  Announcements: ["Date", "Title", "Message"],
};

/* ===== Tabs ===== */

const tabs = document.querySelectorAll(".admin-tab");
const forms = document.querySelectorAll(".admin-form");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    forms.forEach((f) => f.classList.add("hidden"));
    document.getElementById(tab.dataset.target).classList.remove("hidden");
  });
});

/* ===== PIN memory (just convenience, not real security) ===== */

const savedPin = localStorage.getItem("blockcourt_pin");
if (savedPin) {
  document.querySelectorAll('input[name="pin"]').forEach((el) => (el.value = savedPin));
  document.getElementById("pin-status").textContent = "PIN remembered on this device.";
}

/* ===== Submit handling ===== */

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

forms.forEach((form) => {
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const msgEl = form.querySelector(".form-message");
    const submitBtn = form.querySelector(".admin-submit");
    const sheetName = form.dataset.sheet;

    if (!CONFIG.webAppUrl) {
      msgEl.textContent = "No Web App URL set yet — see SETUP-GUIDE.md Part 2.5.";
      msgEl.className = "form-message error";
      return;
    }

    const data = new FormData(form);
    const pin = data.get("pin");

    let row;
    if (sheetName === "Announcements") {
      row = [todayISO(), data.get("Title"), data.get("Message")];
    } else {
      row = COLUMN_ORDER[sheetName].map((col) => data.get(col) ?? "");
    }

    submitBtn.disabled = true;
    msgEl.textContent = "Sending…";
    msgEl.className = "form-message";

    try {
      const res = await fetch(CONFIG.webAppUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ pin, sheet: sheetName, row }),
      });

      let result = null;
      try { result = await res.json(); } catch (_) { /* ignore parse issues */ }

      if (result && result.success === false) {
        msgEl.textContent = result.error || "Something went wrong.";
        msgEl.className = "form-message error";
      } else {
        msgEl.textContent = "Added! Check the site in a minute.";
        msgEl.className = "form-message success";
        localStorage.setItem("blockcourt_pin", pin);

        // Clear everything except the PIN and a couple of repeatable fields
        form.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], input[type="time"], textarea').forEach((el) => {
          if (el.name !== "Location") el.value = "";
        });
      }
    } catch (err) {
      msgEl.textContent = "Couldn't reach the sheet. Check your internet and try again.";
      msgEl.className = "form-message error";
    } finally {
      submitBtn.disabled = false;
    }
  });
});
