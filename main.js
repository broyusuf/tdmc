gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

(function() {
  var wasDesktop = window.innerWidth >= 1024;
  window.addEventListener('resize', function() {
    var isDesktop = window.innerWidth >= 1024;
    if (isDesktop !== wasDesktop) {
      location.reload();
    }
  });
})();

const smoother = ScrollSmoother.create({
  wrapper: '#smooth-wrapper',
  content: '#smooth-content',
  smooth:  1.2,
  effects: true,
});

function scrollToSection(target) {
  var st = ScrollTrigger.getAll().find(function(t) { return t.trigger === target && t.vars && t.vars.pin; });
  if (st) {
    smoother.scrollTo(st.start, true);
  } else {
    smoother.scrollTo(target, true, 'top top');
  }
}

document.querySelectorAll('a.scroll-link').forEach(function(link) {
  link.addEventListener('click', function(e) {
    var target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    scrollToSection(target);
  });
});

/* hero entrance */
gsap.set(['#hero-headline', '#hero-desc', '#hero-cta', '#hero-video'], { opacity: 0 });
gsap.timeline({ defaults: { ease: 'expo.out' } })
  .fromTo('.nav-logo, .mob-logo',      { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6 })
  .fromTo('.nav-link, .mob-hamburger', { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06 }, '-=0.4')
  .fromTo('.nav-cta',                  { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.5 }, '<');

document.fonts.ready.then(function() {
  gsap.set('#hero-headline', { opacity: 1 });

  if (!isMobileView()) {
    var gradientSpan = document.querySelector('#hero-headline .gradient-text');
    if (gradientSpan) {
      SplitText.create(gradientSpan, {
        splitBy: 'chars,words',
        wordsClass: 'word',
        charsClass: 'char',
        mask: 'words',
        onSplit: function(inner) {
          var wordData = [];

          inner.words.forEach(function(word) {
            var content = word.innerHTML;
            word.innerHTML = '';

            var before = document.createElement('div');
            before.classList.add('before');
            before.innerHTML = content;

            var after = document.createElement('div');
            after.setAttribute('aria-hidden', 'true');
            after.classList.add('after');
            after.innerHTML = content;

            word.append(before, after);

            var bChars = before.querySelectorAll('.char');
            var aChars = after.querySelectorAll('.char');

            bChars.forEach(function(bCh, ci) {
              var dir = Math.random() > 0.5 ? 110 : -110;
              bCh.style.setProperty('--exit-dir', dir + '%');
              if (aChars[ci]) aChars[ci].style.setProperty('--enter-dir', (-dir) + '%');
            });

            wordData.push({ bChars: bChars, aChars: aChars });
          });

          requestAnimationFrame(function() {
            var spanRect = gradientSpan.getBoundingClientRect();
            var totalW   = spanRect.width || gradientSpan.offsetWidth;
            var grad     = 'linear-gradient(to right, #2724F8 0%, #A7A6FF 30%, #F0F0FF 80%)';

            wordData.forEach(function(wd) {
              wd.bChars.forEach(function(bCh, ci) {
                var aCh  = wd.aChars[ci];
                var left = bCh.getBoundingClientRect().left - spanRect.left;

                function applyGrad(c) {
                  c.style.background           = grad;
                  c.style.backgroundSize       = totalW + 'px 100%';
                  c.style.backgroundPosition   = (-left) + 'px 0';
                  c.style.webkitBackgroundClip = 'text';
                  c.style.backgroundClip       = 'text';
                  c.style.webkitTextFillColor  = 'transparent';
                }

                applyGrad(bCh);
                if (aCh) applyGrad(aCh);
              });
            });
          });
        }
      });
    }
  }

  SplitText.create('#hero-headline', {
    type:      'lines',
    mask:      'lines',
    autoSplit: true,
    onSplit: function(self) {
      var tl = gsap.timeline({ delay: 0.1 });
      tl.from(self.lines,       { yPercent: 100, opacity: 0, stagger: 0.12, duration: 0.75, ease: 'expo.out' })
        .fromTo('#hero-desc',   { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' }, '-=0.35')
        .fromTo('#hero-cta',    { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, '-=0.4')
        .fromTo('#hero-video',  { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, '<');
      return tl;
    },
  });
});

setTimeout(function() {
  if (gsap.getProperty('#hero-video', 'opacity') < 0.5) {
    gsap.set(['#hero-headline', '#hero-desc', '#hero-cta', '#hero-video'], { opacity: 1, clearProps: 'transform,y' });
  }
}, 3000);


/* gs_reveal — bidirectional scroll entrance */
function animateFrom(elem, dir) {
  dir = dir || 1;
  var x = 0, y = dir * 80;
  if (elem.classList.contains('gs_reveal_fromLeft'))  { x = -80; y = 0; }
  if (elem.classList.contains('gs_reveal_fromRight')) { x =  80; y = 0; }
  gsap.fromTo(elem,
    { x: x, y: y, autoAlpha: 0 },
    { x: 0, y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', overwrite: 'auto' }
  );
}

function hideEl(elem) {
  gsap.set(elem, { autoAlpha: 0 });
}

gsap.utils.toArray('.gs_reveal').forEach(function(elem) {
  hideEl(elem);
  ScrollTrigger.create({
    trigger: elem,
    onEnter:     function() { animateFrom(elem, 1); },
    onEnterBack: function() { animateFrom(elem, -1); },
    onLeave:     function() { hideEl(elem); },
  });
});

/* quote text — word-by-word reveal */
(function() {
  var quoteEl = document.getElementById('quote-text');
  if (!quoteEl) return;

  var split = SplitText.create(quoteEl, {
    type:       'lines,words',
    linesClass: 'ts-line',
    autoSplit:  true,
  });

  function showQuote(dir) {
    gsap.killTweensOf(split.words);
    gsap.timeline()
      .fromTo(split.words,
        { yPercent: dir * 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.09 }
      );
  }

  function hideQuote(dir) {
    gsap.killTweensOf(split.words);
    gsap.set(split.words, { yPercent: dir * 110, opacity: 0 });
  }

  hideQuote(1);

  ScrollTrigger.create({
    trigger:     quoteEl,
    start:       'top 85%',
    onEnter:     function() { showQuote(1); },
    onLeave:     function() { hideQuote(-1); },
    onEnterBack: function() { showQuote(-1); },
    onLeaveBack: function() { hideQuote(1); },
  });
})();

/* quote divider fill */
(function() {
  var fill = document.querySelector('.quote-divider-fill');
  var divider = document.querySelector('.quote-divider');
  if (!fill || !divider) return;

  gsap.fromTo(fill,
    { width: '0%' },
    {
      width: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: divider,
        start: 'top 90%',
        end: 'top 10%',
        scrub: 1,
      }
    }
  );
})();

/* lazy-load service videos */
(function() {
  var videos = Array.from(document.querySelectorAll('video source[data-src]'));
  if (!videos.length) return;

  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var video = entry.target;
      video.querySelectorAll('source[data-src]').forEach(function(s) {
        s.src = s.getAttribute('data-src');
        s.removeAttribute('data-src');
      });
      video.load();
      io.unobserve(video);
    });
  }, { rootMargin: '300px' });

  videos.forEach(function(source) { io.observe(source.parentElement); });
})();

