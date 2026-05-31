import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const dataPath = join(rootDir, "data", "books.json");
const publicDir = join(rootDir, "public");
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";

async function readBooks() {
  const raw = await readFile(dataPath, "utf8");
  return JSON.parse(raw);
}

async function writeBooks(payload) {
  await writeFile(dataPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function slugifyId(title) {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "book"}-${Date.now()}`;
}

function parseSections(content) {
  return content
    .split(/\n\s*\n/g)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `s${index + 1}`,
      text
    }));
}

function getBookIdFromPath(pathname) {
  const match = pathname.match(/^\/books\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function validateBookBody(body) {
  const title = String(body.title || "").trim();
  const author = String(body.author || "").trim();
  const summary = String(body.summary || "").trim();
  const content = String(body.content || "").trim();

  if (!title || !author || !summary || !content) {
    return { error: "书名、作者、简介和内容都需要填写。" };
  }

  return { title, author, summary, content };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  try {
    if (req.method === "GET" && url.pathname === "/books") {
      sendJson(res, 200, await readBooks());
      return;
    }

    if (req.method === "POST" && url.pathname === "/books") {
      const body = JSON.parse(await readBody(req));
      const fields = validateBookBody(body);

      if (fields.error) {
        sendJson(res, 400, { error: fields.error });
        return;
      }

      const current = await readBooks();
      const now = new Date().toISOString();
      const book = {
        id: body.id || slugifyId(fields.title),
        title: fields.title,
        author: fields.author,
        summary: fields.summary,
        sections: parseSections(fields.content),
        createdAt: now,
        updatedAt: now
      };

      await writeBooks({ books: [book, ...current.books] });
      sendJson(res, 201, book);
      return;
    }

    const bookId = getBookIdFromPath(url.pathname);

    if (bookId && req.method === "PUT") {
      const body = JSON.parse(await readBody(req));
      const fields = validateBookBody(body);

      if (fields.error) {
        sendJson(res, 400, { error: fields.error });
        return;
      }

      const current = await readBooks();
      const existing = current.books.find((book) => book.id === bookId);

      if (!existing) {
        sendJson(res, 404, { error: "没有找到这本书。" });
        return;
      }

      const updated = {
        ...existing,
        title: fields.title,
        author: fields.author,
        summary: fields.summary,
        sections: parseSections(fields.content),
        updatedAt: new Date().toISOString()
      };

      await writeBooks({
        books: current.books.map((book) => (book.id === bookId ? updated : book))
      });
      sendJson(res, 200, updated);
      return;
    }

    if (bookId && req.method === "DELETE") {
      const current = await readBooks();
      const nextBooks = current.books.filter((book) => book.id !== bookId);

      if (nextBooks.length === current.books.length) {
        sendJson(res, 404, { error: "没有找到这本书。" });
        return;
      }

      await writeBooks({ books: nextBooks });
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET") {
      const fileName = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
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
