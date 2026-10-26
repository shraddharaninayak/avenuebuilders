const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8094;
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

  const cdpPort = 9230;
  const userDataDir = path.join(ROOT, 'scratch', 'temp_edge_user_milestone');
  const edgeProc = spawn(edgeExe, [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-sync',
    '--mute-audio',
    '--window-size=1366,850',
    `http://localhost:${PORT}/index.html`
  ]);

  await new Promise(r => setTimeout(r, 2200));

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
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 850,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('=== TEST 1: DESKTOP TIMING & VIDEO VALIDATION ===');
    // At t = 4.0s (Clouds prominently visible for 2s after logo)
    await new Promise(r => setTimeout(r, 4000));

    const cloudDesk = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cloud = document.getElementById('cloudIntro');
          const video = document.querySelector('.hero-video-bg');
          return {
            cloudDisplay: cloud ? window.getComputedStyle(cloud).display : 'none',
            cloudOpacity: cloud ? window.getComputedStyle(cloud).opacity : '0',
            videoPaused: video ? video.paused : true,
            videoCurrentTime: video ? video.currentTime : 0
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Desktop at t=4.0s (During 2s cloud intro):', cloudDesk.result.value);

    // Capture screenshot of cloud intro
    const deskCloudShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_desktop_clouds.png'), Buffer.from(deskCloudShot.data, 'base64'));

    // Wait until clouds fade out and video plays to second ~4.5 of video (total 10.5s from start)
    console.log('Waiting for cloud fade-out and video playback...');
    await new Promise(r => setTimeout(r, 6500));

    const heroDesk = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cloud = document.getElementById('cloudIntro');
          const video = document.querySelector('.hero-video-bg');
          const welcome = document.querySelector('.hero-mobile-welcome');
          const oldIntro = document.querySelector('.hero-mobile-intro');
          return {
            cloudDisplay: cloud ? cloud.style.display : 'none',
            videoPaused: video ? video.paused : true,
            videoCurrentTime: video ? video.currentTime : 0,
            welcomeDesktopDisplay: welcome ? window.getComputedStyle(welcome).display : 'none',
            oldIntroPresent: !!oldIntro
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Desktop at t=10.5s (Milestone video playing with logo):', heroDesk.result.value);

    const deskHeroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_desktop_hero.png'), Buffer.from(deskHeroShot.data, 'base64'));

    console.log('=== TEST 2: MOBILE VIEWPORT & CONTENT VALIDATION ===');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Wait for logo (3.2s) + clouds (2.0s) + fade (1.0s) + 4.5s video playback (~10.7s total)
    console.log('Waiting for mobile sequence (logo -> 2s clouds -> fade -> video)...');
    await new Promise(r => setTimeout(r, 8700));

    const mobileHero = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cloud = document.getElementById('cloudIntro');
          const video = document.querySelector('.hero-video-bg');
          const welcome = document.querySelector('.hero-mobile-welcome-title');
          const oldIntro = document.querySelector('.hero-mobile-intro');
          const wrap = document.querySelector('.hero-video-wrapper');
          return {
            cloudDisplay: cloud ? cloud.style.display : 'none',
            videoPaused: video ? video.paused : true,
            videoCurrentTime: video ? video.currentTime : 0,
            welcomeTitle: welcome ? welcome.textContent.trim() : null,
            welcomeVisible: welcome ? window.getComputedStyle(welcome).display !== 'none' : false,
            oldIntroPresent: !!oldIntro,
            videoHeight: wrap ? wrap.getBoundingClientRect().height : 0
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Mobile at t=10.7s (Milestone video playing + balanced welcome):', mobileHero.result.value);

    const mobileHeroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_mobile_hero.png'), Buffer.from(mobileHeroShot.data, 'base64'));

    console.log('All verification captures saved successfully.');
    ws.close();
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    edgeProc.kill();
    server.close();
    process.exit(0);
  }
});
