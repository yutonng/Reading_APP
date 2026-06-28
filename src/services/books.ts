import AsyncStorage from "@react-native-async-storage/async-storage";

import { getApiBaseUrl } from "@/config/api";
import type { Book, BooksPayload } from "@/types/book";
import type { AuthSession, BookSuggestion, SaveBookInput, SaveBookResult } from "@/types/admin";

const fallbackPayload: BooksPayload = require("../../data/books.json");
const cachedBooksStorageKey = "cached-remote-books";
const requestTimeoutMs = 9000;

export type BooksLoadResult = {
  books: Book[];
  source: "remote" | "cache" | "fallback";
};

function normalizeBooksPayload(payload: unknown): Book[] {
  if (Array.isArray(payload)) {
    return payload as Book[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "books" in payload &&
    Array.isArray((payload as BooksPayload).books)
  ) {
    return (payload as BooksPayload).books;
  }

  return [];
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readCachedBooks(): Promise<Book[]> {
  try {
    const raw = await AsyncStorage.getItem(cachedBooksStorageKey);
    return normalizeBooksPayload(raw ? JSON.parse(raw) : null);
  } catch {
    return [];
  }
}

async function cacheBooks(books: Book[]) {
  try {
    await AsyncStorage.setItem(cachedBooksStorageKey, JSON.stringify({ books }));
  } catch {
    // Cache writes are best-effort; reading should still work with bundled fallback.
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    signal: init?.signal || controller.signal,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      ...init?.headers
    }
  }).finally(() => clearTimeout(timeout));
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "请求失败。");
  }

  return payload as T;
}

export async function loadBooks(): Promise<Book[]> {
  const result = await loadBooksWithStatus();
  return result.books;
}

export async function loadBooksWithStatus(): Promise<BooksLoadResult> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) {
      await delay(700 * attempt);
    }

    try {
      const payload = await requestJson<BooksPayload>("/books");
      const books = normalizeBooksPayload(payload);

      if (books.length > 0) {
        await cacheBooks(books);
        return { books, source: "remote" };
      }

      lastError = new Error("Remote books payload is empty.");
    } catch (error) {
      lastError = error;
    }
  }

  const cachedBooks = await readCachedBooks();

  if (cachedBooks.length > 0) {
    console.warn("Failed to load remote books; using cached remote books", {
      apiBaseUrl: getApiBaseUrl(),
      error: lastError
    });
    return { books: cachedBooks, source: "cache" };
  }

  try {
    return { books: normalizeBooksPayload(fallbackPayload), source: "fallback" };
  } finally {
    console.warn("Failed to load remote books", {
      apiBaseUrl: getApiBaseUrl(),
      error: lastError
    });
  }
}

export async function loadSession(): Promise<AuthSession> {
  return requestJson<AuthSession>("/auth/session");
}

export async function loginAdmin(input: { username: string; password: string }) {
  return requestJson<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function logoutAdmin() {
  await fetch(`${getApiBaseUrl()}/auth/logout`, {
    method: "POST"
  });
}

export async function createBook(input: SaveBookInput): Promise<SaveBookResult> {
  return requestJson<SaveBookResult>("/books", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateBook(id: string, input: SaveBookInput): Promise<SaveBookResult> {
  return requestJson<SaveBookResult>(`/books/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export async function deleteBook(id: string) {
  return requestJson<{ ok: boolean }>(`/books/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export async function createBookSuggestion(content: string): Promise<BookSuggestion> {
  return requestJson<BookSuggestion>("/suggestions", {
    method: "POST",
    body: JSON.stringify({ content })
  });
}
