const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8091;
const CDP_PORT = 9231;
const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let decoded = decodeURIComponent(req.url.split('?')[0]);
  if (decoded === '/') decoded = '/projects.html';
  const filePath = path.join(ROOT, decoded);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);

  const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  const edgeExe = edgePaths.find(p => fs.existsSync(p));
  if (!edgeExe) {
    console.error('Edge not found');
    server.close();
    process.exit(1);
  }

  const userDataDir = path.join(__dirname, 'temp_edge_commercial');
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const edgeProcess = spawn(edgeExe, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    'about:blank'
  ]);

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await sleep(2000);

  async function getWsUrl() {
    for (let i = 0; i < 10; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
        const list = await res.json();
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          return list[0].webSocketDebuggerUrl;
        }
      } catch (e) {
        await sleep(500);
      }
    }
    throw new Error('Could not get WS URL');
  }

  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);

  let msgId = 1;
  const callbacks = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg.result);
      callbacks.delete(msg.id);
    }
  };

  await new Promise(resolve => {
    ws.onopen = resolve;
  });

  function send(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const outDir = path.join(__dirname, 'commercial_verification');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Projects Page Desktop (Card View)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1400,
    height: 900,
    deviceScaleFactor: 1.5,
    mobile: false
  });

  console.log('Navigating to projects.html...');
  await send('Page.navigate', { url: `http://localhost:${PORT}/projects.html` });
  await sleep(2000);

  // Scroll to commercial card
  await send('Runtime.evaluate', {
    expression: `
      const card = document.getElementById('commercial');
      if (card) {
        card.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    `
  });
  await sleep(1000);

  const cardShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'projects_card_desktop.png'), Buffer.from(cardShot.data, 'base64'));
  console.log('Saved projects_card_desktop.png');

  // Also capture clip of just the card
  const cardBounds = await send('Runtime.evaluate', {
    expression: `
      const card = document.getElementById('commercial');
      const rect = card.getBoundingClientRect();
      JSON.stringify({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    `,
    returnByValue: true
  });
  const rect = JSON.parse(cardBounds.result.value);
  if (rect) {
    const singleCardShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: rect.x - 10, y: rect.y - 10, width: rect.width + 20, height: rect.height + 20, scale: 1.5 }
    });
    fs.writeFileSync(path.join(outDir, 'single_card_commercial.png'), Buffer.from(singleCardShot.data, 'base64'));
    console.log('Saved single_card_commercial.png');
  }

  // 2. Commercial Interactive PDF Brochure (commercial.html)
  console.log('Navigating to commercial.html...');
  await send('Page.navigate', { url: `http://localhost:${PORT}/commercial.html` });
  await sleep(2000);

  const brochureHeroShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'commercial_brochure_hero_desktop.png'), Buffer.from(brochureHeroShot.data, 'base64'));
  console.log('Saved commercial_brochure_hero_desktop.png');

  // 3. Commercial Brochure Mobile (390 x 844)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sleep(1000);

  const brochureMobileHeroShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'commercial_brochure_hero_mobile.png'), Buffer.from(brochureMobileHeroShot.data, 'base64'));
  console.log('Saved commercial_brochure_hero_mobile.png');

  console.log('Done!');
  ws.close();
  edgeProcess.kill();
  server.close();
  process.exit(0);
});
