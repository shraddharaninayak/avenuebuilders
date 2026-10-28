const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = 'd:\\INTERNSHIPS\\SOCIAL MEDIA MANANGMENT[SKILLNEX]\\WEBSITES\\AvenueBuilders\\scratch\\temp_edge_hero_recreate';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const edge = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  await sleep(2000);

  const listRes = await fetch('http://localhost:9227/json');
  const tabs = await listRes.json();
  const pageTab = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  const callbacks = new Map();

  ws.onmessage = evt => {
    const parsed = JSON.parse(evt.data);
    if (parsed.id && callbacks.has(parsed.id)) {
      const cb = callbacks.get(parsed.id);
      callbacks.delete(parsed.id);
      cb(parsed.result);
    }
  };

  function send(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const outDir = 'd:\\INTERNSHIPS\\SOCIAL MEDIA MANANGMENT[SKILLNEX]\\WEBSITES\\AvenueBuilders\\scratch\\hero_recreate_verification';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Mobile 390x844 (iPhone 12/13/14)
  console.log('Capturing mobile 390x844...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  await send('Page.navigate', { url: 'http://localhost:8087/index.html' });
  await sleep(2000);

  await send('Runtime.evaluate', {
    expression: `
      const intro = document.getElementById('avenue-intro');
      if (intro) intro.remove();
      const cloud = document.getElementById('cloudIntro');
      if (cloud) cloud.remove();
      document.documentElement.classList.add('skip-intro');
      document.body.classList.remove('intro-active');
      window.scrollTo(0, 0);
    `
  });
  await sleep(1500);

  const mobileShot390 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'mobile_hero_390.png'), Buffer.from(mobileShot390.data, 'base64'));
  console.log('Saved mobile_hero_390.png');

  // Check horizontal overflow
  const evalOverflow = await send('Runtime.evaluate', {
    expression: `
      ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
    `,
    returnByValue: true
  });
  console.log('Mobile 390 overflow check:', evalOverflow.result.value);

  // 2. Mobile 360x780 (Android Galaxy)
  console.log('Capturing mobile 360x780...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 780,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sleep(1000);

  const mobileShot360 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'mobile_hero_360.png'), Buffer.from(mobileShot360.data, 'base64'));
  console.log('Saved mobile_hero_360.png');

  // 3. Desktop 1280x800 check
  console.log('Capturing desktop 1280x800...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });
  await sleep(1500);

  const desktopShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'desktop_hero_1280.png'), Buffer.from(desktopShot.data, 'base64'));
  console.log('Saved desktop_hero_1280.png');

  edge.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
