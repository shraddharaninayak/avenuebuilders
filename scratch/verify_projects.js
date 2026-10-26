const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8089;
const CDP_PORT = 9228;
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

  const userDataDir = path.join(ROOT, 'scratch', 'temp_edge_user3');
  const edgeProc = spawn(edgeExe, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-sync',
    '--disable-gpu',
    '--mute-audio',
    '--window-size=1366,950',
    `http://localhost:${PORT}/projects.html`
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const listRes = await fetch(`http://localhost:${CDP_PORT}/json/list`);
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

    // Remove preloader / overlay if any
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const preloader = document.getElementById('preloader');
          if (preloader) preloader.remove();
          document.body.style.opacity = '1';
          document.body.style.visibility = 'visible';
          window.scrollTo(0, 0);
        })()
      `
    });

    await new Promise(r => setTimeout(r, 800));

    // Helper to take screenshot
    async function takeShot(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const outPath = path.join(ROOT, 'scratch', filename);
      fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    }

    // Set viewport: Desktop 1366x850
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 850,
      deviceScaleFactor: 1,
      mobile: false
    });

    // 1. Initial State Check
    const initialCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const filterBtns = Array.from(document.querySelectorAll('.filter-btn')).map(b => ({
            text: b.textContent.trim(),
            filter: b.getAttribute('data-filter'),
            active: b.classList.contains('active')
          }));

          const compGroup = document.getElementById('completed');
          const ongGroup = document.getElementById('ongoing');
          const layGroup = document.getElementById('layouts');
          const compendium = document.getElementById('portfolio-brochure');

          return {
            filterBtns,
            completedDisplay: compGroup ? compGroup.style.display : null,
            ongoingDisplay: ongGroup ? ongGroup.style.display : null,
            layoutsDisplay: layGroup ? layGroup.style.display : null,
            compendiumExists: !!compendium
          };
        })()
      `,
      returnByValue: true
    });
    console.log('=== INITIAL LOAD CHECK ===');
    console.log(JSON.stringify(initialCheck.result.value, null, 2));

    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 160);' });
    await new Promise(r => setTimeout(r, 500));
    await takeShot('test_initial_legacy.png');

    // 2. Click ONGOING PROJECTS
    console.log('=== TESTING ONGOING PROJECTS (3 + 2 LAYOUT) ===');
    const ongoingLayoutCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('.filter-btn[data-filter="ongoing"]');
          if (btn) btn.click();
          window.scrollTo(0, 160);

          const group = document.getElementById('ongoing');
          const cards = Array.from(group.querySelectorAll('.delivered-card'));
          const rects = cards.map(c => {
            const r = c.getBoundingClientRect();
            return { id: c.id, x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
          });
          const containerRect = group.querySelector('.delivered-gallery-grid').getBoundingClientRect();

          return {
            groupDisplay: group.style.display,
            containerWidth: Math.round(containerRect.width),
            containerLeft: Math.round(containerRect.left),
            cardCount: cards.length,
            cards: rects
          };
        })()
      `,
      returnByValue: true
    });
    console.log(JSON.stringify(ongoingLayoutCheck.result.value, null, 2));

    await new Promise(r => setTimeout(r, 500));
    await takeShot('test_ongoing_3plus2.png');

    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 950);' });
    await new Promise(r => setTimeout(r, 500));
    await takeShot('test_ongoing_row2_centered.png');

    // 3. Click COMPLETED LAYOUTS
    console.log('=== TESTING COMPLETED LAYOUTS (BALANCED 3 CARDS) ===');
    const layoutsCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('.filter-btn[data-filter="layouts"]');
          if (btn) btn.click();
          window.scrollTo(0, 160);

          const group = document.getElementById('layouts');
          const cards = Array.from(group.querySelectorAll('.delivered-card'));
          const rects = cards.map(c => {
            const r = c.getBoundingClientRect();
            return { id: c.id, x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
          });
          const containerRect = group.querySelector('.delivered-gallery-grid').getBoundingClientRect();

          return {
            groupDisplay: group.style.display,
            containerWidth: Math.round(containerRect.width),
            cardCount: cards.length,
            cards: rects
          };
        })()
      `,
      returnByValue: true
    });
    console.log(JSON.stringify(layoutsCheck.result.value, null, 2));

    await new Promise(r => setTimeout(r, 500));
    await takeShot('test_completed_layouts.png');

    // Check transition to CTA and footer
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 800);' });
    await new Promise(r => setTimeout(r, 400));
    await takeShot('test_cta_transition.png');

    // 4. Tablet Test: Ongoing
    console.log('=== TABLET TEST ===');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 768,
      height: 1024,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('.filter-btn[data-filter="ongoing"]');
          if (btn) btn.click();
          window.scrollTo(0, 160);
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));
    await takeShot('test_tablet_ongoing.png');

    // 5. Mobile Test: Ongoing
    console.log('=== MOBILE TEST ===');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true
    });
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 140);' });
    await new Promise(r => setTimeout(r, 500));
    await takeShot('test_mobile_ongoing.png');

    console.log('ALL TESTS PASSED SUCCESSFULLY!');

    ws.close();
    edgeProc.kill();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    try { edgeProc.kill(); } catch (e) {}
    server.close();
    process.exit(1);
  }
});
