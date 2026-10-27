const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8098;
const CDP_PORT = 9243;
const ROOT = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let decoded = decodeURIComponent(req.url.split('?')[0]);
  if (decoded === '/') decoded = '/about.html';
  const filePath = path.join(ROOT, decoded);
  if (!fs.existsSync(filePath)) { res.statusCode = 404; return res.end(); }
  
  if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
  else if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
  else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg');
  else if (filePath.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
  else if (filePath.endsWith('.webp')) res.setHeader('Content-Type', 'image/webp');
  else if (filePath.endsWith('.html')) res.setHeader('Content-Type', 'text/html');

  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);

  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${path.join(ROOT, 'scratch', 'temp_edge_about')}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-sync',
    '--disable-gpu',
    '--mute-audio',
    '--window-size=1400,1050',
    `http://localhost:${PORT}/about.html`
  ]);

  await new Promise(r => setTimeout(r, 2500));
  const listRes = await fetch(`http://localhost:${CDP_PORT}/json/list`);
  const tabs = await listRes.json();
  const tab = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(res => { ws.onopen = res; });

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise(res => {
      const id = msgId++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === id) { ws.removeEventListener('message', handler); res(d.result); }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  async function capture(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ROOT, 'scratch', filename), Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${filename}`);
  }

  // 1. Desktop Hero & Story
  await evaluate(`window.scrollTo({ top: 0, behavior: 'instant' });`);
  await new Promise(r => setTimeout(r, 600));
  await capture('about_desktop_hero_story.png');

  // 2. Achievements & Our Journey
  await evaluate(`
    const bar = document.querySelector('.about-achievements-bar');
    if (bar) bar.scrollIntoView({ behavior: 'instant', block: 'center' });
  `);
  await new Promise(r => setTimeout(r, 600));
  await capture('about_desktop_stats_journey.png');

  // 3. Purpose, Aspiration & Philosophy
  await evaluate(`
    const phil = document.querySelector('.about-philosophy-editorial');
    if (phil) phil.scrollIntoView({ behavior: 'instant', block: 'center' });
  `);
  await new Promise(r => setTimeout(r, 600));
  await capture('about_desktop_philosophy.png');

  // 4. Executive Leadership
  await evaluate(`
    const lead = document.querySelector('.about-leadership-section');
    if (lead) lead.scrollIntoView({ behavior: 'instant', block: 'center' });
  `);
  await new Promise(r => setTimeout(r, 600));
  await capture('about_desktop_directors_cta.png');

  // 5. Final CTA & Footer
  await evaluate(`
    const cta = document.querySelector('.projects-forest-cta');
    if (cta) cta.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise(r => setTimeout(r, 600));
  await capture('about_desktop_cta_footer.png');

  // 6. Mobile View (390 x 844)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await evaluate(`window.scrollTo({ top: 0, behavior: 'instant' });`);
  await new Promise(r => setTimeout(r, 600));
  await capture('about_mobile_hero.png');

  await evaluate(`
    const bar = document.querySelector('.about-achievements-bar');
    if (bar) bar.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise(r => setTimeout(r, 600));
  await capture('about_mobile_stats_journey.png');

  await evaluate(`
    const lead = document.querySelector('.about-leadership-section');
    if (lead) lead.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise(r => setTimeout(r, 600));
  await capture('about_mobile_directors.png');

  console.log('All about redesign screenshots captured successfully!');
  ws.close();
  edgeProc.kill();
  server.close();
  process.exit(0);
});
