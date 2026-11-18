// =========================================================
// squirrel.js — draws the squirrel (with moods and outfits),
// the tree-hollow decorations, and the hazelnut jar.
// All drawings are original artwork made for HazelHollow.
// =========================================================

const Art = (function () {
  // mood: "happy" | "calm" | "sleepy" | "encourage"
  // outfit: "none" | "scarf" | "beanie" | "raincoat"
  function squirrel(mood, outfit) {
    const eyesOpen = `<g class="eyes" stroke="none">
        <ellipse cx="73" cy="84" rx="7" ry="9" fill="#3d2e24"/><ellipse cx="107" cy="84" rx="7" ry="9" fill="#3d2e24"/>
        <circle cx="75.5" cy="80" r="2.6" fill="#fff"/><circle cx="109.5" cy="80" r="2.6" fill="#fff"/></g>`;
    const eyesHappy = `<path d="M65 86 Q73 76 81 86 M99 86 Q107 76 115 86" fill="none" stroke-width="3.2"/>`;
    const eyesSleepy = `<path d="M65 84 Q73 91 81 84 M99 84 Q107 91 115 84" fill="none" stroke-width="3"/>
        <text x="132" y="50" font-family="Georgia, serif" font-style="italic" font-size="22" fill="#7a4e30" stroke="none">z</text>
        <text x="146" y="36" font-family="Georgia, serif" font-style="italic" font-size="16" fill="#7a4e30" stroke="none">z</text>`;
    const mouths = {
      happy: `<path d="M83 102 Q90 113 97 102 Z" fill="#c4626a" stroke-width="2"/>`,
      calm: `<path d="M84 102 Q87 106 90 102 Q93 106 96 102" fill="none" stroke-width="2"/>`,
      sleepy: `<ellipse cx="90" cy="104" rx="2.6" ry="2" fill="#4a3427" stroke="none"/>`,
      encourage: `<path d="M85 103 Q90 107 95 103" fill="none" stroke-width="2"/>`,
    };
    const eyes = mood === "happy" ? eyesHappy : mood === "sleepy" ? eyesSleepy : eyesOpen;

    const raincoat = outfit === "raincoat" ? `
      <path d="M48 150 C46 118 64 106 92 106 C120 106 138 118 136 150 C136 172 120 186 92 186 C64 186 48 172 48 150 Z" fill="#e6bf5e"/>
      <path d="M92 110 L92 184" fill="none" stroke-width="2"/>
      <circle cx="98" cy="140" r="2.5" fill="#4a3427" stroke="none"/><circle cx="98" cy="160" r="2.5" fill="#4a3427" stroke="none"/>` : "";
    const hood = outfit === "raincoat" ? `<path d="M44 96 C40 48 66 34 90 34 C114 34 140 48 136 96 C130 70 116 56 90 56 C64 56 50 70 44 96 Z" fill="#e6bf5e"/>` : "";
    const beanie = outfit === "beanie" ? `
      <path d="M54 66 Q56 34 90 32 Q124 34 126 66 Q90 56 54 66 Z" fill="#8fa37f"/>
      <path d="M52 66 Q90 54 128 66 L128 76 Q90 64 52 76 Z" fill="#6f8862"/>
      <circle cx="90" cy="30" r="8" fill="#f3dcc0"/>` : "";
    const scarf = outfit === "scarf" ? `
      <path d="M56 118 Q90 134 124 118 L126 129 Q90 145 54 129 Z" fill="#c47a62"/>
      <path d="M104 132 L108 158 L120 156 L115 130 Z" fill="#c47a62"/>
      <path d="M70 124 L68 133 M90 128 L90 138 M110 124 L112 133" fill="none" stroke="#f3dcc0" stroke-width="2.4"/>` : "";

    return `<svg class="squirrel" viewBox="0 0 200 200" role="img" aria-label="HazelHollow's squirrel, feeling ${mood === "encourage" ? "encouraging" : mood}">
      <g stroke="#4a3427" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
        <g class="tail">
          <path d="M112 166 C166 174 194 134 180 94 C170 66 192 44 172 26 C152 10 124 24 130 50 C136 72 152 92 140 116 C132 132 120 142 108 150 Z" fill="#c98a5a"/>
          <path d="M163 42 C155 62 168 84 162 108" fill="none" stroke="#e3b088" stroke-width="3"/>
        </g>
        <ellipse cx="92" cy="145" rx="44" ry="40" fill="#b5764a"/>
        <ellipse cx="90" cy="152" rx="26" ry="27" fill="#f3dcc0" stroke="none"/>
        <ellipse cx="70" cy="184" rx="14" ry="7" fill="#9c6340"/>
        <ellipse cx="112" cy="184" rx="14" ry="7" fill="#9c6340"/>
        ${raincoat}${hood}
        <path d="M58 62 C51 36 62 25 72 30 C80 34 80 48 76 58 Z" fill="#b5764a"/>
        <path d="M63 54 C60 42 64 36 69 38 C74 41 73 49 71 55 Z" fill="#e8a598" stroke="none"/>
        <path d="M122 62 C129 36 118 25 108 30 C100 34 100 48 104 58 Z" fill="#b5764a"/>
        <path d="M117 54 C120 42 116 36 111 38 C106 41 107 49 109 55 Z" fill="#e8a598" stroke="none"/>
        <circle cx="90" cy="86" r="40" fill="#b5764a"/>
        <ellipse cx="90" cy="101" rx="25" ry="18" fill="#f3dcc0" stroke="none"/>
        ${eyes}
        <ellipse cx="61" cy="99" rx="8" ry="5" fill="#e8a598" stroke="none"/>
        <ellipse cx="119" cy="99" rx="8" ry="5" fill="#e8a598" stroke="none"/>
        <path d="M86 95 Q90 92 94 95 Q90 100 86 95 Z" fill="#4a3427" stroke-width="1.5"/>
        ${mouths[mood] || mouths.calm}
        ${beanie}${scarf}
        <path d="M80 133 C78 121 102 121 100 133 C100 145 80 145 80 133 Z" fill="#a8683d"/>
        <path d="M78 127 C82 117 98 117 102 127 C96 123 84 123 78 127 Z" fill="#9fb08d"/>
        <ellipse cx="77" cy="134" rx="7" ry="6" fill="#b5764a"/>
        <ellipse cx="103" cy="134" rx="7" ry="6" fill="#b5764a"/>
      </g></svg>`;
  }

  // Decorations that appear in the tree hollow as you check in.
  // days = how many cozy (check-in) days unlock it. pro = Pro-only extra.
  const S = `stroke="#4a3427" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
  const DECOR = [
    { id: "lamp", name: "a little lamp", days: 1, style: "left:7%;bottom:18%;width:15%",
      svg: `<svg viewBox="0 0 40 90"><g ${S}><circle cx="20" cy="18" r="17" fill="#ffe7a8" stroke="none" opacity=".55"/><path d="M8 26 L14 8 L26 8 L32 26 Z" fill="#f4cfae"/><path d="M20 26 L20 84 M10 86 L30 86" fill="none"/></g></svg>` },
    { id: "rug", name: "a cozy rug", days: 3, style: "left:22%;bottom:2%;width:56%",
      svg: `<svg viewBox="0 0 120 30"><g ${S}><ellipse cx="60" cy="15" rx="56" ry="12" fill="#d98b52"/><ellipse cx="60" cy="15" rx="40" ry="7" fill="none" stroke="#f4cfae" stroke-dasharray="5 4"/></g></svg>` },
    { id: "shelf", name: "a tiny bookshelf", days: 5, style: "right:6%;bottom:18%;width:18%",
      svg: `<svg viewBox="0 0 44 60"><g ${S}><rect x="2" y="2" width="40" height="56" rx="3" fill="#8a5a3b"/><path d="M2 30 L42 30" fill="none"/><rect x="7" y="10" width="6" height="20" fill="#c47a62"/><rect x="14" y="13" width="6" height="17" fill="#8fa37f"/><rect x="21" y="9" width="6" height="21" fill="#f4cfae"/><rect x="8" y="38" width="7" height="20" fill="#e6bf5e"/><rect x="16" y="41" width="6" height="17" fill="#b7c3a3"/></g></svg>` },
    { id: "nutjar", name: "a jar of hazelnuts", days: 7, style: "right:8%;bottom:50%;width:11%",
      svg: `<svg viewBox="0 0 30 36"><g ${S}><path d="M6 8 L24 8 L26 32 Q15 36 4 32 Z" fill="#fffaf2" opacity=".9"/><rect x="5" y="3" width="20" height="6" rx="2" fill="#c47a62"/><g stroke="none" fill="#a8683d"><circle cx="11" cy="27" r="4"/><circle cx="19" cy="27" r="4"/><circle cx="15" cy="20" r="4"/></g></g></svg>` },
    { id: "plant", name: "a window plant", days: 10, style: "left:8%;top:22%;width:20%",
      svg: `<svg viewBox="0 0 50 50"><g ${S}><circle cx="25" cy="22" r="20" fill="#cfe0f0"/><path d="M5 22 L45 22 M25 2 L25 42" fill="none" stroke="#8a5a3b"/><path d="M16 48 L18 38 L32 38 L34 48 Z" fill="#c47a62"/><path d="M25 38 C20 30 14 30 12 26 M25 38 C30 30 36 30 38 26 M25 38 L25 28" fill="none" stroke="#55684a"/></g></svg>` },
    { id: "lights", name: "string lights", days: 14, style: "left:12%;top:8%;width:76%",
      svg: `<svg viewBox="0 0 160 30"><path d="M2 4 Q80 34 158 4" fill="none" stroke="#4a3427" stroke-width="1.6"/><g stroke="none"><circle cx="22" cy="12" r="4" fill="#ffd27a"/><circle cx="48" cy="18" r="4" fill="#f4a3a3"/><circle cx="80" cy="20" r="4" fill="#ffd27a"/><circle cx="112" cy="18" r="4" fill="#b7d3a3"/><circle cx="138" cy="12" r="4" fill="#ffd27a"/></g></svg>` },
    // Pro extras
    { id: "stool", name: "a mushroom stool", pro: true, style: "left:24%;bottom:6%;width:12%",
      svg: `<svg viewBox="0 0 30 30"><g ${S}><path d="M11 14 L10 28 L20 28 L19 14 Z" fill="#f3e6d0"/><path d="M2 15 C2 4 28 4 28 15 Z" fill="#c47a62"/><circle cx="10" cy="10" r="2" fill="#fbf3e6" stroke="none"/><circle cx="19" cy="9" r="2" fill="#fbf3e6" stroke="none"/></g></svg>` },
    { id: "painting", name: "a leaf painting", pro: true, style: "right:10%;top:24%;width:16%",
      svg: `<svg viewBox="0 0 40 34"><g ${S}><rect x="2" y="2" width="36" height="30" fill="#fffaf2" stroke="#8a5a3b" stroke-width="3"/><path d="M10 26 C10 16 18 8 30 8 C30 20 22 26 10 26 Z" fill="#d98b52"/></g></svg>` },
    { id: "teacup", name: "a teacup", pro: true, style: "right:28%;bottom:6%;width:9%",
      svg: `<svg viewBox="0 0 30 24"><g ${S}><path d="M4 6 L22 6 L20 18 Q13 22 6 18 Z" fill="#b7c3a3"/><path d="M22 9 Q28 9 26 14 Q24 16 21 15" fill="none"/><path d="M10 3 Q12 0 10 -2 M15 3 Q17 0 15 -2" fill="none" stroke-width="1.4"/></g></svg>` },
  ];

  // The hazelnut jar for savings goals, filled to `pct` (0–100)
  function jar(pct, id) {
    const p = Math.max(0, Math.min(100, pct || 0));
    const top = 30, bottom = 128, fillY = bottom - (bottom - top) * p / 100;
    let nuts = "";
    for (let y = 120, row = 0; y > fillY - 4 && row < 9; y -= 11, row++) {
      for (let x = row % 2 ? 30 : 24; x < 84; x += 14) nuts += `<ellipse cx="${x}" cy="${y}" rx="6" ry="5.5" fill="${(x + y) % 3 ? "#a8683d" : "#c98a5a"}"/>`;
    }
    return `<svg viewBox="0 0 100 140" role="img" aria-label="Jar ${Math.round(p)}% full">
      <defs><clipPath id="jarclip-${id}"><path d="M18 30 C12 50 12 110 18 126 Q50 136 82 126 C88 110 88 50 82 30 Z"/></clipPath></defs>
      <g clip-path="url(#jarclip-${id})"><rect x="0" y="${fillY}" width="100" height="${140 - fillY}" fill="#f4cfae"/>${nuts}</g>
      <path d="M18 30 C12 50 12 110 18 126 Q50 136 82 126 C88 110 88 50 82 30 Z" fill="none" stroke="#4a3427" stroke-width="3" stroke-linejoin="round"/>
      <path d="M26 44 C22 64 22 92 25 108" fill="none" stroke="#fffaf2" stroke-width="4" stroke-linecap="round" opacity=".8"/>
      <rect x="14" y="16" width="72" height="16" rx="5" fill="#c47a62" stroke="#4a3427" stroke-width="3"/>
    </svg>`;
  }

  return { squirrel: squirrel, DECOR: DECOR, jar: jar };
})();
