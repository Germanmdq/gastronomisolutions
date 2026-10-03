(() => {
  // This local reconstruction is a motion study, so keep the motion layer active
  // even if macOS/browser accessibility preferences request reduced motion.
  const reduced = false;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const mobile = window.matchMedia('(max-width: 1025px)').matches;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (mobile) ScrollTrigger.config({ ignoreMobileResize: true });

  // Smooth scrolling: the original uses Lenis. Keep it disabled for reduced motion.
  let lenis = null;
  if (!reduced && window.Lenis && !mobile) {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(500, 33);
  }

  const q = (s, root = document) => root.querySelector(s);
  const qa = (s, root = document) => [...root.querySelectorAll(s)];

  function splitChars(el) {
    if (!el || el.dataset.splitDone) return [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const chars = [];
    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      const parts = node.nodeValue.split(/(\s+)/);
      parts.forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
        const word = document.createElement('span');
        word.className = 'word';
        [...part].forEach((ch) => {
          const mask = document.createElement('span');
          mask.className = 'char-mask';
          const span = document.createElement('span');
          span.className = 'char';
          span.textContent = ch;
          mask.appendChild(span);
          word.appendChild(mask);
          chars.push(span);
        });
        frag.appendChild(word);
      });
      node.parentNode.replaceChild(frag, node);
    });
    el.dataset.splitDone = '1';
    return chars;
  }

  function revealHeading(el, opts = {}) {
    if (!el || el.dataset.revealInit) return;
    el.dataset.revealInit = '1';
    if (reduced) return;
    const chars = splitChars(el);
    gsap.fromTo(chars,
      { yPercent: 115, rotate: 0.001 },
      {
        yPercent: 0,
        duration: opts.duration ?? 0.65,
        stagger: opts.stagger ?? 0.015,
        ease: 'power3.out',
        scrollTrigger: opts.scroll === false ? undefined : { trigger: el, start: 'top 85%', once: true },
        delay: opts.delay ?? 0
      }
    );
  }

  function revealLine(el) {
    if (!el || el.dataset.lineReveal) return;
    el.dataset.lineReveal = '1';
    if (reduced) return;
    gsap.fromTo(el, { y: 24, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 87%', once: true }
    });
  }

  // HERO INTRO — diagonal image mask + delayed copy/header entrance.
  const hero = q('#hero');
  const heroPanel = q('.hero');
  const heroPerson = q('.hero-person');
  const heroCopy = q('.hero-copy');
  const heroTitle = q('.hero h1');
  const heroMeta = qa('.hero-meta p');
  const header = q('.topbar');
  const gallery = q('.gallery-overlay');

  if (heroPerson) {
    heroPerson.classList.add('hero-mask-reveal');
    heroPerson.style.setProperty('--reveal', reduced ? '125%' : '-40%');
  }

  if (!reduced) {
    const restoreHero = () => {
      try { lenis?.start?.(); } catch (_) {}
      gsap.set(header, { yPercent: 0, opacity: 1 });
      gsap.set(heroPerson, { opacity: 1 });
      gsap.set(heroMeta, { y: 0, opacity: 1 });
      qa('.hero h1 .char').forEach((char) => gsap.set(char, { yPercent: 0, opacity: 1 }));
      if (heroPerson) heroPerson.style.setProperty('--reveal', '125%');
      heroPanel?.classList.add('intro-done');
    };

    try {
      gsap.set(header, { yPercent: -50, opacity: 0 });
      gsap.set(heroPerson, { opacity: 0 });
      const titleChars = splitChars(heroTitle);
      gsap.set(titleChars, { yPercent: 115 });
      gsap.set(heroMeta, { y: 24, opacity: 0 });

      if (mobile) {
        const mobileReveal = { value: -28 };
        heroPerson?.style.setProperty('--reveal', '-28%');
        gsap.timeline({ onComplete: () => heroPanel?.classList.add('intro-done') })
          .to(mobileReveal, {
            value: 125,
            duration: 1.25,
            ease: 'power2.out',
            onUpdate: () => heroPerson?.style.setProperty('--reveal', mobileReveal.value + '%')
          }, 0)
          .to(heroPerson, { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' }, 0)
          .to(titleChars, { yPercent: 0, duration: 0.5, stagger: 0.008, ease: 'power3.out' }, 0.18)
          .to(heroMeta, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: 'power2.out' }, 0.38)
          .to(header, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }, 0.34);
      } else {
        const reveal = { value: -40 };
        gsap.timeline({ onComplete: () => { heroPanel?.classList.add('intro-done'); lenis?.start?.(); } })
          .to(reveal, {
            value: 125, duration: 3.5, ease: 'power2.out',
            onUpdate: () => heroPerson?.style.setProperty('--reveal', reveal.value + '%')
          }, 0)
          .to(heroPerson, { opacity: 1, duration: 1.5, ease: 'power2.out' }, 0)
          .to(titleChars, { yPercent: 0, duration: 0.6, stagger: 0.015, ease: 'power3.out' }, 1)
          .to(heroMeta, { y: 0, opacity: 1, duration: 0.75, stagger: 0.12, ease: 'power2.out' }, 1.45)
          .to(header, { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 1.8);
      }

      setTimeout(restoreHero, 4500);
    } catch (err) {
      console.error('Hero intro fallback:', err);
      restoreHero();
    }
  }


  // Hero scroll choreography: shrink the opening panel while the portfolio marquee sharpens in.
  if (hero && heroPanel && gallery && !reduced) {
    if (mobile) {
      gsap.set(gallery, { opacity: 0.28, filter: 'none' });
      gsap.timeline({
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.45 }
      })
        .to(heroPanel, { scale: 0.78, yPercent: -2, ease: 'none', duration: 1 }, 0)
        .to(gallery, { opacity: 1, ease: 'none', duration: 0.65 }, 0.18);
    } else {
      gsap.set(gallery, { opacity: 0.35, filter: 'blur(24px)' });
      gsap.timeline({
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true }
      })
        .to(heroPanel, { scale: 0.5, ease: 'power2.inOut', duration: 1 }, 0)
        .to(gallery, { opacity: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 0.18 }, 0.32);
    }
  }

  // Hero pointer parallax, desktop only.
  if (!reduced && innerWidth > 1024 && heroPerson && heroCopy) {
    let tx = 0, ty = 0, cx = 0, cy = 0, ttx = 0, tty = 0, ccx = 0, ccy = 0;
    window.addEventListener('mousemove', (e) => {
      const nx = e.clientX / innerWidth * 2 - 1;
      const ny = e.clientY / innerHeight * 2 - 1;
      tx = -30 * nx; ty = -30 * ny; ttx = -12 * nx; tty = -12 * ny;
    }, { passive: true });
    const tick = () => {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      ccx += (ttx - ccx) * 0.08; ccy += (tty - ccy) * 0.08;
      gsap.set(heroPerson, { x: cx, y: cy });
      gsap.set(heroCopy, { x: ccx, y: ccy });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // The original columns continuously marquee at two different speeds.
  qa('.marquee-col')[0]?.classList.add('marquee-1');
  qa('.marquee-col')[1]?.classList.add('marquee-2');

  // PORTFOLIO — ellipse transition, progress line, stacked images and snap points.
  const portfolio = q('#portfolio');
  const circleClip = q('.circle-clip');
  const timelineLine = q('.timeline .line');
  const dots = qa('.timeline article > span');
  const timelineItems = qa('.timeline article');
  const layers = qa('.portfolio-layer');
  if (portfolio) {
    if (circleClip && !reduced) {
      gsap.set(circleClip, { clipPath: 'ellipse(150% 100% at 50% 100%)' });
      gsap.to(circleClip, {
        yPercent: innerWidth > 1024 ? -70 : -50,
        clipPath: 'ellipse(60% 100% at 50% 100%)',
        ease: 'none',
        scrollTrigger: { trigger: portfolio, start: 'top bottom', end: '30% bottom', scrub: mobile ? 0.35 : true }
      });
    }

    gsap.set(timelineLine, { scaleY: reduced ? 1 : 0, transformOrigin: 'top' });
    gsap.set(layers, { filter: 'brightness(1)' });
    layers.forEach((layer, i) => gsap.set(layer, { zIndex: i + 1, yPercent: reduced || i === 0 ? 0 : 100 }));
    dots.forEach((dot, i) => gsap.set(dot, {
      backgroundColor: i === 0 ? '#fff' : '#F06A0E',
      borderColor: i === 0 ? '#fff' : 'rgba(255,255,255,.5)'
    }));
    const setPortfolioActive = (active) => {
      timelineItems.forEach((item, i) => item.classList.toggle('active', i === active));
      dots.forEach((dot, i) => gsap.set(dot, {
        backgroundColor: i === active ? '#fff' : '#F06A0E',
        borderColor: i === active ? '#fff' : 'rgba(255,255,255,.5)'
      }));
    };
    setPortfolioActive(0);

    if (!reduced) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: portfolio, start: '10% top', end: 'bottom bottom', scrub: mobile ? 0.35 : true,
          snap: mobile ? false : { snapTo: 1 / 3, duration: { min: 0.2, max: 0.6 }, ease: 'power1.inOut' },
          onUpdate: (self) => setPortfolioActive(Math.min(3, Math.round(self.progress * 3)))
        }
      });
      tl.to(timelineLine, { scaleY: 1, ease: 'none', duration: 3 }, 0);
      for (let i = 0; i < 3; i++) {
        tl.to(layers[i + 1], { yPercent: 0, ease: 'power2.inOut', duration: 1 }, i)
          .to(layers[i], { filter: 'brightness(.3)', ease: 'power2.inOut', duration: 1 }, i);
      }
    }
  }

  // Shared copy reveals used throughout the original.
  qa('section h2, #clientblur h3').forEach((el) => revealHeading(el));
  qa('.section-title p, .services-intro p, .award-row p').forEach(revealLine);

  // WORK WITH ME — card rise + directional underline hover.
  const workCards = qa('.work-card');
  if (!reduced && workCards.length) {
    gsap.fromTo(workCards, { opacity: 0, yPercent: 10 }, {
      opacity: 1, yPercent: 0, stagger: 0.05, ease: 'power2.out',
      scrollTrigger: { trigger: '#work-with-me', start: innerWidth > 1025 ? 'top top' : 'top 82%', once: true }
    });
  }
  workCards.forEach((card) => {
    const bar = q('.progress span', card);
    if (!bar) return;
    gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' });
    const activateBar = () => {
      gsap.killTweensOf(bar); gsap.set(bar, { transformOrigin: 'left center' });
      gsap.to(bar, { scaleX: 1, duration: reduced ? 0 : 0.55, ease: 'power2.out' });
    };
    const deactivateBar = () => {
      gsap.killTweensOf(bar); gsap.set(bar, { transformOrigin: 'right center' });
      gsap.to(bar, { scaleX: 0, duration: reduced ? 0 : 0.55, ease: 'power2.out' });
    };
    card.addEventListener('mouseenter', activateBar);
    card.addEventListener('mouseleave', deactivateBar);
    if (innerWidth <= 1025) {
      ScrollTrigger.create({
        trigger: card,
        start: 'top 72%',
        end: 'bottom 28%',
        onEnter: activateBar,
        onEnterBack: activateBar,
        onLeave: deactivateBar,
        onLeaveBack: deactivateBar
      });
    }
  });

  // SERVICES — exact horizontal travel ratios + active radial reveal / arrow swap.
  const services = q('#services');
  const servicesRow = q('#servicesRow');
  const serviceCards = qa('.service-card');
  let currentService = -1;
  const setServiceActive = (active) => {
    if (active === currentService) return;
    currentService = active;
    serviceCards.forEach((card, i) => {
      const isActive = i === active;
      card.classList.toggle('service-active', isActive);
      gsap.to(card, {
        '--reveal': isActive ? '100%' : '-40%',
        duration: reduced ? 0 : 0.38,
        ease: 'power2.out',
        overwrite: true
      });
    });
  };
  serviceCards.forEach((card, i) => {
    card.style.setProperty('--reveal', i === 0 ? '100%' : '-40%');
    card.addEventListener('mouseenter', () => setServiceActive(i));
  });
  setServiceActive(0);
  if (services && servicesRow && !reduced) {
    const fromX = innerWidth > 1025 ? 70 : 36;
    const toX = innerWidth > 1025 ? -33 : innerWidth > 541 ? -72 : -82;
    gsap.fromTo(servicesRow, { xPercent: fromX }, {
      xPercent: toX, ease: 'none',
      scrollTrigger: {
        trigger: services,
        start: innerWidth > 1025 ? 'top 20%' : 'top top',
        end: 'bottom bottom',
        scrub: mobile ? 0.35 : true,
        onUpdate: (self) => {
          if (innerWidth <= 1025) {
            setServiceActive(Math.min(serviceCards.length - 1, Math.round(self.progress * (serviceCards.length - 1))));
          }
        }
      }
    });
  }

  // AWARDS — draw divider lines and show the image tied to the hovered row.
  const awards = q('#awards');
  const awardRows = qa('.award-row');
  const awardsImageBox = q('.awards-mosaic');
  const awardImgs = qa('.awards-mosaic img');
  if (awardsImageBox) {
    awardImgs.forEach((img, i) => gsap.set(img, { position: 'absolute', inset: 0, scale: i === 0 ? 1.05 : 0, zIndex: i + 1 }));
    if (innerWidth > 1025) gsap.set(awardsImageBox, { opacity: 0 });
  }
  const showAwardImage = (active, followRow = false) => {
    if (!awardsImageBox) return;
    gsap.to(awardsImageBox, { opacity: 1, duration: 0.32, ease: 'power2.out' });
    awardImgs.forEach((img, j) => {
      if (j === active) {
        gsap.set(img, { zIndex: 30 + active });
        gsap.to(img, { scale: 1.05, opacity: 1, duration: 0.4, ease: 'power2.out' });
      } else {
        gsap.to(img, { scale: 0.9, opacity: 0, duration: 0.28, ease: 'power2.inOut' });
      }
    });
    awardRows.forEach((row, j) => row.classList.toggle('active', j === active));
  };
  if (innerWidth <= 1025) showAwardImage(0);
  awardRows.forEach((row, i) => {
    const line = row;
    if (!reduced) {
      gsap.fromTo(line, { '--lineScale': 0 }, {
        '--lineScale': 1, duration: 0.8, ease: 'power2.inOut',
        scrollTrigger: { trigger: row, start: 'top 85%', once: true }
      });
    } else row.style.setProperty('--lineScale', 1);

    row.addEventListener('mouseenter', () => {
      if (!awardsImageBox || innerWidth <= 1025) return;
      const ar = awards.getBoundingClientRect();
      const rr = row.getBoundingClientRect();
      const desired = rr.top + rr.height / 2 - (ar.top + ar.height / 2);
      gsap.to(awardsImageBox, { y: desired, duration: reduced ? 0 : 0.65, ease: 'back.out(1.6)' });
      showAwardImage(i, true);
    });
    if (innerWidth <= 1025) {
      ScrollTrigger.create({
        trigger: row,
        start: 'top 58%',
        end: 'bottom 42%',
        onEnter: () => showAwardImage(i),
        onEnterBack: () => showAwardImage(i)
      });
    }
  });
  q('.awards-copy')?.addEventListener('mouseleave', () => {
    if (awardsImageBox && innerWidth > 1025) gsap.to(awardsImageBox, { opacity: 0, duration: reduced ? 0 : 0.4, ease: 'power2.out' });
  });

  // CLIENT LOGOS — lighter mobile reveal; full 3D choreography stays desktop-only.
  const clientScroll = q('#clientblur');
  const clientImgs = qa('#clientGrid img');
  if (clientScroll && clientImgs.length && !reduced) {
    if (mobile) {
      gsap.fromTo(clientImgs,
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 0.42, stagger: 0.05, ease: 'power2.out',
          scrollTrigger: { trigger: clientScroll, start: 'top 72%', once: true }
        }
      );
    } else {
      const seeds = [
        [-150,-90,-2050], [120,-170,-1800], [-70,155,-2200], [175,70,-1650],
        [-130,130,-1900], [80,-120,-2100], [145,165,-1750], [-175,-45,-2000],
        [50,180,-1850], [-105,-150,-2150], [165,-110,-1700], [-40,85,-1950]
      ];
      const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: clientScroll, start: 'top 20%', end: 'bottom center', scrub: true } });
      const groups = [[0,1,2],[3,4],[5,6,7],[8,9],[10,11]];
      groups.forEach((group, gi) => {
        group.forEach((idx, ii) => {
          const img = clientImgs[idx];
          if (!img) return;
          const [x,y,z] = seeds[idx % seeds.length];
          const start = gi * 1.9 + ii * 0.4;
          gsap.set(img, { opacity: 0, x, y, z, filter: 'blur(10px)', transformOrigin: '0% 0%' });
          tl.to(img, { z: 0, opacity: 1, filter: 'blur(0px)', duration: 1.5 }, start)
            .to(img, { z: 1600 + idx * 16, opacity: 0, filter: 'blur(10px)', duration: 1.5 }, start + 1.5);
        });
      });
    }
  } else if (reduced) {
    gsap.set(clientImgs, { opacity: 1, x: 0, y: 0, z: 0, filter: 'blur(0px)' });
  }

  // TESTIMONIALS — animated copy swap rather than abrupt replacement.
  const quotes = [
    ['Rentabilidad','Costos · Merma · Margen','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=88','Una carta bien diseñada tiene que poder producirse, sostener calidad y dejar margen.'],
    ['Consistencia','Recetas · Estándares · Control','https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1600&q=88','El objetivo es que cada plato salga con el mismo criterio, sin depender de una sola persona.'],
    ['Velocidad','Mise en place · Flujo · Despacho','https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1600&q=88','Ordenar el flujo reduce esperas, retrabajo y conversaciones innecesarias durante el servicio.'],
    ['Equipo','Roles · Capacitación · Autonomía','https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=88','Los procedimientos claros convierten conocimiento individual en una forma de trabajo compartida.'],
    ['Control','Indicadores · Seguimiento · Mejora','https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1600&q=88','Medir puntos críticos permite corregir antes de que el problema llegue al cliente.']
  ];
  const buttons = qa('.avatar-row button');
  const quoteCard = q('.testimonial-card');
  function setQuote(i) {
    const qv = quotes[i];
    const swap = () => {
      q('#quoteName').textContent = qv[0]; q('#quoteRole').textContent = qv[1];
      q('#quoteAvatar').src = qv[2]; q('#quoteText').textContent = qv[3];
      buttons.forEach((b,j) => b.classList.toggle('active', i === j));
    };
    if (reduced || !quoteCard) { swap(); return; }
    gsap.to(quoteCard, { y: -18, opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: () => {
      swap(); gsap.set(quoteCard, { y: 22 });
      gsap.to(quoteCard, { y: 0, opacity: 1, duration: 0.42, ease: 'power3.out' });
    }});
  }
  buttons.forEach((b,i) => b.addEventListener('click', () => setQuote(i)));
  setQuote(0);
  let quoteIndex = 0;
  setInterval(() => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    setQuote(quoteIndex);
  }, 4800);

  // FAQ — keep one item open; native content plus animated icon/background from CSS.
  qa('.faq-list details').forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) qa('.faq-list details').forEach((o) => { if (o !== d) o.open = false; });
  }));

  // FOOTER — glass panel rises into place as in the original desktop layout.
  const footer = q('#footer');
  const footerGlass = q('.footer-glass');
  if (footer && footerGlass && !reduced) {
    if (mobile) {
      gsap.fromTo(footerGlass, { y: 28, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.55, ease: 'power2.out',
        scrollTrigger: { trigger: footer, start: 'top 90%', once: true }
      });
    } else {
      gsap.fromTo(footerGlass, { yPercent: 20, opacity: 1 }, {
        yPercent: 0, opacity: 1, ease: 'power1.out',
        scrollTrigger: { trigger: footer, start: 'top 60%', end: 'bottom bottom', scrub: true }
      });
    }
  }

  // Interactive pills: expanding dot + character lift, matching the source micro-interaction.
  qa('.pill').forEach((pill) => {
    const label = pill.querySelector('span:last-child');
    if (!label || label.dataset.splitButton) return;
    label.dataset.splitButton = '1';
    const text = label.textContent;
    label.innerHTML = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'btn-char'; s.textContent = ch === ' ' ? '\u00a0' : ch;
      s.style.transitionDelay = `${i * .01}s`; label.appendChild(s);
    });
  });

  ScrollTrigger.refresh();
})();
