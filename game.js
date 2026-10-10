/* 타워 스택 — 원터치 하이퍼캐주얼 */
(function () {
  'use strict';
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const $ = (id) => document.getElementById(id);

  const BH = 26;              // 블록 높이
  const PERFECT = 8;          // 퍼펙트 판정 px
  let W, H, blocks, moving, dir, speed, camY, score, best, over, particles;

  best = parseInt(localStorage.getItem('st_best') || '0', 10);
  $('best').textContent = best;

  function resize() {
    W = cv.width = cv.offsetWidth * devicePixelRatio;
    H = cv.height = cv.offsetHeight * devicePixelRatio;
  }
  window.addEventListener('resize', resize);
  resize();

  function hue(i) { return (205 + i * 14) % 360; }

  function reset() {
    blocks = [{ x: W / 2 - 150 * devicePixelRatio / 2, w: 150 * devicePixelRatio, y: 0, hue: hue(0) }];
    moving = newBlock(1);
    dir = 1; speed = (2.2 + Math.random()) * devicePixelRatio;
    camY = 0; score = 0; over = false; particles = [];
    $('score').textContent = '0';
    $('overlay').classList.add('hidden');
  }

  function newBlock(i) {
    const prev = blocks[blocks.length - 1];
    return { x: dir > 0 ? -prev.w : W, w: prev.w, hue: hue(i), prevX: prev.x };
  }

  function drop() {
    if (over) return;
    const prev = blocks[blocks.length - 1];
    const cur = moving;
    const overlapL = Math.max(prev.x, cur.x);
    const overlapR = Math.min(prev.x + prev.w, cur.x + cur.w);
    const overlap = overlapR - overlapL;

    if (overlap <= 0) { // 빗나감
      return gameOver();
    }
    const perfect = Math.abs(cur.x - prev.x) <= PERFECT * devicePixelRatio;
    const w = perfect ? prev.w : overlap;
    const x = perfect ? prev.x : overlapL;
    if (!perfect && overlap < prev.w) {
      // 잘려나간 조각 파티클
      const cutX = cur.x < prev.x ? cur.x : overlapR;
      const cutW = cur.w - overlap;
      particles.push({ x: cutX, y: blocks.length * BH, w: cutW, vy: 0, hue: cur.hue, life: 1 });
    }
    blocks.push({ x, w, y: blocks.length * BH, hue: cur.hue });
    score = blocks.length - 1;
    $('score').textContent = score;
    if (perfect) $('score').textContent = score + ' ✨';
    if (score > 4) camY = (blocks.length - 5) * BH;
    speed = Math.min(7 * devicePixelRatio, speed * 1.045);
    dir = Math.random() < 0.5 ? -1 : 1;
    moving = newBlock(blocks.length);
  }

  function gameOver() {
    over = true;
    const isBest = score > best;
    if (isBest) { best = score; localStorage.setItem('st_best', best); }
    $('finalScore').textContent = score;
    $('best').textContent = best;
    $('newBest').classList.toggle('hidden', !isBest);
    setTimeout(() => $('overlay').classList.remove('hidden'), 500);
  }

  function draw(t) {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, W, H);
    const dpr = devicePixelRatio;

    // 별 배경
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 97) % W, sy = (i * 57) % H;
      ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 0.001 + i);
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;

    const baseY = H - 60 * dpr + camY;

    // 쌓인 블록
    blocks.forEach((b, i) => {
      const y = baseY - (i + 1) * BH;
      if (y < -BH || y > H + BH) return;
      const g = ctx.createLinearGradient(b.x, 0, b.x + b.w, 0);
      g.addColorStop(0, `hsl(${b.hue},70%,45%)`);
      g.addColorStop(1, `hsl(${b.hue},70%,60%)`);
      ctx.fillStyle = g;
      roundRect(b.x, y, b.w, BH - 2 * dpr, 5 * dpr);
      ctx.fill();
    });

    // 움직이는 블록
    if (!over) {
      moving.x += dir * speed;
      if (moving.x + moving.w > W) { moving.x = W - moving.w; dir = -1; }
      if (moving.x < 0) { moving.x = 0; dir = 1; }
      const y = baseY - (blocks.length + 1) * BH;
      ctx.fillStyle = `hsl(${moving.hue},75%,58%)`;
      ctx.globalAlpha = 0.95;
      roundRect(moving.x, y, moving.w, BH - 2 * dpr, 5 * dpr);
      ctx.fill();
      ctx.globalAlpha = 1;
      // 가이드 라인
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(moving.x + moving.w / 2, y + BH); ctx.lineTo(moving.x + moving.w / 2, H); ctx.stroke();
      ctx.setLineDash([]);
    }

    // 파티클
    particles = particles.filter((p) => p.life > 0);
    particles.forEach((p) => {
      p.vy += 0.5 * dpr; p.y += p.vy; p.life -= 0.02;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = `hsl(${p.hue},70%,55%)`;
      const y = baseY - p.y;
      ctx.fillRect(p.x, y, p.w, BH - 2 * dpr);
      ctx.globalAlpha = 1;
    });
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  cv.addEventListener('pointerdown', drop);
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); drop(); }
  });
  $('againBtn').addEventListener('click', reset);

  reset();
  requestAnimationFrame(draw);
})();
