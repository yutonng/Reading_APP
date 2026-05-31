import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createServer } from "node:net";
import { networkInterfaces } from "node:os";
import { join } from "node:path";

const localHome = join(process.cwd(), ".local-home");
mkdirSync(localHome, { recursive: true });

function getLanAddress() {
  const interfaces = networkInterfaces();

  for (const values of Object.values(interfaces)) {
    for (const value of values || []) {
      if (value.family === "IPv4" && !value.internal) {
        return value.address;
      }
    }
  }

  return "127.0.0.1";
}

function findOpenPort(startPort) {
  return new Promise((resolve) => {
    function tryPort(port) {
      const server = createServer();

      server.once("error", () => tryPort(port + 1));
      server.once("listening", () => {
        server.close(() => resolve(String(port)));
      });
      server.listen(port, "0.0.0.0");
    }

    tryPort(startPort);
  });
}

const lanAddress = getLanAddress();
const apiPort = process.env.PORT || (await findOpenPort(8787));
const metroPort = process.env.EXPO_PORT || (await findOpenPort(8081));
const apiUrl = `http://${lanAddress}:${apiPort}`;
const env = {
  ...process.env,
  EXPO_NO_TELEMETRY: "1",
  EXPO_PUBLIC_API_URL: apiUrl,
  HOME: localHome,
  HOST: "0.0.0.0",
  PORT: apiPort,
  npm_config_cache: "/private/tmp/reading-app-npm-cache"
};

console.log(`Book service for phone: ${apiUrl}`);
console.log(`Expo Metro port: ${metroPort}`);

const children = [
  spawn("node", ["server/local-api.mjs"], {
    stdio: "inherit",
    env
  }),
  spawn("npx", ["expo", "start", "--lan", "--port", metroPort], {
    stdio: "inherit",
    env
  })
];

function shutdown() {
  for (const child of children) {
    child.kill("SIGTERM");
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
