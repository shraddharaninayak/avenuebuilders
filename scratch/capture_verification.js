const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgeExe = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outDir = "d:\\INTERNSHIPS\\SOCIAL MEDIA MANANGMENT[SKILLNEX]\\WEBSITES\\AvenueBuilders\\scratch\\verification_shots";

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const edgeProc = spawn(edgeExe, [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--window-size=390,844',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://localhost:9222/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.type === 'page');

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === msgId) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');

    async function capture(pageName, width, height, filename, fullPage = false) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: width,
        height: height,
        deviceScaleFactor: 2,
        mobile: width < 768
      });
      await send('Page.navigate', { url: `http://localhost:8085/${pageName}` });
      await new Promise(r => setTimeout(r, 1200));

      // Make sure all fade-up elements are active for full page capture
      await send('Runtime.evaluate', {
        expression: `document.querySelectorAll('.fadeUpAnimation, .project-card, .service-card, .project-editorial-feature, .delivered-card, .home-trio-card, .about-pillar-row, .director-editorial-item, .service-detail-row').forEach(el => el.classList.add('active'));`
      });
      await new Promise(r => setTimeout(r, 300));

      const screenshotParams = { format: 'png' };
      if (fullPage) {
        screenshotParams.captureBeyondViewport = true;
      }

      const shot = await send('Page.captureScreenshot', screenshotParams);
      const filePath = path.join(outDir, filename);
      fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    }

    // 1. About page mobile full page
    await capture('about.html', 390, 844, 'about_mobile_full.png', true);

    // 2. Services page mobile full page
    await capture('services.html', 390, 844, 'services_mobile_full.png', true);

    // 3. Index page mobile closing CTA section
    await capture('index.html', 390, 844, 'index_mobile_full.png', true);

    // 4. Desktop about
    await capture('about.html', 1280, 800, 'about_desktop_hero.png', false);

    // 5. Desktop services
    await capture('services.html', 1280, 800, 'services_desktop_hero.png', false);

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    edgeProc.kill();
  }
}

run();
