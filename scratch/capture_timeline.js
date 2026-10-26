const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const baseDir = 'd:\\INTERNSHIPS\\SOCIAL MEDIA MANANGMENT[SKILLNEX]\\WEBSITES\\AvenueBuilders';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join(baseDir, 'scratch', 'timeline_shots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const edge = spawn(edgePath, [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--window-size=1400,900',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  http.get('http://localhost:9222/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      const pages = JSON.parse(data);
      const wsUrl = pages[0].webSocketDebuggerUrl;
      console.log('Connecting to ws:', wsUrl);

      const ws = new WebSocket(wsUrl);
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
        console.log('WS connected. Navigating...');
        await send('Page.enable');
        await send('Page.navigate', { url: 'http://localhost:8080/index.html' });

        const capture = async (name, delayMs) => {
          await new Promise(r => setTimeout(r, delayMs));
          const res = await send('Page.captureScreenshot', { format: 'png' });
          if (res.result && res.result.data) {
            const buf = Buffer.from(res.result.data, 'base64');
            const filePath = path.join(outDir, name);
            fs.writeFileSync(filePath, buf);
            console.log(`Saved ${name} (${buf.length} bytes)`);
          }
        };

        // Capture timeline:
        // Delay 1.0s (t = 1.0s) -> Ink strokes drawing
        await capture('stage1_logo_strokes_1s.png', 1000);
        // Delay 1.6s more (t = 2.6s) -> Full color logo reveal
        await capture('stage1_logo_color_2_6s.png', 1600);
        // Delay 1.6s more (t = 4.2s) -> Cloud intro active
        await capture('stage2_clouds_active_4_2s.png', 1600);
        // Delay 2.5s more (t = 6.7s) -> Cloud fading into hero video
        await capture('stage2_clouds_fading_6_7s.png', 2500);
        // Delay 1.8s more (t = 8.5s) -> Hero video active
        await capture('stage3_hero_video_8_5s.png', 1800);

        console.log('All screenshots captured!');
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
