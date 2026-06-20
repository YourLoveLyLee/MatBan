/* =========================================================
   THE BLOCK COURT — Admin logic

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

const PIN_STORAGE_KEY = "blockcourt_pin";

/* =========================================================
   PIN GATE
   The PIN is checked by simply trying it against the Apps
   Script the first time the user adds something — but to
   keep the *gate itself* responsive (no network round trip
   just to unlock the screen), we accept any PIN that looks
   reasonable here and let the real check happen on submit.
   If the PIN is wrong, the form submission will say so and
   the gate re-locks so they can retry.
   ========================================================= */

const pinGate = document.getElementById("pin-gate");
const pinGateForm = document.getElementById("pin-gate-form");
const pinGateInput = document.getElementById("pin-gate-input");
const pinGateError = document.getElementById("pin-gate-error");
const pinRememberCheck = document.getElementById("pin-remember-check");
const adminMain = document.getElementById("admin-main");
const lockBtn = document.getElementById("lock-btn");

let currentPin = "";

function unlock(pin) {
  currentPin = pin;
  pinGate.classList.add("unlocking");
  setTimeout(() => {
    pinGate.classList.add("hidden");
    adminMain.classList.remove("hidden");
  }, 280);
}

function lock() {
  currentPin = "";
  pinGateInput.value = "";
  pinGateError.textContent = "";
  adminMain.classList.add("hidden");
  pinGate.classList.remove("hidden", "unlocking");
  pinGateInput.focus();
}

function showGateError(msg) {
  pinGateError.textContent = msg;
  pinGate.querySelector(".pin-gate-card").classList.add("shake");
  setTimeout(() => pinGate.querySelector(".pin-gate-card").classList.remove("shake"), 400);
}

// Pre-fill remembered PIN
const savedPin = localStorage.getItem(PIN_STORAGE_KEY);
if (savedPin) {
  pinGateInput.value = savedPin;
}

pinGateForm.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const pin = pinGateInput.value.trim();
  if (!pin) {
    showGateError("Enter your PIN to continue.");
    return;
  }
  if (pinRememberCheck.checked) {
    localStorage.setItem(PIN_STORAGE_KEY, pin);
  } else {
    localStorage.removeItem(PIN_STORAGE_KEY);
  }
  unlock(pin);
});

lockBtn.addEventListener("click", () => {
  lock();
});

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
        body: JSON.stringify({ pin: currentPin, sheet: sheetName, row }),
      });

      let result = null;
      try { result = await res.json(); } catch (_) { /* ignore parse issues */ }

      if (result && result.success === false) {
        if (/pin/i.test(result.error || "")) {
          // Wrong PIN — re-lock so they can retry instead of silently failing forever
          msgEl.textContent = "";
          localStorage.removeItem(PIN_STORAGE_KEY);
          lock();
          showGateError("Wrong PIN. Try again.");
        } else {
          msgEl.textContent = result.error || "Something went wrong.";
          msgEl.className = "form-message error";
        }
      } else {
        msgEl.textContent = "Added! Check the site in a minute.";
        msgEl.className = "form-message success";

        // Clear everything except a couple of repeatable fields
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
