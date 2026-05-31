import type { Book, BooksPayload } from "@/types/book";

const fallbackPayload: BooksPayload = require("../../data/books.json");

const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8787";

export async function loadBooks(): Promise<Book[]> {
  try {
    const response = await fetch(`${apiBase}/books`);
    if (!response.ok) {
      throw new Error("Unable to load books from local service.");
    }
    const payload = (await response.json()) as BooksPayload;
    return payload.books;
  } catch {
    return fallbackPayload.books;
  }
}

export async function saveBook(input: {
  title: string;
  author: string;
  summary: string;
  content: string;
}): Promise<Book> {
  const response = await fetch(`${apiBase}/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "保存失败。");
  }

  return payload as Book;
}
