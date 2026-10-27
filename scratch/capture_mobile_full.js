const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8099;
const CDP_PORT = 9253;
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
    `--user-data-dir=${path.join(ROOT, 'scratch', 'temp_edge_user3')}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=390,1400',
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

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 1200,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 500));

  const mobileInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const hero = document.querySelector('.about-hero-section');
      const r = hero.getBoundingClientRect();
      const wrap = document.querySelector('.about-hero-media-wrap');
      const rWrap = wrap.getBoundingClientRect();
      return JSON.stringify({ heroY: r.y, heroHeight: r.height, wrapY: rWrap.y, wrapHeight: rWrap.height });
    })()`
  });
  const mParsed = JSON.parse(mobileInfo.result.value);
  console.log('Mobile dimensions:', mParsed);

  const snapMobileFullHero = await send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: 0,
      y: Math.max(0, mParsed.heroY),
      width: 390,
      height: Math.ceil(mParsed.heroHeight),
      scale: 1
    }
  });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_mobile_full_hero.png'), Buffer.from(snapMobileFullHero.data, 'base64'));

  ws.close();
  try { edgeProc.kill(); } catch (e) {}
  server.close();
  console.log('Mobile full hero saved!');
  process.exit(0);
});
