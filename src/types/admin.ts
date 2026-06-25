import type { Book } from "./book";

export type BookDraft = {
  id?: string;
  title: string;
  author: string;
  summary: string;
  content: string;
};

export type AuthSession = {
  authenticated: boolean;
};

export type SaveBookInput = Pick<BookDraft, "title" | "author" | "summary" | "content">;

export type SaveBookResult = Book;
