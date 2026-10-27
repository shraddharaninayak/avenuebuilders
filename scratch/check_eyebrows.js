const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8095;
const CDP_PORT = 9249;
const ROOT = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let decoded = decodeURIComponent(req.url.split('?')[0]);
  if (decoded === '/') decoded = '/about.html';
  const filePath = path.join(ROOT, decoded);
  if (!fs.existsSync(filePath)) { res.statusCode = 404; return res.end(); }
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${path.join(ROOT, 'scratch', 'temp_edge_eyebrow')}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1400,1000',
    `http://localhost:${PORT}/about.html`
  ]);

  await new Promise(r => setTimeout(r, 2200));
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

  const info = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1Eyebrow = document.querySelector('.about-hero-eyebrow');
      const storyEyebrow = document.querySelector('.story-eyebrow');
      const cs1 = getComputedStyle(h1Eyebrow);
      const cs2 = getComputedStyle(storyEyebrow);
      const r1 = h1Eyebrow.getBoundingClientRect();
      const r2 = storyEyebrow.getBoundingClientRect();
      return JSON.stringify({
        heroEyebrow: {
          text: h1Eyebrow.innerText,
          color: cs1.color,
          fontWeight: cs1.fontWeight,
          fontSize: cs1.fontSize,
          letterSpacing: cs1.letterSpacing,
          rect: { x: r1.x, y: r1.y, width: r1.width, height: r1.height }
        },
        storyEyebrow: {
          text: storyEyebrow.innerText,
          color: cs2.color,
          fontWeight: cs2.fontWeight,
          fontSize: cs2.fontSize,
          letterSpacing: cs2.letterSpacing,
          rect: { x: r2.x, y: r2.y, width: r2.width, height: r2.height }
        }
      });
    })()`
  });

  const parsed = JSON.parse(info.result.value);
  console.log('Eyebrow inspection:', JSON.stringify(parsed, null, 2));

  // Capture close-up of Hero Eyebrow
  const clip1 = {
    x: Math.max(0, parsed.heroEyebrow.rect.x - 20),
    y: Math.max(0, parsed.heroEyebrow.rect.y - 15),
    width: parsed.heroEyebrow.rect.width + 50,
    height: parsed.heroEyebrow.rect.height + 30,
    scale: 2
  };
  const snapHero = await send('Page.captureScreenshot', { format: 'png', clip: clip1 });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'crop_hero_eyebrow.png'), Buffer.from(snapHero.data, 'base64'));

  // Capture close-up of Story Eyebrow
  const clip2 = {
    x: Math.max(0, parsed.storyEyebrow.rect.x - 20),
    y: Math.max(0, parsed.storyEyebrow.rect.y - 15),
    width: parsed.storyEyebrow.rect.width + 50,
    height: parsed.storyEyebrow.rect.height + 30,
    scale: 2
  };
  const snapStory = await send('Page.captureScreenshot', { format: 'png', clip: clip2 });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'crop_story_eyebrow.png'), Buffer.from(snapStory.data, 'base64'));

  // Capture top view
  const snapTop = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_eyebrows_full_top.png'), Buffer.from(snapTop.data, 'base64'));

  ws.close();
  edgeProc.kill();
  server.close();
  console.log('Capture done!');
  process.exit(0);
});