/* hero video expand */
(function() {
  var heroEl       = document.getElementById('hero-section');
  var vid          = document.getElementById('hero-video-el');
  var logosEl      = document.getElementById('hero-video-inner');
  var logosBasePad = window.innerWidth >= 1024 ? 35 : 20;
  var winH         = window.innerHeight;

  function eio(t) {
    return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  }

  gsap.ticker.add(function() {
    var rect = heroEl.getBoundingClientRect();

    if (rect.top > winH || rect.bottom < -winH) {
      return;
    }

    var scrolled    = -rect.top;
    var available   = heroEl.offsetHeight - winH;
    var expandLen   = Math.min(winH * 0.7, available);
    var expandStart = Math.max(0, available - expandLen);

    if (scrolled <= expandStart) {
      vid.style.transform       = '';
      vid.style.opacity         = '';
      vid.style.borderRadius    = '';
      vid.style.zIndex          = '';
      logosEl.style.paddingLeft  = '';
      logosEl.style.paddingRight = '';
      return;
    }

    var p  = Math.min(1, (scrolled - expandStart) / expandLen);
    var e  = eio(p);
    var sx = window.innerWidth  / vid.offsetWidth;
    var sy = winH               / vid.offsetHeight;
    var s  = 1 + (Math.max(sx, sy) - 1) * e;

    vid.style.transform    = 'scale(' + s.toFixed(5) + ')';
    vid.style.borderRadius = (15 * (1 - e)).toFixed(2) + 'px';
    vid.style.zIndex       = '20';
    vid.style.opacity      = e < 0.5 ? '1' : String(Math.max(0, 1 - (e - 0.5) / 0.5));

    var pad = (logosBasePad * (1 - e)).toFixed(2) + 'px';
    logosEl.style.paddingLeft  = pad;
    logosEl.style.paddingRight = pad;
  });
})();

/* mobile menu */
var mobileMenu = document.getElementById('mobile-menu');
var menuOpen   = document.getElementById('menu-open');
var menuClose  = document.getElementById('menu-close');

