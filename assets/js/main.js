/* =====================================================================
   Omar Shaker — Portfolio · shared behaviour (vanilla JS, no dependencies)
   Loaded with `defer` by index.html, projects.html and blog.html.
   Every feature is feature-detected, so a page only runs what it contains.
   ===================================================================== */
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  window.__portfolioReady = true; // tells the <head> fallback timer that scripts loaded

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  /* ───────────── Theme ───────────── */
  const themeBtn = $("#theme-toggle");
  const themeMeta = $('meta[name="theme-color"]');
  const syncThemeMeta = () => {
    if (themeMeta) themeMeta.setAttribute("content", root.getAttribute("data-theme") === "light" ? "#faf9ff" : "#06050f");
  };
  syncThemeMeta();
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.classList.add("theme-anim");
      root.setAttribute("data-theme", next);
      store.set("theme", next);
      syncThemeMeta();
      setTimeout(() => root.classList.remove("theme-anim"), 600);
    });
  }

  /* ───────────── Word-split headings ───────────── */
  $$("[data-split]").forEach((el) => {
    let n = 0;
    const frag = document.createDocumentFragment();
    el.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (!tok.trim()) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "w";
          const i = document.createElement("span"); i.className = "wi";
          i.style.setProperty("--wi", n++); i.textContent = tok;
          w.appendChild(i); frag.appendChild(w);
        });
      } else if (node.nodeName === "BR") {
        frag.appendChild(node.cloneNode());
      } else {
        const w = document.createElement("span"); w.className = "w";
        const i = document.createElement("span"); i.className = "wi";
        i.style.setProperty("--wi", n++); i.appendChild(node.cloneNode(true));
        w.appendChild(i); frag.appendChild(w);
      }
    });
    el.textContent = ""; el.appendChild(frag);
  });

  /* ───────────── Scroll reveal ───────────── */
  $$("[data-stagger]").forEach((group) => {
    Array.from(group.children).forEach((child, i) => child.style.setProperty("--i", i % 4));
  });

  const markDone = (el) => el.classList.add("is-done");
  const revealTargets = $$("[data-reveal], [data-split], .eyebrow");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("is-in");
        if (el.hasAttribute("data-reveal")) {
          const delay = parseFloat(getComputedStyle(el).getPropertyValue("--i") || 0) * 80;
          setTimeout(() => markDone(el), 950 + delay);
        }
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => { el.classList.add("is-in"); markDone(el); });
  }

  /* ───────────── Header, scroll progress, back-to-top, timeline ───────────── */
  const header = $("#header");
  const bar = $(".scroll-progress");
  const toTop = $(".to-top");
  const timeline = $(".timeline");
  let ticking = false;

  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (header) header.classList.toggle("is-scrolled", y > 24);
    if (bar) bar.style.setProperty("--sp", max > 0 ? clamp(y / max, 0, 1).toFixed(4) : 0);
    if (toTop) toTop.classList.toggle("is-visible", y > 700);
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = clamp((window.innerHeight * 0.62 - r.top) / r.height, 0, 1);
      timeline.style.setProperty("--p", p.toFixed(4));
    }
  };
  const requestTick = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick, { passive: true });
  onScroll();

  if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  /* ───────────── Nav: sliding indicator + scroll-spy ───────────── */
  const navList = $(".nav-links");
  const indicator = $(".nav-indicator");
  const navLinks = $$(".nav-links a");
  let activeLink = $(".nav-links a[aria-current='page']");

  const moveIndicator = (link) => {
    if (!indicator || !link || !navList.offsetParent) { if (indicator) indicator.classList.remove("is-on"); return; }
    const box = indicator.parentElement.getBoundingClientRect();
    const r = link.getBoundingClientRect();
    indicator.style.width = r.width + "px";
    indicator.style.transform = `translate(${r.left - box.left}px, -50%)`;
    indicator.classList.add("is-on");
  };
  const setActive = (link) => {
    activeLink = link;
    navLinks.forEach((a) => {
      const on = a === link;
      a.classList.toggle("is-active", on);
      if (a.getAttribute("aria-current") !== "page") on ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current");
    });
    moveIndicator(link);
  };
  navLinks.forEach((a) => {
    a.addEventListener("pointerenter", () => moveIndicator(a));
    a.addEventListener("focus", () => moveIndicator(a));
  });
  if (navList) {
    navList.addEventListener("pointerleave", () => moveIndicator(activeLink));
    navList.addEventListener("focusout", () => moveIndicator(activeLink));
  }
  window.addEventListener("resize", () => moveIndicator(activeLink), { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveIndicator(activeLink));

  const spySections = $$("main section[id], section[id='hero']");
  const byId = new Map();
  navLinks.forEach((a) => { if (a.getAttribute("href").startsWith("#")) byId.set(a.hash.slice(1), a); });
  if (byId.size && spySections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const link = byId.get(e.target.id);
        if (link) setActive(link); else if (e.target.id === "hero") setActive(null);
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    spySections.forEach((s) => spy.observe(s));
  } else {
    moveIndicator(activeLink);
  }

  /* ───────────── Mobile menu ───────────── */
  const menuBtn = $("#menu-btn");
  const menu = $("#mobile-menu");
  const lock = (on) => document.body.classList.toggle("is-locked", on);
  const setMenu = (open) => {
    if (!menu || !menuBtn) return;
    menu.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    lock(open);
    if (open) setTimeout(() => { const first = $("a", menu); if (first) first.focus({ preventScroll: true }); }, 350);
  };
  if (menu && menuBtn) {
    menu.setAttribute("aria-hidden", "true");
    menuBtn.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
    $$("a", menu).forEach((a, i) => { a.style.setProperty("--i", i); a.addEventListener("click", () => setMenu(false)); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); menuBtn.focus(); } });
    window.matchMedia("(min-width: 1100px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });
  }

  /* ───────────── Count-up numbers ───────────── */
  const counters = $$("[data-count]");
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    if (reduceMotion || isNaN(target)) { el.textContent = prefix + target + suffix; return; }
    const dur = 1600, t0 = performance.now();
    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = prefix + Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (counters.length && "IntersectionObserver" in window) {
    counters.forEach((el) => { el.textContent = (el.dataset.prefix || "") + "0" + (el.dataset.suffix || ""); });
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  /* ───────────── Card spotlight + 3D tilt (mouse only) ───────────── */
  if (finePointer) {
    let raf = 0, evt = null, lastCard = null;
    const resetCard = (c) => { if (c && c.hasAttribute("data-tilt")) c.style.transform = ""; };
    const update = () => {
      raf = 0;
      const card = evt.target.closest ? evt.target.closest(".card") : null;
      if (lastCard && lastCard !== card) resetCard(lastCard);
      if (card) {
        const r = card.getBoundingClientRect();
        const x = evt.clientX - r.left, y = evt.clientY - r.top;
        card.style.setProperty("--mx", x + "px");
        card.style.setProperty("--my", y + "px");
        const ready = !card.hasAttribute("data-reveal") || card.classList.contains("is-done");
        if (card.hasAttribute("data-tilt") && ready && !reduceMotion) {
          const rx = (y / r.height - 0.5) * -5, ry = (x / r.width - 0.5) * 5;
          card.style.transform = `perspective(1100px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px)`;
        }
      }
      lastCard = card;
    };
    document.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      evt = e; if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", () => { resetCard(lastCard); lastCard = null; });

    /* magnetic buttons */
    if (!reduceMotion) {
      $$(".btn-primary, [data-magnetic]").forEach((btn) => {
        btn.addEventListener("pointermove", (e) => {
          const r = btn.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) * 0.22;
          const y = (e.clientY - r.top - r.height / 2) * 0.3;
          btn.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
        });
        btn.addEventListener("pointerleave", () => { btn.style.translate = ""; });
      });
    }

    /* soft glow that trails the cursor */
    if (!reduceMotion) {
      const glow = document.createElement("div");
      glow.className = "cursor-glow"; glow.setAttribute("aria-hidden", "true");
      document.body.appendChild(glow);
      let mx = 0, my = 0, cx = 0, cy = 0, run = false;
      const loop = () => {
        cx += (mx - cx) * 0.12; cy += (my - cy) * 0.12;
        glow.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
        if (Math.abs(mx - cx) > 0.4 || Math.abs(my - cy) > 0.4) requestAnimationFrame(loop); else run = false;
      };
      window.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") return;
        mx = e.clientX; my = e.clientY; glow.classList.add("is-on");
        if (!run) { run = true; requestAnimationFrame(loop); }
      }, { passive: true });
      document.documentElement.addEventListener("mouseleave", () => glow.classList.remove("is-on"));
    }

    /* hero parallax for the floating chips */
    const hero = $(".hero");
    const chips = $$(".float-chip");
    if (hero && chips.length && !reduceMotion) {
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        chips.forEach((c, i) => {
          const d = (i % 2 ? -1 : 1) * (14 + i * 6);
          c.style.setProperty("--tx", (nx * d).toFixed(1) + "px");
          c.style.setProperty("--ty", (ny * d).toFixed(1) + "px");
        });
      });
    }
  }

  /* ───────────── Typewriter ───────────── */
  const typed = $("#typed");
  if (typed && !reduceMotion) {
    const phrases = (typed.dataset.phrases || "").split("|").filter(Boolean);
    if (phrases.length) {
      let pi = 0, ci = phrases[0].length, deleting = true;
      const tick = () => {
        const word = phrases[pi];
        if (!deleting) {
          ci++; typed.textContent = word.slice(0, ci);
          if (ci === word.length) { deleting = true; return setTimeout(tick, 1900); }
          return setTimeout(tick, 85);
        }
        ci--; typed.textContent = word.slice(0, ci);
        if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; return setTimeout(tick, 320); }
        return setTimeout(tick, 42);
      };
      setTimeout(tick, 2200);
    }
  }

  /* ───────────── Marquees (duplicate the track for a seamless loop) ───────────── */
  if (!reduceMotion) {
    $$(".marquee").forEach((m) => {
      const group = $(".marquee-group", m);
      if (!group) return;
      const copies = Math.max(1, Math.ceil(m.clientWidth / Math.max(1, group.scrollWidth)));
      for (let i = 0; i < copies; i++) {
        const clone = group.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        m.appendChild(clone);
      }
    });
  }

  /* ───────────── Copy e-mail ───────────── */
  const toast = $(".toast");
  let toastTimer;
  const showToast = (msg) => {
    if (!toast) return;
    $("span", toast).textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2200);
  };
  const copyText = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta);
      ta.select(); let ok = false;
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      ta.remove(); return ok;
    }
  };
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await copyText(btn.dataset.copy);
      const label = $("span", btn);
      if (ok) {
        btn.classList.add("is-copied"); if (label) label.textContent = "Copied!"; showToast("Email copied to clipboard");
        setTimeout(() => { btn.classList.remove("is-copied"); if (label) label.textContent = "Copy"; }, 2000);
      } else { showToast("Couldn't copy — select the address instead"); }
    });
  });

  /* ───────────── Footer year ───────────── */
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  const nowDate = $("#now-date");
  if (nowDate) nowDate.textContent = "Active build · " + new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  /* ═════════════ Projects page ═════════════ */

  /* project preview drawers (images load on first open — some originals are large) */
  $$(".toggle").forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    const label = $(".toggle-label", btn);
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-open", open);
      if (label) label.textContent = open ? "Hide preview" : "Preview & output";
      if (open) {
        $$("img[data-src]", panel).forEach((img) => {
          img.src = img.dataset.src; img.removeAttribute("data-src");
          if (img.complete) img.classList.add("is-loaded"); else img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
        });
      }
    });
  });

  /* lightbox */
  const lb = $("#lightbox");
  if (lb) {
    const img = $(".lb-img", lb), cap = $(".lb-cap", lb), count = $(".lb-count", lb);
    const prev = $(".lb-prev", lb), next = $(".lb-next", lb);
    let items = [], idx = 0;

    const show = (i, dir) => {
      idx = i;
      const it = items[idx];
      const swap = () => {
        img.src = it.src; img.alt = it.alt;
        cap.textContent = it.alt || "";
        count.textContent = items.length > 1 ? `${idx + 1} / ${items.length}` : "";
        prev.disabled = idx === 0; next.disabled = idx === items.length - 1;
        img.classList.remove("is-out-l", "is-out-r");
      };
      if (dir && !reduceMotion) { img.classList.add(dir > 0 ? "is-out-l" : "is-out-r"); setTimeout(swap, 180); } else swap();
    };
    const open = (shot) => {
      const group = shot.closest(".shots");
      items = $$("img", group).map((im) => ({ src: im.currentSrc || im.src, alt: im.alt }));
      const i = $$(".shot", group).indexOf(shot);
      lb.classList.toggle("is-multi", items.length > 1);
      show(Math.max(0, i));
      lb.showModal(); lock(true);
    };
    const go = (d) => { const n = idx + d; if (n >= 0 && n < items.length) show(n, d); };

    document.addEventListener("click", (e) => { const s = e.target.closest(".shot"); if (s) open(s); });
    $(".lb-close", lb).addEventListener("click", () => lb.close());
    prev.addEventListener("click", () => go(-1));
    next.addEventListener("click", () => go(1));
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb-stage")) lb.close(); });
    lb.addEventListener("close", () => { lock(false); img.removeAttribute("src"); });
    lb.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); });

    let sx = 0, sy = 0;
    lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* PDF viewer — modal on desktop, new tab on touch devices (mobile browsers can't embed PDFs) */
  const pdf = $("#pdf-dialog");
  $$("[data-pdf]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const url = btn.dataset.pdf;
      const touchy = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820 || !pdf;
      if (touchy) return; // the link opens the PDF in a new tab
      e.preventDefault();
      $("#pdf-title").textContent = btn.dataset.pdfTitle || "Document";
      $("#pdf-download").href = url;
      $("#pdf-frame").src = url;
      pdf.showModal(); lock(true);
    });
  });
  if (pdf) {
    $("#pdf-close").addEventListener("click", () => pdf.close());
    pdf.addEventListener("click", (e) => { if (e.target === pdf) pdf.close(); });
    pdf.addEventListener("close", () => { lock(false); $("#pdf-frame").removeAttribute("src"); });
  }

  /* category filter (projects + blog share the same pattern) */
  const filterBtns = $$(".filter");
  if (filterBtns.length) {
    const items = $$("[data-cats]:not(li)");
    const railItems = $$(".rail li");
    const countEl = $(".result-count");
    const emptyEl = $(".empty");
    const apply = (f) => {
      let shown = 0;
      filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === f)));
      items.forEach((el) => {
        const match = f === "all" || el.dataset.cats.split(" ").includes(f);
        el.hidden = !match;
        if (match) {
          shown++;
          el.classList.remove("is-filtering"); void el.offsetWidth;
          if (!reduceMotion) { el.classList.add("is-filtering"); el.style.animationDelay = (shown - 1) * 70 + "ms"; }
        }
      });
      railItems.forEach((li) => { li.hidden = !(f === "all" || li.dataset.cats.split(" ").includes(f)); });
      if (countEl) countEl.textContent = `Showing ${shown} of ${items.length}`;
      if (emptyEl) emptyEl.classList.toggle("is-on", shown === 0);
    };
    filterBtns.forEach((b) => b.addEventListener("click", () => apply(b.dataset.filter)));
    if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t && t.hidden) apply("all"); }
  }

  /* projects rail scroll-spy */
  const railLinks = $$(".rail a");
  if (railLinks.length && "IntersectionObserver" in window) {
    const map = new Map(railLinks.map((a) => [a.hash.slice(1), a]));
    const rio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        railLinks.forEach((a) => a.classList.toggle("is-active", a === map.get(e.target.id)));
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    $$(".proj").forEach((p) => rio.observe(p));
  }

  /* ═════════════ Blog page: collapsible long posts ═════════════ */
  $$(".post-body[data-collapsible]").forEach((body) => {
    const post = body.closest(".post");
    const btn = $(".post-more", post);
    const COLLAPSED = 300;
    if (!btn || body.scrollHeight <= COLLAPSED + 120) return;
    const label = $("span", btn);
    body.classList.add("is-collapsed");
    body.style.maxHeight = COLLAPSED + "px";
    btn.hidden = false;
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "Show less" : "Read the full post";
      if (open) {
        body.classList.remove("is-collapsed");
        body.style.maxHeight = body.scrollHeight + "px";
        setTimeout(() => { if (btn.getAttribute("aria-expanded") === "true") body.style.maxHeight = "none"; }, 850);
      } else {
        body.style.maxHeight = body.scrollHeight + "px";
        requestAnimationFrame(() => requestAnimationFrame(() => {
          body.classList.add("is-collapsed");
          body.style.maxHeight = COLLAPSED + "px";
        }));
        post.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
      }
    });
  });
})();
