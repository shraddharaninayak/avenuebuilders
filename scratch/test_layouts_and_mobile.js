const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8094;
const CDP_PORT = 9237;
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
  const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  const edgeExe = edgePaths.find(p => fs.existsSync(p));

  const userDataDir = path.join(ROOT, 'scratch', 'temp_edge_user_redesign3');
  const edgeProc = spawn(edgeExe, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-sync',
    '--disable-gpu',
    '--mute-audio',
    '--window-size=1400,1050',
    `http://localhost:${PORT}/projects.html`
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const listRes = await fetch(`http://localhost:${CDP_PORT}/json/list`);
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.type === 'page');

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (event) => {
          const res = JSON.parse(event.data);
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result ? res.result.value : null;
    }

    async function captureScreenshot(filepath) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot: ${filepath}`);
    }

    // Click Layouts Tab directly
    await evaluate(`
      const btn = document.querySelector('.filter-btn[data-filter="layouts"]');
      if (btn) btn.click();
    `);
    await new Promise(r => setTimeout(r, 800));

    await evaluate(`
      const layouts = document.getElementById('layouts');
      if (layouts) layouts.scrollIntoView({ behavior: 'instant', block: 'start' });
    `);
    await new Promise(r => setTimeout(r, 500));
    await captureScreenshot(path.join(ROOT, 'scratch', 'redesign_desktop_layouts_verified.png'));

    // Tablet check
    await send('Emulation.setDeviceMetricsOverride', {
      width: 820,
      height: 1180,
      deviceScaleFactor: 1,
      mobile: false
    });
    // Click Legacy for tablet
    await evaluate(`
      const btn = document.querySelector('.filter-btn[data-filter="completed"]');
      if (btn) btn.click();
      const comp = document.getElementById('completed');
      if (comp) comp.scrollIntoView({ behavior: 'instant', block: 'start' });
    `);
    await new Promise(r => setTimeout(r, 600));
    await captureScreenshot(path.join(ROOT, 'scratch', 'redesign_tablet_legacy.png'));

    // Mobile check
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await evaluate(`
      const card = document.getElementById('aura');
      if (card) card.scrollIntoView({ behavior: 'instant', block: 'start' });
    `);
    await new Promise(r => setTimeout(r, 600));
    await captureScreenshot(path.join(ROOT, 'scratch', 'redesign_mobile_card.png'));

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    edgeProc.kill();
    server.close();
    process.exit(0);
  }
});