function openMenu() {
  mobileMenu.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .fromTo(mobileMenu,                    { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power3.out' })
    .fromTo('.menu-logo, .menu-close-btn', { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06 }, '-=0.15')
    .fromTo('.menu-item',                  { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.45, stagger: 0.055 }, '-=0.3');
}

function closeMenu() {
  gsap.to(mobileMenu, {
    opacity: 0, duration: 0.28, ease: 'power3.in',
    onComplete: function() {
      mobileMenu.classList.remove('is-open');
      document.body.style.overflow = '';
      gsap.set('.menu-logo, .menu-close-btn, .menu-item', { opacity: 0, x: 0, y: 0 });
    },
  });
}

menuOpen.addEventListener('click', openMenu);
menuClose.addEventListener('click', closeMenu);

document.querySelectorAll('.menu-item').forEach(function(link) {
  link.addEventListener('click', function(e) {
    var href   = this.getAttribute('href');
    var target = href ? document.querySelector(href) : null;
    closeMenu();
    if (!target) return;
    e.preventDefault();
    setTimeout(function() { scrollToSection(target); }, 320);
  });
});

/* quote section title — auto morph */
(function() {
  var el = document.querySelector('.quote-morph');
  if (!el) return;

  SplitText.create(el, {
    splitBy: 'chars,words',
    wordsClass: 'word',
    charsClass: 'char',
    onSplit: function(split) {
      split.words.forEach(function(word) {
        word.style.display = 'inline-block';
        word.style.position = 'relative';
        word.style.overflow = 'hidden';
        word.style.verticalAlign = 'top';

        var content = word.innerHTML;
        word.innerHTML = '';

        var before = document.createElement('div');
        before.classList.add('before');
        before.innerHTML = content;

        var after = document.createElement('div');
        after.setAttribute('aria-hidden', 'true');
        after.classList.add('after');
        after.innerHTML = content;

        word.append(before, after);

        var bChars = before.querySelectorAll('.char');
        var aChars = after.querySelectorAll('.char');

        bChars.forEach(function(bCh, ci) {
          var dir = Math.random() > 0.5 ? 110 : -110;
          bCh.style.setProperty('--exit-dir', dir + '%');
          if (aChars[ci]) aChars[ci].style.setProperty('--enter-dir', (-dir) + '%');
        });
      });

      requestAnimationFrame(function() {
        var rect   = el.getBoundingClientRect();
        var totalW = rect.width || el.offsetWidth;
        var grad   = 'linear-gradient(to right, #2724F8 0%, #A7A6FF 30%, #F0F0FF 80%)';

        el.querySelectorAll('.char').forEach(function(c) {
          var left = c.getBoundingClientRect().left - rect.left;
          c.style.background           = grad;
          c.style.backgroundSize       = totalW + 'px 100%';
          c.style.backgroundPosition   = (-left) + 'px 0';
          c.style.webkitBackgroundClip = 'text';
          c.style.backgroundClip       = 'text';
          c.style.webkitTextFillColor  = 'transparent';
        });

        setInterval(function() {
          el.classList.toggle('is-morphing');
        }, 3000);
      });
    }
  });
})();

/* services */
var isMobileView = function() { return window.innerWidth < 1024; };

document.querySelectorAll('.service-card').forEach(function(card) {
  var darkGrad   = card.querySelector('.dark-grad');
  var blueGrad   = card.querySelector('.blue-grad');
  var defContent = card.querySelector('.default-content');
  var hovContent = card.querySelector('.hover-content');
  var iconRow    = card.querySelector('.hov-icon-row');
  var desc       = card.querySelector('.hov-desc');
  var btn        = card.querySelector('.hov-btn');
  var img        = card.querySelector('.card-img');

  if (!isMobileView()) {
    gsap.set(hovContent, { opacity: 0, pointerEvents: 'none' });
    gsap.set(iconRow,    { opacity: 0, y: 24 });
    gsap.set(desc,       { opacity: 0, y: 14 });
    gsap.set(btn,        { opacity: 0, scale: 0.75 });
  }

  card.addEventListener('mouseenter', function() {
    if (isMobileView()) return;
    card.classList.add('is-hovered');
    gsap.killTweensOf([defContent, hovContent, iconRow, desc, btn, img, darkGrad, blueGrad]);

    gsap.to(img,      { scale: 1.06, duration: 0.7,  ease: 'expo.out' });
    gsap.to(darkGrad, { opacity: 0,  duration: 0.38, ease: 'power3.out' });
    gsap.to(blueGrad, { opacity: 1,  duration: 0.38, ease: 'power3.out' });
    gsap.to(defContent, { y: 14, opacity: 0, duration: 0.22, ease: 'power3.in',
      onComplete: function() { gsap.set(defContent, { pointerEvents: 'none' }); } });

    gsap.set(hovContent, { opacity: 1, pointerEvents: 'auto' });
    gsap.fromTo(iconRow, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7,  ease: 'back.out(1.4)', delay: 0.06 });
    gsap.fromTo(desc,    { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.48, ease: 'expo.out',      delay: 0.16 });
    gsap.fromTo(btn,     { scale: 0.75, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)', delay: 0.23 });
  });

  card.addEventListener('mouseleave', function() {
    if (isMobileView()) return;
    card.classList.remove('is-hovered');
    gsap.killTweensOf([defContent, hovContent, iconRow, desc, btn, img, darkGrad, blueGrad]);

    gsap.to(img,      { scale: 1,   duration: 0.7,  ease: 'expo.out' });
    gsap.to(darkGrad, { opacity: 1, duration: 0.38, ease: 'power3.out' });
    gsap.to(blueGrad, { opacity: 0, duration: 0.32, ease: 'power3.out' });
    gsap.to(iconRow,  { y: 10, opacity: 0, duration: 0.2,  ease: 'power3.in' });
    gsap.to(desc,     { y: 8,  opacity: 0, duration: 0.17, ease: 'power3.in' });
    gsap.to(btn,      { scale: 0.75, opacity: 0, duration: 0.15, ease: 'power3.in' });

    setTimeout(function() {
      gsap.set(hovContent, { opacity: 0, pointerEvents: 'none' });
      gsap.set(iconRow, { y: 24 });
      gsap.set(desc,    { y: 14 });
      gsap.set(btn,     { scale: 0.75 });
    }, 210);

    gsap.fromTo(defContent, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.4)', delay: 0.12,
      onStart: function() { gsap.set(defContent, { pointerEvents: 'auto' }); } });
  });
});

var svcTrack   = document.querySelector('.services-scroll');
var svcSection = document.querySelector('#services-section');
var svcInner   = document.querySelector('.svc-inner');

