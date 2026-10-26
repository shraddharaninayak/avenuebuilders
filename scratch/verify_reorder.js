const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const baseDir = 'd:\\INTERNSHIPS\\SOCIAL MEDIA MANANGMENT[SKILLNEX]\\WEBSITES\\AvenueBuilders';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outPath = path.join(baseDir, 'scratch', 'reordered_legacy_projects.png');

async function run() {
  const edge = spawn(edgePath, [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9223',
    '--window-size=1400,900',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  http.get('http://localhost:9223/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      const pages = JSON.parse(data);
      const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
      let id = 1;
      const callbacks = {};

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && callbacks[msg.id]) {
          callbacks[msg.id](msg);
          delete callbacks[msg.id];
        }
      };

      const send = (method, params = {}) => {
        return new Promise((resolve) => {
          const reqId = id++;
          callbacks[reqId] = resolve;
          ws.send(JSON.stringify({ id: reqId, method, params }));
        });
      };

      ws.onopen = async () => {
        await send('Page.enable');
        await send('Page.navigate', { url: 'http://localhost:8080/projects.html' });
        await new Promise(r => setTimeout(r, 2000));

        // Scroll to legacy section
        await send('Runtime.evaluate', {
          expression: `
            const el = document.querySelector('.delivered-gallery-grid');
            if (el) el.scrollIntoView();
          `
        });
        await new Promise(r => setTimeout(r, 1000));

        const res = await send('Page.captureScreenshot', { format: 'png' });
        if (res.result && res.result.data) {
          const buf = Buffer.from(res.result.data, 'base64');
          fs.writeFileSync(outPath, buf);
          console.log(`Saved screenshot to ${outPath} (${buf.length} bytes)`);
        }

        ws.close();
        edge.kill();
        process.exit(0);
      };
    });
  });
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
