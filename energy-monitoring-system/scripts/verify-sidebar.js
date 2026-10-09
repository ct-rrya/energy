// Usage:  URL=http://localhost:3000/dashboard PREFIX=es- node verify-sidebar.js
// Reference file:  URL=file:///abs/path/sidebar-reference.html PREFIX= node verify-sidebar.js
// Optional: SHOTS=./shots to save screenshots (device scale factor 1.5)
const { chromium } = require('playwright');
const URL = process.env.URL, P = process.env.PREFIX || '', SHOTS = process.env.SHOTS;
if (!URL) { console.error('Set URL'); process.exit(2); }
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1.5 });
  await p.goto(URL); await p.waitForTimeout(600);
  const q = s => `.${P}${s}`;
  const measure = () => p.evaluate(({ P }) => {
    const q = s => `.${P}${s}`;
    const cap = document.querySelector(q('capsule')).getBoundingClientRect();
    const blob = document.querySelector(q('blob')).getBoundingClientRect();
    const ring = document.querySelector(q('ring')).getBoundingClientRect();
    const act = document.querySelector(q('row') + '[aria-current="page"] ' + q('ico') + ' svg').getBoundingClientRect();
    const others = [...document.querySelectorAll(q('row') + '[data-route]:not([aria-current]) ' + q('ico') + ' svg')]
      .map(s => { const r = s.getBoundingClientRect(); return +(r.left + r.width / 2 - cap.left).toFixed(2); });
    const greens = [...document.querySelectorAll(q('capsule') + ' *')].filter(e => {
      const c = getComputedStyle(e).backgroundColor; return c === 'rgb(25, 212, 106)'; }).length;
    return { railW: +cap.width.toFixed(2),
      blobL: +(blob.left - cap.left).toFixed(2), blobR: +(blob.right - cap.left).toFixed(2),
      ringL: +(ring.left - cap.left).toFixed(2),
      dx: +((act.left + act.width / 2) - (blob.left + 27)).toFixed(2),
      dy: +((act.top + act.height / 2) - (blob.top + blob.height / 2)).toFixed(2),
      inactiveX: others, greenShapes: greens };
  }, { P });
  let fails = 0, n = 0;
  for (const theme of ['dark', 'light']) {
    await p.evaluate(t => { document.querySelector('[data-theme]').dataset.theme = t; }, theme);
    for (const exp of [false, true]) {
      await p.evaluate(e => { document.querySelector('[data-expanded]').dataset.expanded = e; }, exp);
      await p.waitForTimeout(900);
      const count = await p.locator(q('row') + '[data-route]').count();
      for (let i = 0; i < count; i++) {
        await p.locator(q('row') + '[data-route]').nth(i).click(); await p.waitForTimeout(900);
        const m = await measure(); n++;
        const ok = Math.abs(m.dx) <= .5 && Math.abs(m.dy) <= .5 && m.inactiveX.every(x => Math.abs(x - 40) <= .5)
          && Math.abs(m.blobR - (m.railW + 2)) <= .5 && Math.abs(m.blobL - 28) <= .5 && Math.abs(m.ringL - 20) <= .5
          && m.greenShapes === 1 && (exp ? m.railW === 264 : m.railW === 80);
        if (!ok) fails++;
        console.log(theme, exp ? 'expanded ' : 'collapsed', 'route#' + i, JSON.stringify(m), ok ? 'PASS' : 'FAIL');
        if (SHOTS) await p.screenshot({ path: `${SHOTS}/${theme}-${exp ? 'exp' : 'col'}-${i}.png`, clip: { x: 0, y: 0, width: exp ? 340 : 140, height: 900 } });
      }
    }
  }
  console.log(`checks: ${n}, failures: ${fails}`);
  await b.close(); process.exit(fails ? 1 : 0);
})();