if (!isMobileView()) {
  var desktopGroups = document.querySelectorAll('.card-group');
  gsap.set(desktopGroups, { opacity: 0, y: 40 });
  ScrollTrigger.create({
    trigger: svcSection,
    start:   'top 85%',
    once:    true,
    onEnter: function() {
      gsap.to(desktopGroups, { opacity: 1, y: 0, duration: 1.1, ease: 'power4.out', stagger: 0.14 });
    },
  });

  ScrollTrigger.create({
    trigger: svcSection,
    start:   'top top',
    end:     function() { return '+=' + (svcInner.offsetWidth - svcTrack.clientWidth); },
    pin:     true,
    scrub:   1,
    invalidateOnRefresh: true,
    onUpdate: function(self) {
      gsap.set(svcInner, { x: -(self.progress * (svcInner.offsetWidth - svcTrack.clientWidth)) });
    },
  });
} else {
  var mobileCards = document.querySelectorAll('.service-card');
  gsap.fromTo(mobileCards,
    { opacity: 0, scale: 0.92, y: 22 },
    { opacity: 1, scale: 1, y: 0, duration: 0.85, ease: 'back.out(1.3)', stagger: 0.07, delay: 0.25 }
  );
}

/* mobile service dots */
(function() {
  if (window.innerWidth >= 1024) return;

  requestAnimationFrame(function() {
    var scroll  = document.querySelector('.services-scroll');
    var dotsEl  = document.getElementById('svc-dots-mobile');
    if (!scroll || !dotsEl) return;

    var cards = Array.from(document.querySelectorAll('.service-card'));
    if (!cards.length) return;

    dotsEl.innerHTML = '';
    var dots = cards.map(function(card, i) {
      var d = document.createElement('div');
      d.className = 'svc-dot' + (i === 0 ? ' active' : '');
      dotsEl.appendChild(d);
      return d;
    });

    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.intersectionRatio >= 0.5) {
          var idx = cards.indexOf(entry.target);
          if (idx < 0) return;
          dots.forEach(function(d, i) { d.classList.toggle('active', i === idx); });
        }
      });
    }, { root: scroll, threshold: 0.5 });

    cards.forEach(function(c) { io.observe(c); });
  });
})();

var svcVideos = Array.from(document.querySelectorAll('#services-section video'));
if (svcVideos.length && svcSection) {
  var svcVideoObs = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting) {
      svcVideos.forEach(function(v) { v.play(); });
    } else {
      svcVideos.forEach(function(v) { v.pause(); });
    }
  }, { rootMargin: '300px 0px' });
  svcVideoObs.observe(svcSection);
}

/* why section — morph hover */
document.querySelectorAll('.why-item').forEach(function(item) {
  var a = item.querySelector('.morph-a');
  var b = item.querySelector('.morph-b');

  gsap.set(b, { display: 'none' });

  if (isMobileView()) return;

  SplitText.create(a, {
    splitBy: 'chars,words',
    wordsClass: 'word',
    charsClass: 'char',
    mask: 'words',
    autoSplit: true,
    onSplit: function(self) {
      self.words.forEach(function(word) {
        var content = word.innerHTML;
        word.innerHTML = '';

        var before = document.createElement('div');
        before.classList.add('before');
        before.innerHTML = content;

        var after = document.createElement('div');
        after.setAttribute('aria-hidden', 'true');
        after.classList.add('after');
        after.innerHTML = content;

        word.append(before, after);

        var bChars = before.querySelectorAll('.char');
        var aChars = after.querySelectorAll('.char');

        bChars.forEach(function(bCh, ci) {
          var dir = Math.random() > 0.5 ? 110 : -110;
          bCh.style.setProperty('--exit-dir', dir + '%');
          if (aChars[ci]) aChars[ci].style.setProperty('--enter-dir', (-dir) + '%');
        });
      });
    }
  });
});

/* why section — pin + scrub */
(function() {
  if (window.innerWidth < 1024) return;
  var whySection  = document.getElementById('why-section');
  var whyScroller = document.getElementById('why-items-scroll');
  var whyInner    = document.getElementById('why-inner');
  if (!whySection || !whyScroller || !whyInner) return;

  whyScroller.style.overflow = 'hidden';

  var items    = Array.from(whySection.querySelectorAll('.why-item'));
  var headings = Array.from(whySection.querySelectorAll('.anim-heading'));

  items.forEach(function(item, i) {
    if (i > 0) gsap.set(item, { opacity: 0, y: 24 });
  });

  headings.forEach(function(h) { gsap.set(h, { opacity: 0, y: 24 }); });

  var setOp = items.map(function(el) { return gsap.quickTo(el, 'opacity', { duration: 0.25, ease: 'none' }); });
  var setY  = items.map(function(el) { return gsap.quickTo(el, 'y',       { duration: 0.25, ease: 'power3.out' }); });

  var virtualTop = 0;

  function revealWhyItems() {
    var cH = whyScroller.clientHeight;
    items.forEach(function(item, i) {
      var inView = item.offsetTop < virtualTop + cH * 0.88;
      setOp[i](inView ? 1 : 0);
      setY[i](inView ? 0 : 24);
    });
  }

  ScrollTrigger.create({
    trigger: whySection,
    start:   'top top',
    end:     function() { return '+=' + (whyInner.offsetHeight - whyScroller.clientHeight); },
    pin:     true,
    scrub:   0.8,
    invalidateOnRefresh: true,
    onUpdate: function(self) {
      var max = whyInner.offsetHeight - whyScroller.clientHeight;
      virtualTop = self.progress * max;
      gsap.set(whyInner, { y: -virtualTop });
      revealWhyItems();
      var fadeStart = 0.78;
      var headOpacity = self.progress < fadeStart ? 1 : Math.max(0, 1 - (self.progress - fadeStart) / (1 - fadeStart));
      headings.forEach(function(h) { gsap.set(h, { opacity: headOpacity }); });
    },
  });

  revealWhyItems();

  ScrollTrigger.create({
    trigger: whySection,
    start:   'top 85%',
    once:    true,
    onEnter: function() {
      gsap.to(headings, { opacity: 1, y: 0, duration: 0.85, ease: 'expo.out', stagger: 0 });
    },
  });
})();

