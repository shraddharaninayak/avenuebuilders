const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8091;
const ROOT_DIR = 'd:/INTERNSHIPS/SOCIAL MEDIA MANANGMENT[SKILLNEX]/WEBSITES/AvenueBuilders';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT_DIR, reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found: ' + reqPath);
    return;
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  if (ext === '.mp4' && req.headers.range) {
    const range = req.headers.range;
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    });
    file.pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes'
  });
  fs.createReadStream(filePath).pipe(res);
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  await new Promise(r => server.listen(PORT, r));
  console.log(`Server listening on http://localhost:${PORT}`);

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const userDir = path.join(ROOT_DIR, 'scratch/temp_edge_vid_91');
  const remotePort = 9228;

  try {
    fs.rmSync(userDir, { recursive: true, force: true });
  } catch(e) {}

  const edge = spawn(edgePath, [
    `--remote-debugging-port=${remotePort}`,
    `--user-data-dir=${userDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    '--disable-gpu',
    '--autoplay-policy=no-user-gesture-required',
    'about:blank'
  ]);

  let pageTab = null;
  for (let i = 0; i < 25; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${remotePort}/json`);
      const tabs = await res.json();
      pageTab = tabs.find(t => t.type === 'page') || tabs[0];
      if (pageTab && pageTab.webSocketDebuggerUrl) break;
    } catch (e) {
      await sleep(300);
    }
  }

  if (!pageTab || !pageTab.webSocketDebuggerUrl) {
    throw new Error('Failed to find Edge page target');
  }

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  console.log('Connected to CDP at:', pageTab.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();
  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pending.has(msg.id)) {
      const resolve = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) {
        console.error('CDP Error for ID', msg.id, msg.error);
        resolve(null);
      } else {
        resolve(msg.result);
      }
    }
  };

  function send(method, params = {}) {
    return new Promise(resolve => {
      const id = idCounter++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evalJson(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true
    });
    const val = res && res.result ? res.result.value : null;
    return val ? JSON.parse(val) : null;
  }

  await send('Page.enable');
  await send('DOM.enable');

  // Test 1: Mobile View with Intro Sequence -> Video Playback
  console.log('\n--- TEST 1: Mobile Viewport (390x844) First Visit Intro Sequence ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
  await sleep(2000);

  // Check state during logo intro
  let state1 = await evalJson(`JSON.stringify({
    logoIntroVisible: !!(document.getElementById('avenue-intro') && getComputedStyle(document.getElementById('avenue-intro')).display !== 'none'),
    cloudIntroVisible: !!(document.getElementById('cloudIntro') && getComputedStyle(document.getElementById('cloudIntro')).display !== 'none'),
    videoPaused: document.querySelector('.hero-video-bg') ? document.querySelector('.hero-video-bg').paused : null
  })`);
  console.log('Stage 1 (Logo Intro active):', state1);

  // Wait for intro sequence to complete
  console.log('Waiting for cloud dissolve & video playback trigger...');
  for (let i = 0; i < 40; i++) {
    const isCloudDone = await evalJson(`document.getElementById('cloudIntro') ? getComputedStyle(document.getElementById('cloudIntro')).display === 'none' : true`);
    if (isCloudDone) break;
    await sleep(250);
  }
  await sleep(800);

  // Check video playback state
  const res1 = await evalJson(`JSON.stringify({
    logoIntroDisplay: document.getElementById('avenue-intro') ? getComputedStyle(document.getElementById('avenue-intro')).display : null,
    cloudIntroDisplay: document.getElementById('cloudIntro') ? getComputedStyle(document.getElementById('cloudIntro')).display : null,
    videoExists: !!document.querySelector('.hero-video-bg'),
    videoPaused: document.querySelector('.hero-video-bg') ? document.querySelector('.hero-video-bg').paused : null,
    videoCurrentTime: document.querySelector('.hero-video-bg') ? document.querySelector('.hero-video-bg').currentTime : null,
    videoDuration: document.querySelector('.hero-video-bg') ? document.querySelector('.hero-video-bg').duration : null,
    wrapperHasIsPlaying: document.querySelector('.hero-video-wrapper') ? document.querySelector('.hero-video-wrapper').classList.contains('is-playing') : false,
    wrapperOpacity: document.querySelector('.hero-video-wrapper') ? getComputedStyle(document.querySelector('.hero-video-wrapper')).opacity : null,
    welcomeTitle: document.querySelector('.hero-mobile-welcome-title') ? document.querySelector('.hero-mobile-welcome-title').innerText : null,
    hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  })`);
  console.log('Stage 3 (Hero Video Playing):', res1);

  // Capture Mobile Video Playing Screenshot
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  const data1 = shot1 ? (shot1.data || (shot1.result && shot1.result.data)) : null;
  if (data1) {
    fs.writeFileSync(path.join(ROOT_DIR, 'scratch/mobile_hero_video_playing.png'), Buffer.from(data1, 'base64'));
    console.log('Saved scratch/mobile_hero_video_playing.png');
  }

  // Test 2: Refresh Behavior (Session storage flag set, intro should be skipped, video plays immediately)
  console.log('\n--- TEST 2: Mobile Page Refresh (Direct Video Playback) ---');
  await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
  await sleep(3500);

  let state2 = await evalJson(`JSON.stringify({
    skipIntroClass: document.documentElement.classList.contains('skip-intro'),
    logoIntroDisplay: document.getElementById('avenue-intro') ? getComputedStyle(document.getElementById('avenue-intro')).display : null,
    videoPaused: document.querySelector('.hero-video-bg') ? document.querySelector('.hero-video-bg').paused : null,
    videoCurrentTime: document.querySelector('.hero-video-bg') ? document.querySelector('.hero-video-bg').currentTime : null,
    wrapperOpacity: document.querySelector('.hero-video-wrapper') ? getComputedStyle(document.querySelector('.hero-video-wrapper')).opacity : null
  })`);
  console.log('Refresh State:', state2);

  // Test 3: Desktop Viewport (1280x800)
  console.log('\n--- TEST 3: Desktop Viewport (1280x800) Check ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
  await sleep(3500);

  let state3 = await evalJson(`JSON.stringify({
    desktopVideoPaused: document.querySelector('.hero-video-bg') ? document.querySelector('.hero-video-bg').paused : null,
    desktopVideoCurrentTime: document.querySelector('.hero-video-bg') ? document.querySelector('.hero-video-bg').currentTime : null,
    desktopVideoWrapperDisplay: document.querySelector('.hero-video-wrapper') ? getComputedStyle(document.querySelector('.hero-video-wrapper')).display : null,
    desktopMobileWelcomeDisplay: document.querySelector('.hero-mobile-welcome') ? getComputedStyle(document.querySelector('.hero-mobile-welcome')).display : null,
    hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
  })`);
  console.log('Desktop State:', state3);

  const shotDesktop = await send('Page.captureScreenshot', { format: 'png' });
  const dataDesktop = shotDesktop ? (shotDesktop.data || (shotDesktop.result && shotDesktop.result.data)) : null;
  if (dataDesktop) {
    fs.writeFileSync(path.join(ROOT_DIR, 'scratch/desktop_hero_video_playing.png'), Buffer.from(dataDesktop, 'base64'));
    console.log('Saved scratch/desktop_hero_video_playing.png');
  }

  ws.close();
  edge.kill();
  server.close();
  console.log('\nAll tests completed successfully!');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
