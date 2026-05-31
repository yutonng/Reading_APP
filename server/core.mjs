import { get, put } from "@vercel/blob";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const defaultDataPath = join(rootDir, "data", "books.json");
const dataPath = process.env.DATA_PATH || defaultDataPath;
const blobPath = process.env.BOOKS_BLOB_PATH || "data/books.json";
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const sessionSecret = process.env.ADMIN_SESSION_SECRET || "local-development-secret";

export function sendJson(res, status, payload, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...headers
  });
  res.end(JSON.stringify(payload));
}

export function sendNoContent(res, status = 204, headers = {}) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...headers
  });
  res.end();
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body ? JSON.parse(body) : {}));
    req.on("error", reject);
  });
}

export function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie || "";

  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key) {
      cookies[key] = decodeURIComponent(value.join("="));
    }
  }

  return cookies;
}

export function isEqualString(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function sign(value) {
  return createHmac("sha256", sessionSecret).update(value).digest("base64url");
}

function createSessionToken() {
  const payload = Buffer.from(
    JSON.stringify({
      id: randomBytes(16).toString("hex"),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    })
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function isAuthenticated(req) {
  const token = parseCookies(req).admin_session;

  if (!token) {
    return false;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature || !isEqualString(signature, sign(payload))) {
    return false;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number(session.exp) > Date.now();
  } catch {
    return false;
  }
}

export function requireAdmin(req, res) {
  if (isAuthenticated(req)) {
    return true;
  }

  sendJson(res, 401, { error: "需要登录后台。" });
  return false;
}

export function login(req, res, body) {
  const username = String(body.username || "");
  const password = String(body.password || "");

  if (!isEqualString(username, adminUsername) || !isEqualString(password, adminPassword)) {
    sendJson(res, 401, { error: "账号或密码不正确。" });
    return;
  }

  sendJson(res, 200, { authenticated: true }, {
    "Set-Cookie": `admin_session=${encodeURIComponent(createSessionToken())}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
  });
}

export function logout(res) {
  sendNoContent(res, 204, {
    "Set-Cookie": "admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
  });
}

async function readSeedBooks() {
  const raw = await readFile(defaultDataPath, "utf8");
  return JSON.parse(raw);
}

async function readBooksFromFile() {
  try {
    const raw = await readFile(dataPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }

    const seed = await readSeedBooks();
    await writeBooksToFile(seed);
    return seed;
  }
}

async function writeBooksToFile(payload) {
  await mkdir(dirname(dataPath), { recursive: true });
  await writeFile(dataPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function readBooksFromBlob() {
  try {
    const result = await get(blobPath, { access: "private" });
    if (!result || result.statusCode !== 200) {
      throw new Error("Blob not found");
    }

    const raw = await new Response(result.stream).text();
    return JSON.parse(raw);
  } catch (error) {
    if (error?.name !== "BlobNotFoundError" && !String(error?.message || "").includes("not found")) {
      throw error;
    }

    const seed = await readSeedBooks();
    await writeBooksToBlob(seed);
    return seed;
  }
}

async function writeBooksToBlob(payload) {
  await put(blobPath, JSON.stringify(payload, null, 2), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true
  });
}

export async function readBooks() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return readBooksFromBlob();
  }

  return readBooksFromFile();
}

export async function writeBooks(payload) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await writeBooksToBlob(payload);
    return;
  }

  await writeBooksToFile(payload);
}

export function slugifyId(title) {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "book"}-${Date.now()}`;
}

export function parseSections(content) {
  return content
    .split(/\n\s*\n/g)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `s${index + 1}`,
      text
    }));
}

export function getBookIdFromPath(pathname) {
  const match = pathname.match(/^\/(?:api\/)?books\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function validateBookBody(body) {
  const title = String(body.title || "").trim();
  const author = String(body.author || "").trim();
  const summary = String(body.summary || "").trim();
  const content = String(body.content || "").trim();

  if (!title || !author || !summary || !content) {
    return { error: "书名、作者、简介和内容都需要填写。" };
  }

  return { title, author, summary, content };
}

export async function handleApiRequest(req, res, pathname) {
  if (req.method === "OPTIONS") {
    sendNoContent(res);
    return true;
  }

  if (req.method === "GET" && pathname === "/books") {
    sendJson(res, 200, await readBooks());
    return true;
  }

  if (req.method === "GET" && pathname === "/auth/session") {
    sendJson(res, 200, { authenticated: isAuthenticated(req) });
    return true;
  }

  if (req.method === "POST" && pathname === "/auth/login") {
    login(req, res, await readBody(req));
    return true;
  }

  if (req.method === "POST" && pathname === "/auth/logout") {
    logout(res);
    return true;
  }

  if (req.method === "POST" && pathname === "/books") {
    if (!requireAdmin(req, res)) {
      return true;
    }

    const body = await readBody(req);
    const fields = validateBookBody(body);

    if (fields.error) {
      sendJson(res, 400, { error: fields.error });
      return true;
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
    return true;
  }

  const bookId = getBookIdFromPath(pathname);

  if (bookId && req.method === "PUT") {
    if (!requireAdmin(req, res)) {
      return true;
    }

    const fields = validateBookBody(await readBody(req));

    if (fields.error) {
      sendJson(res, 400, { error: fields.error });
      return true;
    }

    const current = await readBooks();
    const existing = current.books.find((book) => book.id === bookId);

    if (!existing) {
      sendJson(res, 404, { error: "没有找到这本书。" });
      return true;
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
    return true;
  }

  if (bookId && req.method === "DELETE") {
    if (!requireAdmin(req, res)) {
      return true;
    }

    const current = await readBooks();
    const nextBooks = current.books.filter((book) => book.id !== bookId);

    if (nextBooks.length === current.books.length) {
      sendJson(res, 404, { error: "没有找到这本书。" });
      return true;
    }

    await writeBooks({ books: nextBooks });
    sendJson(res, 200, { ok: true });
    return true;
  }

  return false;
}
