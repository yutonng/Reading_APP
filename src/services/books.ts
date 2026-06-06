import { getApiBaseUrl } from "@/config/api";
import type { Book, BooksPayload } from "@/types/book";
import type { AuthSession, SaveBookInput, SaveBookResult } from "@/types/admin";

const fallbackPayload: BooksPayload = require("../../data/books.json");

export type BooksLoadResult = {
  books: Book[];
  source: "remote" | "fallback";
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });
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
  try {
    const payload = await requestJson<BooksPayload>("/books");
    return { books: payload.books, source: "remote" };
  } catch {
    return { books: fallbackPayload.books, source: "fallback" };
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
