import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { handleApiRequest, sendJson } from "./core.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const publicDir = join(rootDir, "public");
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  try {
    if (await handleApiRequest(req, res, url.pathname)) {
      return;
    }

    if (req.method === "GET") {
      const requestedName = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      const fileName = requestedName.includes(".") ? requestedName : "index.html";
      const filePath = join(publicDir, fileName);
      const content = await readFile(filePath);
      const contentType = fileName.endsWith(".css")
        ? "text/css; charset=utf-8"
        : fileName.endsWith(".js")
          ? "text/javascript; charset=utf-8"
          : fileName.endsWith(".png")
            ? "image/png"
            : fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")
              ? "image/jpeg"
              : fileName.endsWith(".webp")
                ? "image/webp"
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