/* industries marquee */
(function() {
  var GAP        = 20;
  var DURATION   = 40;
  var trackLeft  = document.getElementById('track-left');
  var trackRight = document.getElementById('track-right');

  trackLeft.innerHTML  += trackLeft.innerHTML;
  trackRight.innerHTML += trackRight.innerHTML;

  var tweenLeft, tweenRight;
  var setWidth = 4068;
  var trackTweens = new Map();

  function initTweens() {
    if (tweenLeft)  tweenLeft.kill();
    if (tweenRight) tweenRight.kill();

    gsap.set(trackLeft,  { x: 0 });
    gsap.set(trackRight, { x: -setWidth });

    tweenLeft = gsap.to(trackLeft, {
      x: -setWidth, ease: 'none', duration: DURATION, repeat: -1,
    });

    tweenRight = gsap.to(trackRight, {
      x: 0, ease: 'none', duration: DURATION, repeat: -1,
      onRepeat: function() { gsap.set(trackRight, { x: -setWidth }); },
    });

    trackTweens.set(trackLeft,  tweenLeft);
    trackTweens.set(trackRight, tweenRight);
  }

  function calcSetWidth() {
    var all = trackLeft.querySelectorAll('.industry-card');
    var n   = all.length / 2;
    var w   = 0;
    for (var i = 0; i < n; i++) w += all[i].getBoundingClientRect().width;
    w += n * GAP;
    setWidth = w;
    document.documentElement.style.setProperty('--set-width', w + 'px');
    initTweens();
  }

  requestAnimationFrame(calcSetWidth);

  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(calcSetWidth, 120);
  });

  document.querySelectorAll('#industries-section .industry-card').forEach(function(card) {
    card.addEventListener('mouseenter', function() {
      var tween = trackTweens.get(card.closest('.scroll-track'));
      if (tween) tween.pause();
      gsap.to(card, { scale: 1.04, duration: 0.45, ease: 'back.out(1.6)',
        boxShadow: '0 20px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.35)' });
    });
    card.addEventListener('mouseleave', function() {
      var tween = trackTweens.get(card.closest('.scroll-track'));
      if (tween) tween.resume();
      gsap.to(card, { scale: 1, duration: 0.4, ease: 'power3.out',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.22)' });
    });
  });

})();

/* reviews carousel — infinite loop */
(function() {
  var viewport = document.getElementById('carousel-viewport');
  var track    = document.getElementById('carousel-track');
  var btnPrev  = document.getElementById('btn-prev');
  var btnNext  = document.getElementById('btn-next');
  var dotsRow  = document.getElementById('dots-row');
  if (!viewport || !track) return;

  var origCards = Array.from(track.querySelectorAll('.review-card'));
  var TOTAL     = origCards.length;

  origCards.forEach(function(c) { track.appendChild(c.cloneNode(true)); });

  if (dotsRow) dotsRow.innerHTML = '';
  if (btnPrev) btnPrev.disabled = false;
  if (btnNext) btnNext.disabled = false;

  var posX     = 0;
  var dragging = false;
  var dragX0   = 0;
  var posX0    = 0;
  var velX     = 0;
  var prevX    = 0;
  var prevT    = 0;

  function getStep() {
    var c = track.querySelectorAll('.review-card')[0];
    var g = parseInt(getComputedStyle(track).gap) || 25;
    return c.offsetWidth + g;
  }

  function getSetW() { return TOTAL * getStep(); }

  function norm(x) {
    var sw = getSetW();
    x = x % sw;
    if (x > 0) x -= sw;
    return x;
  }

  function commit(x, dur) {
    posX = norm(x);
    if (dur) {
      gsap.to(track, { x: posX, duration: dur, ease: 'power3.out' });
    } else {
      gsap.set(track, { x: posX });
    }
  }

  (function() {
    var vw    = viewport.clientWidth;
    var s     = getStep();
    var g     = parseInt(getComputedStyle(track).gap) || 25;
    var three = 3 * s - g;
    var margin = (vw - three) / 2;
    commit(margin > 0 ? -(s - margin) : 0);
  })();

  if (btnPrev) {
    btnPrev.addEventListener('click', function() {
      commit(posX + getStep(), 0.55);
    });
  }
  if (btnNext) {
    btnNext.addEventListener('click', function() {
      commit(posX - getStep(), 0.55);
    });
  }

  function dstart(x) {
    var actual = gsap.getProperty(track, 'x');
    posX = norm(actual);
    gsap.killTweensOf(track);
    gsap.set(track, { x: posX });
    dragging = true;
    dragX0   = x;
    posX0    = posX;
    velX     = 0;
    prevX    = x;
    prevT    = Date.now();
    viewport.classList.add('is-dragging');
  }

  function dmove(x) {
    if (!dragging) return;
    var now = Date.now();
    var dt  = now - prevT || 1;
    velX  = (x - prevX) / dt * 16;
    prevX = x;
    prevT = now;
    commit(posX0 + (x - dragX0));
  }

  function dend() {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('is-dragging');
    var s      = getStep();
    var target = Math.round((posX + velX * 5) / s) * s;
    commit(target, 0.6);
  }

  viewport.addEventListener('mousedown',   function(e) { dstart(e.clientX); e.preventDefault(); });
  document.addEventListener('mousemove',   function(e) { if (dragging) dmove(e.clientX); });
  document.addEventListener('mouseup',     dend);
  viewport.addEventListener('dragstart',   function(e) { e.preventDefault(); });

  viewport.addEventListener('touchstart',  function(e) { dstart(e.touches[0].clientX); },           { passive: true });
  viewport.addEventListener('touchmove',   function(e) { if (dragging) dmove(e.touches[0].clientX); }, { passive: true });
  viewport.addEventListener('touchend',    dend);
  viewport.addEventListener('touchcancel', dend);
})();

