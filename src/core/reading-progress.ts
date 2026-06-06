import type { Book } from "@/types/book";

export type ReadingProgressRecord = {
  page: number;
  updatedAt: string;
};

export type ReadingProgressMap = Record<string, ReadingProgressRecord>;

export function clampPage(page: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.min(Math.max(page, 0), total - 1);
}

export function getBookProgress(book: Book, progress: ReadingProgressMap) {
  const saved = progress[book.id];
  const page = clampPage(Number(saved?.page || 0), book.sections.length);

  return {
    page,
    isStarted: Boolean(saved),
    isFinished: page >= book.sections.length - 1
  };
}

export function findLastReadBook(books: Book[], progress: ReadingProgressMap) {
  return books
    .map((book) => ({
      book,
      progress: getBookProgress(book, progress),
      updatedAt: progress[book.id]?.updatedAt || ""
    }))
    .filter((item) => item.progress.isStarted)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

export function updateProgress(progress: ReadingProgressMap, bookId: string, page: number) {
  return {
    ...progress,
    [bookId]: {
      page,
      updatedAt: new Date().toISOString()
    }
  };
}
