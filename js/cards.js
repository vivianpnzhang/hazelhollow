// =========================================================
// cards.js — draws the downloadable picture cards:
//   • Semester recap card
//   • Founding Team card
//   • Share-kit image
// They're drawn on a <canvas> (a drawing area) and saved as PNG images.
// =========================================================

const Cards = (function () {
  const C = { cream: "#f7f3ec", oat: "#f0e9de", paper: "#fffdf9", ink: "#2b231d", soft: "#6a5c50",
              hazel: "#7a4e30", moss: "#4c6243", sage: "#e3e9dc", peach: "#f7e6d5", gold: "#e9cf86" };

  function loadImg(src) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }
  async function fontsReady() {
    try { await Promise.all([document.fonts.load("600 60px Fraunces"), document.fonts.load("400 30px Inter"), document.fonts.load("600 30px Inter")]); } catch (e) {}
  }
  function round(ctx, x, y, w, h, r, fill) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  }
  function text(ctx, str, x, y, font, color, align) {
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align || "center"; ctx.fillText(str, x, y);
  }
  async function base(w, h) {
    await fontsReady();
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = C.cream; ctx.fillRect(0, 0, w, h);
    round(ctx, 40, 40, w - 80, h - 80, 48, C.paper);
    ctx.strokeStyle = "#e5dccd"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(40, 40, w - 80, h - 80, 48); ctx.stroke();
    return { cv: cv, ctx: ctx };
  }
  async function drawSquirrel(ctx, x, y, size) {
    try { ctx.drawImage(await loadImg("images/squirrel.svg"), x, y, size, size); } catch (e) {}
  }

  // ---- Semester recap card (1080 × 1350) ----
  // Shows counts and percentages only, never dollar amounts, so it's safe to share.
  async function recap(d) {
    const { cv, ctx } = await base(1080, 1350);
    text(ctx, "My semester in the hollow", 540, 190, "600 76px Fraunces", C.hazel);
    text(ctx, d.range, 540, 250, "400 34px Inter", C.soft);
    await drawSquirrel(ctx, 360, 280, 360);
    const rows = [
      ["", d.cozyDays + (d.cozyDays === 1 ? " cozy check-in day" : " cozy check-in days")],
      ["", d.logs + (d.logs === 1 ? " purchase logged" : " purchases logged")],
      ["", d.topCategory ? "Most logged: " + d.topCategory : "Still gathering data"],
      ["", d.jarPct === null ? "No savings jar yet" : d.jarPct + "% of my jar filled"],
      ["", d.badges + (d.badges === 1 ? " little win earned" : " little wins earned")],
    ];
    rows.forEach(function (r, i) {
      const y = 730 + i * 104;
      round(ctx, 150, y - 66, 780, 88, 20, C.oat);
      ctx.beginPath(); ctx.arc(205, y - 22, 9, 0, Math.PI * 2); ctx.fillStyle = C.moss; ctx.fill();
      text(ctx, r[1], 245, y - 8, "500 38px Inter", C.ink, "left");
    });
    text(ctx, "HazelHollow", 540, 1262, "600 40px Fraunces", C.hazel);
    return cv;
  }

  // ---- Founding Team card (1080 × 1350) ----
  async function team(d) {
    const { cv, ctx } = await base(1080, 1350);
    // golden hazelnut badge
    ctx.beginPath(); ctx.arc(540, 200, 80, 0, Math.PI * 2); ctx.fillStyle = C.gold; ctx.fill();
    try { ctx.drawImage(await loadImg("images/hazelnut.svg"), 490, 150, 100, 100); } catch (e) {}
    text(ctx, "HazelHollow Founding Team", 540, 360, "600 64px Fraunces", C.hazel);
    await drawSquirrel(ctx, 390, 390, 300);
    text(ctx, d.name, 540, 800, "600 96px Fraunces", C.ink);
    round(ctx, 290, 840, 500, 80, 40, C.sage);
    text(ctx, d.role, 540, 893, "600 38px Inter", C.ink);
    text(ctx, "Level: " + d.level, 540, 1010, "600 40px Inter", C.moss);
    text(ctx, "Since " + d.since, 540, 1070, "400 36px Inter", C.soft);
    text(ctx, "A volunteer role on a student-built project", 540, 1250, "400 30px Inter", C.soft);
    return cv;
  }

  // ---- Share-kit image (1080 × 1080) ----
  async function share(d) {
    const { cv, ctx } = await base(1080, 1080);
    text(ctx, d.headline, 540, 200, "600 72px Fraunces", C.hazel);
    text(ctx, "a cozy budgeting app for students", 540, 270, "400 40px Inter", C.ink);
    await drawSquirrel(ctx, 380, 300, 320);
    round(ctx, 140, 660, 800, 150, 40, C.paper);
    text(ctx, "Tell it what you have and when", 540, 722, "600 38px Inter", C.ink);
    text(ctx, "more comes in. Get one weekly number.", 540, 776, "600 38px Inter", C.ink);
    text(ctx, d.disclosure, 540, 900, "600 32px Inter", C.moss);
    text(ctx, "Free · no account · your numbers stay on your phone", 540, 960, "400 28px Inter", C.soft);
    return cv;
  }

  // ---- Save or share a finished card ----
  function download(cv, filename) {
    cv.toBlob(function (blob) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    }, "image/png");
  }

  return { recap: recap, team: team, share: share, download: download };
})();
