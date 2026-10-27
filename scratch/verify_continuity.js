const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8099;
const CDP_PORT = 9242;
const ROOT = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let decoded = decodeURIComponent(req.url.split('?')[0]);
  if (decoded === '/') decoded = '/projects.html';
  const filePath = path.join(ROOT, decoded);
  if (!fs.existsSync(filePath)) { res.statusCode = 404; return res.end(); }
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);

  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${path.join(ROOT, 'scratch', 'temp_continuity')}`,
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

  // View 1: Top of project listing & Row 1
  await evaluate(`
    const filterBar = document.querySelector('.projects-filter-bar');
    if (filterBar) filterBar.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise(r => setTimeout(r, 800));
  await capture('continuous_legacy_row1.png');

  // View 2: Midpoint between Row 1 and Row 2 (showing connection and gap between rows)
  await evaluate(`
    const aura = document.getElementById('aura');
    const nx = document.getElementById('nx');
    if (aura && nx) {
      const mid = (aura.getBoundingClientRect().bottom + window.scrollY + nx.getBoundingClientRect().top + window.scrollY) / 2;
      window.scrollTo({ top: mid - window.innerHeight / 2, behavior: 'instant' });
    }
  `);
  await new Promise(r => setTimeout(r, 800));
  await capture('continuous_legacy_transition_row1_to_row2.png');

  // View 3: Row 2 and transition into CTA
  await evaluate(`
    const nx = document.getElementById('nx');
    if (nx) nx.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise(r => setTimeout(r, 800));
  await capture('continuous_legacy_row2_and_cta.png');

  // View 4: Ongoing Projects tab
  await evaluate(`
    const btn = document.querySelector('.filter-btn[data-filter="ongoing"]');
    if (btn) btn.click();
    const ongoing = document.getElementById('ongoing');
    if (ongoing) ongoing.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise(r => setTimeout(r, 1200));
  await capture('continuous_ongoing_row1.png');

  // View 5: Ongoing Row 2 (Aaryana and Viraj Avenue centered)
  await evaluate(`
    const aaryana = document.getElementById('aaryana');
    if (aaryana) aaryana.scrollIntoView({ behavior: 'instant', block: 'center' });
  `);
  await new Promise(r => setTimeout(r, 800));
  await capture('continuous_ongoing_row2_centered.png');

  // View 6: Completed Layouts tab
  await evaluate(`
    const btn = document.querySelector('.filter-btn[data-filter="layouts"]');
    if (btn) btn.click();
    const layouts = document.getElementById('layouts');
    if (layouts) layouts.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise(r => setTimeout(r, 1200));
  await capture('continuous_layouts.png');

  console.log('All continuity screenshots captured!');
  ws.close();
  edgeProc.kill();
  server.close();
  process.exit(0);
});
