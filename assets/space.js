(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- starfield: slow forward drift, mouse parallax, rare shooting stars ---------- */
  const canvas = document.getElementById("space");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, stars = [], streaks = [];
    let mx = 0, my = 0, px = 0, py = 0;
    const tints = ["#ffffff", "#cfe6ff", "#9fd2ff", "#ffe2b8", "#ffd08a"];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      const count = Math.round((innerWidth * innerHeight) / 2600);
      stars = Array.from({ length: count }, () => star(true));
    }
    function star(anywhere) {
      return {
        x: (Math.random() - 0.5) * w * 2,
        y: (Math.random() - 0.5) * h * 2,
        z: anywhere ? Math.random() * w : w,
        c: tints[(Math.random() * tints.length) | 0],
        tw: Math.random() * Math.PI * 2,
      };
    }
    function shoot() {
      const fromLeft = Math.random() < 0.5;
      streaks.push({
        x: fromLeft ? -50 : w + 50,
        y: Math.random() * h * 0.6,
        vx: (fromLeft ? 1 : -1) * (9 + Math.random() * 6) * dpr,
        vy: (2 + Math.random() * 2) * dpr,
        life: 1,
      });
    }
    addEventListener("resize", resize);
    addEventListener("mousemove", (e) => {
      mx = (e.clientX / innerWidth - 0.5) * 2;
      my = (e.clientY / innerHeight - 0.5) * 2;
    });
    resize();

    let last = performance.now();
    function frame(now) {
      const dt = Math.min((now - last) / 16.7, 3);
      last = now;
      px += (mx - px) * 0.03;
      py += (my - py) * 0.03;
      const scroll = scrollY * 0.02;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2 - px * 40 * dpr, cy = h / 2 - py * 30 * dpr;
      const speed = still ? 0 : 0.55 * dpr * dt;
      for (const s of stars) {
        s.z -= speed * (1 + scroll * 0.05);
        if (s.z <= 1) Object.assign(s, star(false));
        const k = (w * 0.5) / s.z;
        const x = s.x * k + cx, y = s.y * k + cy;
        if (x < -20 || x > w + 20 || y < -20 || y > h + 20) { if (!still) Object.assign(s, star(false)); continue; }
        const depth = 1 - s.z / w;
        const r = Math.max(0.3, depth * 1.9) * dpr;
        s.tw += 0.03 * dt;
        ctx.globalAlpha = Math.min(1, depth * 1.3) * (0.75 + Math.sin(s.tw) * 0.25);
        ctx.fillStyle = s.c;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!still && Math.random() < 0.0025 * dt) shoot();
      for (const st of streaks) {
        st.x += st.vx * dt; st.y += st.vy * dt; st.life -= 0.012 * dt;
        const g = ctx.createLinearGradient(st.x, st.y, st.x - st.vx * 14, st.y - st.vy * 14);
        g.addColorStop(0, "rgba(255,230,190," + Math.max(st.life, 0) + ")");
        g.addColorStop(1, "rgba(255,230,190,0)");
        ctx.globalAlpha = 1;
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.4 * dpr;
        ctx.beginPath();
        ctx.moveTo(st.x, st.y);
        ctx.lineTo(st.x - st.vx * 14, st.y - st.vy * 14);
        ctx.stroke();
      }
      streaks = streaks.filter((s) => s.life > 0);
      ctx.globalAlpha = 1;
      if (!still) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- skill orbit ---------- */
  const orbit = document.querySelector(".orbit");
  if (orbit) {
    const rings = [
      { size: 0.62, t: 38, rev: false, items: [["C# / .NET", 1], ["Rust", 1], ["ASP.NET Core", 0]] },
      { size: 0.8, t: 60, rev: true, items: [["Kafka", 1], ["Kubernetes", 1], ["AWS", 0], ["Azure", 0], ["PostgreSQL", 0]] },
      { size: 0.98, t: 90, rev: false, items: [["React", 0], ["TypeScript", 0], ["Terraform", 0], ["Docker", 0], ["Grafana", 0], ["CI/CD", 0], ["DDD · CQRS", 1]] },
    ];
    for (const r of rings) {
      const ring = document.createElement("div");
      ring.className = "ring" + (r.rev ? " rev" : "");
      ring.style.width = ring.style.height = r.size * 100 + "%";
      ring.style.setProperty("--t", r.t + "s");
      const spin = document.createElement("div");
      spin.className = "spin";
      r.items.forEach(([name, hot], i) => {
        const n = document.createElement("div");
        n.className = "node" + (hot ? " hot" : "");
        n.style.setProperty("--a", (360 / r.items.length) * i + r.t + "deg");
        n.style.setProperty("--r", "calc(var(--size) * " + r.size / 2 + ")");
        const s = document.createElement("span");
        s.textContent = name;
        n.appendChild(s);
        spin.appendChild(n);
      });
      ring.appendChild(spin);
      orbit.insertBefore(ring, orbit.firstChild);
    }
  }

  /* ---------- rotating role line ---------- */
  const roleEl = document.querySelector(".roles .text");
  if (roleEl) {
    const roles = JSON.parse(roleEl.dataset.roles);
    let i = 0, j = 0, del = false;
    const tick = () => {
      const word = roles[i];
      roleEl.textContent = word.slice(0, j);
      if (still) { roleEl.textContent = roles.join(" · "); return; }
      if (!del && j < word.length) j++;
      else if (!del) { del = true; return setTimeout(tick, 1800); }
      else if (j > 0) j--;
      else { del = false; i = (i + 1) % roles.length; }
      setTimeout(tick, del ? 28 : 60);
    };
    tick();
  }

  /* ---------- reveal, skill bars, counters ---------- */
  const count = (el) => {
    const target = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split(".")[1] || "").length;
    const start = performance.now(), dur = 1600;
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    };
    still ? (el.textContent = el.dataset.count) : requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("in");
      e.target.querySelectorAll(".fill").forEach((f) => (f.style.width = f.dataset.v + "%"));
      e.target.querySelectorAll("[data-count]").forEach(count);
      io.unobserve(e.target);
    }
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();
