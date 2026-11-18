// =========================================================
// site.js — things every page shares:
//   the top menu, the footer, falling leaves, invite-link
//   tracking, and turning on offline mode.
// Needs js/config.js to be loaded first.
// =========================================================

// ---------- Top menu ----------
function buildHeader() {
  const spot = document.getElementById("site-header");
  if (!spot) return;
  spot.className = "site-header";
  spot.innerHTML = `
    <a class="logo" href="index.html">
      <img src="images/hazelnut.svg" alt="" width="34" height="34">
      <span>HazelHollow</span>
    </a>
    <nav aria-label="Main">
      <a href="about.html">About</a>
      <a href="join.html">Join the team</a>
      <a class="button small" href="app.html">Open app</a>
    </nav>`;
}

// ---------- Footer ----------
function buildFooter() {
  const spot = document.getElementById("site-footer");
  if (!spot) return;
  spot.className = "site-footer";
  spot.innerHTML = `
    <div class="wrap">
      <img src="images/hazelnut.svg" alt="" width="32" height="32">
      <p><strong>Made by Vivian Zhang</strong> · <span data-email></span></p>
      <p class="footer-links">
        <a href="about.html">About</a>
        <a href="team.html">Founding Team</a>
        <a href="privacy.html">Privacy</a>
        <a href="terms.html">Terms</a>
        <a href="not-advice.html">Not financial advice</a>
        <a href="credits.html">Credits</a>
      </p>
      <p class="small-print">HazelHollow is a free, student-built budgeting project. It is not a bank
        or a registered business, and it never holds, moves or lends anyone's money.</p>
    </div>`;
}

// ---------- Contact email ----------
// Any element with data-email gets your email (or a "coming soon" note).
function fillEmails() {
  document.querySelectorAll("[data-email]").forEach(function (el) {
    if (CONFIG.CONTACT_EMAIL) {
      el.innerHTML = `<a href="mailto:${CONFIG.CONTACT_EMAIL}">${CONFIG.CONTACT_EMAIL}</a>`;
    } else {
      el.textContent = "contact email coming soon";
    }
  });
}

// ---------- Falling leaves (decoration) ----------
function addLeaves(count) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < count; i++) {
    const leaf = document.createElement("img");
    leaf.src = "images/leaf.svg";
    leaf.alt = "";
    leaf.className = "falling-leaf";
    leaf.style.left = 8 + Math.random() * 84 + "%";
    leaf.style.animationDelay = i * 5 + "s";
    leaf.style.width = 18 + Math.random() * 12 + "px";
    document.body.appendChild(leaf);
  }
}

// ---------- Invite links ----------
// If someone arrives with ?ref=anna in the address, remember "anna"
// on their device so the Apply form can say who invited them.
function rememberReferral() {
  const ref = new URLSearchParams(location.search).get("ref");
  if (ref) {
    const clean = ref.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
    if (clean) localStorage.setItem("hh-ref", clean);
  }
}

// Build the Apply form link, adding the referral tag if we have one.
function applyFormLink() {
  if (!CONFIG.APPLY_FORM_URL) return "";
  const ref = localStorage.getItem("hh-ref");
  if (!ref) return CONFIG.APPLY_FORM_URL;
  const joiner = CONFIG.APPLY_FORM_URL.includes("?") ? "&" : "?";
  return CONFIG.APPLY_FORM_URL + joiner + encodeURIComponent(CONFIG.REF_FIELD) + "=" + encodeURIComponent(ref);
}

// ---------- Offline mode ----------
// The "service worker" saves the site on the device so it opens without internet.
function startOffline() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
}

// Load JSON data files (team list, codes, missions...)
async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error("Could not load " + path);
  return res.json();
}

// Make text safe to put inside HTML (stops odd characters breaking the page)
function esc(text) {
  return String(text ?? "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// Run all of the above when the page loads
buildHeader();
buildFooter();
fillEmails();
rememberReferral();
startOffline();