/* logo cycling */
(function() {
  var slots = Array.from(document.querySelectorAll('.logo-slot'));
  if (!slots.length) return;

  var logos = [
    function() {
      var d = document.createElement('div');
      d.className = 'flex flex-col items-start';
      d.innerHTML = '<span class="font-bold text-white tracking-[-0.05em] leading-none whitespace-nowrap" style="font-size:clamp(18px,2.2vw,30px);">BACK2NEW</span><span class="text-white tracking-[0.5em] leading-none mt-1 whitespace-nowrap" style="font-size:clamp(6px,0.7vw,8px);">SLIDING DOOR REPAIRS</span>';
      return d;
    },
    function() {
      var d = document.createElement('div');
      d.className = 'flex flex-col items-start';
      d.innerHTML = '<span class="font-bold text-white tracking-[-0.05em] leading-none whitespace-nowrap" style="font-size:clamp(28px,3.5vw,45px);">revolv</span><span class="text-white tracking-[0.14em] leading-none mt-0.5 whitespace-nowrap" style="font-size:clamp(7px,0.8vw,9px);">HEALTH . WELLNESS</span>';
      return d;
    },
    function() {
      var s = document.createElement('span');
      s.className = 'font-bold text-white whitespace-nowrap';
      s.style.cssText = 'font-size:clamp(22px,2.8vw,36px);letter-spacing:-0.02em;';
      s.textContent = 'ARGUS';
      return s;
    },
    function() {
      var s = document.createElement('span');
      s.className = 'text-white font-normal whitespace-nowrap';
      s.style.cssText = "font-family:'Playfair Display',serif;font-size:clamp(17px,2vw,27px);";
      s.textContent = 'Indoz Realtors';
      return s;
    },
  ];

  var shown = [0, 1, 2, 3];
  var busy  = [false, false, false, false];

  slots.forEach(function(slot, i) {
    var a = slot.querySelector('.logo-slot-a');
    a.appendChild(logos[shown[i]]());
    gsap.set(a, { opacity: 1, filter: 'blur(0px)' });
    gsap.set(slot.querySelector('.logo-slot-b'), { opacity: 0, filter: 'blur(0px)' });
  });

  function cycleSlot(idx) {
    if (busy[idx]) return;
    busy[idx] = true;

    var slot = slots[idx];
    var a    = slot.querySelector('.logo-slot-a');
    var b    = slot.querySelector('.logo-slot-b');

    var candidates = [0, 1, 2, 3].filter(function(n) { return n !== shown[idx]; });
    var next = candidates[Math.floor(Math.random() * candidates.length)];

    b.innerHTML = '';
    b.appendChild(logos[next]());
    gsap.set(b, { opacity: 0, filter: 'blur(6px)' });

    gsap.to(a, { opacity: 0, filter: 'blur(6px)', duration: 0.45, ease: 'power2.inOut' });
    gsap.to(b, {
      opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out', delay: 0.2,
      onComplete: function() {
        a.innerHTML = '';
        while (b.firstChild) a.appendChild(b.firstChild);
        gsap.set(a, { opacity: 1, filter: 'blur(0px)', clearProps: 'transform' });
        b.innerHTML = '';
        gsap.set(b, { opacity: 0, filter: 'blur(0px)', clearProps: 'transform' });
        shown[idx] = next;
        busy[idx]  = false;
      },
    });
  }

  if (window.innerWidth >= 1024) {
    var delays  = [2800, 1600, 3500, 2300];
    var periods = [3200, 3900, 2900, 3600];
    slots.forEach(function(_, i) {
      setTimeout(function() {
        cycleSlot(i);
        setInterval(function() { cycleSlot(i); }, periods[i]);
      }, delays[i]);
    });
  }
})();

/* mobile logo marquee */
(function() {
  if (window.innerWidth >= 1024) return;

  requestAnimationFrame(function() {
    var slotsEl = document.getElementById('logo-slots');
    if (!slotsEl) return;

    var originalSlots = Array.from(slotsEl.querySelectorAll('.logo-slot'));
    if (!originalSlots.length) return;

    var track = document.createElement('div');
    track.className = 'logo-marquee-track';
    originalSlots.forEach(function(s) { track.appendChild(s); });

    var clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');

    var inner = document.createElement('div');
    inner.className = 'logo-marquee-inner';
    inner.appendChild(track);
    inner.appendChild(clone);

    slotsEl.appendChild(inner);
    slotsEl.classList.add('logo-marquee');
  });
})();

