/* Page interactions: navigation, pointer glow, counters, scroll reveals. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(pointer: fine)').matches;

  document.getElementById('year').textContent = new Date().getFullYear();

  // keep the current section when switching language
  document.querySelectorAll('.lang a').forEach(function (a) {
    a.addEventListener('click', function () { if (location.hash) a.href = a.getAttribute('href').split('#')[0] + location.hash; });
  });

  // ---- mobile menu ----
  var btn = document.querySelector('.menu-btn');
  var links = document.getElementById('nav-links');
  function closeMenu() { links.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Open menu'); }
  btn.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  // ---- nav background + active section ----
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('scrolled', scrollY > 40); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  var byId = {};
  navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
  // sections without their own nav link highlight their parent entry
  var alias = { education: 'experience', training: 'leadership' };
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = alias[en.target.id] || en.target.id;
        navLinks.forEach(function (a) { a.classList.toggle('active', a === byId[id]); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { io.observe(s); });
  }

  // ---- pointer-following glow on glass surfaces ----
  if (finePointer) {
    document.addEventListener('pointermove', function (e) {
      var el = e.target.closest && e.target.closest('.glass');
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });

    // gentle parallax on the floating hero icons
    var hero = document.querySelector('.hero');
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5).toFixed(3));
      hero.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5).toFixed(3));
    }, { passive: true });
  }

  // ---- animated counters ----
  function count(el) {
    var end = +el.dataset.count, t0 = null;
    if (reduce) return;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1400, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  document.querySelectorAll('[data-count]').forEach(function (el) { setTimeout(function () { count(el); }, 600); });

  // ---- scroll reveals: CSS transitions triggered by IntersectionObserver ----
  if (!reduce && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('reveal-on');
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { rio.observe(el); });
  }

  // ---- scroll-linked effects (GSAP); they never hide content at rest ----
  var g = window.gsap, ST = window.ScrollTrigger;
  if (!g || !ST || reduce) return;
  g.registerPlugin(ST);

  // timeline line fills as you scroll through experience
  g.fromTo('.tl-fill', { scaleY: 0 }, {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.tl', start: 'top 70%', end: 'bottom 60%', scrub: true }
  });

})();
