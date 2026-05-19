(() => {
  'use strict';

  const el = document.getElementById('solar');
  if (!el) return;
  const ctx = el.getContext('2d');

  /* ─── Palette ─── */
  const GREEN = [57, 255, 20];
  const TEAL  = [0, 190, 150];
  const WHITE = [210, 215, 225];
  const GREY  = [120, 125, 140];
  const AMBER = [255, 175, 50];
  const GOLD  = [255, 200, 50];
  const DIM   = [50, 55, 65];
  const FAINT = [25, 28, 35];

  const PLANET_COLORS = [
    [255, 210, 80],   // sun
    [169, 169, 173],  // mercury
    [240, 225, 180],  // venus
    [70, 130, 220],   // earth
    [190, 95, 60],    // mars
    [210, 175, 130],  // jupiter
    [225, 200, 145],  // saturn
    [150, 210, 220],  // uranus
    [55, 90, 180],    // neptune
  ];

  /* ─── State ─── */
  let W, H, sc;

  function resize() {
    const d = devicePixelRatio || 1;
    W = innerWidth; H = innerHeight;
    el.width = W * d; el.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    sc = Math.min(W * 0.60, H * 0.40);
  }

  /* ─── Helpers ─── */
  const rnd  = (a, b) => a + Math.random() * (b - a);
  const mix  = (a, b, t) => a + (b - a) * t;
  const cap  = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

  /* ─── 3D Math ─── */
  function rot(x, y, z, ry, rx) {
    const cy = Math.cos(ry), sy = Math.sin(ry);
    const cx = Math.cos(rx), sx = Math.sin(rx);
    const x1 = x * cy - z * sy;
    const z1 = x * sy + z * cy;
    return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
  }

  function unrot(x, y, z, ry, rx) {
    const cy = Math.cos(ry), sy = Math.sin(ry);
    const cx = Math.cos(rx), sx = Math.sin(rx);
    return [
      x * cy - y * sy * sx + z * sy * cx,
      y * cx + z * sx,
      -x * sy - y * cy * sx + z * cy * cx,
    ];
  }

  const FOV = 12.8;
  function proj(x, y, z) {
    const d = FOV / (FOV + z);
    return [x * d * sc + W * 0.5, y * d * sc + H * 0.5, z, d];
  }

  function screenToWorld(sx, sy, depth, ry, rx) {
    const d = FOV / (FOV + depth);
    const nx = (sx - W * 0.5) / (sc * d);
    const ny = (sy - H * 0.5) / (sc * d);
    return unrot(nx, ny, depth, ry, rx);
  }

  /* ─── Planet Data ─── */
  const PLANETS = [
    { name: 'sun',     orbit: 0.00, radius: 0.30, speed: 0,    tilt: 0,   colorIdx: 0, count: 500, rotSpeed: 0.2  },
    { name: 'mercury', orbit: 0.30, radius: 0.05, speed: 1.75,  tilt: 7.0, colorIdx: 1, count: 100, rotSpeed: 2.0  },
    { name: 'venus',   orbit: 0.65, radius: 0.09, speed: 0.9,  tilt: 3.4, colorIdx: 2, count: 200, rotSpeed: 1.2  },
    { name: 'earth',   orbit: 1.00, radius: 0.10, speed: 0.6,  tilt: 0.0, colorIdx: 3, count: 200, rotSpeed: 2.0  },
    { name: 'mars',    orbit: 1.25, radius: 0.07, speed: 0.45,  tilt: 1.9, colorIdx: 4, count: 200, rotSpeed: 2.5  },
    { name: 'jupiter', orbit: 1.50, radius: 0.22, speed: 0.25,  tilt: 1.3, colorIdx: 5, count: 500, rotSpeed: 2.0  },
    { name: 'saturn',  orbit: 1.75, radius: 0.18, speed: 0.15,  tilt: 2.5, colorIdx: 6, count: 400, rings: true, rotSpeed: 1.0  },
    { name: 'uranus',  orbit: 2.00, radius: 0.13, speed: 0.09, tilt: 0.8, colorIdx: 7, count: 300, rotSpeed: 1.5  },
    { name: 'neptune', orbit: 2.25, radius: 0.11, speed: 0.05, tilt: 1.8, colorIdx: 8, count: 200, rotSpeed: 2.8  },
  ];

  const MOONS = [
    { planetIdx: 3, name: 'moon',     orbit: 1.5,  radius: 0.035, speed: 8.0,  colorIdx: 9, count: 60  },
    { planetIdx: 4, name: 'phobos',   orbit: 1.8,  radius: 0.015, speed: 12.0, colorIdx: 4, count: 30  },
    { planetIdx: 4, name: 'deimos',   orbit: 2.5,  radius: 0.010, speed: 6.0,  colorIdx: 4, count: 30  },
    { planetIdx: 5, name: 'io',       orbit: 2.0,  radius: 0.025, speed: 9.0,  colorIdx: 10, count: 40 },
    { planetIdx: 5, name: 'europa',  orbit: 2.8,  radius: 0.022, speed: 5.5,  colorIdx: 11, count: 40 },
    { planetIdx: 5, name: 'ganymede', orbit: 3.8,  radius: 0.035, speed: 3.5,  colorIdx: 10, count: 50 },
    { planetIdx: 5, name: 'callisto', orbit: 5.0,  radius: 0.030, speed: 2.0,  colorIdx: 12, count: 45 },
    { planetIdx: 6, name: 'mimas',    orbit: 2.2,  radius: 0.015, speed: 11.0, colorIdx: 13, count: 30 },
    { planetIdx: 6, name: 'enceladus',orbit: 2.8, radius: 0.012, speed: 8.0,  colorIdx: 14, count: 30 },
    { planetIdx: 6, name: 'tethys',   orbit: 3.5,  radius: 0.020, speed: 6.0,  colorIdx: 13, count: 35 },
    { planetIdx: 6, name: 'dione',    orbit: 4.2,  radius: 0.018, speed: 4.5,  colorIdx: 13, count: 35 },
    { planetIdx: 6, name: 'rhea',     orbit: 5.0,  radius: 0.022, speed: 3.0,  colorIdx: 13, count: 40 },
    { planetIdx: 6, name: 'titan',    orbit: 7.0,  radius: 0.040, speed: 1.8,  colorIdx: 15, count: 60 },
    { planetIdx: 6, name: 'iapetus',  orbit: 9.5,  radius: 0.018, speed: 0.8,  colorIdx: 13, count: 35 },
    { planetIdx: 7, name: 'miranda',  orbit: 2.0,  radius: 0.012, speed: 7.0,  colorIdx: 16, count: 30 },
    { planetIdx: 7, name: 'ariel',    orbit: 3.0,  radius: 0.020, speed: 4.5,  colorIdx: 16, count: 35 },
    { planetIdx: 7, name: 'umbriel',  orbit: 4.0,  radius: 0.018, speed: 3.0,  colorIdx: 16, count: 35 },
    { planetIdx: 7, name: 'titania',  orbit: 5.0,  radius: 0.025, speed: 2.0,  colorIdx: 16, count: 40 },
    { planetIdx: 7, name: 'oberon',   orbit: 6.5,  radius: 0.022, speed: 1.2,  colorIdx: 16, count: 40 },
    { planetIdx: 8, name: 'triton',   orbit: 3.5,  radius: 0.035, speed: 4.5,  colorIdx: 17, count: 50 },
  ];

  const MOON_COLORS = [
    [200, 200, 210],
    [255, 200, 150],
    [180, 160, 140],
    [240, 220, 200],
    [160, 150, 140],
    [220, 200, 180],
    [180, 170, 160],
    [200, 195, 185],
    [230, 240, 255],
    [220, 180, 140],
  ];

  /* ─── Point Cloud Generation ─── */
  const allPoints = [];

  function spherePoints(radius, count) {
    const pts = [];
    const nLat = Math.max(4, Math.round(Math.sqrt(count) * 1.5));
    const nLon = Math.max(6, Math.round(Math.sqrt(count) * 3));
    let added = 0;
    for (let li = 1; li < nLat && added < count; li++) {
      const theta = (li / nLat) * Math.PI;
      const ringR = Math.sin(theta) * radius;
      const y = Math.cos(theta) * radius;
      const nR = Math.max(4, Math.round(nLon * ringR / radius));
      for (let ri = 0; ri < nR && added < count; ri++) {
        const phi = (ri / nR) * Math.PI * 2;
        pts.push({
          x: ringR * Math.cos(phi),
          y,
          z: ringR * Math.sin(phi),
          phase: rnd(0, 6.28), sf: rnd(0.3, 1.2),
        });
        added++;
      }
    }
    while (added < count) {
      const theta = rnd(0, Math.PI);
      const phi = rnd(0, Math.PI * 2);
      const r = radius * Math.cbrt(rnd(0, 1));
      pts.push({
        x: r * Math.sin(theta) * Math.cos(phi),
        y: r * Math.cos(theta),
        z: r * Math.sin(theta) * Math.sin(phi),
        phase: rnd(0, 6.28), sf: rnd(0.3, 1.2),
      });
      added++;
    }
    return pts;
  }

  function ringPoints(innerR, outerR, count) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const r = rnd(innerR, outerR);
      const theta = rnd(0, Math.PI * 2);
      pts.push({
        x: r * Math.cos(theta),
        y: rnd(-0.006, 0.006),
        z: r * Math.sin(theta),
        phase: rnd(0, 6.28), sf: rnd(0.5, 1.5),
      });
    }
    return pts;
  }

  function generateClouds() {
    for (const p of PLANETS) {
      const pts = spherePoints(p.radius, p.count);
      const rings = p.rings ? ringPoints(p.radius * 1.5, p.radius * 3.0, 280) : null;
      allPoints.push({ pts, rings });
    }
    for (const m of MOONS) {
      const pts = spherePoints(m.radius, m.count);
      allPoints.push({ pts });
    }
  }

  /* ─── Orbit Paths ─── */
  const ORBIT_SEGMENTS = 80;
  let orbitPaths = [];

  function generateOrbits() {
    orbitPaths = [];
    for (const p of PLANETS) {
      if (p.orbit === 0) continue;
      const pts = [];
      for (let i = 0; i <= ORBIT_SEGMENTS; i++) {
        const ang = (i / ORBIT_SEGMENTS) * Math.PI * 2;
        pts.push({ x: p.orbit * Math.cos(ang), y: 0, z: p.orbit * Math.sin(ang) });
      }
      orbitPaths.push(pts);
    }
  }

  /* ─── Stars ─── */
  const STAR_N = 200;
  let stars = [];
  function seedStars() {
    stars = [];
    for (let i = 0; i < STAR_N; i++) {
      stars.push({
        x: rnd(0, W), y: rnd(0, H),
        a: rnd(0.2, 0.7), sz: rnd(8, 14),
      });
    }
  }

  /* ─── Shooting Stars ─── */
  const SHOOTING_N = 3;
  let shootingStars = [];
  function seedShootingStars() {
    shootingStars = [];
    for (let i = 0; i < SHOOTING_N; i++) {
      shootingStars.push({
        x: rnd(0, W), y: rnd(0, H * 0.5),
        dx: rnd(1.5, 3), dy: rnd(1.5, 3),
        len: rnd(40, 80), a: rnd(0.4, 0.8),
        life: 0, maxLife: rnd(60, 150),
      });
    }
  }
  function resetShootingStar(s) {
    s.x = rnd(-20, W + 20);
    s.y = rnd(-20, H * 0.3);
    s.dx = rnd(1.5, 3);
    s.dy = rnd(1.5, 3);
    s.len = rnd(40, 80);
    s.a = rnd(0.4, 0.8);
    s.life = 0;
    s.maxLife = rnd(60, 150);
  }

  const FN = '"JetBrains Mono","SF Mono",ui-monospace,monospace';

  /* ─── Mouse State ─── */
  let curX = -9999, curY = -9999, active = true;
  let smX = -9999, smY = -9999;

  window.addEventListener('mousemove', e => { curX = e.clientX; curY = e.clientY; active = true; });
  window.addEventListener('mouseleave', () => { active = false; });
  window.addEventListener('touchstart', e => {
    const t = e.touches[0]; curX = t.clientX; curY = t.clientY; active = true;
  }, { passive: true });
  window.addEventListener('touchmove', e => {
    const t = e.touches[0]; curX = t.clientX; curY = t.clientY;
  }, { passive: true });
  window.addEventListener('touchend', () => { active = false; });

  /* ─── Attraction State ─── */
  let attractedIdx = -1;
  let attractFactor = 0;
  const ATTRACT_THRESH = 50;
  const RELEASE_THRESH = 20;

  /* ─── Orbital & Rotation Angles ─── */
  const orbitAngles = [0, 0, 1.0, 2.5, 4.0, 1.8, 3.2, 0.5, 5.0];
  const rotAngles = new Array(PLANETS.length).fill(0);
  const moonAngles = new Array(MOONS.length).fill(0).map((_, i) => rnd(0, Math.PI * 2));

  /* ─── Planet world position (inclined orbit) ─── */
  function planetWorldPos(orbit, angle, tiltDeg) {
    const incRad = tiltDeg * Math.PI / 180;
    return {
      x: orbit * Math.cos(angle),
      y: orbit * Math.sin(angle) * Math.sin(incRad),
      z: orbit * Math.sin(angle) * Math.cos(incRad),
    };
  }

  /* ─── Frame ─── */
  function frame(time) {
    ctx.clearRect(0, 0, W, H);

    /* smooth cursor */
    if (active) {
      smX += (curX - smX) * 0.12;
      smY += (curY - smY) * 0.12;
    } else {
      smX += (-9999 - smX) * 0.05;
      smY += (-9999 - smY) * 0.05;
    }

    /* update orbital angles & rotation angles */
    const dt = 0.008;
    for (let i = 1; i < PLANETS.length; i++) {
      orbitAngles[i] += dt * PLANETS[i].speed;
    }
    for (let i = 0; i < PLANETS.length; i++) {
      rotAngles[i] += dt * PLANETS[i].rotSpeed * 1.5;
    }
    for (let i = 0; i < MOONS.length; i++) {
      moonAngles[i] += dt * MOONS[i].speed * 0.15;
    }

    /* camera rotation */
    const ry = time * 0.00006;
    const rx = 0.45;

    /* compute planet world positions */
    const worldPositions = [];
    for (let i = 0; i < PLANETS.length; i++) {
      if (i === 0) {
        worldPositions.push({ x: 0, y: 0, z: 0 });
      } else {
        worldPositions.push(planetWorldPos(PLANETS[i].orbit, orbitAngles[i], PLANETS[i].tilt));
      }
    }

    /* compute moon world positions */
    const moonWorldPositions = [];
    for (let mi = 0; mi < MOONS.length; mi++) {
      const m = MOONS[mi];
      const parent = worldPositions[m.planetIdx];
      const pTilt = PLANETS[m.planetIdx].tilt * Math.PI / 180;
      const moonOrbitDist = m.orbit * m.radius * 4;
      moonWorldPositions.push({
        x: parent.x + moonOrbitDist * Math.cos(moonAngles[mi]),
        y: parent.y + moonOrbitDist * Math.sin(moonAngles[mi]) * Math.sin(pTilt),
        z: parent.z + moonOrbitDist * Math.sin(moonAngles[mi]) * Math.cos(pTilt),
      });
    }

    /* ── project planet centers for attraction check ── */
    const projectedCenters = [];
    for (let i = 0; i < PLANETS.length; i++) {
      const w = worldPositions[i];
      const [sx, sy, sz] = proj(...rot(w.x, w.y, w.z, ry, rx));
      projectedCenters.push({ sx, sy, sz });
    }

    /* ── attraction logic ── */
    let closestIdx = -1;
    let closestDist = Infinity;
    for (let i = 1; i < projectedCenters.length; i++) {
      const dx = projectedCenters[i].sx - smX;
      const dy = projectedCenters[i].sy - smY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) { closestDist = dist; closestIdx = i; }
    }

    if (attractedIdx === -1) {
      if (closestIdx !== -1 && closestDist < ATTRACT_THRESH && active) {
        attractedIdx = closestIdx;
      }
    } else {
      if (closestDist > RELEASE_THRESH || !active) {
        attractFactor = Math.max(0, attractFactor - 0.015);
        if (attractFactor < 0.005) { attractFactor = 0; attractedIdx = -1; }
      } else {
        attractFactor = Math.min(1, attractFactor + 0.015);
      }
    }

    /* compute mouse 3D position for attracted planet */
    let mouseWorld = null;
    if (attractedIdx !== -1) {
      const mw = screenToWorld(smX, smY, projectedCenters[attractedIdx].sz, ry, rx);
      mouseWorld = { x: mw[0], y: mw[1], z: mw[2] };
    }

    /* ── stars ── */
    for (const s of stars) {
      ctx.font = `${s.sz}px ${FN}`;
      ctx.fillStyle = rgba(WHITE, s.a);
      ctx.fillText('.', s.x, s.y);
    }

    /* ── shooting stars ── */
    for (const s of shootingStars) {
      if (s.life < s.maxLife) {
        const alpha = s.life < 10 ? s.life / 10 : (s.life > s.maxLife - 20 ? (s.maxLife - s.life) / 20 : 1) * s.a;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.dx * s.len / Math.sqrt(s.dx * s.dx + s.dy * s.dy) * 0.3, s.y - s.dy * s.len / Math.sqrt(s.dx * s.dx + s.dy * s.dy) * 0.3);
        ctx.strokeStyle = rgba(WHITE, alpha);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.font = `${12}px ${FN}`;
        ctx.fillStyle = rgba(WHITE, alpha);
        ctx.fillText('*', s.x, s.y);
        s.x += s.dx;
        s.y += s.dy;
        s.life++;
      } else {
        resetShootingStar(s);
      }
    }

    /* ── orbit paths ── */
    ctx.save();
    ctx.setLineDash([2, 8]);
    ctx.lineWidth = 0.4;
    for (const path of orbitPaths) {
      ctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const [sx, sy] = proj(...rot(path[i].x, 0, path[i].z, ry, rx));
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = rgba(DIM, 0.1);
      ctx.stroke();
    }
    ctx.restore();

    /* ── collect all visible particles ── */
    const vis = [];
    const cursorR = Math.min(W, H) * 0.12;

    for (let pi = 0; pi < PLANETS.length; pi++) {
      const p = PLANETS[pi];
      const cloud = allPoints[pi];
      let cx, cy, cz;

      if (pi === 0) {
        cx = 0; cy = 0; cz = 0;
      } else if (pi === attractedIdx && mouseWorld) {
        const local = planetWorldPos(p.orbit, orbitAngles[pi], p.tilt);
        cx = mix(0, mouseWorld.x, attractFactor) + local.x;
        cy = mix(0, mouseWorld.y, attractFactor) + local.y;
        cz = mix(0, mouseWorld.z, attractFactor) + local.z;
      } else {
        cx = worldPositions[pi].x;
        cy = worldPositions[pi].y;
        cz = worldPositions[pi].z;
      }

      const color = PLANET_COLORS[p.colorIdx];
      const isSun = pi === 0;

      const ca = Math.cos(rotAngles[pi]), sa = Math.sin(rotAngles[pi]);
      for (const pt of cloud.pts) {
        const lx = pt.x * ca - pt.z * sa;
        const lz = pt.x * sa + pt.z * ca;
        const [rx2, ry2, rz] = rot(cx + lx, cy + pt.y, cz + lz, ry, rx);
        const [sx, sy, , d] = proj(rx2, ry2, rz);

        const dn = cap((rz + 3.5) / 7.0, 0, 1);
        const da = 1 - dn * 0.85;
        const shim = 0.85 + Math.sin(time * 0.001 * pt.sf + pt.phase) * 0.15;
        let alpha = (isSun ? 0.9 : 0.5) * da * shim;
        if (alpha < 0.01) continue;

        const ddx = sx - smX, ddy = sy - smY;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        let drawX = sx, drawY = sy;
        let drawAlpha = alpha;
        let drawColor = color;

        if (dist < cursorR) {
          const strength = 1 - dist / cursorR;
          const s2 = strength * strength;
          const push = s2 * cursorR * 0.35;
          const ang = Math.atan2(ddy, ddx);
          drawX += Math.cos(ang) * push;
          drawY += Math.sin(ang) * push;
          drawAlpha = cap(drawAlpha + s2 * 0.5, 0, 0.95);
          if (s2 > 0.15) drawColor = GREEN;
        }

        vis.push({ sx: drawX, sy: drawY, rz, alpha: drawAlpha, color: drawColor, d });
      }

      /* Saturn rings */
      if (cloud.rings) {
        const rca = Math.cos(rotAngles[pi]), rsa = Math.sin(rotAngles[pi]);
        for (const pt of cloud.rings) {
          const lx = pt.x * rca - pt.z * rsa;
          const lz = pt.x * rsa + pt.z * rca;
          const [rx2, ry2, rz] = rot(cx + lx, cy + pt.y, cz + lz, ry, rx);
          const [sx, sy, , d] = proj(rx2, ry2, rz);

          const dn = cap((rz + 3.5) / 7.0, 0, 1);
          const da = 1 - dn * 0.85;
          const shim = 0.85 + Math.sin(time * 0.001 * pt.sf + pt.phase) * 0.15;
          let alpha = 0.35 * da * shim;
          if (alpha < 0.01) continue;

          const ringColor = [190, 175, 140];
          const ddx = sx - smX, ddy = sy - smY;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          let drawX = sx, drawY = sy;
          let drawAlpha = alpha;

          if (dist < cursorR) {
            const strength = 1 - dist / cursorR;
            const push = strength * strength * cursorR * 0.35;
            const ang = Math.atan2(ddy, ddx);
            drawX += Math.cos(ang) * push;
            drawY += Math.sin(ang) * push;
            drawAlpha = cap(drawAlpha + strength * strength * 0.3, 0, 0.8);
          }

          vis.push({ sx: drawX, sy: drawY, rz, alpha: drawAlpha, color: ringColor, d });
        }
      }
    }

    /* ── render moons ── */
    for (let mi = 0; mi < MOONS.length; mi++) {
      const m = MOONS[mi];
      const mCloud = allPoints[PLANETS.length + mi];
      const mp = moonWorldPositions[mi];
      const color = MOON_COLORS[m.colorIdx - 9] || [200, 200, 200];

      const mca = Math.cos(moonAngles[mi] * 2), msa = Math.sin(moonAngles[mi] * 2);
      for (const pt of mCloud.pts) {
        const lx = pt.x * mca - pt.z * msa;
        const lz = pt.x * msa + pt.z * mca;
        const [rx2, ry2, rz] = rot(mp.x + lx, mp.y + pt.y, mp.z + lz, ry, rx);
        const [sx, sy, , d] = proj(rx2, ry2, rz);

        const dn = cap((rz + 3.5) / 7.0, 0, 1);
        const da = 1 - dn * 0.85;
        const shim = 0.85 + Math.sin(time * 0.001 * pt.sf + pt.phase) * 0.15;
        let alpha = 0.5 * da * shim;
        if (alpha < 0.01) continue;

        const ddx = sx - smX, ddy = sy - smY;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        let drawX = sx, drawY = sy;
        let drawAlpha = alpha;
        let drawColor = color;

        if (dist < cursorR) {
          const strength = 1 - dist / cursorR;
          const s2 = strength * strength;
          const push = s2 * cursorR * 0.35;
          const ang = Math.atan2(ddy, ddx);
          drawX += Math.cos(ang) * push;
          drawY += Math.sin(ang) * push;
          drawAlpha = cap(drawAlpha + s2 * 0.5, 0, 0.95);
          if (s2 > 0.15) drawColor = GREEN;
        }

        vis.push({ sx: drawX, sy: drawY, rz, alpha: drawAlpha, color: drawColor, d });
      }
    }

    /* depth sort back→front */
    vis.sort((a, b) => b.rz - a.rz);

    /* draw all particles */
    const isMobile = W < 768;
    for (const v of vis) {
      const sz = Math.max(isMobile ? 11 : 9, Math.round((isMobile ? 18 : 14) * v.d));
      ctx.font = `${sz}px ${FN}`;
      ctx.fillStyle = rgba(v.color, cap(v.alpha, 0, 0.95));
      ctx.fillText('.', v.sx, v.sy);
    }

    /* ── sun glow ── */
    {
      const [sx, sy] = proj(...rot(0, 0, 0, ry, rx));
      ctx.shadowBlur = 40;
      ctx.shadowColor = rgba(GOLD, 0.35);
      ctx.font = `bold 22px ${FN}`;
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillText('', sx, sy - 12);
      ctx.shadowBlur = 25;
      ctx.shadowColor = rgba(AMBER, 0.25);
      ctx.fillText('', sx + 14, sy + 10);
      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(frame);
  }

  /* ─── Init ─── */
  resize();
  generateClouds();
  generateOrbits();
  seedStars();
  seedShootingStars();
  window.addEventListener('resize', () => { resize(); seedStars(); seedShootingStars(); });
  requestAnimationFrame(frame);
})();
