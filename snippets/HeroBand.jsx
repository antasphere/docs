{/*
  The hero band of a tool's landing page: the products' page band (Slideless
  and the hub, apps/dashboard/src/lib/components/brand/HeroStage.svelte) on
  the docs. A seeded field with the film grain as the ground, one of the
  brand's drawings as a true 3D body on it (solids.ts, the `latitudes` and
  `meridians` bodies ported verbatim), the words at the foot. The body turns
  about its centre toward the pointer and never leaves it; the ground slides
  the other way, as its surface would; a slow float of a few px is all the
  life it has of its own. Nothing moves under prefers-reduced-motion: the
  settled frame is painted once and that is the whole page for that reader.

  The sync places it on each tool's index page from the `hero:` block of
  sync/tools.yml, and its COMPACT form (eyebrow + title, no lede, a lower
  band, the product's section hero) on every other page except the ones
  written for agents (tools.yml `plain:`), which stay bare on purpose;
  nothing in the tools' own docs/ names it. Four bodies: latitudes,
  meridians, harmonic, lattice — all ports of the products' solids.ts. The styles live
  in style.css under .ant-hero, so the band and the rest of the skin are one
  file to read.

  Mintlify's snippet runtime provides the React hooks as globals; this file
  imports nothing.
*/}

export const HeroBand = ({
  eyebrow,
  title,
  lede,
  drawing = 'latitudes',
  seed = 976086463,
  level = 0.55,
  compact = false,
  // the field is ONE weather for the whole site, whatever body a page wears:
  // the seed of the deployment-profiles page, the one Romain chose (2026-09-22)
  fieldSeed = 1872629950
}) => {
  const box = useRef(null);
  const groundRef = useRef(null);
  const bodyRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const boxEl = box.current;
    const groundEl = groundRef.current;
    const bodyEl = bodyRef.current;
    const canvas = canvasRef.current;
    if (!boxEl || !groundEl || !bodyEl || !canvas) return;

    const TAU = Math.PI * 2;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const isDark = () => document.documentElement.classList.contains('dark');

    /* ── the field engine, the parts the ground needs ─────────────────── */
    const PALETTES = {
      // the umber paper, the gates' ground: from nearly bare paper to a felt
      // pool of the beige accent's own brown
      'umber-field': {
        light: true,
        base: '#ECE4D6',
        hues: ['#FAF6EE', '#F6F0E4', '#ECE4D6', '#D9C6AC', '#C9B193', '#F8F3EA', '#B89E80']
      },
      // at night, Clave's charcoal ramp (the docs' dark set), not the
      // products' near-black: ash, never a hole cut in the page
      'umber-field-dark': {
        light: false,
        base: '#2F2B27',
        hues: ['#2B2722', '#34302C', '#3E3A35', '#4C4743', '#5A5651', '#302C28', '#6A6560']
      }
    };
    const LOW_W = 116;

    function mulberry32(s) {
      let a = s >>> 0;
      return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function buildBlobs(s, palName) {
      const pal = PALETTES[palName];
      const rnd = mulberry32(s);
      const count = 7 + Math.floor(rnd() * 4);
      const blobs = [];
      for (let i = 0; i < count; i++) {
        blobs.push({
          color: pal.hues[Math.floor(rnd() * pal.hues.length)],
          x: rnd(),
          y: rnd(),
          r: 0.22 + rnd() * 0.4,
          alpha: 0.75 + rnd() * 0.25,
          px: 0.5 + rnd() * 1.5,
          py: 0.5 + rnd() * 1.5,
          ax: 0.02 + rnd() * 0.05,
          ay: 0.02 + rnd() * 0.05,
          ph: rnd() * TAU
        });
      }
      return blobs;
    }
    function renderLow(blobs, palName, W, H) {
      const pal = PALETTES[palName];
      const lw = LOW_W;
      const lh = Math.max(8, Math.round((LOW_W * H) / W));
      const low = document.createElement('canvas');
      low.width = lw;
      low.height = lh;
      const c = low.getContext('2d');
      c.fillStyle = pal.base;
      c.fillRect(0, 0, lw, lh);
      blobs.forEach((b) => {
        const x = (b.x + Math.sin(b.ph) * b.ax) * lw;
        const y = (b.y + Math.cos(b.ph) * b.ay) * lh;
        const r = b.r * lw;
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, b.color);
        g.addColorStop(1, b.color.slice(0, 7) + '00');
        c.fillStyle = g;
        c.globalAlpha = b.alpha;
        c.beginPath();
        c.arc(x, y, r, 0, TAU);
        c.fill();
        c.globalAlpha = 1;
      });
      return low;
    }
    function noiseTile(size, amp) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(size, size);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = 128 + (Math.random() - 0.5) * 255 * amp;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      return c;
    }

    /* The ground is painted ONCE as a sheet wider and taller than the box
       (the overscan is what a turn can slide it by, and then some), and every
       frame draws that sheet shifted, so the field moves as one surface and
       no edge of it ever reaches the frame. The grain is not on the sheet:
       it is a still layer over the box (.ant-hero-grain), as the products
       lay it, so the film does not travel with the weather. */
    const OVER = 0.24;
    let sheet = null;
    let sheetKey = '';
    function makeSheet(W, H) {
      const key = isDark() ? 'umber-field-dark' : 'umber-field';
      const sw = Math.round(W * (1 + OVER * 2));
      const sh = Math.round(H * (1 + OVER * 2));
      const c = document.createElement('canvas');
      c.width = sw;
      c.height = sh;
      const ctx = c.getContext('2d');
      const low = renderLow(buildBlobs(fieldSeed, key), key, sw, sh);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.filter = 'blur(' + Math.max(4, Math.round(sw * 0.018)) + 'px)';
      ctx.drawImage(low, -sw * 0.06, -sh * 0.06, sw * 1.12, sh * 1.12);
      ctx.filter = 'none';
      sheet = c;
      sheetKey = key + ':' + sw + 'x' + sh;
    }
    let slide = { x: 0, y: 0 };
    function paintGround() {
      const W = Math.round(groundEl.offsetWidth * DPR);
      const H = Math.round(groundEl.offsetHeight * DPR);
      if (W < 2 || H < 2) return;
      if (groundEl.width !== W || groundEl.height !== H) {
        groundEl.width = W;
        groundEl.height = H;
      }
      const key = isDark() ? 'umber-field-dark' : 'umber-field';
      const sw = Math.round(W * (1 + OVER * 2));
      const sh = Math.round(H * (1 + OVER * 2));
      if (!sheet || sheetKey !== key + ':' + sw + 'x' + sh) makeSheet(W, H);
      const ctx = groundEl.getContext('2d');
      // the slide is clamped to the overscan, so the sheet always covers the box
      const dx = Math.max(-W * OVER, Math.min(W * OVER, slide.x * DPR));
      const dy = Math.max(-H * OVER, Math.min(H * OVER, slide.y * DPR));
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(sheet, -W * OVER + dx, -H * OVER + dy);
    }

    /* ── the solids: a body built once in 3D, turned per frame ─────────── */
    function turn(p, pitch, yaw) {
      const ct = Math.cos(pitch);
      const st = Math.sin(pitch);
      const cp = Math.cos(yaw);
      const sp = Math.sin(yaw);
      const y2 = p.y * ct - p.z * st;
      const z2 = p.y * st + p.z * ct;
      return { x: p.x * cp + z2 * sp, y: y2, z: -p.x * sp + z2 * cp };
    }
    function ringAround(axis, h, samples) {
      const r = Math.sqrt(Math.max(0, 1 - h * h));
      const ref = Math.abs(axis.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
      let ux = axis.y * ref.z - axis.z * ref.y;
      let uy = axis.z * ref.x - axis.x * ref.z;
      let uz = axis.x * ref.y - axis.y * ref.x;
      const ul = Math.hypot(ux, uy, uz);
      ux /= ul;
      uy /= ul;
      uz /= ul;
      const vx = axis.y * uz - axis.z * uy;
      const vy = axis.z * ux - axis.x * uz;
      const vz = axis.x * uy - axis.y * ux;
      const out = [];
      for (let k = 0; k <= samples; k++) {
        const th = (k / samples) * TAU;
        const c = Math.cos(th) * r;
        const s = Math.sin(th) * r;
        out.push({
          x: axis.x * h + c * ux + s * vx,
          y: axis.y * h + c * uy + s * vy,
          z: axis.z * h + c * uz + s * vz
        });
      }
      return out;
    }
    // a line on a solid is walked once and broken where it changes side:
    // the near run drawn firm, the far run a ghost
    function strokeRuns(f, v, pts, near, far) {
      const { ctx } = f;
      let open = false;
      let side = false;
      const close = () => {
        if (!open) return;
        const a = side ? near : far;
        if (a > 0) {
          ctx.strokeStyle = f.ink(a);
          ctx.stroke();
        }
        open = false;
      };
      for (const p of pts) {
        const sx = v.cx + p.x * v.R;
        const sy = v.cy - p.y * v.R;
        const front = p.z >= 0;
        if (open && front !== side) {
          ctx.lineTo(sx, sy);
          close();
        }
        if (!open) {
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          open = true;
          side = front;
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      close();
    }
    function outline(f, v, a, w = 0.8) {
      f.ctx.lineWidth = Math.max(1, f.dpr * w);
      f.ctx.strokeStyle = f.ink(a);
      f.ctx.beginPath();
      f.ctx.arc(v.cx, v.cy, v.R, 0, TAU);
      f.ctx.stroke();
    }
    function view(f, scale = 0.42) {
      return { cx: f.W / 2, cy: f.H / 2, R: Math.min(f.W, f.H) * scale };
    }
    const up = { x: 0, y: 1, z: 0 };
    function latitudes(s) {
      const squash = 0.26 + mulberry32(s)() * 0.12;
      const lean = Math.asin(squash);
      const N = 13;
      const rows = Array.from({ length: N - 1 }, (_, i) => ((i + 1) / N) * 2 - 1);
      const rings = rows.map((h) => ringAround(up, h, 72));
      return (f) => {
        const v = view(f);
        outline(f, v, 0.4);
        f.ctx.lineWidth = Math.max(1, f.dpr * 0.8);
        const pitch = lean + f.pitch;
        rings.forEach((ring, i) => {
          const h = Math.abs(rows[i]);
          strokeRuns(f, v, ring.map((p) => turn(p, pitch, f.yaw)), 0.2 + h * 0.12, 0.05 + h * 0.03);
        });
        let pole = turn(up, pitch, f.yaw);
        if (pole.z < 0) pole = { x: -pole.x, y: -pole.y, z: -pole.z };
        f.ctx.fillStyle = f.ink(0.5);
        f.ctx.beginPath();
        f.ctx.arc(v.cx + pole.x * v.R, v.cy - pole.y * v.R, Math.max(1.5, f.dpr * 1.5), 0, TAU);
        f.ctx.fill();
      };
    }
    function meridians(s) {
      const rnd = mulberry32(s);
      const lean = 0.3 + rnd() * 0.14;
      const greats = [];
      for (let k = 0; k < 9; k++) {
        const th = (k / 9) * Math.PI;
        greats.push(ringAround({ x: Math.cos(th), y: 0, z: Math.sin(th) }, 0, 96));
      }
      const rows = [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75];
      const parallels = rows.map((h) => ringAround(up, h, 72));
      return (f) => {
        const v = view(f);
        outline(f, v, 0.4);
        f.ctx.lineWidth = Math.max(1, f.dpr * 0.8);
        const pitch = lean + f.pitch;
        const yaw = f.yaw + f.t * 0.05;
        greats.forEach((ring) => strokeRuns(f, v, ring.map((p) => turn(p, pitch, yaw)), 0.3, 0.07));
        parallels.forEach((ring) => strokeRuns(f, v, ring.map((p) => turn(p, pitch, yaw)), 0.17, 0.045));
      };
    }
    const GOLDEN = Math.PI * (3 - Math.sqrt(5));
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    function spinY(p, a) {
      const c = Math.cos(a);
      const s = Math.sin(a);
      return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
    }
    function plm(l, m, x) {
      let pmm = 1;
      if (m > 0) {
        const s = Math.sqrt((1 - x) * (1 + x));
        let fact = 1;
        for (let i = 1; i <= m; i++) {
          pmm *= -fact * s;
          fact += 2;
        }
      }
      if (l === m) return pmm;
      let pmmp1 = x * (2 * m + 1) * pmm;
      if (l === m + 1) return pmmp1;
      let pll = 0;
      for (let ll = m + 2; ll <= l; ll++) {
        pll = (x * (2 * ll - 1) * pmmp1 - (ll + m - 1) * pmm) / (ll - m);
        pmm = pmmp1;
        pmmp1 = pll;
      }
      return pll;
    }
    // the nodal set of a spherical harmonic: l-m circles between the poles
    // and m great circles through them
    function harmonic(s) {
      const rnd = mulberry32(s);
      const pairs = [[2, 1], [3, 2], [4, 2], [5, 3], [3, 1], [4, 3], [6, 4]];
      const [l, m] = pairs[Math.floor(rnd() * pairs.length)];
      const lean = 0.28 + rnd() * 0.5;
      const spin0 = rnd() * TAU;
      const circles = [];
      let prev = plm(l, m, -0.999);
      for (let i = 1; i <= 2000; i++) {
        const x = -0.999 + (1.998 * i) / 2000;
        const cur = plm(l, m, x);
        if (prev * cur < 0) circles.push(ringAround(up, x - 0.0005, 72));
        prev = cur;
      }
      const greats = Array.from({ length: m }, (_, k) => {
        const phi = (Math.PI / 2 + k * Math.PI) / m;
        return ringAround({ x: -Math.sin(phi), y: 0, z: Math.cos(phi) }, 0, 96);
      });
      return (f) => {
        const v = view(f, 0.44);
        outline(f, v, 0.35, 1);
        const spin = spin0 + f.t * 0.05;
        const pitch = lean + f.pitch;
        const place = (p) => turn(spinY(p, spin), pitch, f.yaw);
        f.ctx.lineWidth = Math.max(1, f.dpr * 0.85);
        for (const c of circles) strokeRuns(f, v, c.map(place), 0.46, 0.1);
        for (const g of greats) strokeRuns(f, v, g.map(place), 0.46, 0.1);
      };
    }
    // golden-angle points on the sphere, each joined to its three nearest
    function lattice(s) {
      const rnd = mulberry32(s);
      const tilt = 0.25 + rnd() * 0.5;
      const spin0 = rnd() * TAU;
      let built = null;
      const build = (n) => {
        const pts = [];
        for (let k = 0; k < n; k++) {
          const z = 1 - (2 * k + 1) / n;
          const r = Math.sqrt(Math.max(0, 1 - z * z));
          pts.push({ x: r * Math.cos(k * GOLDEN), y: r * Math.sin(k * GOLDEN), z });
        }
        const edges = [];
        const seen = new Set();
        for (let k = 0; k < n; k++) {
          const near = pts
            .map((b, j) => ({ j, d: (pts[k].x - b.x) ** 2 + (pts[k].y - b.y) ** 2 + (pts[k].z - b.z) ** 2 }))
            .filter((o) => o.j !== k)
            .sort((p, q) => p.d - q.d)
            .slice(0, 3);
          for (const e of near) {
            const key = Math.min(k, e.j) + ':' + Math.max(k, e.j);
            if (seen.has(key)) continue;
            seen.add(key);
            edges.push([k, e.j]);
          }
        }
        return { n, pts, edges };
      };
      return (f) => {
        const v = view(f);
        const n = Math.min(f.W, f.H) < 560 ? 140 : 260;
        if (!built || built.n !== n) built = build(n);
        const proj = built.pts.map((p) => turn(p, tilt + f.pitch, spin0 + f.t * 0.04 + f.yaw));
        const { ctx } = f;
        ctx.lineWidth = Math.max(1, f.dpr * 0.6);
        for (const [i, j] of built.edges) {
          const a = proj[i];
          const b = proj[j];
          const depth = (a.z + b.z) / 2;
          if (depth < -0.12) continue;
          ctx.strokeStyle = f.ink(0.05 + 0.2 * clamp01((depth + 1) / 2));
          ctx.beginPath();
          ctx.moveTo(v.cx + a.x * v.R, v.cy - a.y * v.R);
          ctx.lineTo(v.cx + b.x * v.R, v.cy - b.y * v.R);
          ctx.stroke();
        }
        for (const p of proj) {
          const d = clamp01((p.z + 1) / 2);
          ctx.fillStyle = f.ink(0.14 + 0.6 * d * d);
          ctx.beginPath();
          ctx.arc(v.cx + p.x * v.R, v.cy - p.y * v.R, Math.max(0.8, f.dpr * (0.5 + 1.5 * d)), 0, TAU);
          ctx.fill();
        }
        outline(f, v, 0.14);
      };
    }
    const BUILDERS = { latitudes, meridians, harmonic, lattice };
    const solid = (BUILDERS[drawing] || latitudes)(seed);

    let held = { a: 0, b: 0, t: 0 };
    function paintBody() {
      const W = Math.round(canvas.offsetWidth * DPR);
      const H = Math.round(canvas.offsetHeight * DPR);
      if (W < 2 || H < 2) return;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      const rgb = isDark() ? '247,244,236' : '28,25,21';
      const ink = (a) => 'rgba(' + rgb + ',' + Math.min(0.96, a).toFixed(3) + ')';
      solid({ ctx, W, H, dpr: DPR, ink, pitch: held.b, yaw: held.a, t: held.t });
    }

    /* ── the motion: the pointer followed critically damped ────────────── */
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stop = () => {};
    if (!still) {
      const aim = { x: 0, y: 0 };
      const onMove = (e) => {
        if (e.pointerType === 'touch') return;
        const r = boxEl.getBoundingClientRect();
        const clamp = (v) => Math.max(-1, Math.min(1, v));
        aim.x = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2));
        aim.y = clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2));
      };
      const onLeave = () => {
        aim.x = 0;
        aim.y = 0;
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
      let seen = false;
      const io = new IntersectionObserver(([e]) => {
        seen = e.isIntersecting;
      });
      io.observe(boxEl);
      const at = { x: 0, y: 0, vx: 0, vy: 0 };
      const t0 = performance.now();
      let last = t0;
      let rafId = requestAnimationFrame(function tick(now) {
        rafId = requestAnimationFrame(tick);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!seen) return;
        at.vx += ((aim.x - at.x) * 18 - at.vx * 8.5) * dt;
        at.vy += ((aim.y - at.y) * 18 - at.vy * 8.5) * dt;
        at.x += at.vx * dt;
        at.y += at.vy * dt;
        const t = (now - t0) / 1000;
        // the band's mapping, a tone lower than the gate's: the yaw follows
        // the hand, the pitch saturates upward so the sphere never rolls
        // away from the eye and flattens its parallels to strokes
        const a = at.x * 0.4 + Math.sin(t * 0.21) * 0.07;
        const away = 0.2;
        const b = at.y < 0 ? -away * Math.tanh((-at.y * 0.3) / away) : at.y * 0.3;
        held = { a, b, t };
        const radius = bodyEl.offsetWidth * 0.42;
        // the ground slides the other way, by angle × radius, as one sheet
        slide = { x: -a * radius, y: -b * radius * 0.6 };
        paintGround();
        const sway = compact ? 0.5 : 0.8;
        const dx = (Math.sin(t * 0.43) * 6 + Math.sin(t * 0.19 + 1.3) * 4) * sway;
        const dy = (Math.cos(t * 0.37) * 8 + Math.sin(t * 0.23) * 4) * sway;
        const lift = 1 + Math.sin(t * 0.31 + 0.6) * 0.016;
        bodyEl.style.transform =
          'translate3d(' + dx.toFixed(2) + 'px, ' + dy.toFixed(2) + 'px, 0) scale(' + lift.toFixed(4) + ')';
        paintBody();
      });
      stop = () => {
        cancelAnimationFrame(rafId);
        io.disconnect();
        window.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('pointerleave', onLeave);
      };
    }

    const grainEl = boxEl.querySelector('.ant-hero-grain');
    if (grainEl && !grainEl.style.backgroundImage) {
      grainEl.style.backgroundImage = 'url(' + noiseTile(512, 0.9).toDataURL() + ')';
      grainEl.style.backgroundSize = 512 / DPR + 'px';
    }
    const repaint = () => {
      sheet = null;
      paintGround();
      paintBody();
    };
    const ro = new ResizeObserver(repaint);
    ro.observe(boxEl);
    // Mintlify flips `.dark` on <html>; the field and the ink follow
    const mo = new MutationObserver(repaint);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    repaint();

    return () => {
      stop();
      ro.disconnect();
      mo.disconnect();
    };
  }, [drawing, seed, compact, fieldSeed]);

  return (
    <div className={'ant-hero' + (compact ? ' compact' : '')} data-hero ref={box} style={{ '--level': level }}>
      <canvas className="ant-hero-ground" ref={groundRef} aria-hidden="true" />
      <div className="ant-hero-grain" aria-hidden="true" />
      <div className="ant-hero-shade" aria-hidden="true" />
      <div className="ant-hero-drawing" aria-hidden="true">
        <div className="ant-hero-body" ref={bodyRef}>
          <canvas ref={canvasRef} />
        </div>
      </div>
      <div className="ant-hero-words">
        {eyebrow ? <p className="ant-hero-eyebrow">{eyebrow}</p> : null}
        <h1 className="ant-hero-title">{title}</h1>
        {lede && !compact ? <p className="ant-hero-lede">{lede}</p> : null}
      </div>
    </div>
  );
};
