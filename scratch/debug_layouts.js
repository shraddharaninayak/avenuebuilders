const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8097;
const CDP_PORT = 9240;
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
    `--user-data-dir=${path.join(ROOT, 'scratch', 'temp_debug_layouts')}`,
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
      ws.send(JSON.stringify({ id: curId = id - 1, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  const debugInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const group = document.getElementById('layouts');
      const cardsInGroup = group ? group.querySelectorAll('.delivered-card') : [];
      const cardsInfo = Array.from(cardsInGroup).map(c => ({
        id: c.id,
        category: c.getAttribute('data-category'),
        styleDisplay: c.style.display,
        computedDisplay: window.getComputedStyle(c).display
      }));
      return {
        groupFound: !!group,
        groupDisplay: group ? group.style.display : null,
        cardsCount: cardsInGroup.length,
        cardsInfo
      };
    })()`,
    returnByValue: true
  });

  console.log('INITIAL STATE (on page load):', JSON.stringify(debugInfo.result.value, null, 2));

  // Now click layouts button
  const clickInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.filter-btn[data-filter="layouts"]');
      if (!btn) return 'Button not found';
      btn.click();
      const group = document.getElementById('layouts');
      const cardsInGroup = group ? group.querySelectorAll('.delivered-card') : [];
      const cardsInfo = Array.from(cardsInGroup).map(c => ({
        id: c.id,
        category: c.getAttribute('data-category'),
        styleDisplay: c.style.display,
        computedDisplay: window.getComputedStyle(c).display
      }));
      return {
        groupDisplay: group ? group.style.display : null,
        computedGroupDisplay: group ? window.getComputedStyle(group).display : null,
        cardsInfo
      };
    })()`,
    returnByValue: true
  });

  console.log('AFTER CLICKING LAYOUTS:', JSON.stringify(clickInfo.result.value, null, 2));

  ws.close();
  edgeProc.kill();
  server.close();
  process.exit(0);
});
