const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = 'd:\\INTERNSHIPS\\SOCIAL MEDIA MANANGMENT[SKILLNEX]\\WEBSITES\\AvenueBuilders\\scratch\\temp_edge_footer_verify2';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const edge = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  await sleep(2000);

  const listRes = await fetch('http://localhost:9226/json');
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

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  const outDir = 'd:\\INTERNSHIPS\\SOCIAL MEDIA MANANGMENT[SKILLNEX]\\WEBSITES\\AvenueBuilders\\scratch\\footer_verification';

  console.log('Capturing desktop index footer...');
  await send('Page.navigate', { url: 'http://localhost:8086/index.html' });
  await sleep(2000);
  await send('Runtime.evaluate', {
    expression: `
      const intro = document.getElementById('avenue-intro');
      if (intro) intro.remove();
      const cloud = document.getElementById('cloudIntro');
      if (cloud) cloud.remove();
      window.scrollTo(0, document.body.scrollHeight);
    `
  });
  await sleep(1500);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'desktop_index_footer.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved desktop_index_footer.png');

  edge.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
