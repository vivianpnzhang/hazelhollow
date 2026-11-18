// =========================================================
// icons.js — simple line icons, drawn for HazelHollow.
// Use: Icons.get("coffee") → an <svg> string that takes the
// text colour around it (so CSS can recolour it).
// =========================================================

const Icons = (function () {
  const P = {
    // spending categories
    coffee: '<path d="M5 9h11v4.5A5.5 5.5 0 0 1 10.5 19h0A5.5 5.5 0 0 1 5 13.5V9z"/><path d="M16 10.5h1.25a2.75 2.75 0 0 1 0 5.5H15.5"/><path d="M8.5 3.5c-.6.9.6 1.6 0 2.5M12 3.5c-.6.9.6 1.6 0 2.5"/>',
    groceries: '<path d="M5.5 8h13l-1.1 11.1a1 1 0 0 1-1 .9H7.6a1 1 0 0 1-1-.9L5.5 8z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
    takeout: '<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M8 20h8"/><path d="M13 3.5l4.5 6M17 3l2 6.5"/>',
    transit: '<rect x="5" y="3.5" width="14" height="14" rx="3"/><path d="M5 11h14M8.5 17.5V20M15.5 17.5V20"/><circle cx="8.5" cy="14.3" r=".9" fill="currentColor"/><circle cx="15.5" cy="14.3" r=".9" fill="currentColor"/>',
    fun: '<path d="M4 8.5a1.5 1.5 0 0 0 1.5-1.5V6a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1a1.5 1.5 0 0 0 0 3v4a1.5 1.5 0 0 0 0 3v1a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-1A1.5 1.5 0 0 0 4 15.5z"/><path d="M14 5v14" stroke-dasharray="2 2"/>',
    other: '<circle cx="12" cy="12" r="8.5"/><circle cx="8" cy="12" r=".9" fill="currentColor"/><circle cx="12" cy="12" r=".9" fill="currentColor"/><circle cx="16" cy="12" r=".9" fill="currentColor"/>',
    income: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.4-.9-1.4-1.5-2.8-1.5-1.6 0-2.8.8-2.8 2s1.2 1.7 2.8 2 2.8.8 2.8 2-1.2 2.1-2.8 2.1c-1.4 0-2.5-.6-2.9-1.6M12 6v1.7M12 16.3V18"/>',
    harvest: '<path d="M12 9c-3.6 0-5.5 3.3-4.6 6.6.8 2.7 3.4 4.4 4.6 4.4s3.8-1.7 4.6-4.4C17.5 12.3 15.6 9 12 9z"/><path d="M6.5 10c.9-2.6 2.9-3.8 5.5-3.8s4.6 1.2 5.5 3.8c-1.8-.9-3.6-1.2-5.5-1.2s-3.7.3-5.5 1.2z"/><path d="M12 6.2V3.5"/>',
    // navigation
    home: '<path d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
    log: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>',
    jar: '<rect x="7.5" y="3.5" width="9" height="3" rx="1"/><path d="M7 6.5h10a2 2 0 0 1 2 2V18a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18V8.5a2 2 0 0 1 2-2z"/><path d="M5 12.5h14"/>',
    me: '<circle cx="12" cy="8.5" r="3.75"/><path d="M4.75 20a7.25 7.25 0 0 1 14.5 0"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    copy: '<rect x="8" y="8" width="11.5" height="11.5" rx="2"/><path d="M5.5 15.5H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9.5a1 1 0 0 1 1 1v.5"/>',
    download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    shield: '<path d="M12 3.5l7 2.5v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
    // badges & levels
    leaf: '<path d="M5 19C5 10.5 10.5 5 19.5 4.5 19.5 13.5 14 19 5 19z"/><path d="M5 19l8.5-8.5"/>',
    check: '<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.4l2.5 2.5 5-5.4"/>',
    star: '<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z"/>',
    flame: '<path d="M12 20.5c3.6 0 6-2.4 6-5.7 0-3.6-2.8-5.6-3.8-9.3-1.7 1.4-2.3 3.4-2.2 5-1-.7-1.7-1.8-1.9-3.2C8.3 9 6 11.6 6 14.8c0 3.3 2.4 5.7 6 5.7z"/>',
    sprout: '<path d="M12 20v-7.5"/><path d="M12 12.5C12 8.6 9.6 6.5 5.5 6.5c0 3.9 2.4 6 6.5 6zM12 10.5c0-3.9 2.4-6 6.5-6 0 3.9-2.4 6-6.5 6z"/>',
    tree: '<path d="M12 20.5v-5"/><path d="M12 3.5c-3.9 0-6.5 2.9-6.5 6.4 0 3.1 2.8 5.6 6.5 5.6s6.5-2.5 6.5-5.6c0-3.5-2.6-6.4-6.5-6.4z"/>',
    house: '<path d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M10 20v-5h4v5"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  };
  function get(name, cls) {
    return `<svg class="${cls || "icon"}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.other}</svg>`;
  }
  return { get: get };
})();
