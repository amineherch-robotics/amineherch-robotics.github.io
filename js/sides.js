/* Side circuits: PCB traces drawn in the left and right page margins, with light
   pulses travelling along them like data. Only on screens with real margins, fades
   in after the hero, speeds up briefly while scrolling, still frame for reduced motion. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CONTENT = 1160, MIN_GUTTER = 110;
  var cv = document.createElement('canvas');
  cv.className = 'side-circuits'; cv.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(cv, document.body.firstChild);
  var ctx = cv.getContext('2d');
  var base = document.createElement('canvas'), bctx = base.getContext('2d');
  var hero = document.getElementById('top');
  var W, H, dpr, traces = [], pulses = [], active = false, boost = 0, lastY = scrollY;

  var VIOLET = [167, 139, 250], CYAN = [34, 211, 238];
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // a trace runs top to bottom with 45° jogs, staying inside its lane
  function makeTrace(x0, x1) {
    var x = rnd(x0, x1), y = -30, pts = [[x, y]];
    while (y < H + 30) {
      y += rnd(50, 170); pts.push([x, y]);
      if (Math.random() < .7) {
        var dx = (Math.random() < .5 ? -1 : 1) * rnd(12, 34);
        if (x + dx < x0 || x + dx > x1) dx = -dx;
        x += dx; y += Math.abs(dx); pts.push([x, y]);
      }
    }
    var len = [0];
    for (var i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts: pts, len: len, total: len[len.length - 1], col: Math.random() < .35 ? CYAN : VIOLET };
  }
  function pointAt(tr, d) {
    var L = tr.len, i = 1;
    while (i < L.length - 1 && L[i] < d) i++;
    var a = tr.pts[i - 1], b = tr.pts[i], f = (d - L[i - 1]) / ((L[i] - L[i - 1]) || 1);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  }

  function build() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    var gutter = (W - CONTENT) / 2;
    active = gutter >= MIN_GUTTER;
    cv.style.display = active ? 'block' : 'none';
    if (!active) return;
    [cv, base].forEach(function (c) { c.width = W * dpr; c.height = H * dpr; });
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    traces = []; pulses = [];
    var g = Math.min(gutter, 260), n = Math.max(3, Math.round(g / 34));
    [[12, g - 18], [W - g + 18, W - 12]].forEach(function (lane) {
      var step = (lane[1] - lane[0]) / n;
      for (var k = 0; k < n; k++) traces.push(makeTrace(lane[0] + k * step, lane[0] + (k + 1) * step));
    });
    traces.forEach(function (tr) {
      var m = Math.random() < .5 ? 1 : 2;
      for (var j = 0; j < m; j++) pulses.push({ tr: tr, d: rnd(0, tr.total), v: rnd(55, 130) * (Math.random() < .5 ? 1 : -1), tail: rnd(70, 140) });
    });
    // static layer: traces, pads and a few chips
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, W, H);
    bctx.lineJoin = 'round'; bctx.lineCap = 'round';
    traces.forEach(function (tr) {
      bctx.strokeStyle = rgba(tr.col, .16); bctx.lineWidth = 1.4;
      bctx.beginPath(); tr.pts.forEach(function (p, i) { i ? bctx.lineTo(p[0], p[1]) : bctx.moveTo(p[0], p[1]); }); bctx.stroke();
      tr.pts.forEach(function (p, i) {
        if (i % 3 !== 1) return;
        bctx.fillStyle = '#06060E'; bctx.strokeStyle = rgba(tr.col, .35); bctx.lineWidth = 1.2;
        bctx.beginPath(); bctx.arc(p[0], p[1], 3, 0, 7); bctx.fill(); bctx.stroke();
      });
    });
    [[12, g - 18], [W - g + 18, W - 12]].forEach(function (lane) {
      for (var c = 0; c < 2; c++) {
        var cw = Math.min(46, (lane[1] - lane[0]) * .45), ch = cw * .8;
        var cx = rnd(lane[0], lane[1] - cw), cy = rnd(H * .15, H * .85);
        bctx.fillStyle = 'rgba(14,12,32,.9)'; bctx.strokeStyle = rgba(VIOLET, .32); bctx.lineWidth = 1.2;
        bctx.beginPath(); bctx.roundRect ? bctx.roundRect(cx, cy, cw, ch, 4) : bctx.rect(cx, cy, cw, ch); bctx.fill(); bctx.stroke();
        bctx.strokeStyle = rgba(VIOLET, .25);
        for (var p = 1; p < 5; p++) {
          var px = cx + p * cw / 5;
          bctx.beginPath(); bctx.moveTo(px, cy); bctx.lineTo(px, cy - 5); bctx.moveTo(px, cy + ch); bctx.lineTo(px, cy + ch + 5); bctx.stroke();
        }
      }
    });
  }

  function draw(dt) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(base, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    var mult = 1 + boost * 3;
    pulses.forEach(function (p) {
      var tr = p.tr;
      p.d += p.v * dt * mult;
      if (p.d > tr.total) p.d -= tr.total; if (p.d < 0) p.d += tr.total;
      var dir = p.v > 0 ? -1 : 1, prev = pointAt(tr, p.d);
      for (var s = 1; s <= 10; s++) {
        var d = p.d + dir * p.tail * s / 10;
        if (d < 0 || d > tr.total) break;
        var q = pointAt(tr, d);
        ctx.strokeStyle = rgba(tr.col, .55 * (1 - s / 10)); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        prev = q;
      }
      var h = pointAt(tr, p.d);
      ctx.fillStyle = rgba(tr.col, .22); ctx.beginPath(); ctx.arc(h[0], h[1], 6, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(h[0], h[1], 1.8, 0, 7); ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  // fade in once the hero is mostly scrolled past
  function updateFade() {
    var h = hero ? hero.offsetHeight : 600;
    var k = Math.min(Math.max((scrollY - h * .45) / (h * .4), 0), 1);
    cv.style.opacity = k.toFixed(3);
    return k;
  }
  addEventListener('scroll', function () {
    boost = Math.min(1, boost + Math.abs(scrollY - lastY) / 600); lastY = scrollY;
    updateFade();
    if (reduce && active) draw(0);
  }, { passive: true });

  var t0 = 0, rt;
  addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); if (active) draw(0); }, 150); });
  build(); updateFade();
  if (!active) { /* nothing to draw on narrow screens */ }
  if (reduce) { if (active) draw(0); return; }
  (function tick(t) {
    var dt = Math.min((t - (t0 || t)) / 1000, .05); t0 = t;
    boost *= Math.pow(.2, dt);
    if (active && !document.hidden && cv.style.opacity !== '0' && cv.style.opacity !== '0.000') draw(dt);
    requestAnimationFrame(tick);
  })(0);
})();
