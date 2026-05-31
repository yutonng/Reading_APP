import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { Socket } from "node:net";

const localHome = join(process.cwd(), ".local-home");
mkdirSync(localHome, { recursive: true });

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = new Socket();
    socket.setTimeout(300);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
    socket.connect(port, "127.0.0.1");
  });
}

const children = [];

if (!(await isPortOpen(8787))) {
  children.push(spawn("node", ["server/local-api.mjs"], { stdio: "inherit" }));
}

children.push(
  spawn("npx", ["expo", "start", "--web", "--port", "8081"], {
    stdio: "inherit",
    env: {
      ...process.env,
      HOME: localHome,
      EXPO_NO_TELEMETRY: "1",
      npm_config_cache: "/private/tmp/reading-app-npm-cache"
    }
  })
);

function shutdown() {
  for (const child of children) {
    child.kill("SIGTERM");
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
