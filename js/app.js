// =========================================================
// app.js — the HazelHollow app.
//
// Sections:
//   1. Saving on the device
//   2. Little helpers
//   3. Switching screens
//   4. Setup
//   5. Home (squirrel, weekly number, the math)
//   6. Logging spending
//   7. Jars (savings goals)
//   8. Check-ins, streaks, badges
//   9. Me (badges, recap, Pro, your data)
//  10. Pro: team codes
//  11. Tester Hub
//  12. Pro tools: roommate split, CSV import, themes, past semesters
//  13. Start the app
//
// Privacy: everything is saved ONLY in this browser (localStorage).
// Nothing about anyone's money is ever sent anywhere.
// =========================================================


// ---------- 1. SAVING ON THE DEVICE ----------
const STORE_KEY = "hazelhollow-v1";

function freshState() {
  return {
    version: 1,
    setup: null,        // { school, city, placeId, anchor, semesterStart }
    balance: null,      // { amount, date, ts }  money they had when they last told us
    nextMoney: null,    // { date, amount }
    bills: [],          // [{ id, name, amount, freq: monthly|weekly|once, day, date }]
    logs: [],           // [{ id, ts, date, kind: spend|income, category, amount, note }]
    goals: [],          // [{ id, name, target, saved }]
    checkins: [],       // ["2026-11-18", ...]
    badges: {},         // { badgeId: "date earned" }
    weeks: {},          // { "week start": allowance }  for the "stayed under" badge
    pro: null,          // { code, name, role, start, ref }
    missionsDone: {},   // { missionId: "date" }
    look: { theme: "autumn", outfit: "none", extras: [] },
    semesters: [],      // past semester summaries (Pro)
  };
}
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return saved ? Object.assign(freshState(), saved) : freshState();
  } catch (e) { return freshState(); }
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

let state = loadState();


// ---------- 2. LITTLE HELPERS ----------
const $ = function (id) { return document.getElementById(id); };
const today = function () { return Budget.todayStr(); };
const uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
function money(n, cents) {
  const v = Number(n) || 0;
  const s = Math.abs(v).toLocaleString("en-CA", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
  return (v < 0 ? "−$" : "$") + s;
}
function prettyDate(str, withYear) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: withYear ? "numeric" : undefined, weekday: withYear ? undefined : "short" });
}
function addDays(str, n) { return Budget.fromD(Budget.D(str) + n); }
function num(v) { const n = parseFloat(String(v).replace(/[$,\s]/g, "")); return isNaN(n) ? NaN : n; }
let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
}
function bounce() {
  const sq = document.querySelector(".home-scene .sq");
  if (!sq) return;
  sq.classList.remove("bounce"); void sq.offsetWidth; sq.classList.add("bounce");
}
function copyText(str) {
  (navigator.clipboard ? navigator.clipboard.writeText(str) : Promise.reject())
    .then(function () { toast("Copied!"); })
    .catch(function () { window.prompt("Copy this:", str); });
}
const isPro = function () { return !!state.pro; };
const CATEGORIES = [
  { id: "Coffee", icon: "coffee" }, { id: "Groceries", icon: "groceries" }, { id: "Takeout", icon: "takeout" },
  { id: "Transit", icon: "transit" }, { id: "Fun", icon: "fun" }, { id: "Other", icon: "other" },
];
const iconFor = function (cat) { return Icons.get((CATEGORIES.find(function (c) { return c.id === cat; }) || { icon: "other" }).icon); };
let costsData = null; // data/costs.json, loaded at start