/* included section */
(function() {
  var includedSection = document.getElementById('included-section');
  if (!includedSection) return;

  var incHeading  = includedSection.querySelector('.anim-heading');
  var incImgPanel = includedSection.querySelector('.anim-image');

  if (incHeading) {
    gsap.set(incHeading, { opacity: 0, y: 24 });
    ScrollTrigger.create({
      trigger:     includedSection,
      start:       'top 80%',
      onEnter:     function() { gsap.to(incHeading, { opacity: 1, y: 0, duration: 0.85, ease: 'expo.out' }); },
      onEnterBack: function() { gsap.to(incHeading, { opacity: 1, y: 0, duration: 0.85, ease: 'expo.out' }); },
      onLeaveBack: function() { gsap.set(incHeading, { opacity: 0, y: 24 }); },
    });
  }

  if (incImgPanel) {
    gsap.set(incImgPanel, { opacity: 0, y: 30 });
    ScrollTrigger.create({
      trigger:     includedSection,
      start:       'top 75%',
      onEnter:     function() { gsap.to(incImgPanel, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }); },
      onEnterBack: function() { gsap.to(incImgPanel, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }); },
      onLeaveBack: function() { gsap.set(incImgPanel, { opacity: 0, y: 30 }); },
    });
  }

  if (window.innerWidth < 1024) return;

  var scroller = document.getElementById('inc-scroll');
  var incInner = document.getElementById('inc-inner');
  var imgs     = Array.from(includedSection.querySelectorAll('.inc-img'));
  var items    = Array.from(includedSection.querySelectorAll('.content-item'));
  if (!scroller || !incInner) return;

  scroller.style.overflow = 'hidden';

  items.forEach(function(item, i) {
    if (i > 0) gsap.set(item, { opacity: 0, y: 24 });
  });

var setOp    = items.map(function(el) { return gsap.quickTo(el, 'opacity', { duration: 0.25, ease: 'none' }); });
  var setY     = items.map(function(el) { return gsap.quickTo(el, 'y',       { duration: 0.25, ease: 'power3.out' }); });
  var activeImg = 0;
  var setImgOp = imgs.map(function(img) { return gsap.quickTo(img, 'opacity', { duration: 0.55, ease: 'power2.inOut' }); });

  function switchImage(idx) {
    idx = Math.max(0, Math.min(idx, imgs.length - 1));
    if (idx === activeImg) return;
    setImgOp[activeImg](0);
    setImgOp[idx](1);
    items[activeImg].classList.remove('is-active');
    items[idx].classList.add('is-active');
    activeImg = idx;
  }

  var virtualTop = 0;

  function updateInc(max) {
    var cH = scroller.clientHeight;
    items.forEach(function(item, i) {
      var inView = item.offsetTop < virtualTop + cH * 0.88;
      setOp[i](inView ? 1 : 0);
      setY[i](inView ? 0 : 24);
    });
var newIdx = max > 0 ? Math.min(Math.floor(virtualTop * items.length / max), items.length - 1) : 0;
    switchImage(newIdx);
  }

  items[0].classList.add('is-active');

  ScrollTrigger.create({
    trigger: includedSection,
    start:   'top top',
    end:     function() { return '+=' + (incInner.offsetHeight - scroller.clientHeight); },
    pin:     true,
    scrub:   0.8,
    invalidateOnRefresh: true,
    onUpdate: function(self) {
      var max = incInner.offsetHeight - scroller.clientHeight;
      virtualTop = self.progress * max;
      gsap.set(incInner, { y: -virtualTop });
      updateInc(max);
    },
  });

  updateInc(0);
})();

