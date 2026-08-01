#!/usr/bin/env node

const { spawn } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");

const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2];
const outDirArg = process.argv[3];

if (!url) {
  console.error("Usage: node tools/responsive-check.js <url>");
  process.exit(1);
}

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 }
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJson(endpoint, attempts = 50) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) return response.json();
    } catch (error) {
      // Keep waiting for Chrome.
    }
    await delay(100);
  }
  throw new Error(`Chrome endpoint did not respond: ${endpoint}`);
}

class CdpClient {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.readyPromise = this.connect(wsUrl);
  }

  async connect(wsUrl) {
    const parsed = new URL(wsUrl);
    this.socket = net.createConnection({ host: parsed.hostname, port: Number(parsed.port) });
    this.buffer = Buffer.alloc(0);
    this.handshakeDone = false;

    await new Promise((resolve, reject) => {
      this.socket.once("connect", resolve);
      this.socket.once("error", reject);
    });

    const key = crypto.randomBytes(16).toString("base64");
    this.socket.write([
      `GET ${parsed.pathname}${parsed.search} HTTP/1.1`,
      `Host: ${parsed.host}`,
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Key: ${key}`,
      "Sec-WebSocket-Version: 13",
      "",
      ""
    ].join("\r\n"));

    await new Promise((resolve, reject) => {
      const onData = (chunk) => {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        const marker = this.buffer.indexOf("\r\n\r\n");
        if (marker !== -1) {
          const head = this.buffer.slice(0, marker).toString("utf8");
          if (!head.includes("101")) {
            reject(new Error(`WebSocket handshake failed: ${head}`));
            return;
          }
          this.buffer = this.buffer.slice(marker + 4);
          this.handshakeDone = true;
          this.socket.off("data", onData);
          this.socket.on("data", (data) => this.handleData(data));
          if (this.buffer.length) {
            this.handleData(Buffer.alloc(0));
          }
          resolve();
        }
      };
      this.socket.on("data", onData);
      this.socket.once("error", reject);
    });
  }

  handleData(chunk) {
    if (chunk.length) this.buffer = Buffer.concat([this.buffer, chunk]);

    while (this.buffer.length >= 2) {
      const first = this.buffer[0];
      const second = this.buffer[1];
      const opcode = first & 0x0f;
      let length = second & 0x7f;
      let offset = 2;
      if (length === 126) {
        if (this.buffer.length < offset + 2) return;
        length = this.buffer.readUInt16BE(offset);
        offset += 2;
      } else if (length === 127) {
        if (this.buffer.length < offset + 8) return;
        const high = this.buffer.readUInt32BE(offset);
        const low = this.buffer.readUInt32BE(offset + 4);
        length = high * 2 ** 32 + low;
        offset += 8;
      }
      if (this.buffer.length < offset + length) return;
      const payload = this.buffer.slice(offset, offset + length);
      this.buffer = this.buffer.slice(offset + length);

      if (opcode === 8) {
        this.close();
        return;
      }
      if (opcode !== 1) continue;

      const data = JSON.parse(payload.toString("utf8"));
      if (data.id && this.pending.has(data.id)) {
        const { resolve, reject } = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      }
    }
  }

  frame(text) {
    const payload = Buffer.from(text, "utf8");
    const mask = crypto.randomBytes(4);
    let header;
    if (payload.length < 126) {
      header = Buffer.from([0x81, 0x80 | payload.length]);
    } else if (payload.length < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(payload.length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 0x80 | 127;
      header.writeUInt32BE(0, 2);
      header.writeUInt32BE(payload.length, 6);
    }
    const masked = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i += 1) {
      masked[i] = payload[i] ^ mask[i % 4];
    }
    return Buffer.concat([header, mask, masked]);
  }

  async send(method, params = {}) {
    await this.readyPromise;
    const id = this.nextId;
    this.nextId += 1;
    const result = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.socket.write(this.frame(JSON.stringify({ id, method, params })));
    return result;
  }

  close() {
    if (this.socket && !this.socket.destroyed) this.socket.destroy();
  }
}

async function runViewport(viewport, outDir) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), `neb-cdp-${viewport.name}-`));
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    `--user-data-dir=${userDataDir}`,
    `--remote-debugging-port=${port}`,
    "about:blank"
  ], { stdio: "ignore" });

  let client;
  try {
    const tabs = await waitForJson(`http://127.0.0.1:${port}/json`);
    const tab = tabs.find((item) => item.type === "page") || tabs[0];
    client = new CdpClient(tab.webSocketDebuggerUrl);
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width < 768
    });
    await client.send("Page.navigate", { url });
    await delay(3500);
    const expression = `(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const bodyWidth = document.body ? document.body.scrollWidth : 0;
      const docWidth = document.documentElement.scrollWidth;
      const overflow = [];
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const rect = el.getBoundingClientRect();
        if (rect.width > viewportWidth + 1 || rect.right > viewportWidth + 1 || rect.left < -1) {
          overflow.push({
            tag: el.tagName.toLowerCase(),
            cls: String(el.className || '').slice(0, 160),
            id: el.id || '',
            text: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 80),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width)
          });
        }
        if (overflow.length >= 20) break;
      }
      const toggle = document.querySelector('.elementor-menu-toggle');
      const navMenu = document.querySelector('.elementor-widget-nav-menu');
      return {
        viewportWidth,
        bodyWidth,
        docWidth,
        hasHorizontalOverflow: Math.max(bodyWidth, docWidth) > viewportWidth + 1,
        toggle: toggle ? {
          visible: getComputedStyle(toggle).display !== 'none' && getComputedStyle(toggle).visibility !== 'hidden',
          rect: (() => { const r = toggle.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) }; })()
        } : null,
        navMenu: navMenu ? (() => { const r = navMenu.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) }; })() : null,
        overflow
      };
    })()`;
    const result = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    let screenshot = null;
    if (outDir) {
      fs.mkdirSync(outDir, { recursive: true });
      const shot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      screenshot = path.join(outDir, `responsive-${viewport.name}.png`);
      fs.writeFileSync(screenshot, Buffer.from(shot.data, "base64"));
    }
    return { name: viewport.name, width: viewport.width, height: viewport.height, screenshot, ...result.result.value };
  } finally {
    if (client) client.close();
    chrome.kill();
  }
}

(async () => {
  const results = [];
  const outDir = outDirArg ? path.resolve(outDirArg) : null;
  for (const viewport of viewports) {
    results.push(await runViewport(viewport, outDir));
  }
  if (outDir) {
    fs.writeFileSync(path.join(outDir, "responsive-report.json"), `${JSON.stringify(results, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
