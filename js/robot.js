/* Hero 3D scene: a procedural autonomous mobile robot (AMR) on a glowing platform.
   Three.js is loaded through the import map in index.html. If WebGL or the CDN is
   unavailable, the page falls back to a CSS illustration (html.no-webgl). */
(async function () {
  var canvas = document.getElementById('amr');
  var hero = document.getElementById('top');
  var hudLayer = document.querySelector('.hud-layer');
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = matchMedia('(max-width: 760px)').matches;

  function fail() { root.classList.add('no-webgl'); }
  try {
    var probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return fail();
  } catch (e) { return fail(); }

  var THREE, RoundedBoxGeometry, RoomEnvironment;
  try {
    THREE = await import('three');
    RoundedBoxGeometry = (await import('three/addons/geometries/RoundedBoxGeometry.js')).RoundedBoxGeometry;
    RoomEnvironment = (await import('three/addons/environments/RoomEnvironment.js')).RoomEnvironment;
  } catch (e) { return fail(); }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !small, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return fail(); }
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !small;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var VIOLET = 0x8b5cf6, CYAN = 0x22d3ee;
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x06060e, 0.06);
  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // ---------- lights ----------
  scene.add(new THREE.HemisphereLight(0x8f7cff, 0x05040c, 0.5));
  var key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(4, 9, 5);
  key.castShadow = !small;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -4;
  key.shadow.camera.right = key.shadow.camera.top = 4;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 6;
  scene.add(key);
  var rimV = new THREE.PointLight(VIOLET, 40, 14, 2); rimV.position.set(-4, 2.5, -3); scene.add(rimV);
  var rimC = new THREE.PointLight(CYAN, 26, 12, 2); rimC.position.set(4.5, 1.6, -2.5); scene.add(rimC);
  var under = new THREE.PointLight(VIOLET, 8, 5, 2); under.position.set(0, 0.25, 0); scene.add(under);

  // ---------- helpers: generated textures ----------
  function canvasTex(size, draw) {
    var c = document.createElement('canvas'); c.width = c.height = size;
    draw(c.getContext('2d'), size);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // circuit traces etched into the platform
  var circuitTex = canvasTex(1024, function (g, s) {
    var R = rng(11); g.translate(s / 2, s / 2); g.lineCap = 'round'; g.lineJoin = 'round';
    for (var i = 0; i < 80; i++) {
      var a = R() * Math.PI * 2, r = 165 + R() * 70, len = 110 + R() * 220;
      var cyan = R() < .3, al = .35 + R() * .5;
      g.strokeStyle = (cyan ? 'rgba(34,211,238,' : 'rgba(167,139,250,') + al + ')';
      g.lineWidth = 1.5 + R() * 1.8;
      var x1 = Math.cos(a) * r, y1 = Math.sin(a) * r, r2 = r + len * .5;
      var a2 = a + (R() < .5 ? -1 : 1) * (.06 + R() * .12), r3 = Math.min(r2 + len * .5, 470);
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); g.lineTo(Math.cos(a2) * r3, Math.sin(a2) * r3); g.stroke();
      g.fillStyle = g.strokeStyle;
      g.beginPath(); g.arc(Math.cos(a2) * r3, Math.sin(a2) * r3, 4.5, 0, 7); g.fill();
      g.beginPath(); g.arc(x1, y1, 3, 0, 7); g.fill();
    }
    [[150, 'rgba(139,92,246,.7)', 3], [300, 'rgba(34,211,238,.35)', 1.5], [410, 'rgba(139,92,246,.45)', 1.5], [496, 'rgba(167,139,250,.9)', 4]].forEach(function (c) {
      g.strokeStyle = c[1]; g.lineWidth = c[2]; g.beginPath(); g.arc(0, 0, c[0], 0, 7); g.stroke();
    });
    for (var k = 0; k < 144; k++) {
      var b = k / 144 * Math.PI * 2, o = k % 6 ? 466 : 452;
      g.strokeStyle = 'rgba(167,139,250,.55)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(Math.cos(b) * o, Math.sin(b) * o); g.lineTo(Math.cos(b) * 480, Math.sin(b) * 480); g.stroke();
    }
  });
  circuitTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  var radialFade = canvasTex(256, function (g, s) {
    var gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });
  var beamFade = canvasTex(128, function (g, s) {
    var gr = g.createLinearGradient(0, 0, 0, s);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.12, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });

  // ---------- materials ----------
  var graphite = new THREE.MeshPhysicalMaterial({ color: 0x1b1a24, metalness: .85, roughness: .33, clearcoat: .7, clearcoatRoughness: .18 });
  var brushed = new THREE.MeshPhysicalMaterial({ color: 0x9a97a8, metalness: 1, roughness: .3, anisotropy: .7 });
  var darkMat = new THREE.MeshStandardMaterial({ color: 0x0c0b13, metalness: .4, roughness: .55 });
  var rubber = new THREE.MeshStandardMaterial({ color: 0x131218, metalness: .1, roughness: .85 });
  var glassMat = new THREE.MeshPhysicalMaterial({ color: 0x07060d, metalness: .2, roughness: .06, clearcoat: 1 });
  var glowV = new THREE.MeshBasicMaterial({ color: VIOLET, toneMapped: false });
  var glowC = new THREE.MeshBasicMaterial({ color: CYAN, toneMapped: false });

  function mesh(geo, mat, x, y, z) { var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; return m; }

  // ---------- the AMR ----------
  var robot = new THREE.Group();
  var body = new THREE.Group(); robot.add(body);
  body.add(mesh(new RoundedBoxGeometry(2.6, 0.5, 1.66, 5, 0.14), graphite, 0, 0.47, 0));
  body.add(mesh(new RoundedBoxGeometry(2.32, 0.07, 1.38, 3, 0.03), brushed, 0, 0.745, 0));
  // cargo rails on the deck
  [-0.55, 0.55].forEach(function (z) { body.add(mesh(new THREE.BoxGeometry(1.5, 0.05, 0.05), brushed, -0.25, 0.8, z)); });
  // light strips: violet along the sides, cyan front and back
  [-0.835, 0.835].forEach(function (z) { body.add(mesh(new THREE.BoxGeometry(2.05, 0.035, 0.012), glowV, 0, 0.5, z)); });
  [-1.305, 1.305].forEach(function (x) { body.add(mesh(new THREE.BoxGeometry(0.012, 0.035, 1.2), glowC, x, 0.5, 0)); });
  // front bumper, sensor window and status LEDs
  body.add(mesh(new RoundedBoxGeometry(0.12, 0.16, 1.5, 2, 0.04), darkMat, 1.33, 0.3, 0));
  body.add(mesh(new THREE.BoxGeometry(0.02, 0.09, 0.95), glassMat, 1.306, 0.63, 0));
  [-0.3, -0.1, 0.1, 0.3].forEach(function (z, i) { body.add(mesh(new THREE.SphereGeometry(0.018, 10, 10), i % 2 ? glowV : glowC, 1.318, 0.63, z)); });
  // rear antenna beacon
  body.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8), brushed, -1.02, 0.94, -0.55));
  var beacon = mesh(new THREE.SphereGeometry(0.035, 16, 16), glowV.clone(), -1.02, 1.11, -0.55); body.add(beacon);

  // LiDAR turret
  var lidar = new THREE.Group(); lidar.position.set(0.82, 0.78, 0); body.add(lidar);
  lidar.add(mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.09, 32), graphite, 0, 0.045, 0));
  var head = new THREE.Group(); head.position.y = 0.16; lidar.add(head);
  head.add(mesh(new THREE.CylinderGeometry(0.135, 0.145, 0.15, 32), glassMat));
  var lidarRing = new THREE.Mesh(new THREE.TorusGeometry(0.142, 0.009, 8, 48), glowC); lidarRing.rotation.x = Math.PI / 2; head.add(lidarRing);
  head.add(mesh(new THREE.BoxGeometry(0.03, 0.05, 0.08), glowC, 0.14, 0, 0));
  // scanning fan of light
  var scanMat = new THREE.MeshBasicMaterial({ color: CYAN, map: radialFade, transparent: true, opacity: .28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  var scan = new THREE.Mesh(new THREE.CircleGeometry(3.4, 40, -Math.PI / 12, Math.PI / 6), scanMat);
  scan.rotation.x = -Math.PI / 2; head.add(scan);

  // mecanum wheels: hub, side plates and 45° rollers
  var wheels = [];
  function wheel(x, z, hand) {
    var w = new THREE.Group(); w.position.set(x, 0.3, z);
    var hub = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.22, 24), brushed); hub.rotation.x = Math.PI / 2; w.add(hub);
    [-0.11, 0.11].forEach(function (dz) {
      var p = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.025, 32), graphite, 0, 0, dz); p.rotation.x = Math.PI / 2; w.add(p);
    });
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.008, 6, 40), glowV); ring.position.z = z > 0 ? 0.125 : -0.125; w.add(ring);
    var rollerGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.26, 10);
    for (var i = 0; i < 10; i++) {
      var piv = new THREE.Group(); piv.rotation.z = i / 10 * Math.PI * 2;
      var r = mesh(rollerGeo, rubber, 0.245, 0, 0); r.rotation.x = hand * Math.PI / 4; piv.add(r); w.add(piv);
    }
    robot.add(w); wheels.push(w);
  }
  wheel(0.92, 0.94, 1); wheel(-0.92, 0.94, -1); wheel(0.92, -0.94, -1); wheel(-0.92, -0.94, 1);
  robot.traverse(function (o) { if (o.isMesh) o.castShadow = !small; });
  scene.add(robot);

  // ---------- platform and environment ----------
  var disc = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.5, 0.14, 96), new THREE.MeshStandardMaterial({ color: 0x0d0b1c, metalness: .7, roughness: .38 }));
  disc.position.y = -0.07; disc.receiveShadow = true; scene.add(disc);
  var etch = new THREE.Mesh(new THREE.CircleGeometry(3.38, 96), new THREE.MeshBasicMaterial({ map: circuitTex, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  etch.rotation.x = -Math.PI / 2; etch.position.y = 0.002; scene.add(etch);
  var rim = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.018, 8, 160), glowV); rim.rotation.x = Math.PI / 2; scene.add(rim);
  var rim2 = new THREE.Mesh(new THREE.TorusGeometry(3.9, 0.006, 6, 160), new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: .5, toneMapped: false }));
  rim2.rotation.x = Math.PI / 2; rim2.position.y = -0.12; scene.add(rim2);
  // pulse ring travelling outward, like a scan wave
  var pulseMat = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  var pulse = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 128), pulseMat); pulse.rotation.x = -Math.PI / 2; pulse.position.y = 0.006; scene.add(pulse);
  // floor grid fading into fog
  var grid = new THREE.GridHelper(60, 60, 0x3a2a7a, 0x1a1636); grid.position.y = -0.14;
  grid.material.transparent = true; grid.material.opacity = .45; scene.add(grid);
  // volumetric light cones
  var beamMat = new THREE.MeshBasicMaterial({ color: VIOLET, map: beamFade, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  [[0, 0, 1.7, .16], [-4.5, -3, 1.1, .08], [4.8, -2.5, 1.1, .08]].forEach(function (b) {
    var m = beamMat.clone(); m.opacity = b[3];
    var c = new THREE.Mesh(new THREE.ConeGeometry(b[2], 9, 40, 1, true), m); c.position.set(b[0], 4.4, b[1]); scene.add(c);
  });
  // floating particles
  var N = small ? 140 : 380, pos = new Float32Array(N * 3), spd = new Float32Array(N);
  for (var i = 0; i < N; i++) {
    var ang = Math.random() * Math.PI * 2, rad = 1.2 + Math.random() * 6.5;
    pos[i * 3] = Math.cos(ang) * rad; pos[i * 3 + 1] = Math.random() * 5; pos[i * 3 + 2] = Math.sin(ang) * rad - 1;
    spd[i] = .08 + Math.random() * .22;
  }
  var pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xc4b5fd, size: .045, map: radialFade, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scene.add(particles);

  // ---------- floating HUD labels (HTML, projected from 3D anchors) ----------
  var LABELS = ['ROS 2', 'SLAM', 'Open-RMF', 'Sensor fusion', 'Autonomous navigation', 'Embedded systems', 'Digital twin'];
  var anchors = new THREE.Group(); scene.add(anchors);
  var huds = LABELS.map(function (txt, i) {
    var a = new THREE.Object3D();
    var ang = i / LABELS.length * Math.PI * 2;
    var rr = small ? 2.3 : 2.95; a.position.set(Math.cos(ang) * rr, 1.05 + (i % 3) * 0.42, Math.sin(ang) * rr);
    a.userData.y0 = a.position.y; anchors.add(a);
    var el = document.createElement('div'); el.className = 'hud';
    el.innerHTML = '<span class="hud-dot"></span><span class="hud-txt"><i>0' + (i + 1) + '</i>' + txt + '</span>';
    hudLayer.appendChild(el);
    return { a: a, el: el };
  });

  // ---------- camera framing, mouse and scroll ----------
  var W = 1, H = 1, fit = 1;
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 }, scrollP = 0, visible = true;
  var camFrom = new THREE.Vector3(0, 2.3, 7.4), camTo = new THREE.Vector3(0, 3.9, 5.9);
  var lookFrom = new THREE.Vector3(0, 0.82, 0), lookTo = new THREE.Vector3(0, 0.5, 0);
  var camPos = new THREE.Vector3(), look = new THREE.Vector3(), tmp = new THREE.Vector3();

  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // keep the robot fully in frame on tall/narrow screens
    fit = camera.aspect < 1.7 ? Math.pow(1.7 / camera.aspect, 0.75) : 1;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas); resize();

  if (matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width * 2 - 1;
      mouse.ty = (e.clientY - r.top) / r.height * 2 - 1;
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { mouse.tx = mouse.ty = 0; });
  }
  function readScroll() { scrollP = Math.min(Math.max(scrollY / (hero.offsetHeight * 0.9), 0), 1); }
  addEventListener('scroll', readScroll, { passive: true }); readScroll();
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !reduce) loop(); }).observe(hero);

  // ---------- frame ----------
  var clock = new THREE.Clock(), t = 0, running = false;
  function frame(dt) {
    t += dt;
    var s = scrollP * scrollP * (3 - 2 * scrollP);
    mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;

    robot.rotation.y = -0.5 + t * 0.22 + s * 1.4;
    robot.position.y = 0.07 + Math.sin(t * 1.3) * 0.045;
    wheels.forEach(function (w) { w.rotation.z = -t * 2.2; });
    head.rotation.y = t * 3.2;
    beacon.material.color.setHex(Math.sin(t * 4) > 0 ? VIOLET : 0x3b2a75);

    var pp = (t * 0.45) % 1;
    pulse.scale.setScalar(1 + pp * 2.35); pulseMat.opacity = .55 * (1 - pp);
    etch.rotation.z = t * 0.03;
    anchors.rotation.y = -t * 0.12;

    var p = pGeo.attributes.position.array;
    for (var i = 0; i < N; i++) { p[i * 3 + 1] += spd[i] * dt; if (p[i * 3 + 1] > 5) p[i * 3 + 1] = 0; }
    pGeo.attributes.position.needsUpdate = true;

    camPos.lerpVectors(camFrom, camTo, s).multiplyScalar(fit);
    camPos.x += mouse.x * 0.9; camPos.y += -mouse.y * 0.45;
    camera.position.copy(camPos);
    look.lerpVectors(lookFrom, lookTo, s);
    camera.lookAt(look);

    renderer.render(scene, camera);
    placeHuds(s);
  }
  function placeHuds(s) {
    huds.forEach(function (h, i) {
      h.a.position.y = h.a.userData.y0 + Math.sin(t * 0.9 + i) * 0.08;
      h.a.getWorldPosition(tmp);
      var depth = tmp.z;
      tmp.project(camera);
      var x = (tmp.x * .5 + .5) * W, y = (-tmp.y * .5 + .5) * H;
      if (!h.w) h.w = h.el.offsetWidth;
      x = Math.min(Math.max(x, 8), W - h.w - 8);
      var o = (0.25 + 0.75 * (depth + 2.95) / 5.9) * (1 - s * 1.4);
      h.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-6px,-50%)';
      h.el.style.opacity = Math.max(o, 0).toFixed(3);
      h.el.style.zIndex = depth > 0 ? 2 : 0;
    });
  }
  function loop() {
    if (running) return; running = true;
    clock.getDelta();
    (function tick() {
      if (!visible) { running = false; return; }
      frame(Math.min(clock.getDelta(), 0.05));
      requestAnimationFrame(tick);
    })();
  }

  if (reduce) {
    t = 2.2; frame(0);
    addEventListener('scroll', function () { frame(0); }, { passive: true });
    new ResizeObserver(function () { frame(0); }).observe(canvas);
  } else {
    loop();
  }
  root.classList.add('webgl-ready');
})();