/* pillars entrance */
var pillarsCard = document.querySelector('.pillars-card');
if (pillarsCard) {
  gsap.set('.pillar-bar', { transformOrigin: 'center bottom' });
  gsap.set('.pillars-card', { opacity: 0, y: 36, scale: 0.97 });
  gsap.set('.pillar-bar',   { scaleY: 0 });
  gsap.set('.pillar-col',   { opacity: 0, y: 28 });

  var pillarsLoop = null;

  function startPillarsLoop() {
    pillarsLoop = gsap.to('.pillar-bar', {
      scaleY: 0.2,
      duration: 0.55,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: 0.14
    });
  }

  function showPillars() {
    if (pillarsLoop) { pillarsLoop.kill(); pillarsLoop = null; }
    gsap.timeline()
      .fromTo('.pillars-card', { opacity: 0, y: 36, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.7)' })
      .fromTo('.pillar-bar',   { scaleY: 0 }, { scaleY: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.7)' }, '-=0.5')
      .fromTo('.pillar-col',   { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.09, ease: 'expo.out' }, '-=0.3')
      .call(startPillarsLoop);
  }

  function hidePillars() {
    if (pillarsLoop) { pillarsLoop.kill(); pillarsLoop = null; }
    gsap.killTweensOf(['.pillars-card', '.pillar-bar', '.pillar-col']);
    gsap.timeline()
      .to('.pillar-col',   { opacity: 0, y: 28, duration: 0.3, stagger: { each: 0.06, from: 'end' }, ease: 'power2.in' })
      .to('.pillar-bar',   { scaleY: 0,         duration: 0.25, stagger: { each: 0.06, from: 'end' }, ease: 'power2.in' }, '<')
      .to('.pillars-card', { opacity: 0, y: 36, scale: 0.97, duration: 0.35, ease: 'power2.in' }, '-=0.1');
  }

  ScrollTrigger.create({
    trigger:     pillarsCard,
    start:       'top 85%',
    onEnter:     showPillars,
    onLeave:     hidePillars,
    onEnterBack: showPillars,
    onLeaveBack: hidePillars,
  });
}

/* faq section */
(function() {
  var faqSection = document.getElementById('faq-section');
  if (!faqSection) return;

  faqSection.querySelectorAll('.acc-item').forEach(function(item) {
    item.querySelector('.acc-trigger').addEventListener('click', function() {
      var isOpen = item.classList.contains('open');
      item.classList.toggle('open', !isOpen);
      item.querySelector('.acc-btn').setAttribute('aria-expanded', String(!isOpen));
    });
  });
})();

/* faqs section */
(function() {
  var faqsSection = document.getElementById('faqs-section');
  if (!faqsSection) return;

  faqsSection.querySelectorAll('.acc-item').forEach(function(item) {
    item.querySelector('.acc-trigger').addEventListener('click', function() {
      item.classList.toggle('open');
    });
  });
})();

/* sticky nav */
(function() {
  var nav    = document.getElementById('site-nav');
  var navMob = document.getElementById('site-nav-mob');
  if (!nav && !navMob) return;

  var navInner     = nav    ? nav.querySelector('#nav-inner')        : null;
  var navLinksPill = nav    ? nav.querySelector('#nav-links-pill')   : null;
  var mobLinksPill = navMob ? navMob.querySelector('#mob-links-pill') : null;
  var navLogo      = nav    ? nav.querySelector('.nav-logo')          : null;
  var navLinks     = nav    ? nav.querySelectorAll('.nav-link')        : [];
  var sticky       = false;

  function setSticky(on) {
    if (on === sticky) return;
    sticky = on;
    var dur = 0.65, ease = 'power4.out';

    if (nav) {
      nav.classList.toggle('nav-sticky', on);
      gsap.to(nav, { top: on ? 18 : 35, duration: dur, ease: ease });
      if (navInner) {
        gsap.to(navInner, { height: on ? 72 : 106, duration: dur, ease: ease });
      }
      if (navLinksPill) {
        navLinksPill.classList.toggle('pill-sticky', on);
        gsap.to(navLinksPill, {
          paddingLeft:     on ? 10   : 0,
          paddingRight:    on ? 10   : 0,
          paddingTop:      on ? 10   : 0,
          paddingBottom:   on ? 10   : 0,
          borderRadius:    on ? 9999 : 0,
          backgroundColor: on ? 'rgba(10,10,14,0.45)' : 'rgba(0,0,0,0)',
          backdropFilter:  on ? 'blur(24px) saturate(160%)' : 'blur(0px)',
          duration: dur, ease: ease,
        });
      }
      if (navLogo) {
        gsap.to(navLogo, { width: on ? 72 : 106, height: on ? 72 : 106, duration: dur, ease: ease });
      }
    }

    if (navMob) {
      navMob.classList.toggle('nav-sticky', on);
      gsap.to(navMob, { top: on ? 14 : 20, duration: dur, ease: ease });
      if (mobLinksPill) {
        mobLinksPill.classList.toggle('pill-sticky', on);
        gsap.to(mobLinksPill, {
          paddingLeft:     on ? 10   : 0,
          paddingRight:    on ? 10   : 0,
          paddingTop:      on ? 10   : 0,
          paddingBottom:   on ? 10   : 0,
          borderRadius:    on ? 9999 : 0,
          backgroundColor: on ? 'rgba(10,10,14,0.45)' : 'rgba(0,0,0,0)',
          backdropFilter:  on ? 'blur(24px) saturate(160%)' : 'blur(0px)',
          duration: dur, ease: ease,
        });
      }
    }
  }

  ScrollTrigger.create({
    trigger:     '#hero-section',
    start:       'top+=120 top',
    onEnter:     function() { setSticky(true); },
    onLeaveBack: function() { setSticky(false); },
  });

  navLinks.forEach(function(link) {
    link.addEventListener('mouseenter', function() {
      gsap.to(link, { backgroundColor: '#2724F8', duration: 0.22, ease: 'power2.out' });
    });
    link.addEventListener('mouseleave', function() {
      gsap.to(link, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.22, ease: 'power2.out' });
    });
  });
})();

/* hero cta paired hover */
(function() {
  var cta = document.getElementById('hero-cta');
  if (!cta) return;
  var primary   = cta.querySelector('.hero-btn-primary');
  var secondary = cta.querySelector('.hero-btn-secondary');
  if (!primary || !secondary) return;

  var base  = Math.round(primary.getBoundingClientRect().width) || 286;
  var delta = 14;
  var dur   = 0.55;
  var ease  = 'power3.out';

  function clearWidths() {
    gsap.killTweensOf([primary, secondary]);
    primary.style.width   = '';
    secondary.style.width = '';
  }

  function grow(a, b) {
    gsap.to(a, { width: base + delta, duration: dur, ease: ease });
    gsap.to(b, { width: base - delta, duration: dur, ease: ease });
  }
  function reset() {
    gsap.to([primary, secondary], { width: base, duration: dur, ease: ease });
  }

  primary.addEventListener('mouseenter',   function() { if (window.innerWidth >= 640) grow(primary,   secondary); });
  primary.addEventListener('mouseleave',   function() { if (window.innerWidth >= 640) reset(); });
  secondary.addEventListener('mouseenter', function() { if (window.innerWidth >= 640) grow(secondary, primary);   });
  secondary.addEventListener('mouseleave', function() { if (window.innerWidth >= 640) reset(); });

  window.addEventListener('resize', function() {
    if (window.innerWidth < 640) clearWidths();
  });
})();