// ---------- 3. SWITCHING SCREENS ----------
const RENDER = {};   // each screen adds its draw function here
let current = "home";
function show(name) {
  if (!state.setup && name !== "setup") name = "setup";
  current = name;
  document.querySelectorAll(".screen").forEach(function (s) { s.hidden = s.id !== "screen-" + name; });
  $("tabbar").hidden = name === "setup";
  document.querySelectorAll("#tabbar button").forEach(function (b) {
    const tabFor = { pro: "me", hub: "me", split: "me", import: "me", style: "me", recap: "me" }[name] || name;
    if (b.dataset.tab === tabFor) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  RENDER[name]();
  renderTopPills();
  window.scrollTo(0, 0);
}
document.querySelectorAll("#tabbar button").forEach(function (b) {
  b.addEventListener("click", function () { show(b.dataset.tab); });
});
function backButton() { return `<p style="margin:0 0 .25rem"><button class="ghost" onclick="show('me')">${Icons.get("back")} Back</button></p>`; }
function renderTopPills() {
  // A tiny golden hazelnut for Founding Team members (who also have Pro)
  $("top-pills").innerHTML = isPro() ? `<span class="pill gold" title="Founding Team · Pro">${Icons.get("star")} Team · Pro</span>` : "";
}


// ---------- 4. SETUP ----------
RENDER.setup = function () {
  const editing = !!state.setup;
  const s = state.setup || {};
  const bills = state.bills.length ? state.bills : [
    { id: uid(), name: "Rent", amount: "", freq: "monthly", day: 1 },
    { id: uid(), name: "Phone", amount: "", freq: "monthly", day: 15 },
    { id: uid(), name: "Transit pass", amount: "", freq: "monthly", day: 1 },
  ];
  const places = (costsData && costsData.places) || [];
  $("screen-setup").innerHTML = `
    ${editing ? backButton() : ""}
    <div class="center"><div style="width:140px;margin:0 auto">${Art.squirrel("happy", state.look.outfit)}</div></div>
    <h1 class="center">${editing ? "Edit your setup" : "Let's fill your hollow"}</h1>
    <p class="center muted">${editing ? "Change anything, then save." : "Under a minute. Everything stays on this device."}</p>
    <form id="setup-form" class="card" novalidate>
      <label for="s-school">Your school</label>
      <select id="s-school">
        <option value="">Choose…</option>
        ${places.map(function (p) { return `<option value="${p.id}" ${s.placeId === p.id ? "selected" : ""}>${esc(p.name)}</option>`; }).join("")}
        <option value="other" ${s.placeId === "other" ? "selected" : ""}>Another school</option>
      </select>
      <div id="s-other-wrap" ${s.placeId === "other" ? "" : "hidden"}>
        <label for="s-school-name">School name</label><input id="s-school-name" value="${esc(s.placeId === "other" ? s.school : "")}">
      </div>
      <label for="s-city">City</label><input id="s-city" value="${esc(s.city || "")}" placeholder="e.g. Waterloo, ON">

      <label for="s-money">How much money do you have right now?
        <span class="hint">Check your bank app. Include everything you'll live on until your next money comes in.</span></label>
      <div class="money"><input id="s-money" inputmode="decimal" value="${editing ? Budget.compute(state, today()).moneyNow : ""}" placeholder="0"></div>

      <div class="row">
        <div><label for="s-next-date">When does your next money come in?</label>
          <input id="s-next-date" type="date" value="${state.nextMoney ? state.nextMoney.date : ""}"></div>
        <div><label for="s-next-amt">About how much? <span class="hint">optional</span></label>
          <div class="money"><input id="s-next-amt" inputmode="decimal" value="${state.nextMoney && state.nextMoney.amount ? state.nextMoney.amount : ""}"></div></div>
      </div>
      <p class="hint">e.g. OSAP for next term, a summer job, help from family.</p>

      <h3 style="margin-top:1.2rem">Fixed bills</h3>
      <p class="hint">Things you must pay before your next money comes in. Leave an amount empty to skip it.</p>
      <div id="bill-rows"></div>
      <button type="button" class="secondary small" id="add-bill">+ Add a bill</button>
      <div id="suggestions"></div>

      <p id="setup-error" class="notice" hidden></p>
      <div class="actions"><button type="submit">${editing ? "Save changes" : "Show me my number"}</button></div>
    </form>`;

  const rows = $("bill-rows");
  bills.forEach(function (b) { rows.appendChild(billRow(b)); });
  $("add-bill").onclick = function () { rows.appendChild(billRow({ id: uid(), name: "", amount: "", freq: "monthly", day: 1 })); };
  $("s-school").onchange = function () {
    $("s-other-wrap").hidden = this.value !== "other";
    if (this.value && this.value !== "other" && !$("s-city").value) $("s-city").value = "Waterloo, ON";
    renderSuggestions();
  };
  renderSuggestions();
  $("setup-form").onsubmit = function (e) { e.preventDefault(); saveSetup(); };
};

// One bill row: name, amount, how often, and when
function billRow(b) {
  const div = document.createElement("div");
  div.className = "bill-row";
  div.dataset.id = b.id;
  div.innerHTML = `
    <input aria-label="Bill name" class="b-name" value="${esc(b.name)}" placeholder="Bill">
    <div class="money"><input aria-label="Amount" class="b-amt" inputmode="decimal" value="${b.amount === "" ? "" : esc(b.amount)}" placeholder="0"></div>
    <select aria-label="How often" class="b-freq">
      <option value="monthly" ${b.freq === "monthly" ? "selected" : ""}>Monthly</option>
      <option value="weekly" ${b.freq === "weekly" ? "selected" : ""}>Weekly</option>
      <option value="once" ${b.freq === "once" ? "selected" : ""}>One time</option>
    </select>
    <button type="button" class="ghost" aria-label="Remove bill">${Icons.get("close")}</button>
    <span class="b-when-wrap" style="grid-column:1/-1"></span>`;
  const whenWrap = div.querySelector(".b-when-wrap");
  function drawWhen() {
    const f = div.querySelector(".b-freq").value;
    whenWrap.innerHTML = f === "monthly"
      ? `<label class="when">Due on day <input class="b-day" type="number" min="1" max="31" value="${b.day || 1}" style="width:4.5rem"> of each month</label>`
      : `<label class="when">${f === "weekly" ? "First one on" : "Due on"} <input class="b-date" type="date" value="${b.date || today()}"></label>`;
  }
  div.querySelector(".b-freq").onchange = drawWhen;
  div.querySelector("button").onclick = function () { div.remove(); };
  drawWhen();
  return div;
}

// Suggested costs from official sources for the chosen school
function renderSuggestions() {
  const box = $("suggestions");
  const id = $("s-school").value;
  const place = costsData && costsData.places.find(function (p) { return p.id === id; });
  if (!place) { box.innerHTML = ""; return; }
  box.innerHTML = `<h3 style="margin-top:1.2rem">Suggested student costs</h3>` + place.items.map(function (it, i) {
    const src = it.url ? `<br><small>Source: <a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.source)}</a>, checked ${prettyDate(it.checked, true)}</small>` : "";
    let body = "";
    if (it.kind === "books") {
      body = `<strong>${esc(it.label)}:</strong> ${money(it.amount)} for ${esc(it.per)}, about ${money(it.perTerm)} a term.
        <button type="button" class="secondary small" data-sugg="${i}">Add ${money(it.perTerm)} as a one-time bill</button>`;
    } else if (it.kind === "groceries") {
      body = `<strong>${esc(it.label)}:</strong> ${money(it.amount)} for ${esc(it.per)}, about ${money(it.perMonth, true)} a month over 8 months.
        Groceries come out of your weekly number, so you don't need to add them as a bill.`;
    } else {
      body = `<strong>${esc(it.label)}:</strong> ${esc(it.note)}`;
    }
    return `<p class="source-note">${body}${src}</p>`;
  }).join("") + `<p class="hint">These are published estimates, not your real costs. You can change every number.</p>`;
  box.querySelectorAll("[data-sugg]").forEach(function (btn) {
    btn.onclick = function () {
      const it = place.items[Number(btn.dataset.sugg)];
      $("bill-rows").appendChild(billRow({ id: uid(), name: "Textbooks", amount: it.perTerm, freq: "once", date: today() }));
      btn.disabled = true; btn.textContent = "Added (set the date)";
    };
  });
}

function saveSetup() {
  const err = $("setup-error");
  const fail = function (msg) { err.textContent = msg; err.hidden = false; err.scrollIntoView({ block: "center" }); };
  const placeId = $("s-school").value;
  const place = costsData && costsData.places.find(function (p) { return p.id === placeId; });
  const school = placeId === "other" ? $("s-school-name").value.trim() : place ? place.name : "";
  const moneyNow = num($("s-money").value);
  const nextDate = $("s-next-date").value;
  const nextAmt = num($("s-next-amt").value);
  if (isNaN(moneyNow) || moneyNow < 0) return fail("Please enter how much money you have now (a number, like 2500).");
  if (!nextDate) return fail("Please choose when your next money comes in.");
  if (nextDate <= today()) return fail("Your next money date should be after today.");

  const bills = [];
  document.querySelectorAll("#bill-rows .bill-row").forEach(function (row) {
    const amount = num(row.querySelector(".b-amt").value);
    if (isNaN(amount) || amount <= 0) return; // skip empty bills
    const freq = row.querySelector(".b-freq").value;
    bills.push({
      id: row.dataset.id, name: row.querySelector(".b-name").value.trim() || "Bill", amount: amount, freq: freq,
      day: freq === "monthly" ? Math.min(31, Math.max(1, parseInt(row.querySelector(".b-day").value) || 1)) : undefined,
      date: freq !== "monthly" ? row.querySelector(".b-date").value || today() : undefined,
    });
  });

  const first = !state.setup;
  const oldMoney = first ? null : Budget.compute(state, today()).moneyNow;
  state.setup = Object.assign(state.setup || { anchor: today(), semesterStart: today() },
    { school: school, city: $("s-city").value.trim(), placeId: placeId });
  // Only reset the balance if it's new or they changed it
  if (first || Math.abs(moneyNow - oldMoney) >= 0.01) state.balance = { amount: moneyNow, date: today(), ts: Date.now() };
  state.nextMoney = { date: nextDate, amount: isNaN(nextAmt) ? null : nextAmt };
  state.bills = bills;
  save();
  if (first) checkIn();
  show("home");
  toast(first ? "Your hollow is ready!" : "Saved!");
}


// ---------- 5. HOME ----------
function mood(r) {
  const h = new Date().getHours();
  if (h >= 22 || h < 6) return "sleepy";
  if (r && r.left < 0) return "encourage";
  if (state.checkins.includes(today())) return "happy";
  return "calm";
}
function moodMessage(m, r) {
  const name = CONFIG.SQUIRREL_NAME;
  if (m === "sleepy") return name + " is asleep. See you tomorrow.";
  if (m === "encourage") return "We've got this. Fresh start next week.";
  if (m === "happy") return r.left > 0 ? "Nice check-in. Your stash is on track." : "Thanks for checking in.";
  return "Hi, I'm " + name + ".";
}

function homeScene(m) {
  const days = state.checkins.length;
  const items = Art.DECOR.filter(function (d) {
    return d.pro ? isPro() && state.look.extras.includes(d.id) : days >= d.days;
  });
  return `<div class="home-scene ${m === "sleepy" ? "night" : ""}" aria-label="The squirrel's tree-hollow home">
      <div class="inside"><div class="floor"></div></div>
      ${items.map(function (d) { return `<div class="item on" style="${d.style}" title="${d.name}">${d.svg}</div>`; }).join("")}
      <div class="sq">${Art.squirrel(m, isPro() ? state.look.outfit : "none")}</div>
      <p class="bubble">${esc(moodMessage(m, lastResult))}</p>
    </div>`;
}

let lastResult = null;
let showMath = false;
RENDER.home = function () {
  const r = Budget.compute(state, today());
  lastResult = r;
  recordWeek(r);
  checkBadges(r);
  const m = mood(r);
  const left = Math.floor(Math.max(0, r.left));
  let numberBlock;
  if (r.overdue) {
    numberBlock = `<div class="card notice">
      <h3>Has your next money come in?</h3>
      <p>Your next money date (${prettyDate(state.nextMoney.date, true)}) is here. Update it so your weekly number stays right.</p>
      <form id="harvest-form">
        <div class="row"><div><label for="h-amt">How much came in?</label><div class="money"><input id="h-amt" inputmode="decimal" value="${state.nextMoney.amount || ""}"></div></div>
        <div><label for="h-date">And the next time after that?</label><input id="h-date" type="date"></div></div>
        <div class="actions"><button type="submit">Update</button></div>
      </form></div>`;
  } else {
    numberBlock = `<div class="card big-card">
      <p class="label">You can spend</p>
      <button class="big-number" id="big-number" aria-expanded="${showMath}" aria-controls="math" title="See the math">${money(left)}</button>
      <p class="label">this week <span class="estimate-tag">Estimate</span></p>
      <div class="week-bar" aria-hidden="true"><span style="width:${r.allowance > 0 ? Math.min(100, (r.spentThisWeek / r.allowance) * 100) : 0}%"></span></div>
      <p class="hint" style="margin:0">${money(r.spentThisWeek, true)} spent of ${money(r.allowance, true)} · resets ${prettyDate(addDays(r.weekEnd, 1))}</p>
      <p style="margin:.6rem 0 0"><button class="ghost small" id="math-toggle">${showMath ? "Hide" : "See"} how this is worked out</button></p>
      ${r.left < 0 ? `<p class="muted">You're ${money(-r.left, true)} over this week. That's okay. Next week's number will adjust a little to keep your stash on track.</p>` : ""}
      ${r.spendable <= 0 ? `<p class="muted">Your bills and jar add up to more than your money right now. Maybe move a little out of your jar, or check whether a bill can wait. Your school's financial aid office can also help.</p>` : ""}
      <div class="math" id="math" ${showMath ? "" : "hidden"}>${mathTable(r)}</div>
    </div>`;
  }

  $("screen-home").innerHTML = `
    ${homeScene(m)}
    ${numberBlock}
    <h2 class="section-title">Quick log</h2>
    <div class="card">${quickLogForm("home")}</div>
    <div class="segmented">
      <button class="secondary small" id="checkin-btn">${Icons.get(state.checkins.includes(today()) ? "check" : "calendar")} ${state.checkins.includes(today()) ? "Checked in today" : "Check in"}</button>
      <button class="secondary small" id="nospend-btn">${Icons.get("leaf")} No-spend day</button>
    </div>
    <p class="streak-line" style="margin-top:1rem">${Icons.get("flame")} ${streakText()}</p>`;

  function toggleMath() {
    showMath = !showMath; $("math").hidden = !showMath;
    $("big-number").setAttribute("aria-expanded", showMath);
    $("math-toggle").textContent = (showMath ? "Hide" : "See") + " how this is worked out";
  }
  if ($("big-number")) { $("big-number").onclick = toggleMath; $("math-toggle").onclick = toggleMath; }
  if ($("harvest-form")) $("harvest-form").onsubmit = function (e) {
    e.preventDefault();
    const amt = num($("h-amt").value), nd = $("h-date").value;
    if (!nd || nd <= today()) return toast("Pick a future date for your next money.");
    if (!isNaN(amt) && amt > 0) state.logs.push({ id: uid(), ts: Date.now(), date: today(), kind: "income", category: "Harvest", amount: amt, note: "Next money arrived" });
    state.nextMoney = { date: nd, amount: null };
    save(); checkIn(); show("home"); toast("Harvest stored!");
  };
  wireQuickLog("home");
  $("checkin-btn").onclick = function () { checkIn(); show("home"); bounce(); };
  $("nospend-btn").onclick = function () {
    const spentToday = state.logs.some(function (l) { return l.kind === "spend" && l.date === today(); });
    if (spentToday) return toast("You logged something today, so let's try for a no-spend day tomorrow");
    checkIn();
    if (!state.badges["no-spend"]) { state.badges["no-spend"] = today(); save(); toast("Badge: First no-spend day"); }
    else toast("A no-spend day! Lovely");
    show("home"); bounce();
  };
};

function mathTable(r) {
  const billRows = r.billsAhead.items.slice(0, 8).map(function (b) {
    return `<tr><td class="muted">&nbsp;&nbsp;${esc(b.name)} · ${prettyDate(b.date)}</td><td class="muted">${money(b.amount, true)}</td></tr>`;
  }).join("") + (r.billsAhead.items.length > 8 ? `<tr><td class="muted">&nbsp;&nbsp;…and ${r.billsAhead.items.length - 8} more</td><td></td></tr>` : "");
  return `<p><strong>How we got this number</strong></p>
    <table>
      <tr><td>Money at the start of this week</td><td>${money(r.pool, true)}</td></tr>
      <tr><td>− Bills before ${prettyDate(state.nextMoney.date)}</td><td>${money(r.billsAhead.total, true)}</td></tr>
      ${billRows}
      <tr><td>− Set aside in your jar${state.goals.length > 1 ? "s" : ""}</td><td>${money(r.jar, true)}</td></tr>
      <tr class="total"><td>= Free to spend until then</td><td>${money(r.spendable, true)}</td></tr>
      <tr><td>÷ Weeks left (${r.daysLeft} days)</td><td>${r.weeksLeft.toFixed(2)}</td></tr>
      <tr class="total"><td>= This week's amount</td><td>${money(r.allowance, true)}</td></tr>
      <tr><td>− Logged so far this week</td><td>${money(r.spentThisWeek, true)}</td></tr>
      <tr class="total"><td>= Left this week</td><td>${money(r.left, true)}</td></tr>
    </table>
    ${r.shortWeek ? `<p class="hint">This is a short week (${r.daysThisWeek} days), so it gets a share of your money for those days only.${r.daysLeft <= r.daysThisWeek ? " Your next money arrives this week, so all of it is yours to use." : ""}</p>` : ""}
    <p class="hint">Weeks run ${prettyDate(r.weekStart)} – ${prettyDate(r.weekEnd)}. This is an estimate based on what you've entered.
      Money now: ${money(r.moneyNow, true)}. <a href="#" onclick="show('log');return false">Update balance</a></p>`;
}


// ---------- 6. LOGGING SPENDING ----------
function quickLogForm(where) {
  return `<form id="ql-${where}" novalidate>
    <div class="quick-grid" role="group" aria-label="Category">
      ${CATEGORIES.map(function (c) { return `<button type="button" data-cat="${c.id}" aria-pressed="false">${Icons.get(c.icon)}${c.id}</button>`; }).join("")}
    </div>
    <div class="row" style="margin-top:.7rem">
      <div class="money"><input id="ql-amt-${where}" inputmode="decimal" placeholder="Amount" aria-label="Amount"></div>
      <button type="submit" style="flex:0 0 auto">Log it</button>
    </div>
    ${where === "log" ? `<details style="margin-top:.6rem"><summary>Add a note or change the date</summary>
      <label for="ql-note-log">Note</label><input id="ql-note-log" maxlength="60">
      <label for="ql-date-log">Date</label><input id="ql-date-log" type="date" value="${today()}" max="${today()}"></details>` : ""}
  </form>`;
}
function wireQuickLog(where) {
  const form = $("ql-" + where);
  let cat = null;
  form.querySelectorAll("[data-cat]").forEach(function (b) {
    b.onclick = function () {
      cat = b.dataset.cat;
      form.querySelectorAll("[data-cat]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      $("ql-amt-" + where).focus();
    };
  });
  form.onsubmit = function (e) {
    e.preventDefault();
    const amt = num($("ql-amt-" + where).value);
    if (isNaN(amt) || amt <= 0) return toast("Type an amount first, like 4.50");
    const note = $("ql-note-" + where) ? $("ql-note-" + where).value.trim() : "";
    const date = $("ql-date-" + where) ? $("ql-date-" + where).value || today() : today();
    logSpend(cat || "Other", amt, date, note);
    show(where); bounce();
  };
}
function logSpend(cat, amt, date, note) {
  state.logs.push({ id: uid(), ts: Date.now(), date: date, kind: "spend", category: cat, amount: Budget.round2(amt), note: note || "" });
  checkIn();
  if (!state.badges["first-log"]) { state.badges["first-log"] = today(); toast("Badge: First nut stored"); }
  else toast("Logged " + money(amt, true) + " · " + cat);
  save();
}

RENDER.log = function () {
  const r = Budget.compute(state, today());
  const recent = state.logs.slice().sort(function (a, b) { return b.date === a.date ? b.ts - a.ts : b.date < a.date ? -1 : 1; }).slice(0, 30);
  $("screen-log").innerHTML = `
    <h1>Log it</h1>
    <div class="card">${quickLogForm("log")}</div>
    <div class="card">
      <h3>Recent</h3>
      ${recent.length ? `<ul class="log-list">${recent.map(function (l) {
        return `<li><span class="what"><span class="ico">${l.kind === "income" ? Icons.get("income") : iconFor(l.category)}</span>
            <span>${esc(l.note || l.category)}<br><span class="hint">${l.note ? (l.kind === "income" ? "Money in" : esc(l.category)) + " · " : ""}${prettyDate(l.date)}</span></span></span>
          <span class="right"><span class="amt">${l.kind === "income" ? "+" : ""}${money(l.amount, true)}</span>
          <button class="ghost" data-del="${l.id}" aria-label="Delete">${Icons.get("close")}</button></span></li>`;
      }).join("")}</ul>` : `<p class="muted">Nothing yet. Your first log earns a badge!</p>`}
    </div>
    <div class="card">
      <h3>Got extra money?</h3>
      <p class="hint">A gift, a shift at work, a refund…</p>
      <form id="income-form" class="row">
        <div class="money"><input id="inc-amt" inputmode="decimal" placeholder="Amount" aria-label="Amount"></div>
        <input id="inc-note" placeholder="What was it?" aria-label="Note">
        <button type="submit" style="flex:0 0 auto">Add</button>
      </form>
    </div>
    <div class="card">
      <h3>Match your bank balance</h3>
      <p class="hint">HazelHollow thinks you have <strong>${money(r.moneyNow, true)}</strong>. If your bank app says something different, update it here and your number will start fresh from today.</p>
      <form id="bal-form" class="row">
        <div class="money"><input id="bal-amt" inputmode="decimal" placeholder="Bank says…" aria-label="Your real balance"></div>
        <button type="submit" style="flex:0 0 auto">Update</button>
      </form>
    </div>`;
  wireQuickLog("log");
  document.querySelectorAll("[data-del]").forEach(function (b) {
    b.onclick = function () {
      state.logs = state.logs.filter(function (l) { return l.id !== b.dataset.del; });
      save(); show("log"); toast("Removed");
    };
  });
  $("income-form").onsubmit = function (e) {
    e.preventDefault();
    const amt = num($("inc-amt").value);
    if (isNaN(amt) || amt <= 0) return toast("Type an amount first");
    state.logs.push({ id: uid(), ts: Date.now(), date: today(), kind: "income", category: "Extra", amount: Budget.round2(amt), note: $("inc-note").value.trim() || "Extra money" });
    checkIn(); save(); show("log"); toast("Added to your stash");
  };
  $("bal-form").onsubmit = function (e) {
    e.preventDefault();
    const amt = num($("bal-amt").value);
    if (isNaN(amt) || amt < 0) return toast("Type your balance, like 1840.25");
    state.balance = { amount: Budget.round2(amt), date: today(), ts: Date.now() };
    checkIn(); save(); show("home"); toast("Balance updated");
  };
};


// ---------- 7. JARS (SAVINGS GOALS) ----------
RENDER.jar = function () {
  const canAdd = isPro() || state.goals.length < 1;
  $("screen-jar").innerHTML = `
    <h1>Your hazelnut jar${state.goals.length > 1 ? "s" : ""}</h1>
    <p class="muted">Money you put in a jar is set aside, so it's not counted in your weekly number. It still stays in your own bank account.</p>
    <div id="goal-list"></div>
    ${canAdd ? `<form id="goal-form" class="card">
        <h3>${state.goals.length ? "Start another jar" : "Start a jar"}</h3>
        <label for="g-name">What are you saving for?</label><input id="g-name" placeholder="e.g. Reading week trip" maxlength="40">
        <label for="g-target">Goal amount</label><div class="money"><input id="g-target" inputmode="decimal" placeholder="300"></div>
        <div class="actions"><button type="submit">Make my jar</button></div>
      </form>`
    : `<div class="card"><p>Want more jars? Unlimited jars are part of <strong>Pro</strong>.</p><button class="secondary" onclick="show('pro')">About Pro</button></div>`}`;

  $("goal-list").innerHTML = state.goals.map(function (g) {
    const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
    return `<div class="card"><div class="jar-wrap">${Art.jar(pct, g.id)}
      <div style="flex:1"><h3>${esc(g.name)}</h3>
        <p><strong>${money(g.saved, true)}</strong> of ${money(g.target)} · ${Math.round(pct)}%</p>
        <div class="progress"><span style="width:${pct}%"></span></div>
        ${pct >= 100 ? `<p>Full jar!</p>` : ""}</div></div>
      <form class="row" data-goal="${g.id}" style="margin-top:.8rem">
        <div class="money"><input inputmode="decimal" placeholder="Amount" aria-label="Amount for ${esc(g.name)}"></div>
        <button type="submit" data-act="add" style="flex:0 0 auto">Add</button>
        <button type="submit" data-act="out" class="secondary" style="flex:0 0 auto">Take out</button>
      </form>
      <p style="margin:.4rem 0 0"><button class="ghost" data-delgoal="${g.id}">Remove this jar</button></p></div>`;
  }).join("");

  document.querySelectorAll("[data-goal]").forEach(function (f) {
    let act = "add";
    f.querySelectorAll("button").forEach(function (b) { b.onclick = function () { act = b.dataset.act; }; });
    f.onsubmit = function (e) {
      e.preventDefault();
      const g = state.goals.find(function (x) { return x.id === f.dataset.goal; });
      const amt = num(f.querySelector("input").value);
      if (isNaN(amt) || amt <= 0) return toast("Type an amount first");
      g.saved = Budget.round2(act === "add" ? g.saved + amt : Math.max(0, g.saved - amt));
      if (g.saved >= g.target && !state.badges["full-jar"]) { state.badges["full-jar"] = today(); toast("Badge: Full jar"); }
      else toast(act === "add" ? "Into the jar" : "Taken out");
      checkIn(); save(); show("jar");
    };
  });
  document.querySelectorAll("[data-delgoal]").forEach(function (b) {
    b.onclick = function () {
      if (!confirm("Remove this jar? The money in it goes back into your weekly number.")) return;
      state.goals = state.goals.filter(function (g) { return g.id !== b.dataset.delgoal; });
      save(); show("jar");
    };
  });
  if ($("goal-form")) $("goal-form").onsubmit = function (e) {
    e.preventDefault();
    const name = $("g-name").value.trim(), target = num($("g-target").value);
    if (!name) return toast("Give your jar a name");
    if (isNaN(target) || target <= 0) return toast("Add a goal amount");
    state.goals.push({ id: uid(), name: name, target: Budget.round2(target), saved: 0 });
    save(); show("jar"); toast("New jar!");
  };
};


// ---------- 8. CHECK-INS, STREAKS, BADGES ----------
// Checking in = logging something, tapping "Just checking in" or "No-spend day".
// Every check-in day makes the home cozier. Missing days only PAUSES the streak.
function checkIn() {
  const t = today();
  if (!state.checkins.includes(t)) {
    state.checkins.push(t);
    const unlocked = Art.DECOR.find(function (d) { return !d.pro && d.days === state.checkins.length; });
    if (unlocked) setTimeout(function () { toast("Your home got cozier: " + unlocked.name + "!"); }, 1200);
    if (state.checkins.length >= 7 && !state.badges["cozy-7"]) state.badges["cozy-7"] = t;
  }
  save();
}
function streakText() {
  const n = state.checkins.length;
  if (!n) return "Check in to start making the hollow cozy.";
  const last = state.checkins[state.checkins.length - 1];
  const next = Art.DECOR.find(function (d) { return !d.pro && d.days > n; });
  const nextTxt = next ? ` ${next.days - n} more to unlock ${next.name}.` : " Your home is fully cozy!";
  if (last === today()) return `${n} cozy day${n === 1 ? "" : "s"}.${nextTxt}`;
  if (last === addDays(today(), -1)) return `${n} cozy day${n === 1 ? "" : "s"}. Check in today to keep it going.`;
  return `${n} cozy day${n === 1 ? "" : "s"}. Your streak is resting. Check in to pick it back up!`;
}
function recordWeek(r) {
  if (r.overdue) return;
  state.weeks[r.periodStart] = r.allowance;
  save();
}
function checkBadges() {
  if (state.badges["under-week"]) return;
  const starts = Object.keys(state.weeks).sort();
  const cur = lastResult ? lastResult.periodStart : today();
  for (let i = 0; i < starts.length; i++) {
    const s = starts[i];
    if (s >= cur) continue;
    const end = starts[i + 1] || addDays(s, 7);
    const spent = state.logs.filter(function (l) { return l.kind === "spend" && l.date >= s && l.date < end; })
      .reduce(function (a, l) { return a + l.amount; }, 0);
    if (state.weeks[s] > 0 && spent <= state.weeks[s]) {
      state.badges["under-week"] = today(); save();
      setTimeout(function () { toast("Badge: Stayed under this week's number"); }, 600);
      return;
    }
  }
}
const BADGES = [
  { id: "first-log", icon: "harvest", name: "First nut stored", how: "Log your first purchase" },
  { id: "no-spend", icon: "leaf", name: "First no-spend day", how: "Tap “No-spend day”" },
  { id: "under-week", icon: "check", name: "Stayed under this week's number", how: "Finish a week at or under your number" },
  { id: "full-jar", icon: "jar", name: "Full jar", how: "Fill a jar to its goal" },
  { id: "cozy-7", icon: "house", name: "7 cozy days", how: "Check in on 7 days" },
  { id: "founding", icon: "star", name: "Founding Team", how: "Join the Founding Team", gold: true },
];


// ---------- 9. ME ----------
RENDER.me = function () {
  const earned = BADGES.filter(function (b) { return state.badges[b.id]; }).length;
  $("screen-me").innerHTML = `
    <h1>Me</h1>
    <div class="card"><p class="streak-line" style="justify-content:flex-start">${Icons.get("flame")} ${streakText()}</p>
      <h3 style="display:flex;justify-content:space-between;align-items:baseline">Little wins <span class="hint">${earned} of ${BADGES.length}</span></h3>
      <div class="badges">${BADGES.map(function (b) {
        const got = state.badges[b.id];
        return `<div class="badge ${got ? "" : "locked"} ${b.gold ? "gold" : ""}" title="${got ? "Earned " + prettyDate(got, true) : b.how}">
          <span class="medal">${Icons.get(got ? b.icon : "lock")}</span>${b.name}${got ? "" : `<small>${b.how}</small>`}</div>`;
      }).join("")}</div></div>

    <div class="card"><h3>Semester recap</h3>
      <p>A summary card of your semester so far, ready to save or share. It shows counts, never dollar amounts.</p>
      <button onclick="show('recap')">Make my recap card</button></div>

    <div class="card"><h3>${isPro() ? "Pro is on" : "HazelHollow Pro"}</h3>
      ${isPro() ? `<p>Unlocked by your Founding Team code${state.pro.name ? ", " + esc(state.pro.name) : ""}. Thank you!</p>
        <div class="actions">
          <button onclick="show('hub')">Tester Hub</button>
          <button class="secondary" onclick="show('split')">Roommate split</button>
          <button class="secondary" onclick="show('import')">Import bank CSV</button>
          <button class="secondary" onclick="show('style')">Themes &amp; outfits</button>
        </div>`
      : `<p>${esc(CONFIG.PRO_PRICE_NOTE)} Founding Team members get it free.</p><button onclick="show('pro')">See Pro / enter a team code</button>`}
    </div>

    <div class="card"><h3>Settings</h3>
      <div class="actions"><button class="secondary" onclick="show('setup')">Edit my setup</button></div></div>

    <div class="card"><h3>Your data</h3>
      <p class="hint">Everything is saved only on this device. Nothing is sent to us.</p>
      <div class="actions">
        <button class="secondary" id="export-btn">Export my data</button>
        <label class="button secondary" style="margin:0">Restore from a file<input type="file" id="restore-file" accept=".json,application/json" hidden></label>
        <button class="danger" id="delete-btn">Delete all my data</button>
      </div></div>
    <p class="center small-print"><a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · <a href="not-advice.html">Not financial advice</a> · <a href="index.html">Website</a></p>`;

  $("export-btn").onclick = exportData;
  $("delete-btn").onclick = deleteAll;
  $("restore-file").onchange = restoreData;
};

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "hazelhollow-data-" + today() + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  toast("Downloaded your data");
}
function restoreData(e) {
  const file = e.target.files[0];
  if (!file) return;
  file.text().then(function (txt) {
    const data = JSON.parse(txt);
    if (!data || data.version !== 1) throw new Error();
    if (!confirm("Replace everything on this device with this file?")) return;
    state = Object.assign(freshState(), data); save(); applyLook(); show("home"); toast("Restored");
  }).catch(function () { toast("That file doesn't look like a HazelHollow export."); });
}
function deleteAll() {
  if (!confirm("Delete ALL your HazelHollow data from this device? This can't be undone. (Tip: export first if you want a copy.)")) return;
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem("hh-ref");
  state = freshState();
  applyLook();
  show("setup");
  toast("All your data was deleted from this device.");
}

RENDER.recap = function () {
  const start = state.setup.semesterStart;
  const logs = state.logs.filter(function (l) { return l.kind === "spend" && l.date >= start; });
  const counts = {};
  logs.forEach(function (l) { counts[l.category] = (counts[l.category] || 0) + 1; });
  const top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
  const target = state.goals.reduce(function (s, g) { return s + g.target; }, 0);
  const saved = state.goals.reduce(function (s, g) { return s + Math.min(g.saved, g.target); }, 0);
  const summary = {
    start: start, end: today(), range: prettyDate(start, true) + " – " + prettyDate(today(), true),
    cozyDays: state.checkins.filter(function (d) { return d >= start; }).length, logs: logs.length,
    topCategory: top || "", jarPct: target ? Math.round((saved / target) * 100) : null,
    badges: Object.keys(state.badges).length,
  };
  $("screen-recap").innerHTML = `${backButton()}<h1>Semester recap</h1>
    <p class="muted">${summary.range}</p>
    <div id="recap-preview"><p class="muted">Drawing your card…</p></div>
    <div class="actions" style="justify-content:center"><button id="recap-dl">Download image</button>
      ${navigator.canShare ? `<button class="secondary" id="recap-share">Share</button>` : ""}</div>
    <div class="card" style="margin-top:1.5rem"><h3>Past semesters ${isPro() ? "" : '<span class="pill">Pro</span>'}</h3>
      ${isPro() ? (state.semesters.length ? `<ul class="log-list">${state.semesters.map(function (s) {
          return `<li><span>${esc(s.range)}</span><span class="muted">${s.logs} logs · ${s.cozyDays} cozy days · ${s.badges} wins</span></li>`; }).join("")}</ul>`
        : `<p class="muted">When a semester ends, save it here and start fresh.</p>`)
        + `<button class="secondary" id="new-sem">Save this semester &amp; start a new one</button>`
      : `<p class="muted">Keep a shelf of all your past semester recaps with Pro.</p>`}</div>`;
  let canvas;
  Cards.recap(summary).then(function (cv) {
    canvas = cv; cv.className = "preview";
    $("recap-preview").innerHTML = ""; $("recap-preview").appendChild(cv);
  });
  $("recap-dl").onclick = function () { if (canvas) Cards.download(canvas, "hazelhollow-recap.png"); };
  if ($("recap-share")) $("recap-share").onclick = function () {
    if (!canvas) return;
    canvas.toBlob(function (blob) {
      const file = new File([blob], "hazelhollow-recap.png", { type: "image/png" });
      if (navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: "My HazelHollow semester" }).catch(function () {});
      else Cards.download(canvas, "hazelhollow-recap.png");
    });
  };
  if ($("new-sem")) $("new-sem").onclick = function () {
    if (!confirm("Save this semester's recap and start a new semester? Your bills and jars stay. You'll enter your new money and next money date.")) return;
    state.semesters.unshift(summary);
    state.setup.semesterStart = today();
    state.setup.anchor = today();
    state.nextMoney = null;
    save();
    RENDER.setup(); current = "setup";
    document.querySelectorAll(".screen").forEach(function (s) { s.hidden = s.id !== "screen-setup"; });
  };
};


// ---------- 10. PRO: TEAM CODES ----------
// Codes live in data/codes.json. NOTE: in this version, a determined person
// could read that file and find codes. That's okay for now (see README).
RENDER.pro = function () {
  $("screen-pro").innerHTML = `${backButton()}
    <h1>HazelHollow Pro</h1>
    <p class="notice">${esc(CONFIG.PRO_PRICE_NOTE)} Nothing is for sale yet, and we never take payments in this version.</p>
    <div class="card"><h3>What's in Pro</h3><ul>
      <li>Unlimited savings jars</li><li>Roommate bill splitting</li>
      <li>Import a bank statement file (CSV), read only on your device</li>
      <li>Full semester recaps, with past semesters</li>
      <li>Extra themes, squirrel outfits (scarf, beanie, raincoat) and home decorations</li>
      <li>The Tester Hub, for Founding Team members</li></ul></div>
    <div class="card"><h3>Have a Founding Team code?</h3>
      ${isPro() ? `<p>Pro is on</p><button class="ghost" id="remove-code">Remove my code from this device</button>` : `
      <form id="code-form" class="row"><input id="code-in" placeholder="Your code" autocomplete="off" autocapitalize="characters" aria-label="Team code">
        <button type="submit" style="flex:0 0 auto">Unlock</button></form>`}
      <p class="hint">Codes are for <a href="join.html">Founding Team</a> members.</p></div>`;
  if ($("code-form")) $("code-form").onsubmit = function (e) { e.preventDefault(); unlock($("code-in").value); };
  if ($("remove-code")) $("remove-code").onclick = function () {
    if (!confirm("Remove your team code from this device? Pro features will lock (your data stays).")) return;
    state.pro = null; save(); applyLook(); show("me");
  };
};
async function unlock(input) {
  const code = String(input || "").trim().toUpperCase();
  if (!code) return toast("Type your code first");
  try {
    const data = await loadJSON("data/codes.json");
    const found = data.codes.find(function (c) { return c.code.toUpperCase() === code; });
    if (!found) return toast("Hmm, that code didn't work. Check for typos?");
    state.pro = { code: found.code, name: found.name, role: found.role, start: found.start, ref: found.ref };
    state.badges["founding"] = state.badges["founding"] || today();
    save(); show("hub"); toast("Welcome to the Founding Team!");
  } catch (e) { toast("Couldn't check codes right now. Are you online?"); }
}
// On start: make sure a saved code is still active (if we're online)
async function recheckCode() {
  if (!state.pro) return;
  try {
    const data = await loadJSON("data/codes.json");
    const ok = data.codes.some(function (c) { return c.code.toUpperCase() === state.pro.code.toUpperCase(); });
    if (!ok) { state.pro = null; save(); applyLook(); show(current); toast("Your team code isn't active anymore, so Pro is paused. Thanks for helping!"); }
  } catch (e) { /* offline: keep Pro for now */ }
}


// ---------- 11. TESTER HUB ----------
const LEVELS = [
  { name: "Hazelnut", icon: "harvest", min: 0 }, { name: "Sprout", icon: "sprout", min: 3 },
  { name: "Sapling", icon: "leaf", min: 6 }, { name: "Hazel Tree", icon: "tree", min: 10 },
];
function level() {
  const done = Object.keys(state.missionsDone).length;
  let lv = LEVELS[0];
  LEVELS.forEach(function (l) { if (done >= l.min) lv = l; });
  const next = LEVELS[LEVELS.indexOf(lv) + 1];
  return { lv: lv, next: next, done: done };
}
function inviteLink() {
  const base = CONFIG.SITE_URL || (location.origin + location.pathname.replace(/app\.html$/, ""));
  const tag = (state.pro.ref || state.pro.name || "friend").toLowerCase().replace(/[^a-z0-9-]/g, "");
  return base.replace(/\/?$/, "/") + "?ref=" + tag;
}
function roleInfo() {
  const amb = state.pro.role === "Campus Ambassador";
  if (state.pro.role === "Founder") return {
    title: "Founder", tag: "#Founder", disclosure: "#Founder · I built HazelHollow.",
    desc: "Founder of HazelHollow, a free budgeting web app for students. I designed and built the app and run the Founding Team program.",
  };
  return {
    title: amb ? "Campus Ambassador" : "Founding Tester",
    tag: amb ? "#CampusAmbassador" : "#FoundingTester",
    disclosure: amb ? "#CampusAmbassador · I get free Pro as a HazelHollow Campus Ambassador."
                    : "#FoundingTester · I get free Pro for testing HazelHollow.",
    desc: amb
      ? "Volunteer campus ambassador for HazelHollow, a free budgeting web app built by a student for students. I share the app with students on campus, invite friends to try it, and pass student feedback on to the founder. (Up to 20 minutes a week.)"
      : "Volunteer tester for HazelHollow, a free budgeting web app built by a student for students. Each week I complete small testing missions, report bugs, and give feedback on design and ease of use to help shape the product. (Up to 30 minutes a week.)",
  };
}
function sharePosts(link, ri) {
  const who = ri.title === "Campus Ambassador" ? "a Campus Ambassador" : ri.title === "Founder" ? "the founder" : "a Founding Tester";
  return [
    `I'm ${who} for HazelHollow, a free budgeting app made by a student, for students. You tell it what money you have and when your next money comes in (OSAP, summer job savings…), and it gives you one number: how much you can spend this week. No account, and your numbers stay on your phone.\n\nTry it: ${link}\n\n${ri.disclosure}`,
    `Student money doesn't come every two weeks. It comes in big chunks and has to last. HazelHollow splits your stash into one calm weekly number so it lasts the whole semester. I've been helping with it and honestly like how un-stressful it feels.\n\n${link}\n\n${ri.disclosure}`,
    ri.title === "Founder" ? `I built HazelHollow, a free budgeting web app for students. It turns the money you have into one weekly spending number, so a big chunk of money (like OSAP) lasts the whole semester. I'd love your honest feedback: ${link}\n\n${ri.disclosure}` : `Excited to share that I've joined the Founding Team at HazelHollow as ${who}! HazelHollow is a free, student-built budgeting web app that turns the money you have into one weekly spending number. If your money comes in big chunks too, give it a try and tell me what you think: ${link}\n\n${ri.disclosure}`,
  ];
}

RENDER.hub = function () {
  if (!isPro()) return show("pro");
  const L = level(), ri = roleInfo(), link = inviteLink();
  const posts = sharePosts(link, ri);
  const startMonth = new Date(state.pro.start + "T12:00").toLocaleDateString("en-CA", { month: "long", year: "numeric" });
  $("screen-hub").innerHTML = `${backButton()}
    <h1>Tester Hub</h1>
    <div class="card center">
      <div class="level-badge">${Icons.get(L.lv.icon)}</div>
      <h2 style="margin:0">${esc(state.pro.name || "Team member")}</h2>
      <p><span class="pill gold">${Icons.get("star")} ${esc(state.pro.role)}</span> <span class="pill">Level: ${L.lv.name}</span></p>
      <p class="muted">${L.done} mission${L.done === 1 ? "" : "s"} done.${L.next ? ` ${L.next.min - L.done} more to reach ${L.next.name}.` : " You've reached the top level!"}</p>
      <p class="hint">Levels: Hazelnut → Sprout (3 missions) → Sapling (6) → Hazel Tree (10)</p>
    </div>

    <div class="card"><h3>This week's missions</h3><div id="missions"><p class="muted">Loading…</p></div>
      ${CONFIG.FEEDBACK_FORM_URL ? `<a class="button" href="${esc(CONFIG.FEEDBACK_FORM_URL)}" target="_blank" rel="noopener">Send feedback</a>` : `<button disabled>Feedback form coming soon</button>`}</div>

    <div class="card"><h3>Add it to LinkedIn</h3>
      <p class="hint">It's an honest volunteer role, so add it under <strong>Volunteer experience</strong>.</p>
      <ol>
        <li>On your LinkedIn profile, tap <strong>Add profile section</strong>.</li>
        <li>Choose <strong>Volunteer experience</strong>.</li>
        <li><strong>Organization:</strong> HazelHollow <button class="ghost" data-copy="HazelHollow">Copy</button></li>
        <li><strong>Role:</strong> ${ri.title} <button class="ghost" data-copy="${ri.title}">Copy</button></li>
        <li><strong>Cause:</strong> Education</li>
        <li><strong>Start date:</strong> ${startMonth}. Tick “I am currently volunteering in this role”.</li>
        <li><strong>Description:</strong><div class="copy-box">${esc(ri.desc)}</div><button class="ghost" data-copy="${esc(ri.desc)}">Copy description</button></li>
        <li>Save. That's it!</li>
      </ol></div>

    <div class="card"><h3>Your invite link</h3>
      <div class="copy-box">${esc(link)}</div><button class="secondary" data-copy="${esc(link)}">Copy link</button>
      <p class="hint">When a friend opens your link, their device remembers your name tag. If they apply to the Founding Team, the form tells Vivian you invited them. Nothing else is tracked.</p></div>

    <div class="card"><h3>Share kit</h3>
      <p class="notice">Please keep the <strong>${ri.tag}</strong> line in every post. You get free Pro, so people need to know you're connected. Only share your honest opinion, and feel free to rewrite these in your own words.</p>
      ${posts.map(function (p, i) { return `<details ${i === 0 ? "open" : ""}><summary>Post ${i + 1}</summary><div class="copy-box">${esc(p)}</div><button class="secondary" data-copy="${esc(p)}">Copy post</button></details>`; }).join("")}
      <h3 style="margin-top:1rem">Share image</h3><div id="share-img"></div><button id="share-dl">Download image</button></div>

    <div class="card"><h3>Your Founding Team card</h3><div id="team-card"></div><button id="team-dl">Download card</button></div>`;

  document.querySelectorAll("[data-copy]").forEach(function (b) { b.onclick = function () { copyText(b.dataset.copy); }; });

  loadJSON("data/missions.json").then(function (m) {
    $("missions").innerHTML = m.missions.length ? `<p class="hint">Week of ${prettyDate(m.week, true)}</p><ul class="missions">${m.missions.map(function (x) {
      return `<li><input type="checkbox" id="m-${esc(x.id)}" data-mission="${esc(x.id)}" ${state.missionsDone[x.id] ? "checked" : ""}><label for="m-${esc(x.id)}" style="margin:0;font-weight:400">${esc(x.text)}</label></li>`;
    }).join("")}</ul>` : `<p class="muted">No missions this week. Enjoy the break!</p>`;
    document.querySelectorAll("[data-mission]").forEach(function (cb) {
      cb.onchange = function () {
        if (cb.checked) state.missionsDone[cb.dataset.mission] = today(); else delete state.missionsDone[cb.dataset.mission];
        const before = L.lv.name; save();
        const after = level().lv;
        if (after.name !== before) toast("Level up: " + after.name); else if (cb.checked) toast("Mission done");
        if (after.name !== before) show("hub");
      };
    });
  }).catch(function () { $("missions").innerHTML = `<p class="muted">Missions couldn't load. Check your connection.</p>`; });

  let shareCv, teamCv;
  Cards.share({ headline: ri.title === "Campus Ambassador" ? "I'm a HazelHollow ambassador" : ri.title === "Founder" ? "Meet HazelHollow" : "I'm testing HazelHollow", disclosure: ri.disclosure }).then(function (cv) {
    shareCv = cv; cv.className = "preview"; $("share-img").appendChild(cv);
  });
  Cards.team({ name: state.pro.name || "Team member", role: state.pro.role, level: L.lv.name, since: startMonth }).then(function (cv) {
    teamCv = cv; cv.className = "preview"; $("team-card").appendChild(cv);
  });
  $("share-dl").onclick = function () { if (shareCv) Cards.download(shareCv, "hazelhollow-share.png"); };
  $("team-dl").onclick = function () { if (teamCv) Cards.download(teamCv, "hazelhollow-founding-team-card.png"); };
};


// ---------- 12. PRO TOOLS ----------

// Roommate bill split
RENDER.split = function () {
  if (!isPro()) return show("pro");
  $("screen-split").innerHTML = `${backButton()}
    <h1>Roommate split</h1>
    <form id="split-form" class="card">
      <label for="sp-name">What's the bill?</label><input id="sp-name" placeholder="e.g. Internet" value="Internet">
      <label for="sp-total">Total amount</label><div class="money"><input id="sp-total" inputmode="decimal" placeholder="90"></div>
      <label for="sp-people">Who's splitting? <span class="hint">Names separated by commas. Put yourself first.</span></label>
      <input id="sp-people" value="Me, " placeholder="Me, Sam, Priya">
      <label><input type="checkbox" id="sp-custom" style="width:auto"> Not an even split (e.g. bigger room pays more)</label>
      <div id="sp-custom-rows"></div>
      <div class="actions"><button type="submit">Split it</button></div>
    </form>
    <div id="sp-result"></div>`;
  function people() { return $("sp-people").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean); }
  function drawCustom() {
    $("sp-custom-rows").innerHTML = $("sp-custom").checked ? people().map(function (p, i) {
      return `<div class="row"><span style="flex:0 0 6rem">${esc(p)}</span><div class="money"><input inputmode="decimal" data-share="${i}" placeholder="their share"></div></div>`;
    }).join("") : "";
  }
  $("sp-custom").onchange = drawCustom;
  $("sp-people").oninput = function () { if ($("sp-custom").checked) drawCustom(); };
  $("split-form").onsubmit = function (e) {
    e.preventDefault();
    const total = num($("sp-total").value), ps = people();
    if (isNaN(total) || total <= 0) return toast("Add the total amount");
    if (ps.length < 2) return toast("Add at least two people");
    let shares;
    if ($("sp-custom").checked) {
      shares = ps.map(function (_, i) { const v = num(document.querySelector(`[data-share="${i}"]`).value); return isNaN(v) ? 0 : v; });
      const sum = Budget.round2(shares.reduce(function (a, b) { return a + b; }, 0));
      if (Math.abs(sum - total) > 0.01) return toast("Shares add up to " + money(sum, true) + ", not " + money(total, true));
    } else {
      // Even split in cents, so it always adds up exactly
      const cents = Math.round(total * 100), each = Math.floor(cents / ps.length), extra = cents - each * ps.length;
      shares = ps.map(function (_, i) { return (each + (i < extra ? 1 : 0)) / 100; });
    }
    const mine = shares[0], billName = $("sp-name").value.trim() || "Shared bill";
    $("sp-result").innerHTML = `<div class="card"><h3>${esc(billName)}: ${money(total, true)}</h3>
      <ul class="log-list">${ps.map(function (p, i) { return `<li><span>${esc(p)}</span><span class="amt">${money(shares[i], true)}</span></li>`; }).join("")}</ul>
      <p>Your share: <strong>${money(mine, true)}</strong></p>
      <div class="actions"><button id="sp-bill">Add my share as a monthly bill</button><button class="secondary" id="sp-log">Log my share now</button></div></div>`;
    $("sp-bill").onclick = function () {
      const day = parseInt(prompt("Which day of the month is it due? (1–31)", "1"));
      if (!day || day < 1 || day > 31) return;
      state.bills.push({ id: uid(), name: billName + " (my share)", amount: mine, freq: "monthly", day: day });
      save(); toast("Added to your bills");
    };
    $("sp-log").onclick = function () { logSpend("Other", mine, today(), billName + " (my share)"); toast("Logged your share"); };
  };
};

// Import a bank statement CSV — read on this device only, never uploaded
const GUESS = [
  [/tim hortons|starbucks|second cup|coffee|cafe|café|balzac/i, "Coffee"],
  [/uber ?eats|doordash|skip ?the|skipthedishes|mcdonald|pizza|a&w|subway|wendy|burger|sushi|restaurant/i, "Takeout"],
  [/loblaw|zehrs|no ?frills|sobeys|metro|food basics|walmart|costco|freshco|farm boy|t&t|grocery|superstore/i, "Groceries"],
  [/grt|presto|transit|uber(?! ?eats)|lyft|via rail|go transit|bus/i, "Transit"],
  [/cineplex|steam|spotify|netflix|ticket|bar |pub|bowling/i, "Fun"],
];
function parseCSV(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(function (r) { return r.some(function (c) { return c.trim(); }); });
}
function parseDate(s) {
  s = String(s || "").trim();
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return m[1] + "-" + m[2].padStart(2, "0") + "-" + m[3].padStart(2, "0");
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) { // most Canadian bank exports are month/day/year; if the first number is >12 it must be the day
    let mo = +m[1], d = +m[2]; if (mo > 12) { const t = mo; mo = d; d = t; }
    return m[3] + "-" + String(mo).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  }
  const t = Date.parse(s);
  return isNaN(t) ? null : Budget.todayStr(new Date(t));
}
RENDER.import = function () {
  if (!isPro()) return show("pro");
  $("screen-import").innerHTML = `${backButton()}
    <h1>Import a bank statement</h1>
    <p>Download your transactions as a <strong>CSV file</strong> from your bank's website, then pick it here.
      The file is read <strong>only on this device</strong>. It's never uploaded anywhere.</p>
    <p class="notice">Never type your bank login into HazelHollow. We only read the file you choose.</p>
    <div class="card"><input type="file" id="csv-file" accept=".csv,text/csv"></div>
    <div id="csv-out"></div>`;
  $("csv-file").onchange = function (e) {
    const f = e.target.files[0];
    if (!f) return;
    f.text().then(function (txt) { showCSV(parseCSV(txt)); });
  };
};
function showCSV(rows) {
  const out = $("csv-out");
  if (!rows.length) { out.innerHTML = `<p class="notice">That file looks empty.</p>`; return; }
  // Find the columns. If the first row starts with a date, there's no header row.
  let hasHeader = !parseDate(rows[0][0]);
  const head = hasHeader ? rows[0].map(function (h) { return h.toLowerCase(); }) : [];
  const find = function (re) { return head.findIndex(function (h) { return re.test(h); }); };
  let iDate = hasHeader ? find(/date/) : 0;
  let iDesc = hasHeader ? find(/desc|merchant|payee|name|detail|transaction/) : 1;
  let iDebit = hasHeader ? find(/debit|withdraw|out/) : 2;
  let iAmt = hasHeader ? find(/amount|cad|value/) : -1;
  if (iDate < 0) iDate = 0;
  if (iDesc < 0) iDesc = iDate === 1 ? 2 : 1;
  const body = hasHeader ? rows.slice(1) : rows;
  // If there's one Amount column, figure out whether purchases are negative (most banks) or positive (some credit cards)
  let negIsSpend = true;
  if (iDebit < 0 && iAmt >= 0) {
    const vals = body.map(function (r) { return num(r[iAmt]); }).filter(function (v) { return !isNaN(v); });
    negIsSpend = vals.filter(function (v) { return v < 0; }).length >= vals.length / 2;
  }
  const items = [];
  body.forEach(function (r) {
    const date = parseDate(r[iDate]);
    let amt = NaN;
    if (iDebit >= 0) amt = num(r[iDebit]);
    else if (iAmt >= 0) { const v = num(r[iAmt]); amt = negIsSpend ? (v < 0 ? -v : NaN) : (v > 0 ? v : NaN); }
    if (!date || isNaN(amt) || amt <= 0) return;
    const desc = (r[iDesc] || "").trim();
    const g = GUESS.find(function (x) { return x[0].test(desc); });
    items.push({ date: date, desc: desc, amount: Budget.round2(Math.abs(amt)), cat: g ? g[1] : "Other" });
  });
  if (!items.length) { out.innerHTML = `<p class="notice">We couldn't find any purchases in that file. Make sure it's a CSV with dates and amounts.</p>`; return; }
  const counted = items.filter(function (it) { return it.date >= state.balance.date; }).length;
  out.innerHTML = `<div class="card"><h3>Found ${items.length} purchase${items.length === 1 ? "" : "s"}</h3>
    <p class="hint">Untick anything you don't want. Only purchases on or after ${prettyDate(state.balance.date, true)} (when you last set your balance) change your weekly number${counted < items.length ? `. ${items.length - counted} older one${items.length - counted === 1 ? "" : "s"} will be saved for your recap only` : ""}.</p>
    <div class="table-scroll"><table><tr><th></th><th>Date</th><th>What</th><th>Amount</th><th>Category</th></tr>
    ${items.map(function (it, i) { return `<tr><td><input type="checkbox" data-i="${i}" checked style="width:auto"></td><td>${prettyDate(it.date)}</td><td>${esc(it.desc)}</td><td>${money(it.amount, true)}</td>
      <td><select data-cat-i="${i}">${CATEGORIES.map(function (c) { return `<option ${c.id === it.cat ? "selected" : ""}>${c.id}</option>`; }).join("")}</select></td></tr>`; }).join("")}
    </table></div>
    <div class="actions"><button id="csv-go">Import selected</button></div></div>`;
  $("csv-go").onclick = function () {
    let n = 0;
    items.forEach(function (it, i) {
      if (!document.querySelector(`[data-i="${i}"]`).checked) return;
      const cat = document.querySelector(`[data-cat-i="${i}"]`).value;
      const old = it.date < state.balance.date;
      // Older purchases get a timestamp before the balance, so they don't count twice
      state.logs.push({ id: uid(), ts: old ? (state.balance.ts - 1) : Date.now(), date: it.date, kind: "spend", category: cat, amount: it.amount, note: it.desc.slice(0, 60) });
      n++;
    });
    checkIn(); save(); show("log"); toast("Imported " + n + " purchase" + (n === 1 ? "" : "s") + "");
  };
}

