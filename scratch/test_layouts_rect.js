const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8098;
const CDP_PORT = 9241;
const ROOT = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let decoded = decodeURIComponent(req.url.split('?')[0]);
  if (decoded === '/') decoded = '/projects.html';
  const filePath = path.join(ROOT, decoded);
  if (!fs.existsSync(filePath)) { res.statusCode = 404; return res.end(); }
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${path.join(ROOT, 'scratch', 'temp_edge_user_layouts2')}`,
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

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.filter-btn[data-filter="layouts"]');
      btn.click();
      const layouts = document.getElementById('layouts');
      const rect = layouts ? layouts.getBoundingClientRect() : null;
      const cards = Array.from(layouts.querySelectorAll('.delivered-card')).map(c => ({
        id: c.id,
        rect: c.getBoundingClientRect(),
        display: c.style.display,
        compDisplay: window.getComputedStyle(c).display
      }));
      return { rect, cards, scrollY: window.scrollY };
    })()`,
    returnByValue: true
  });

  console.log('LAYOUTS RECT & CARDS:', JSON.stringify(res.result.value, null, 2));

  // Now scroll layouts card into view block center and take screenshot
  await send('Runtime.evaluate', {
    expression: `document.getElementById('pathardi-vadner-nx').scrollIntoView({ behavior: 'instant', block: 'center' });`
  });
  await new Promise(r => setTimeout(r, 800));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'test_layouts_centered.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved test_layouts_centered.png');

  ws.close();
  edgeProc.kill();
  server.close();
  process.exit(0);
});
