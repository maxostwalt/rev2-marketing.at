(function () {
  document.documentElement.classList.add("js");

  /* Nach einem Neuladen immer oben starten (der Browser würde sonst eine alte Position
     wiederherstellen, die durch die gehaltene Sektion nicht mehr stimmt) */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (!location.hash) window.scrollTo(0, 0);

  /* Nav state */
  var nav = document.querySelector(".nav");
  var logo = nav ? nav.querySelector(".brand img") : null;
  var navH = nav ? nav.offsetHeight : 0;
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 8);
    /* Welche Sektion liegt unter der Unterkante des Headers? */
    var el = document.elementFromPoint(Math.round(window.innerWidth / 2), navH + 2);
    var band = el ? el.closest(".band, .kpis, .footer") : null;
    var light = !!(band && (band.classList.contains("light") || band.classList.contains("light-2")));
    if (light !== nav.classList.contains("light")) {
      nav.classList.toggle("light", light);
      if (logo) logo.src = light ? "/assets/rev2-marketing-black.png" : "/assets/rev2-marketing-white.png";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var burger = document.querySelector(".burger");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll(".nav-menu a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); });
    });
  }

  /* Reveal on scroll */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rv = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0 });
    rv.forEach(function (el) { io.observe(el); });
    /* Safety net: anything already above the fold line gets revealed on scroll */
    var sweep = function () {
      var line = window.innerHeight * 0.96;
      rv.forEach(function (el) {
        if (!el.classList.contains("in") && el.getBoundingClientRect().top < line) el.classList.add("in");
      });
    };
    window.addEventListener("scroll", sweep, { passive: true });
    window.addEventListener("load", sweep);
    setTimeout(sweep, 400);
  } else {
    rv.forEach(function (el) { el.classList.add("in"); });
  }

  /* Count-up numbers */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    var dur = 1400, start = null;
    var fmt = function (n) { return prefix + Math.round(n).toLocaleString("de-AT") + suffix; };
    if (reduce) { el.textContent = fmt(target); return; }
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* Deadline countdown */
  var cd = document.querySelector("[data-deadline]");
  if (cd) {
    var deadline = new Date(cd.getAttribute("data-deadline") + "T23:59:59+01:00");
    var now = new Date();
    var days = Math.max(0, Math.ceil((deadline - now) / 86400000));
    var num = cd.querySelector("[data-days]");
    if (num) { num.setAttribute("data-count", days); }
    var bar = cd.querySelector(".frist-bar i");
    if (bar) {
      var target = bar.style.width || "5.5%";
      bar.style.width = "0";
      setTimeout(function () { bar.style.width = target; }, 300);
    }
  }

  /* Multi-step forms */
  document.querySelectorAll("form[data-steps]").forEach(function (form) {
    var steps = Array.prototype.slice.call(form.querySelectorAll(".fstep"));
    var bars = form.querySelectorAll(".progress span");
    var lbl = form.querySelector("[data-step-label]");
    var err = form.querySelector(".ferr");
    var done = form.parentElement.querySelector(".fdone");
    var idx = 0;

    function show(i) {
      idx = i;
      steps.forEach(function (s, k) { s.hidden = k !== i; s.classList.remove("enter"); if (k === i) { void s.offsetWidth; s.classList.add("enter"); } });
      bars.forEach(function (b, k) { b.classList.toggle("on", k <= i); });
      if (lbl) lbl.textContent = "Schritt " + (i + 1) + " von " + steps.length;
      if (err) err.classList.remove("on");
      var top = form.getBoundingClientRect().top + window.scrollY - 96;
      if (i > 0) window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
    }

    function valid(i) {
      var fields = steps[i].querySelectorAll("input, select, textarea");
      var ok = true, radioNames = {};
      fields.forEach(function (f) {
        if (f.type === "radio") {
          if (f.required) radioNames[f.name] = true;
          return;
        }
        if (!f.checkValidity()) { ok = false; }
      });
      Object.keys(radioNames).forEach(function (n) {
        if (!form.querySelector('input[name="' + n + '"]:checked')) ok = false;
      });
      if (!ok && err) {
        err.textContent = "Bitte füllen Sie die markierten Felder aus.";
        err.classList.add("on");
        var first = steps[i].querySelector(":invalid");
        if (first && first.type !== "radio") first.focus();
      }
      return ok;
    }

    form.addEventListener("click", function (e) {
      var t = e.target.closest("[data-next], [data-prev]");
      if (!t) return;
      e.preventDefault();
      if (t.hasAttribute("data-next")) { if (valid(idx)) show(idx + 1); }
      else show(idx - 1);
    });

    /* File drop */
    var drop = form.querySelector(".drop");
    if (drop) {
      var input = drop.querySelector("input[type=file]");
      var list = form.querySelector(".files");
      function render() {
        if (!list) return;
        list.innerHTML = "";
        Array.prototype.forEach.call(input.files, function (f) {
          var li = document.createElement("li");
          var kb = f.size > 1048576 ? (f.size / 1048576).toFixed(1) + " MB" : Math.round(f.size / 1024) + " KB";
          li.innerHTML = "<span></span><small></small>";
          li.firstChild.textContent = f.name;
          li.lastChild.textContent = kb;
          list.appendChild(li);
        });
      }
      input.addEventListener("change", render);
      ["dragenter", "dragover"].forEach(function (ev) {
        drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); });
      });
      ["dragleave", "drop"].forEach(function (ev) {
        drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); });
      });
      drop.addEventListener("drop", function (e) {
        if (e.dataTransfer && e.dataTransfer.files.length) { input.files = e.dataTransfer.files; render(); }
      });
    }

    /* Submit */
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!valid(idx)) return;
      var btn = form.querySelector("[type=submit]");
      var label = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Wird gesendet …"; }

      var preview = /claude\.ai|localhost|127\.0\.0\.1/.test(location.hostname) || location.protocol === "file:";
      var finish = function () {
        form.hidden = true;
        if (done) { done.hidden = false; done.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); }
      };
      var fail = function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        if (err) {
          err.textContent = "Das Senden hat nicht geklappt. Bitte versuchen Sie es noch einmal oder schreiben Sie an max@rev2.at.";
          err.classList.add("on");
        }
      };
      if (preview) { setTimeout(finish, 700); return; }

      var data = new FormData(form);
      fetch(form.getAttribute("action") || "/api/kontakt", { method: "POST", body: data, headers: { "accept": "application/json" } })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (j) { if (j && j.ok) finish(); else fail(); })
        .catch(fail);
    });

    show(0);
  });


  /* Umbenennungs-Demo: auf Desktop scrollgesteuert (Sektion bleibt stehen), sonst getippt beim Sichtbarwerden */
  var rn = document.querySelector(".rename");
  if (rn) {
    var rows = Array.prototype.slice.call(rn.querySelectorAll(".new"));
    var texts = rows.map(function (el) { return el.getAttribute("data-new"); });
    var total = texts.reduce(function (a, t) { return a + t.length + 6; }, 0); /* +6: kurze Pause je Zeile */
    var section = document.getElementById("system");
    var desktop = window.matchMedia("(min-width: 980px)").matches && !reduce && section && section.classList.contains("pin");

    function render(progress) {
      var budget = Math.round(progress * total);
      rows.forEach(function (el, i) {
        var t = texts[i], len = Math.max(0, Math.min(t.length, budget));
        el.textContent = t.slice(0, len);
        el.classList.toggle("typing", len > 0 && len < t.length);
        el.classList.toggle("done", len >= t.length);
        budget -= t.length + 6;
      });
    }

    if (desktop && section) {
      var busy = false;
      var wrap = section.querySelector(".wrap");
      var onScroll2 = function () {
        var rect = section.getBoundingClientRect();
        var span = section.offsetHeight - window.innerHeight;
        var raw = span > 0 ? -rect.top / span : 1;
        raw = Math.max(0, Math.min(1, raw));
        /* Inhalt driftet während der Halterung langsam weiter, damit der Stopp nicht hart wirkt */
        if (wrap) wrap.style.transform = "translate3d(0," + Math.round((0.5 - raw) * 160) + "px,0)";
        var p = Math.max(0, Math.min(1, (raw - 0.08) / 0.7));
        render(p);
        busy = false;
      };
      window.addEventListener("scroll", function () { if (!busy) { busy = true; requestAnimationFrame(onScroll2); } }, { passive: true });
      onScroll2();
    } else {
      var started = false;
      function typeRow(i) {
        if (i >= rows.length) return;
        var el = rows[i], text = texts[i], k = 0;
        if (reduce) { el.textContent = text; el.classList.add("done"); typeRow(i + 1); return; }
        el.classList.add("typing");
        var t = setInterval(function () {
          k++; el.textContent = text.slice(0, k);
          if (k >= text.length) { clearInterval(t); el.classList.remove("typing"); el.classList.add("done"); setTimeout(function () { typeRow(i + 1); }, 260); }
        }, 28);
      }
      function startTyping() { if (started) return; started = true; setTimeout(function () { typeRow(0); }, 300); }
      if ("IntersectionObserver" in window) {
        var rio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { startTyping(); rio.disconnect(); } }); }, { threshold: 0.5 });
        rio.observe(rn);
      } else { startTyping(); }
    }
  }

  /* Parallax auf der Fassade, nur Desktop */
  var art = document.querySelector(".hero-art");
  if (art && !reduce && window.matchMedia("(min-width: 980px)").matches) {
    var ticking = false;
    var par = function () {
      var y = window.scrollY;
      if (y < 1400) art.style.transform = "translate3d(0," + Math.round(y * 0.18) + "px,0)";
      ticking = false;
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(par); } }, { passive: true });
  }

  /* Calendly: Script erst beim Klick laden, dann als Overlay öffnen; ohne Script öffnet der Link normal */
  var calLoading = null;
  function loadCalendly() {
    if (window.Calendly) return Promise.resolve();
    if (calLoading) return calLoading;
    calLoading = new Promise(function (res, rej) {
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://assets.calendly.com/assets/external/widget.css"; document.head.appendChild(l);
      var sc = document.createElement("script"); sc.src = "https://assets.calendly.com/assets/external/widget.js"; sc.async = true;
      sc.onload = res; sc.onerror = rej; document.head.appendChild(sc);
    });
    return calLoading;
  }
  document.querySelectorAll("[data-calendly]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var url = a.getAttribute("data-calendly");
      if (window.matchMedia("(max-width: 640px)").matches) return; /* am Handy direkt die Calendly-Seite */
      e.preventDefault();
      loadCalendly().then(function () {
        window.Calendly.initPopupWidget({ url: url + "?hide_gdpr_banner=1&primary_color=ffd23f&background_color=0a0c12&text_color=ffffff" });
      }).catch(function () { window.open(url, "_blank", "noopener"); });
    });
  });


  /* Videos: erst beim Klick laden. data-embed = YouTube- oder Vimeo-Link, data-src = eigene mp4 */
  function embedUrl(u) {
    var m;
    if ((m = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/))) return "https://www.youtube-nocookie.com/embed/" + m[1] + "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
    if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([\w]+))?/))) return "https://player.vimeo.com/video/" + m[1] + "?autoplay=1&dnt=1&title=0&byline=0&portrait=0" + (m[2] ? "&h=" + m[2] : "");
    return u;
  }
  document.querySelectorAll(".vid").forEach(function (v) {
    var src = v.getAttribute("data-src"), emb = v.getAttribute("data-embed");
    var play = v.querySelector(".play");
    if (!play) return;
    if (!src && !emb) { play.setAttribute("title", "Video folgt"); return; }
    play.addEventListener("click", function () {
      v.classList.add("playing");
      if (src) {
        var vid = document.createElement("video");
        vid.src = src; vid.controls = true; vid.autoplay = true; vid.playsInline = true;
        var poster = v.querySelector("img.poster"); if (poster) vid.poster = poster.src;
        v.appendChild(vid); vid.play().catch(function () {});
      } else {
        var f = document.createElement("iframe");
        f.src = embedUrl(emb); f.allow = "autoplay; fullscreen; picture-in-picture"; f.setAttribute("allowfullscreen", "");
        f.title = v.getAttribute("data-title") || "Video";
        v.appendChild(f);
      }
    });
  });

  /* Cases: „Mehr vom Case" ein- und ausklappen */
  document.querySelectorAll("[data-more]").forEach(function (btn) {
    var target = document.getElementById(btn.getAttribute("data-more"));
    if (!target) return;
    var open = btn.querySelector("[data-open]"), close = btn.querySelector("[data-close]");
    btn.addEventListener("click", function () {
      var show = target.hidden;
      target.hidden = !show;
      btn.setAttribute("aria-expanded", show ? "true" : "false");
      if (open) open.hidden = show; if (close) close.hidden = !show;
      if (show) {
        target.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); });
        setTimeout(function () { target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" }); }, 30);
      }
    });
  });

  /* Current year */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
