import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const publicDir = join(rootDir, "public");

function loadLocalEnv(fileName) {
  const filePath = join(rootDir, fileName);
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv(".env");
loadLocalEnv(".env.local");

const { handleApiRequest, sendJson } = await import("./core.mjs");

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  try {
    if (await handleApiRequest(req, res, url.pathname)) {
      return;
    }

    if (req.method === "GET") {
      if (url.pathname === "/favicon.ico") {
        res.writeHead(204);
        res.end();
        return;
      }

      const requestedName = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      const fileName = requestedName.includes(".") ? requestedName : "index.html";
      const filePath = join(publicDir, fileName);
      const content = await readFile(filePath);
      const contentType = fileName.endsWith(".css")
        ? "text/css; charset=utf-8"
        : fileName.endsWith(".js")
          ? "text/javascript; charset=utf-8"
          : "text/html; charset=utf-8";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Unknown error" });
  }
});

server.listen(port, host, () => {
  console.log(`Local book service is running at http://${host}:${port}`);
});
