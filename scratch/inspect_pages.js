const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const edgeExe = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

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
    if (!pageTab) throw new Error('No page tab found');

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

    const pagesToCheck = ['index.html', 'about.html', 'services.html', 'projects.html', 'contact.html'];
    const widths = [360, 390, 768, 1280];

    for (const pageName of pagesToCheck) {
      console.log(`\n=================== CHECKING ${pageName} ===================`);
      await send('Page.navigate', { url: `http://localhost:8085/${pageName}` });
      await new Promise(r => setTimeout(r, 1000));

      for (const width of widths) {
        await send('Emulation.setDeviceMetricsOverride', {
          width: width,
          height: 844,
          deviceScaleFactor: 2,
          mobile: width < 768
        });
        await new Promise(r => setTimeout(r, 500));

        const evalResult = await send('Runtime.evaluate', {
          expression: `(() => {
            const docWidth = document.documentElement.clientWidth;
            const scrollWidth = document.documentElement.scrollWidth;
            const bodyScrollWidth = document.body.scrollWidth;
            const bodyClientWidth = document.body.clientWidth;
            const overflowing = [];
            document.querySelectorAll('*').forEach(el => {
              const rect = el.getBoundingClientRect();
              if (rect.right > docWidth + 1.5 || rect.left < -1.5) {
                // Ignore elements with display:none or zero size or fixed elements like hidden nav
                if (rect.width > 0 && rect.height > 0) {
                  const style = window.getComputedStyle(el);
                  if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                    overflowing.push({
                      tag: el.tagName,
                      id: el.id,
                      className: typeof el.className === 'string' ? el.className.slice(0, 50) : '',
                      rect: { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }
                    });
                  }
                }
              }
            });
            return {
              viewportWidth: docWidth,
              docScrollWidth: scrollWidth,
              bodyScrollWidth: bodyScrollWidth,
              hasOverflow: scrollWidth > docWidth,
              overflowCount: overflowing.length,
              sampleOverflows: overflowing.slice(0, 5)
            };
          })()`,
          returnByValue: true
        });

        const res = evalResult.result.value;
        console.log(`[Width: ${width}px] Overflow: ${res.hasOverflow ? 'YES (scrollWidth=' + res.docScrollWidth + ' vs viewport=' + res.viewportWidth + ')' : 'NO'}`);
        if (res.hasOverflow) {
          console.log(`  Overflowing elements (${res.overflowCount}):`, JSON.stringify(res.sampleOverflows, null, 2));
        }
      }
    }

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    edgeProc.kill();
  }
}

run();
