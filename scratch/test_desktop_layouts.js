const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8096;
const CDP_PORT = 9239;
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
    `--user-data-dir=${path.join(ROOT, 'scratch', 'temp_edge_user_layouts')}`,
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
  await send('Runtime.evaluate', { expression: 'document.querySelector(".filter-btn[data-filter=\\"layouts\\"]").click();' });
  await new Promise(r => setTimeout(r, 1500));
  await send('Runtime.evaluate', { expression: 'document.getElementById("layouts").scrollIntoView({ behavior: "instant", block: "start" });' });
  await new Promise(r => setTimeout(r, 1000));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'redesign_desktop_layouts_final.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved redesign_desktop_layouts_final.png');

  ws.close();
  edgeProc.kill();
  server.close();
  process.exit(0);
});
