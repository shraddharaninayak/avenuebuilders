const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8097;
const CDP_PORT = 9251;
const ROOT = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let decoded = decodeURIComponent(req.url.split('?')[0]);
  if (decoded === '/') decoded = '/about.html';
  const filePath = path.join(ROOT, decoded);
  if (!fs.existsSync(filePath)) { res.statusCode = 404; return res.end(); }
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${path.join(ROOT, 'scratch', 'temp_edge_user_hero')}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1400,1050',
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

  const info = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1Eyebrow = document.querySelector('.about-hero-eyebrow');
      const storyEyebrow = document.querySelector('.story-eyebrow');
      const mediaWrap = document.querySelector('.about-hero-media-wrap');
      const img = document.querySelector('.about-hero-media-wrap img');

      return {
        h1Eyebrow: {
          text: h1Eyebrow.innerText,
          color: getComputedStyle(h1Eyebrow).color,
          fontWeight: getComputedStyle(h1Eyebrow).fontWeight,
          rect: h1Eyebrow.getBoundingClientRect()
        },
        storyEyebrow: {
          text: storyEyebrow.innerText,
          color: getComputedStyle(storyEyebrow).color,
          fontWeight: getComputedStyle(storyEyebrow).fontWeight,
          rect: storyEyebrow.getBoundingClientRect()
        },
        img: {
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          currentSrc: img.currentSrc,
          objectFit: getComputedStyle(img).objectFit,
          rect: img.getBoundingClientRect()
        },
        mediaWrapRect: mediaWrap.getBoundingClientRect()
      };
    })()`,
    returnByValue: true
  });

  console.log('Inspection result:', JSON.stringify(info.result.value, null, 2));

  // Desktop shot of the hero section
  const desktopHeroClip = await send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: 0,
      y: 0,
      width: 1400,
      height: 900,
      scale: 1
    }
  });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_about_hero_desktop.png'), Buffer.from(desktopHeroClip.data, 'base64'));

  // Mobile screenshot
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 600));

  const mobileHeroClip = await send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: 0,
      y: 0,
      width: 390,
      height: 844,
      scale: 1
    }
  });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_about_hero_mobile.png'), Buffer.from(mobileHeroClip.data, 'base64'));

  console.log('Screenshots captured successfully!');
  try { edgeProc.kill(); } catch (e) {}
  server.close();
  process.exit(0);
});
