const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8086;
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
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  let decoded = decodeURIComponent(req.url.split('?')[0]);
  if (decoded === '/') decoded = '/index.html';
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

  const cdpPort = 9226;
  const userDataDir = path.join(ROOT, 'scratch', 'temp_edge_user2');
  const edgeProc = spawn(edgeExe, [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--mute-audio',
    '--window-size=1366,950',
    `http://localhost:${PORT}/index.html`
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch(`http://localhost:${cdpPort}/json/list`);
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.type === 'page');

    if (!tab) throw new Error('No page tab found');

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (evt) => {
          const data = JSON.parse(evt.data);
          if (data.id === msgId) {
            ws.removeEventListener('message', handler);
            if (data.error) reject(data.error);
            else resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    // Remove intro overlays to inspect page immediately
    await send('Runtime.evaluate', {
      expression: `
        const intro = document.getElementById('avenue-intro');
        if (intro) intro.style.display = 'none';
        const cloud = document.getElementById('cloudIntro');
        if (cloud) cloud.style.display = 'none';
        document.body.style.overflow = 'auto';

        const sec = document.getElementById('signature-landmarks');
        if (sec) {
          sec.scrollIntoView({ behavior: 'instant', block: 'start' });
          sec.querySelectorAll('.fadeUpAnimation').forEach(el => el.classList.add('active'));
        }
      `
    });

    await new Promise(r => setTimeout(r, 1200));

    // Get bounding rect of #signature-landmarks
    const rectRes = await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('signature-landmarks');
        const r = el.getBoundingClientRect();
        JSON.stringify({ x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height });
      `
    });
    const rect = JSON.parse(rectRes.result.value);

    // Capture Entire Desktop Section Screenshot with clip
    const deskShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        scale: 1
      }
    });
    fs.writeFileSync(path.join(ROOT, 'scratch', 'landmarks_desktop.png'), Buffer.from(deskShot.data, 'base64'));
    console.log('Saved full landmarks_desktop.png');

    // Click Next Arrow Button
    await send('Runtime.evaluate', {
      expression: `
        const nextBtn = document.querySelector('.landmarks-floating-next-btn') || document.querySelector('.nav-rail-next');
        if (nextBtn) nextBtn.click();
      `
    });

    await new Promise(r => setTimeout(r, 900));

    const nextShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        scale: 1
      }
    });
    fs.writeFileSync(path.join(ROOT, 'scratch', 'landmarks_desktop_slid.png'), Buffer.from(nextShot.data, 'base64'));
    console.log('Saved full landmarks_desktop_slid.png');

    // Set mobile viewport 390x844
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Runtime.evaluate', {
      expression: `
        const sec = document.getElementById('signature-landmarks');
        if (sec) {
          sec.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      `
    });

    await new Promise(r => setTimeout(r, 800));

    const mobileShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ROOT, 'scratch', 'landmarks_mobile.png'), Buffer.from(mobileShot.data, 'base64'));
    console.log('Saved landmarks_mobile.png');

    await send('Runtime.evaluate', {
      expression: `
        const viewAll = document.querySelector('.landmarks-view-all-wrap');
        if (viewAll) {
          viewAll.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));
    const mobileBottomShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ROOT, 'scratch', 'landmarks_mobile_bottom.png'), Buffer.from(mobileBottomShot.data, 'base64'));
    console.log('Saved landmarks_mobile_bottom.png');

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    edgeProc.kill();
    server.close();
    process.exit(0);
  }
});
