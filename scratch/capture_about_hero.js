const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8098;
const CDP_PORT = 9252;
const ROOT = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let decoded = decodeURIComponent(req.url.split('?')[0]);
  if (decoded === '/') decoded = '/about.html';
  const filePath = path.join(ROOT, decoded);
  if (!fs.existsSync(filePath)) { res.statusCode = 404; return res.end(); }
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${path.join(ROOT, 'scratch', 'temp_edge_user4')}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1400,1200',
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
      const hero = document.querySelector('.about-hero-section');
      const h1Eyebrow = document.querySelector('.about-hero-eyebrow');
      const storyEyebrow = document.querySelector('.story-eyebrow');
      const mediaWrap = document.querySelector('.about-hero-media-wrap');
      const img = document.querySelector('.about-hero-media-wrap img');

      const csHero = getComputedStyle(hero);
      const cs1 = getComputedStyle(h1Eyebrow);
      const cs2 = getComputedStyle(storyEyebrow);
      const csImg = getComputedStyle(img);

      const rHero = hero.getBoundingClientRect();
      const r1 = h1Eyebrow.getBoundingClientRect();
      const r2 = storyEyebrow.getBoundingClientRect();
      const rWrap = mediaWrap.getBoundingClientRect();
      const rImg = img.getBoundingClientRect();

      return JSON.stringify({
        hero: { rect: { x: rHero.x, y: rHero.y, width: rHero.width, height: rHero.height } },
        heroEyebrow: {
          text: h1Eyebrow.innerText,
          color: cs1.color,
          fontWeight: cs1.fontWeight,
          fontSize: cs1.fontSize,
          rect: { x: r1.x, y: r1.y, width: r1.width, height: r1.height }
        },
        storyEyebrow: {
          text: storyEyebrow.innerText,
          color: cs2.color,
          fontWeight: cs2.fontWeight,
          fontSize: cs2.fontSize,
          rect: { x: r2.x, y: r2.y, width: r2.width, height: r2.height }
        },
        img: {
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          objectFit: csImg.objectFit,
          rect: { x: rImg.x, y: rImg.y, width: rImg.width, height: rImg.height }
        },
        mediaWrap: {
          rect: { x: rWrap.x, y: rWrap.y, width: rWrap.width, height: rWrap.height }
        }
      });
    })()`
  });

  const parsed = JSON.parse(info.result.value);
  console.log('Inspection data:', JSON.stringify(parsed, null, 2));

  // Screenshot hero section
  const heroClip = {
    x: 0,
    y: Math.max(0, parsed.hero.rect.y),
    width: 1400,
    height: Math.min(1000, parsed.hero.rect.height + 100),
    scale: 1
  };
  const snapHero = await send('Page.captureScreenshot', { format: 'png', clip: heroClip });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_hero_section.png'), Buffer.from(snapHero.data, 'base64'));

  // Screenshot the entire hero + story
  const fullHeroStoryClip = {
    x: 0,
    y: Math.max(0, parsed.hero.rect.y),
    width: 1400,
    height: 1100,
    scale: 1
  };
  const snapFull = await send('Page.captureScreenshot', { format: 'png', clip: fullHeroStoryClip });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_hero_and_story.png'), Buffer.from(snapFull.data, 'base64'));

  // Close-up of building image
  const imgClip = {
    x: Math.max(0, parsed.mediaWrap.rect.x - 20),
    y: Math.max(0, parsed.mediaWrap.rect.y - 20),
    width: parsed.mediaWrap.rect.width + 40,
    height: parsed.mediaWrap.rect.height + 40,
    scale: 1
  };
  const snapImg = await send('Page.captureScreenshot', { format: 'png', clip: imgClip });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_building_closeup.png'), Buffer.from(snapImg.data, 'base64'));

  // Mobile screenshot
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 600));

  const mobileInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const hero = document.querySelector('.about-hero-section');
      const r = hero.getBoundingClientRect();
      return JSON.stringify({ y: r.y, height: r.height });
    })()`
  });
  const mParsed = JSON.parse(mobileInfo.result.value);

  const snapMobile = await send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: 0,
      y: Math.max(0, mParsed.y),
      width: 390,
      height: 750,
      scale: 1
    }
  });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'verified_hero_mobile.png'), Buffer.from(snapMobile.data, 'base64'));

  ws.close();
  try { edgeProc.kill(); } catch (e) {}
  server.close();
  console.log('All verification captures saved successfully!');
  process.exit(0);
});