// Themes, outfits, decorations
const THEMES = [
  { id: "autumn", name: "Autumn hollow" }, { id: "frost", name: "Winter frost" },
  { id: "meadow", name: "Spring meadow" }, { id: "berry", name: "Berry jam" },
];
const OUTFITS = [{ id: "none", name: "No outfit" }, { id: "scarf", name: "Cozy scarf" }, { id: "beanie", name: "Beanie" }, { id: "raincoat", name: "Raincoat" }];
RENDER.style = function () {
  if (!isPro()) return show("pro");
  $("screen-style").innerHTML = `${backButton()}
    <h1>Themes &amp; outfits</h1>
    <div class="card center"><div style="width:170px;margin:0 auto">${Art.squirrel("happy", state.look.outfit)}</div></div>
    <div class="card"><h3>Theme</h3>${THEMES.map(function (t) { return `<label class="choice"><input type="radio" name="theme" value="${t.id}" style="width:auto" ${state.look.theme === t.id ? "checked" : ""}> ${t.name}</label>`; }).join("")}</div>
    <div class="card"><h3>Outfit</h3>${OUTFITS.map(function (o) { return `<label class="choice"><input type="radio" name="outfit" value="${o.id}" style="width:auto" ${state.look.outfit === o.id ? "checked" : ""}> ${o.name}</label>`; }).join("")}</div>
    <div class="card"><h3>Extra decorations</h3>${Art.DECOR.filter(function (d) { return d.pro; }).map(function (d) { return `<label class="choice"><input type="checkbox" value="${d.id}" data-extra style="width:auto" ${state.look.extras.includes(d.id) ? "checked" : ""}> ${d.name}</label>`; }).join("")}</div>`;
  document.querySelectorAll('[name="theme"]').forEach(function (r) { r.onchange = function () { state.look.theme = r.value; save(); applyLook(); }; });
  document.querySelectorAll('[name="outfit"]').forEach(function (r) { r.onchange = function () { state.look.outfit = r.value; save(); show("style"); }; });
  document.querySelectorAll("[data-extra]").forEach(function (c) {
    c.onchange = function () {
      state.look.extras = state.look.extras.filter(function (x) { return x !== c.value; });
      if (c.checked) state.look.extras.push(c.value);
      save(); toast(c.checked ? "Added to your home" : "Removed");
    };
  });
};
function applyLook() {
  const theme = isPro() ? state.look.theme : "autumn";
  if (theme === "autumn") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme;
}


// ---------- 13. START THE APP ----------
async function start() {
  // Put a line icon on each bottom tab
  const tabIcons = { home: "home", log: "log", jar: "jar", me: "me" };
  document.querySelectorAll("#tabbar button").forEach(function (b) { b.insertAdjacentHTML("afterbegin", Icons.get(tabIcons[b.dataset.tab])); });
  applyLook();
  try { costsData = await loadJSON("data/costs.json"); } catch (e) { costsData = null; }
  const wanted = location.hash.replace("#", "");
  show(RENDER[wanted] ? wanted : "home");
  recheckCode();
}
start();
