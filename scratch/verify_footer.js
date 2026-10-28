const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = 'd:\\INTERNSHIPS\\SOCIAL MEDIA MANANGMENT[SKILLNEX]\\WEBSITES\\AvenueBuilders\\scratch\\temp_edge_footer_verify';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function run() {
  const edge = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  await sleep(2000);

  const listRes = await fetch('http://localhost:9225/json');
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

  // Set mobile device metrics (390 x 844 iPhone 12/13/14)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  const outDir = 'd:\\INTERNSHIPS\\SOCIAL MEDIA MANANGMENT[SKILLNEX]\\WEBSITES\\AvenueBuilders\\scratch\\footer_verification';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Check index.html hero section
  console.log('Capturing index.html mobile hero...');
  await send('Page.navigate', { url: 'http://localhost:8086/index.html' });
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

  const heroShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'mobile_home_hero.png'), Buffer.from(heroShot.data, 'base64'));
  console.log('Saved mobile_home_hero.png');

  // 2. Capture mobile footer on index.html
  console.log('Capturing index.html mobile footer...');
  await send('Runtime.evaluate', {
    expression: `window.scrollTo(0, document.body.scrollHeight);`
  });
  await sleep(1500);
  const indexFooterShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'mobile_index_footer.png'), Buffer.from(indexFooterShot.data, 'base64'));
  console.log('Saved mobile_index_footer.png');

  // 3. Capture about.html mobile footer
  console.log('Capturing about.html mobile footer...');
  await send('Page.navigate', { url: 'http://localhost:8086/about.html' });
  await sleep(2000);
  await send('Runtime.evaluate', {
    expression: `window.scrollTo(0, document.body.scrollHeight);`
  });
  await sleep(1500);
  const aboutFooterShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'mobile_about_footer.png'), Buffer.from(aboutFooterShot.data, 'base64'));
  console.log('Saved mobile_about_footer.png');

  // 4. Capture projects.html mobile footer
  console.log('Capturing projects.html mobile footer...');
  await send('Page.navigate', { url: 'http://localhost:8086/projects.html' });
  await sleep(2000);
  await send('Runtime.evaluate', {
    expression: `window.scrollTo(0, document.body.scrollHeight);`
  });
  await sleep(1500);
  const projectsFooterShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'mobile_projects_footer.png'), Buffer.from(projectsFooterShot.data, 'base64'));
  console.log('Saved mobile_projects_footer.png');

  // 5. Capture services.html mobile footer
  console.log('Capturing services.html mobile footer...');
  await send('Page.navigate', { url: 'http://localhost:8086/services.html' });
  await sleep(2000);
  await send('Runtime.evaluate', {
    expression: `window.scrollTo(0, document.body.scrollHeight);`
  });
  await sleep(1500);
  const servicesFooterShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'mobile_services_footer.png'), Buffer.from(servicesFooterShot.data, 'base64'));
  console.log('Saved mobile_services_footer.png');

  // 6. Capture contact.html mobile footer
  console.log('Capturing contact.html mobile footer...');
  await send('Page.navigate', { url: 'http://localhost:8086/contact.html' });
  await sleep(2000);
  await send('Runtime.evaluate', {
    expression: `window.scrollTo(0, document.body.scrollHeight);`
  });
  await sleep(1500);
  const contactFooterShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'mobile_contact_footer.png'), Buffer.from(contactFooterShot.data, 'base64'));
  console.log('Saved mobile_contact_footer.png');

  // 7. Capture portfolio.html mobile footer
  console.log('Capturing portfolio.html mobile footer...');
  await send('Page.navigate', { url: 'http://localhost:8086/portfolio.html' });
  await sleep(2000);
  await send('Runtime.evaluate', {
    expression: `window.scrollTo(0, document.body.scrollHeight);`
  });
  await sleep(1500);
  const portfolioFooterShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'mobile_portfolio_footer.png'), Buffer.from(portfolioFooterShot.data, 'base64'));
  console.log('Saved mobile_portfolio_footer.png');

  edge.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
