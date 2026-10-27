const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8094;
const CDP_PORT = 9237;
const ROOT = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let decoded = decodeURIComponent(req.url.split('?')[0]);
  if (decoded === '/') decoded = '/projects.html';
  const filePath = path.join(ROOT, decoded);
  if (!fs.existsSync(filePath)) { res.statusCode = 404; return res.end(); }
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgeExe, [
    '--remote-debugging-port=' + CDP_PORT,
    '--user-data-dir=' + path.join(ROOT, 'scratch', 'temp_tab_test'),
    '--headless=new',
    '--window-size=1400,1050',
    'http://localhost:' + PORT + '/projects.html'
  ]);
  await new Promise(r => setTimeout(r, 2500));
  try {
    const listRes = await fetch('http://localhost:' + CDP_PORT + '/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.type === 'page');
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let id = 1;
    const send = (method, params = {}) => new Promise(res => {
      const curId = id++;
      const onMsg = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.id === curId) { ws.removeEventListener('message', onMsg); res(d.result); }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
    await send('Runtime.enable');
    await send('Page.enable');
    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.filter-btn[data-filter="layouts"]');
        if (btn) btn.click();
        const compDisplay = document.getElementById('completed').style.display;
        const ongoingDisplay = document.getElementById('ongoing').style.display;
        const layoutsDisplay = document.getElementById('layouts').style.display;
        const layoutCards = Array.from(document.querySelectorAll('#layouts .delivered-card')).map(c => ({ id: c.id, display: c.style.display }));
        return { compDisplay, ongoingDisplay, layoutsDisplay, layoutCards };
      })()`,
      returnByValue: true
    });
    console.log('Result:', JSON.stringify(evalRes.result.value, null, 2));

    await new Promise(r => setTimeout(r, 600));
    const snap = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ROOT, 'scratch', 'check_layouts_tab.png'), Buffer.from(snap.data, 'base64'));
    console.log('Saved check_layouts_tab.png');

    ws.close();
  } catch(e) {
    console.error(e);
  } finally {
    edgeProc.kill();
    server.close();
    process.exit(0);
  }
});
