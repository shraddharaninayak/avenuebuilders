const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8094;
const CDP_PORT = 9247;
const ROOT = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let decoded = decodeURIComponent(req.url.split('?')[0]);
  if (decoded === '/') decoded = '/about.html';
  const filePath = path.join(ROOT, decoded);
  if (!fs.existsSync(filePath)) { res.statusCode = 404; return res.end(); }
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  // Test Desktop
  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${path.join(ROOT, 'scratch', 'temp_edge_about_verify')}`,
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

  // Verify section order in DOM
  const orderCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const main = document.getElementById('pageContent');
      const sections = Array.from(main.querySelectorAll('section')).map(s => ({
        className: s.className,
        heading: s.querySelector('h1, h2')?.innerText?.trim() || ''
      }));
      const desktopNavPresent = !!document.querySelector('.desktop-nav');
      const navbarInfo = {
        headerClass: document.querySelector('.site-header').className,
        enquireBtnText: document.querySelector('.btn-header-enquire').innerText.replace(/\\s+/g, ' ').trim(),
        hamburgerBars: document.querySelectorAll('.menu-cta-menu-hamburger span').length,
        desktopNavPresent
      };
      return JSON.stringify({ sections, navbarInfo });
    })()`
  });
  console.log('Section Order & Navbar Check:\n', JSON.stringify(JSON.parse(orderCheck.result.value), null, 2));

  // Desktop shot 1: Top (Navbar + Hero)
  const snap1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_about_desktop_top.png'), Buffer.from(snap1.data, 'base64'));

  // Scroll to Executive Leadership & Guiding Principles
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1100);' });
  await new Promise(r => setTimeout(r, 600));
  const snap2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_about_desktop_leadership.png'), Buffer.from(snap2.data, 'base64'));

  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1900);' });
  await new Promise(r => setTimeout(r, 600));
  const snap3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_about_desktop_principles.png'), Buffer.from(snap3.data, 'base64'));

  // Test Mobile View
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
  await new Promise(r => setTimeout(r, 600));
  const snapMobile = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_about_mobile_top.png'), Buffer.from(snapMobile.data, 'base64'));

  // Test mobile menu open
  await send('Runtime.evaluate', { expression: 'document.querySelector(".menu-cta-menu-hamburger").click();' });
  await new Promise(r => setTimeout(r, 600));
  const snapDrawer = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_about_mobile_drawer.png'), Buffer.from(snapDrawer.data, 'base64'));

  ws.close();
  edgeProc.kill();
  server.close();
  console.log('Verification completed successfully!');
  process.exit(0);
});
