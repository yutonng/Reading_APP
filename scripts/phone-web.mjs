import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";

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

const port = process.env.PORT || "8791";
const lanAddress = getLanAddress();

console.log(`Open this on your phone: http://${lanAddress}:${port}`);

spawn("node", ["server/local-api.mjs"], {
  stdio: "inherit",
  env: {
    ...process.env,
    HOST: "0.0.0.0",
    PORT: port
  }
});
