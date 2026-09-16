// Shared sprite drawing for the Margin Mower prototype (game + sprite gallery).
// Every sprite is drawn with its ground contact at (x, base). Styles:
//   A = current outlined pixel-ish look
//   B = bold cartoon (Paperboy-ish: big heads, thick outlines, highlights)
//   C = flat modern (no outlines, rounded shapes)
const Sprites = (() => {
  const OL = '#1b1b24';
  let c = null;
  const use = ctx => { c = ctx; };

  // ---------- helpers ----------
  const px = (x, y, w, h, color) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
  const box = (x, y, w, h, color, o = OL) => { px(x - 1, y - 1, w + 2, h + 2, o); px(x, y, w, h, color); };
  function poly(points, fill, stroke = OL, lw = 1) {
    c.beginPath(); c.moveTo(points[0][0], points[0][1]);
    for (const [x, y] of points.slice(1)) c.lineTo(x, y);
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.lineWidth = lw; c.lineJoin = 'round'; c.strokeStyle = stroke; c.stroke(); }
  }
  function ellipse(x, y, rx, ry, fill, stroke, lw = 1) {
    c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
  }
  function rrect(x, y, w, h, r, fill, stroke, lw = 1) {
    c.beginPath(); c.roundRect(x, y, w, h, r);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
  }
  function line(x1, y1, x2, y2, color, lw = 1) {
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineCap = 'round'; c.lineWidth = lw; c.strokeStyle = color; c.stroke();
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(v + (amt < 0 ? v * amt : (255 - v) * amt))));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }
  const shadow = (x, base, w, alpha = 0.28) => ellipse(x, base + 1, w, 3.5, `rgba(0,0,0,${alpha})`);
  const faded = (on, fn) => { c.globalAlpha = on ? 0.35 : 1; fn(); c.globalAlpha = 1; };
  const bob = (speed, amt) => Math.round(Math.sin(performance.now() / speed) * amt);

  // =====================================================================
  // CREWS
  // =====================================================================
  function rideOnA(x, base, { air = 0, duck = false } = {}) {
    const y = base - air;
    ellipse(x, base + 1, 14 - Math.min(6, air / 8), 3.5, 'rgba(0,0,0,.3)');
    box(x - 13, y - 8, 27, 4, '#8f2a1f');
    poly([[x - 12, y - 8], [x - 12, y - 15], [x + 2, y - 15], [x + 6, y - 19], [x + 14, y - 17], [x + 14, y - 8]], '#d64533');
    px(x + 3, y - 17, 9, 2, '#f06a57'); px(x - 11, y - 14, 12, 1, '#f06a57');
    box(x - 11, y - 21, 8, 6, '#2b2b2b'); px(x - 12, y - 24, 3, 9, '#2b2b2b');
    px(x + 1, y - 26, 1, 8, OL); px(x - 1, y - 26, 5, 2, OL);
    const d = duck ? 4 : 0;
    box(x - 9, y - 30 + d, 8, 10, '#127DB9');
    box(x - 3, y - 27 + d, 5, 2, '#127DB9');
    ellipse(x - 5, y - 34 + d, 4, 4, '#f1c27d', OL);
    poly([[x - 10, y - 36 + d], [x - 5, y - 40 + d], [x, y - 37 + d], [x + 4, y - 36 + d], [x - 10, y - 35 + d]], '#f5c542');
    ellipse(x - 8, y - 5, 6, 6, '#222', OL); ellipse(x - 8, y - 5, 2.5, 2.5, '#bbb');
    ellipse(x + 10, y - 3, 4, 4, '#222', OL); ellipse(x + 10, y - 3, 1.5, 1.5, '#bbb');
  }

  function pushA(x, base, { air = 0, duck = false } = {}) {
    const y = base - air;
    ellipse(x, base + 1, 14 - Math.min(6, air / 8), 3.5, 'rgba(0,0,0,.3)');
    box(x + 3, y - 8, 15, 6, '#127DB9'); px(x + 3, y - 8, 15, 2, '#4aa3dc');
    box(x - 1, y - 11, 6, 8, '#2b2b2b');
    ellipse(x + 5, y - 2, 2.5, 2.5, '#222', OL); ellipse(x + 16, y - 2, 2.5, 2.5, '#222', OL);
    const hy = duck ? y - 16 : y - 27;
    line(x + 5, y - 7, x - 1, hy, OL, 1.5);
    if (duck) {
      box(x - 12, y - 7, 9, 7, '#35507a');
      box(x - 12, y - 17, 9, 10, '#f5c542'); px(x - 12, y - 13, 9, 1, '#c8c8c8');
      box(x - 5, y - 16, 5, 2, '#f1c27d');
      ellipse(x - 6, y - 21, 4, 4, '#f1c27d', OL);
      poly([[x - 11, y - 23], [x - 6, y - 27], [x - 1, y - 24], [x + 3, y - 23], [x - 11, y - 22]], '#2b2b2b');
    } else {
      box(x - 12, y - 12, 3, 12, '#35507a'); box(x - 7, y - 12, 3, 12, '#35507a');
      box(x - 13, y - 24, 10, 12, '#f5c542'); px(x - 13, y - 19, 10, 1, '#c8c8c8');
      box(x - 5, y - 23, 5, 2, '#f1c27d');
      ellipse(x - 8, y - 28, 4, 4, '#f1c27d', OL);
      poly([[x - 13, y - 30], [x - 8, y - 34], [x - 3, y - 31], [x + 1, y - 30], [x - 13, y - 29]], '#2b2b2b');
    }
  }

  // ---- style B: bold cartoon ----
  const LW = 2;
  function headB(hx, hy, cap, capBrim = 1) {
    ellipse(hx, hy, 6.5, 6.5, '#f1c27d', OL, LW);
    // cap
    c.beginPath(); c.arc(hx, hy - 1, 6.8, Math.PI, 0); c.closePath();
    c.fillStyle = cap; c.fill(); c.lineWidth = LW; c.strokeStyle = OL; c.stroke();
    poly([[hx + 2 * capBrim, hy - 1.5], [hx + 11 * capBrim, hy - 0.5], [hx + 11 * capBrim, hy + 1], [hx + 2 * capBrim, hy + 0.5]], cap, OL, 1.5);
    px(hx - 3, hy - 6, 3, 2, 'rgba(255,255,255,.45)');
    // face: eye + smile + ear
    ellipse(hx + 3, hy + 2, 1.1, 1.3, OL);
    c.beginPath(); c.arc(hx + 2.5, hy + 3.5, 2, 0.2, 1.3); c.lineWidth = 1; c.strokeStyle = OL; c.stroke();
    ellipse(hx - 2.5, hy + 2, 1.5, 2, '#e3a86b');
  }

  function rideOnB(x, base, { air = 0, duck = false } = {}) {
    const y = base - air;
    ellipse(x + 1, base + 1, 17 - Math.min(7, air / 7), 4, 'rgba(0,0,0,.3)');
    // mower deck
    rrect(x - 15, y - 9, 34, 6, 2, '#6d1e16', OL, LW);
    // body + hood
    poly([[x - 14, y - 9], [x - 14, y - 18], [x - 2, y - 18], [x + 3, y - 23], [x + 17, y - 21], [x + 19, y - 13], [x + 18, y - 9]], '#e0402d', OL, LW);
    poly([[x + 4, y - 21], [x + 15, y - 19.5], [x + 16, y - 17], [x + 5, y - 18.5]], '#ff8a78', null);
    rrect(x + 13, y - 16, 5, 3, 1, '#fff3b0', OL, 1); // headlight
    px(x - 12, y - 16, 10, 2, '#ff8a78');
    // seat
    rrect(x - 14, y - 27, 11, 10, 3, '#2b2b2b', OL, LW);
    // steering column + wheel
    line(x + 1, y - 18, x + 4, y - 30, OL, 2);
    ellipse(x + 4, y - 30, 4, 1.5, '#444', OL, 1.5);
    // driver
    const d = duck ? 6 : 0;
    rrect(x - 12, y - 36 + d, 11, 14, 3, '#127DB9', OL, LW);      // shirt
    px(x - 11, y - 34 + d, 3, 10, 'rgba(255,255,255,.25)');
    line(x - 4, y - 31 + d, x + 3, y - 30, '#127DB9', 3.5);        // arm
    ellipse(x + 3.5, y - 30, 2, 2, '#f1c27d', OL, 1);              // hand
    rrect(x - 10, y - 24, 9, 6, 2, '#35507a', OL, LW);            // legs on seat
    headB(x - 6, y - 43 + d, '#f5c542');
    // wheels
    ellipse(x - 9, y - 5, 7.5, 7.5, '#262626', OL, LW); ellipse(x - 9, y - 5, 3, 3, '#cfcfcf', OL, 1);
    ellipse(x + 13, y - 3, 4.5, 4.5, '#262626', OL, LW); ellipse(x + 13, y - 3, 1.8, 1.8, '#cfcfcf');
  }

  function pushB(x, base, { air = 0, duck = false } = {}) {
    const y = base - air;
    ellipse(x + 2, base + 1, 17 - Math.min(7, air / 7), 4, 'rgba(0,0,0,.3)');
    // mower
    rrect(x + 4, y - 10, 18, 8, 3, '#e0402d', OL, LW);
    px(x + 6, y - 9, 14, 2, '#ff8a78');
    rrect(x - 2, y - 14, 8, 11, 2, '#3a3a3a', OL, LW);              // bag
    ellipse(x + 7, y - 2, 3, 3, '#262626', OL, 1.5); ellipse(x + 19, y - 2, 3, 3, '#262626', OL, 1.5);
    const handTop = duck ? [x - 1, y - 18] : [x - 3, y - 30];
    line(x + 6, y - 9, handTop[0], handTop[1], OL, 2.5);
    line(x + 6, y - 9, handTop[0], handTop[1], '#9a9a9a', 1);
    if (duck) {
      rrect(x - 17, y - 9, 13, 8, 3, '#35507a', OL, LW);             // crouched legs
      rrect(x - 17, y - 3, 6, 3, 1, '#5a3a20', OL, 1);               // boot
      rrect(x - 16, y - 21, 12, 13, 3, '#c6e63a', OL, LW);          // vest
      px(x - 16, y - 16, 12, 2, '#e8e8e8');
      line(x - 7, y - 17, handTop[0], handTop[1], '#c6e63a', 3.5);
      ellipse(handTop[0], handTop[1], 2, 2, '#f1c27d', OL, 1);
      headB(x - 9, y - 27, '#127DB9');
    } else {
      rrect(x - 15, y - 15, 5, 15, 2, '#35507a', OL, LW);
      rrect(x - 9, y - 15, 5, 15, 2, '#35507a', OL, LW);
      rrect(x - 16, y - 3, 7, 3, 1, '#5a3a20', OL, 1); rrect(x - 10, y - 3, 7, 3, 1, '#5a3a20', OL, 1);
      rrect(x - 17, y - 30, 14, 17, 3, '#c6e63a', OL, LW);          // vest
      px(x - 17, y - 24, 14, 2, '#e8e8e8'); px(x - 17, y - 19, 14, 2, '#e8e8e8');
      line(x - 7, y - 26, handTop[0], handTop[1], '#c6e63a', 3.5);
      ellipse(handTop[0], handTop[1], 2, 2, '#f1c27d', OL, 1);
      headB(x - 10, y - 36, '#127DB9');
    }
  }

  // ---- style C: flat modern ----
  function rideOnC(x, base, { air = 0, duck = false } = {}) {
    const y = base - air;
    ellipse(x + 1, base + 1, 16 - Math.min(7, air / 7), 3.5, 'rgba(0,0,0,.18)');
    rrect(x - 15, y - 9, 34, 5, 2.5, '#2f3a4a');
    rrect(x - 14, y - 19, 32, 12, 6, '#ff6b4a');
    rrect(x + 2, y - 23, 16, 8, 4, '#ff6b4a');
    rrect(x - 14, y - 27, 10, 10, 4, '#2f3a4a');
    const d = duck ? 6 : 0;
    rrect(x - 12, y - 36 + d, 10, 13, 5, '#2d9cdb');
    ellipse(x - 7, y - 41 + d, 5.5, 5.5, '#f4c7a1');
    c.beginPath(); c.arc(x - 7, y - 42 + d, 5.8, Math.PI, 0); c.fillStyle = '#ffd166'; c.fill();
    rrect(x - 3, y - 43 + d, 8, 2, 1, '#ffd166');
    line(x - 4, y - 31 + d, x + 4, y - 29, '#2d9cdb', 3);
    ellipse(x - 9, y - 5, 7, 7, '#2f3a4a'); ellipse(x - 9, y - 5, 2.5, 2.5, '#e6e6e6');
    ellipse(x + 13, y - 3, 4, 4, '#2f3a4a'); ellipse(x + 13, y - 3, 1.5, 1.5, '#e6e6e6');
  }

  function pushC(x, base, { air = 0, duck = false } = {}) {
    const y = base - air;
    ellipse(x + 2, base + 1, 16 - Math.min(7, air / 7), 3.5, 'rgba(0,0,0,.18)');
    rrect(x + 4, y - 10, 18, 8, 4, '#ff6b4a');
    rrect(x - 2, y - 14, 8, 11, 3, '#2f3a4a');
    ellipse(x + 7, y - 2, 2.8, 2.8, '#2f3a4a'); ellipse(x + 19, y - 2, 2.8, 2.8, '#2f3a4a');
    const top = duck ? [x - 1, y - 18] : [x - 3, y - 30];
    line(x + 6, y - 9, top[0], top[1], '#8795a8', 2);
    if (duck) {
      rrect(x - 17, y - 9, 13, 9, 4, '#3d5a80');
      rrect(x - 16, y - 21, 12, 13, 5, '#b8e04a');
      line(x - 8, y - 17, top[0], top[1], '#b8e04a', 3);
      ellipse(x - 9, y - 26, 5.5, 5.5, '#f4c7a1');
      c.beginPath(); c.arc(x - 9, y - 27, 5.8, Math.PI, 0); c.fillStyle = '#2d9cdb'; c.fill();
    } else {
      rrect(x - 15, y - 15, 5, 15, 2.5, '#3d5a80'); rrect(x - 9, y - 15, 5, 15, 2.5, '#3d5a80');
      rrect(x - 17, y - 30, 14, 17, 5, '#b8e04a');
      line(x - 8, y - 26, top[0], top[1], '#b8e04a', 3);
      ellipse(x - 10, y - 35, 5.5, 5.5, '#f4c7a1');
      c.beginPath(); c.arc(x - 10, y - 36, 5.8, Math.PI, 0); c.fillStyle = '#2d9cdb'; c.fill();
    }
  }

  const CREW_STYLES = { A: { rideOn: rideOnA, push: pushA }, B: { rideOn: rideOnB, push: pushB }, C: { rideOn: rideOnC, push: pushC } };
  function crew(style, id, x, base, opts) { (CREW_STYLES[style] || CREW_STYLES.A)[id](x, base, opts); }

  // =====================================================================
  // OBSTACLES (style A and B)
  // =====================================================================
  function rock(style, x, base) {
    shadow(x, base, 10);
    if (style === 'B') {
      poly([[x - 9, base], [x - 8, base - 8], [x - 3, base - 13], [x + 5, base - 12], [x + 9, base - 5], [x + 9, base]], '#a3a3ab', OL, LW);
      poly([[x - 4, base - 11], [x + 2, base - 11.5], [x - 1, base - 8]], '#d4d4da', null);
      poly([[x + 3, base], [x + 8, base - 5], [x + 9, base]], '#7d7d86', null);
    } else {
      poly([[x - 8, base], [x - 7, base - 8], [x - 2, base - 12], [x + 5, base - 11], [x + 8, base - 4], [x + 8, base]], '#9a9a9f');
      px(x - 3, base - 10, 5, 2, '#c4c4c9'); px(x - 5, base - 6, 3, 1, '#c4c4c9');
    }
  }
  function sprinkler(style, x, base) {
    shadow(x, base, 6);
    if (style === 'B') {
      rrect(x - 3.5, base - 10, 7, 10, 1.5, '#2b2b2b', OL, LW);
      rrect(x - 5, base - 13, 10, 4, 1.5, '#4a4a4a', OL, 1.5);
      c.strokeStyle = '#6cc4f5'; c.lineWidth = 1.5; c.lineCap = 'round';
      for (const dir of [-1, 1]) { c.beginPath(); c.moveTo(x, base - 13); c.quadraticCurveTo(x + dir * 7, base - 26, x + dir * 13, base - 12); c.stroke(); }
      for (const [dx, dy] of [[-13, -10], [13, -10], [-10, -18], [10, -18]]) ellipse(x + dx, base + dy, 1.3, 1.3, '#a8defa');
    } else {
      box(x - 3, base - 9, 6, 9, '#2b2b2b'); box(x - 4, base - 11, 8, 3, '#555');
      for (const [dx, dy] of [[-9, -16], [-5, -20], [0, -22], [5, -20], [9, -16]]) ellipse(x + dx, base + dy, 1.2, 1.2, '#7ec8f0');
    }
  }
  function curb(style, x, base) {
    shadow(x, base, 11);
    if (style === 'B') {
      // picnic table (side view)
      const wood = '#b0703a', dark = '#8a5428';
      line(x - 9, base, x + 1, base - 13, OL, 4.5); line(x - 9, base, x + 1, base - 13, dark, 2.5);   // A-frame legs
      line(x + 9, base, x - 1, base - 13, OL, 4.5); line(x + 9, base, x - 1, base - 13, dark, 2.5);
      rrect(x - 14, base - 7, 28, 3, 1, wood, OL, 1.5);                                           // bench
      rrect(x - 13, base - 16, 26, 4, 1, wood, OL, LW);                                           // tabletop
      px(x - 12, base - 15.5, 24, 1, 'rgba(255,255,255,.3)');
      for (const gx of [-6, 1, 7]) px(x + gx, base - 15, 0.8, 2.5, dark);                        // plank seams
      rrect(x - 8, base - 19, 6, 3, 0.8, '#e23b3b', OL, 1);                                       // picnic basket
    } else {
      box(x - 9, base - 9, 18, 9, '#b0aca3'); px(x - 9, base - 9, 18, 3, '#f1c232'); px(x - 9, base - 6, 18, 1, OL);
    }
  }
  function shrub(style, x, base) {
    shadow(x, base, 12);
    if (style === 'B') {
      line(x - 3, base, x - 5, base - 5, '#6b4423', 2); line(x + 3, base, x + 5, base - 5, '#6b4423', 2); line(x, base, x, base - 6, '#6b4423', 2);
      // bumpy clipped outline
      c.beginPath();
      c.moveTo(x - 11, base - 3);
      const bumps = [[-12, -9], [-9, -15], [-4, -18], [2, -18.5], [7, -16], [11, -11], [11.5, -5]];
      for (const [bx, by] of bumps) c.quadraticCurveTo(x + bx - 3, base + by - 2, x + bx, base + by);
      c.lineTo(x + 10, base - 3); c.closePath();
      c.fillStyle = '#2f7a2f'; c.fill(); c.lineWidth = LW; c.strokeStyle = OL; c.stroke();
      // leaf texture
      for (let i = 0; i < 16; i++) {
        const lx = x - 8 + ((i * 7) % 17), ly = base - 5 - ((i * 5) % 12);
        ellipse(lx, ly, 2.2, 1.4, i % 2 ? '#3f9a3c' : '#276a28');
      }
      ellipse(x - 3, base - 15, 3.5, 1.8, '#6cc25e');
      // red berries
      for (const [bx, by] of [[-6, -10], [-1, -7], [4, -12], [7, -7], [1, -14], [-8, -5]]) {
        ellipse(x + bx, base + by, 1.6, 1.6, '#d62828', OL, 0.6); ellipse(x + bx - 0.5, base + by - 0.6, 0.5, 0.5, '#ffb3b3');
      }
    } else {
      ellipse(x, base - 9, 11, 10, '#2f6b2f', OL); ellipse(x - 3, base - 12, 5, 4, '#4f9f45'); ellipse(x + 4, base - 7, 3, 3, '#3f8a3a');
    }
  }
  function oldLady(style, x, base) {
    const b = bob(260, 1);
    shadow(x, base, 9);
    if (style === 'B') {
      rrect(x - 5, base - 5, 4, 5, 1, '#6b4a3a', OL, 1.5); rrect(x + 1, base - 5, 4, 5, 1, '#6b4a3a', OL, 1.5);
      poly([[x - 8, base - 4], [x - 5, base - 19 + b], [x + 5, base - 19 + b], [x + 8, base - 4]], '#9b7fc4', OL, LW);
      rrect(x - 6, base - 23 + b, 12, 7, 2, '#f0c8dc', OL, LW);                    // cardigan
      for (let i = -3; i <= 3; i += 2) ellipse(x + i, base - 17 + b, 0.9, 0.9, '#fff'); // pearls
      ellipse(x, base - 30 + b, 6, 6, '#f1c9a0', OL, LW);                             // head
      ellipse(x - 1, base - 35 + b, 6, 3.5, '#e4e4ec', OL, 1.5); ellipse(x - 6, base - 34 + b, 3, 3, '#e4e4ec', OL, 1.5);
      ellipse(x - 2, base - 30 + b, 2, 2, null, OL, 1); ellipse(x + 3, base - 30 + b, 2, 2, null, OL, 1); // glasses
      c.beginPath(); c.arc(x + 1, base - 27 + b, 1.5, 0.2, 2.9); c.lineWidth = 1; c.strokeStyle = OL; c.stroke();
      rrect(x + 5, base - 16 + b, 6, 5, 1.5, '#c0392b', OL, 1.5);                    // purse
      line(x + 11, base, x + 10, base - 18 + b, '#6b4423', 2); line(x + 10, base - 18 + b, x + 7, base - 19 + b, '#6b4423', 2); // cane
    } else {
      box(x - 4, base - 5, 3, 5, '#5a4030'); box(x + 1, base - 5, 3, 5, '#5a4030');
      poly([[x - 7, base - 5], [x - 5, base - 17 + b], [x + 5, base - 17 + b], [x + 7, base - 5]], '#9b7fc4');
      box(x - 5, base - 20 + b, 10, 6, '#e0c3d9');
      ellipse(x, base - 24 + b, 4, 4, '#f1c9a0', OL);
      ellipse(x - 1, base - 28 + b, 4, 2.5, '#d9d9e0', OL); ellipse(x - 4, base - 27 + b, 2, 2, '#d9d9e0', OL);
      px(x + 1, base - 25 + b, 3, 1, OL);
      px(x + 7, base - 16 + b, 1, 16, '#6b4423'); px(x + 5, base - 16 + b, 3, 1, '#6b4423');
    }
  }
  function boyDog(style, x, base) {
    // walking toward the mower (facing left); dog leads on the left
    const step = Math.sin(performance.now() / 120);
    const b = Math.round(step);
    shadow(x - 1, base, 17);
    if (style === 'B') {
      // dog
      rrect(x - 17, base - 11, 14, 7, 3, '#c98a3c', OL, LW);
      rrect(x - 16 + b, base - 5, 2.5, 5, 1, '#c98a3c', OL, 1); rrect(x - 7 - b, base - 5, 2.5, 5, 1, '#c98a3c', OL, 1);
      ellipse(x - 18, base - 14, 4.5, 4, '#c98a3c', OL, LW);
      ellipse(x - 22, base - 13, 2.5, 1.8, '#c98a3c', OL, 1);
      ellipse(x - 23.5, base - 13.5, 1, 1, OL);
      ellipse(x - 17, base - 13, 2, 3, '#8a5a24', OL, 1);                       // ear
      ellipse(x - 19, base - 15, 0.9, 0.9, OL);
      line(x - 3, base - 10, x + 1, base - 14 - b, '#c98a3c', 2.5);             // tail
      rrect(x - 16, base - 12, 2, 3, 0.5, '#e23b3b');                           // collar
      // boy
      rrect(x + 3, base - 9, 3.5, 9, 1, '#2f4f7f', OL, 1.5); rrect(x + 8, base - 9, 3.5, 9, 1, '#2f4f7f', OL, 1.5);
      rrect(x + 2, base - 3, 5, 3, 1, '#ffffff', OL, 1); rrect(x + 7, base - 3, 5, 3, 1, '#ffffff', OL, 1);
      rrect(x + 1, base - 20, 12, 12, 3, '#e23b3b', OL, LW);
      px(x + 2, base - 15, 10, 2, '#ffffff');
      line(x + 3, base - 16, x - 2, base - 13, '#f1c27d', 2.5);                  // arm holding leash
      ellipse(x + 7, base - 26, 6, 6, '#f1c27d', OL, LW);
      c.beginPath(); c.arc(x + 7, base - 27, 6.2, Math.PI, 0); c.closePath(); c.fillStyle = '#2d6cdf'; c.fill(); c.lineWidth = LW; c.strokeStyle = OL; c.stroke();
      poly([[x + 7, base - 28], [x + 15, base - 27.5], [x + 15, base - 26], [x + 7, base - 26]], '#2d6cdf', OL, 1.5); // backwards cap
      ellipse(x + 4, base - 25, 1.1, 1.3, OL);
      c.beginPath(); c.arc(x + 4.5, base - 23.5, 1.8, 1.8, 2.9); c.lineWidth = 1; c.strokeStyle = OL; c.stroke();
    } else {
      box(x - 16, base - 10, 12, 6, '#c98a3c');
      px(x - 15 + b, base - 4, 2, 4, '#8a5a24'); px(x - 7 - b, base - 4, 2, 4, '#8a5a24');
      ellipse(x - 17, base - 12, 3.5, 3, '#c98a3c', OL);
      px(x - 21, base - 12, 3, 2, '#c98a3c'); px(x - 22, base - 12, 1, 1, OL);
      px(x - 4, base - 12, 1, 3, '#c98a3c');
      box(x + 3, base - 8, 2, 8, '#2f4f7f'); box(x + 7, base - 8, 2, 8, '#2f4f7f');
      box(x + 2, base - 17, 8, 9, '#e23b3b');
      px(x - 1, base - 13, 4, 1, '#f1c27d');
      ellipse(x + 6, base - 21, 4, 4, '#f1c27d', OL);
      poly([[x + 2, base - 23], [x + 6, base - 26], [x + 10, base - 23], [x + 12, base - 22], [x + 2, base - 22]], '#2d6cdf');
    }
    line(x - 1, base - 13, x - 15, base - 11, '#e23b3b', 0.8);                  // leash
  }
  function weed(style, x, base, { missed = false } = {}) {
    ellipse(x, base, 8, 3, '#4a2d18');
    const leaf = '#6d8f2a', dark = '#3e5a14', lw = style === 'B' ? 1.5 : 1;
    const blade = pts => poly(pts, leaf, dark, lw);
    blade([[x, base], [x - 14, base - 6], [x - 10, base - 8], [x - 12, base - 11], [x - 6, base - 9], [x - 2, base - 4]]);
    blade([[x, base], [x + 14, base - 7], [x + 10, base - 9], [x + 13, base - 13], [x + 6, base - 10], [x + 2, base - 4]]);
    blade([[x - 1, base], [x - 6, base - 16], [x - 3, base - 14], [x - 3, base - 20], [x + 1, base - 13], [x + 1, base]]);
    blade([[x, base], [x + 4, base - 18], [x + 5, base - 13], [x + 9, base - 17], [x + 3, base - 4]]);
    // dandelion seed head
    c.beginPath(); c.moveTo(x + 1, base - 3); c.quadraticCurveTo(x + 3, base - 16, x + 1, base - 27);
    c.lineWidth = 1.2; c.strokeStyle = '#7fa33a'; c.stroke();
    const hx = x + 1, hy = base - 32;
    ellipse(hx, hy, 6.5, 6.5, 'rgba(255,255,255,.55)', style === 'B' ? 'rgba(27,27,36,.35)' : null, 0.8);
    c.lineWidth = 0.6; c.strokeStyle = '#ffffff';
    for (let a = 0; a < 16; a++) {
      const ang = a / 16 * Math.PI * 2;
      c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + Math.cos(ang) * 6, hy + Math.sin(ang) * 6); c.stroke();
      ellipse(hx + Math.cos(ang) * 6.3, hy + Math.sin(ang) * 6.3, 0.7, 0.7, '#ffffff');
    }
    ellipse(hx, hy, 1.4, 1.4, '#c9b27a');
    if (missed) {
      ellipse(x + 12, base - 38, 5, 5, '#e23b3b', OL);
      c.fillStyle = '#fff'; c.font = '6px "Press Start 2P"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', x + 12, base - 37);
    }
  }
  // Low branch: one tree per run of consecutive branch columns (span = number of columns).
  // Trunk stands behind the fence (draw before the crew); the limb reaches over the lawn (draw after).
  const branchEdges = (x, span) => ({ left: x - 24, right: x + (span - 1) * 24 + 22 });
  function branchTrunk(style, x, span = 1) {
    const { right } = branchEdges(x, span);
    const lw = style === 'B' ? LW : 1, stroke = style === 'C' ? null : OL;
    rrect(right + 16, 62, 12, 96, 3, '#6b4423', stroke, lw);
    px(right + 19, 72, 2, 78, 'rgba(255,255,255,.15)');
    // crown built from the same leaves as the branch
    const cx = right + 22, cy = 52;
    line(cx, 72, cx - 14, 50, '#6b4423', 3); line(cx, 70, cx + 12, 46, '#6b4423', 3); line(cx, 72, cx + 1, 36, '#6b4423', 3);
    ellipse(cx, cy, 30, 22, '#2f7a2f');
    ellipse(cx - 4, cy - 6, 18, 11, '#3a8a37');
    const ring = 15;
    for (let i = 0; i < ring; i++) {
      const a = i / ring * Math.PI * 2 + 0.2;
      const wob = 1 + ((i * 5) % 3) * 0.06;
      leafCluster(cx + Math.cos(a) * 26 * wob, cy + Math.sin(a) * 18 * wob, a, stroke, 3, 11);
    }
    for (const [dx, dy, a] of [[-12, -4, -2.2], [10, -8, -0.8], [-2, 6, 1.9], [14, 6, 0.4], [-16, 8, 2.6]]) leafCluster(cx + dx, cy + dy, a, stroke, 3, 10);
  }
  function leaf(lx, ly, len, angle, fill, stroke) {
    c.save(); c.translate(lx, ly); c.rotate(angle);
    c.beginPath(); c.moveTo(0, 0);
    c.quadraticCurveTo(len * 0.5, -len * 0.38, len, 0);
    c.quadraticCurveTo(len * 0.5, len * 0.38, 0, 0);
    c.fillStyle = fill; c.fill();
    if (stroke) { c.lineWidth = 0.8; c.strokeStyle = stroke; c.stroke(); }
    c.beginPath(); c.moveTo(len * 0.1, 0); c.lineTo(len * 0.8, 0); c.lineWidth = 0.5; c.strokeStyle = 'rgba(0,0,0,.25)'; c.stroke();
    c.restore();
  }
  function leafCluster(lx, ly, dir, stroke, count = 5, len = 8) {
    for (let i = 0; i < count; i++) {
      const a = dir + (i - (count - 1) / 2) * 0.55;
      leaf(lx, ly, len, a, i % 2 ? '#3f9a3c' : '#2f7a2f', stroke);
    }
  }
  function branch(style, x, leafBottom, span = 1) {
    const { left, right } = branchEdges(x, span);
    const stroke = style === 'C' ? null : OL;
    const tipY = leafBottom - 12;
    // main limb: thick at the trunk, thin at the tip, drawn as round-capped segments
    const pts = [[right + 20, tipY - 26], [right + 4, tipY - 15], [right - 18, tipY - 7], [(left + right) / 2, tipY - 1], [left + 4, tipY + 1], [left - 16, tipY - 2]];
    const widths = [9, 8, 6.5, 5, 3.5, 2];
    const seg = (color, extra) => {
      for (let i = 0; i < pts.length - 1; i++) line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], color, widths[i] + extra);
    };
    const mid = t => {
      const f = t * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), r = f - i;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r];
    };
    // offshoot twigs (behind the limb so the joint looks natural)
    const twigs = [[0.45, -16, -13], [0.62, -13, 4], [0.8, -12, -10]];
    const twigEnds = twigs.map(([t, dx, dy]) => { const [tx, ty] = mid(t); return [tx, ty, tx + dx, ty + dy]; });
    if (stroke) for (const [a, b, e, f] of twigEnds) line(a, b, e, f, stroke, 4.5);
    if (stroke) seg(stroke, 2.5);
    for (const [a, b, e, f] of twigEnds) line(a, b, e, f, '#6b4423', 2.5);
    seg('#6b4423', 0);
    // bark highlight + knots
    for (let i = 0; i < 3; i++) line(pts[i][0], pts[i][1] - widths[i] / 4, pts[i + 1][0], pts[i + 1][1] - widths[i + 1] / 4, 'rgba(255,255,255,.18)', 1.2);
    const [kx, ky] = mid(0.3); ellipse(kx, ky, 1.6, 1.1, '#4a2e16');
    // leaves: along the top of the limb, at twig tips, and at the tip
    for (const t of [0.35, 0.55, 0.72, 0.9]) { const [lx, ly] = mid(t); leafCluster(lx, ly - 1, -Math.PI / 2 - 0.5, stroke, 3, 7); }
    for (const t of [0.5, 0.85]) { const [lx, ly] = mid(t); leafCluster(lx, ly + 1, Math.PI / 2 + 0.4, stroke, 2, 7); }
    for (const [a, b, e, f] of twigEnds) leafCluster(e, f, Math.atan2(f - b, e - a), stroke, 5, 8);
    const tip = pts[pts.length - 1];
    leafCluster(tip[0], tip[1], Math.PI, stroke, 5, 9);
  }

  function obstacle(style, ch, x, base, { hit = false } = {}) {
    const s = style === 'C' ? 'A' : style;
    faded(hit, () => {
      if (ch === 'r') rock(s, x, base);
      if (ch === 's') sprinkler(s, x, base);
      if (ch === 'c') curb(s, x, base);
      if (ch === 'h') shrub(s, x, base);
      if (ch === 'L') oldLady(s, x, base);
      if (ch === 'D') boyDog(s, x, base);
    });
  }

  return { use, OL, px, box, poly, ellipse, rrect, line, shade, crew, obstacle, weed, branch, branchTrunk };
})();
